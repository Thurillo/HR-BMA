import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const esegui = promisify(exec);

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../');

async function leggiVersione() {
  try {
    const testo = await readFile(path.join(ROOT, 'VERSION'), 'utf8');
    return testo.trim();
  } catch {
    return 'sconosciuta';
  }
}

async function commitLocale() {
  const { stdout } = await esegui('git rev-parse HEAD', { cwd: ROOT });
  return stdout.trim();
}

async function commitRemoto(branch) {
  await esegui(`git fetch origin ${branch} --quiet`, { cwd: ROOT });
  const { stdout } = await esegui(`git rev-parse origin/${branch}`, { cwd: ROOT });
  return stdout.trim();
}

async function branchCorrente() {
  const { stdout } = await esegui('git rev-parse --abbrev-ref HEAD', { cwd: ROOT });
  return stdout.trim();
}

// GET /api/sistema/versione — stato attuale e disponibilità aggiornamento
router.get('/versione', async (req, res) => {
  try {
    const branch = await branchCorrente();
    const [versione, locale, remoto] = await Promise.all([
      leggiVersione(),
      commitLocale(),
      commitRemoto(branch),
    ]);

    res.json({
      versione,
      branch,
      commit_locale: locale.slice(0, 7),
      commit_remoto: remoto.slice(0, 7),
      aggiornamento_disponibile: locale !== remoto,
    });
  } catch (err) {
    res.status(500).json({ errore: 'Impossibile verificare aggiornamenti', dettaglio: err.message });
  }
});

// POST /api/sistema/aggiorna — esegue pull, reinstalla dipendenze, ricostruisce frontend
router.post('/aggiorna', async (req, res) => {
  // Risponde subito: l'aggiornamento procede in background
  res.json({ messaggio: 'Aggiornamento avviato. Il servizio si riavvierà a breve.' });

  try {
    await esegui('git pull', { cwd: ROOT });
    await esegui('npm install --omit=dev --silent', { cwd: path.join(ROOT, 'backend') });
    await esegui('npm install --silent && npm run build', {
      cwd: path.join(ROOT, 'frontend'),
      env: { ...process.env, NODE_ENV: 'production' },
    });
    // Riavvio tramite systemd (se disponibile), altrimenti esce e lascia che il processo manager rilanci
    esegui('systemctl restart ats-backend').catch(() => process.exit(0));
  } catch (err) {
    console.error('[aggiornamento] Errore:', err.message);
  }
});

export default router;
