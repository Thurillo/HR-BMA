import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const router = Router();
const eseguiCmd = promisify(exec);

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../');
const BRANCH_AGGIORNAMENTO = 'main';

// Git "dubious ownership": il processo Node gira con utente diverso dal proprietario
// della cartella. -c safe.directory=* bypassa il controllo per tutti i comandi git.
const GIT = 'git -c safe.directory=*';

let aggiornaInCorso = false;

async function leggiVersione() {
  try {
    return (await readFile(path.join(ROOT, 'VERSION'), 'utf8')).trim();
  } catch { return 'sconosciuta'; }
}

async function commitLocale() {
  const { stdout } = await eseguiCmd(`${GIT} rev-parse HEAD`, { cwd: ROOT });
  return stdout.trim();
}

async function branchCorrente() {
  const { stdout } = await eseguiCmd(`${GIT} rev-parse --abbrev-ref HEAD`, { cwd: ROOT });
  return stdout.trim();
}

async function commitRemoto(branch) {
  await eseguiCmd(`${GIT} fetch origin ${branch} --quiet`, { cwd: ROOT, timeout: 15000 });
  const { stdout } = await eseguiCmd(`${GIT} rev-parse origin/${branch}`, { cwd: ROOT });
  return stdout.trim();
}

// ── GET /api/sistema/stato ────────────────────────────────────────────────────
router.get('/stato', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ db: 'connesso' });
  } catch (err) {
    res.status(503).json({ db: 'errore', dettaglio: err.message });
  }
});

// ── GET /api/sistema/versione ─────────────────────────────────────────────────
// Dati locali — risponde sempre, senza accesso a rete
router.get('/versione', async (req, res) => {
  try {
    const [versione, locale, branchAttuale] = await Promise.all([
      leggiVersione(),
      commitLocale(),
      branchCorrente(),
    ]);
    res.json({
      versione,
      branch_locale: branchAttuale,
      branch_aggiornamento: BRANCH_AGGIORNAMENTO,
      commit_locale: locale.slice(0, 7),
      aggiorna_in_corso: aggiornaInCorso,
    });
  } catch (err) {
    res.status(500).json({ errore: 'Errore lettura versione locale', dettaglio: err.message });
  }
});

// ── GET /api/sistema/controlla ────────────────────────────────────────────────
// Fa il fetch da GitHub e confronta i commit
router.get('/controlla', async (req, res) => {
  try {
    const [versione, locale, remoto, branchAttuale] = await Promise.all([
      leggiVersione(),
      commitLocale(),
      commitRemoto(BRANCH_AGGIORNAMENTO),
      branchCorrente(),
    ]);
    res.json({
      versione,
      branch_locale: branchAttuale,
      branch_aggiornamento: BRANCH_AGGIORNAMENTO,
      commit_locale: locale.slice(0, 7),
      commit_remoto: remoto.slice(0, 7),
      aggiornamento_disponibile: locale !== remoto,
      aggiorna_in_corso: aggiornaInCorso,
    });
  } catch (err) {
    res.status(503).json({ errore: 'Impossibile raggiungere GitHub', dettaglio: err.message });
  }
});

// ── GET /api/sistema/aggiorna/stream ─────────────────────────────────────────
router.get('/aggiorna/stream', async (req, res) => {
  if (aggiornaInCorso) {
    res.status(409).json({ errore: 'Aggiornamento già in corso' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const invia = (messaggio, tipo = 'log') => {
    if (res.writableEnded) return;
    res.write(`event: ${tipo}\ndata: ${JSON.stringify({ messaggio, ts: new Date().toLocaleTimeString('it-IT') })}\n\n`);
  };

  aggiornaInCorso = true;

  try {
    invia('Connessione a GitHub…');
    await eseguiCmd(`${GIT} fetch origin ${BRANCH_AGGIORNAMENTO} --quiet`, { cwd: ROOT, timeout: 30000 });
    invia('✓ Repository raggiunto');

    invia(`Passaggio al branch ${BRANCH_AGGIORNAMENTO}…`);
    await eseguiCmd(`${GIT} checkout ${BRANCH_AGGIORNAMENTO}`, { cwd: ROOT });

    invia('Applicazione aggiornamenti…');
    const { stdout: pullOut } = await eseguiCmd(`${GIT} reset --hard origin/${BRANCH_AGGIORNAMENTO}`, { cwd: ROOT });
    invia(`✓ ${pullOut.trim()}`);

    invia('Aggiornamento dipendenze backend…');
    await eseguiCmd('npm install --omit=dev --silent', { cwd: path.join(ROOT, 'backend') });
    invia('✓ Dipendenze backend aggiornate');

    invia('Installazione dipendenze frontend…');
    await eseguiCmd('npm install --silent', { cwd: path.join(ROOT, 'frontend') });
    invia('✓ Dipendenze frontend aggiornate');

    invia('Build frontend in produzione (può richiedere qualche minuto)…');
    await eseguiCmd('npm run build --silent', {
      cwd: path.join(ROOT, 'frontend'),
      env: { ...process.env, NODE_ENV: 'production', VITE_API_URL: '' },
      timeout: 300000,
    });
    invia('✓ Frontend compilato con successo');

    invia('Riavvio del servizio…', 'completato');
    res.end();

    setTimeout(() => {
      eseguiCmd('systemctl restart ats-backend').catch(() => process.exit(0));
    }, 500);

  } catch (err) {
    invia(`Errore: ${err.message}`, 'errore');
    res.end();
  } finally {
    aggiornaInCorso = false;
  }
});

export default router;
