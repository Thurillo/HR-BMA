import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pool from './db.js';
import sistemaRouter from './routes/sistema.js';
import posizioniRouter from './routes/posizioni.js';
import emailTemplatesRouter from './routes/emailTemplates.js';
import authRouter from './routes/auth.js';
import { autenticazione } from './middleware/auth.js';
import { STATI_CANDIDATO, COLONNE_LISTA_CANDIDATI } from './config/stati.js';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Campi modificabili candidati ─────────────────────────────────────────────
const CAMPI_TABELLA = new Set([
  'first_name', 'last_name', 'email', 'phone', 'location',
  'current_role', 'years_experience', 'max_education', 'executive_summary',
  'file_path_smb', 'linkedin_url', 'portfolio_url', 'seniority',
  'settore_prevalente', 'hard_skills', 'soft_skills', 'ambito_studi',
  'universita', 'certificazioni', 'preavviso', 'ral_indicata',
  'modalita_lavoro', 'status', 'macro_sector', 'extra_data', 'note',
]);
const CAMPI_SOLA_LETTURA = new Set(['id', 'created_at', 'updated_at']);

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Limite generale: 300 richieste ogni 15 minuti per IP
const limiterGenerale = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { errore: 'Troppe richieste, riprova tra qualche minuto' },
});

// Limite webhook n8n: 60 inserimenti al minuto per IP
const limiterWebhook = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { errore: 'Troppi candidati inviati, attendi prima di riprovare' },
});

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/api', limiterGenerale);

// ── Route pubbliche (nessuna auth) ────────────────────────────────────────────
app.use('/api/auth', authRouter);

// Health check pubblico: usato da StatoDB ogni 30s, deve restare senza auth
app.get('/api/sistema/stato', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ db: 'connesso' });
  } catch (err) {
    res.status(503).json({ db: 'errore', dettaglio: err.message });
  }
});

// Webhook n8n — pubblico ma rate-limited separatamente
app.post('/api/candidates', limiterWebhook, async (req, res) => {
  const payload = req.body;

  const campiStandard = {};
  const campiExtra    = {};

  for (const [chiave, valore] of Object.entries(payload)) {
    if (chiave === 'extra_data') continue;
    if (CAMPI_TABELLA.has(chiave)) {
      campiStandard[chiave] = typeof valore === 'object' ? JSON.stringify(valore) : valore;
    } else {
      campiExtra[chiave] = valore;
    }
  }

  if (Object.keys(campiExtra).length > 0) {
    campiStandard.extra_data = JSON.stringify(campiExtra);
  }

  if (Object.keys(campiStandard).length === 0) {
    return res.status(400).json({ errore: 'Payload vuoto o non valido' });
  }

  const colonne    = Object.keys(campiStandard).join(', ');
  const segnaposto = Object.keys(campiStandard).map(() => '?').join(', ');
  const valori     = Object.values(campiStandard);

  try {
    const [result] = await pool.query(
      `INSERT INTO candidates (${colonne}) VALUES (${segnaposto})`,
      valori
    );
    res.status(201).json({ messaggio: 'Candidato inserito con successo', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ errore: 'Candidato già presente (email duplicata)' });
    }
    res.status(500).json({ errore: 'Errore inserimento candidato', dettaglio: err.message });
  }
});

// ── Middleware autenticazione per tutte le route protette ─────────────────────
app.use('/api/sistema', autenticazione, sistemaRouter);
app.use('/api/posizioni', autenticazione, posizioniRouter);
app.use('/api/email-templates', autenticazione, emailTemplatesRouter);

// ── GET /api/candidates — lista con colonne esplicite + paginazione + ricerca ─
app.get('/api/candidates', autenticazione, async (req, res) => {
  try {
    // Paginazione opzionale: ?page=1&limit=50
    const page  = Math.max(1, parseInt(req.query.page  ?? '1',  10));
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit ?? '0', 10)));
    const q     = (req.query.q ?? '').trim();

    let sql    = `SELECT ${COLONNE_LISTA_CANDIDATI} FROM candidates`;
    const params = [];

    if (q) {
      sql += ` WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?
               OR current_role LIKE ? OR macro_sector LIKE ? OR location LIKE ?)`;
      const like = `%${q}%`;
      params.push(like, like, like, like, like, like);
    }

    sql += ' ORDER BY created_at DESC';

    if (limit > 0) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, (page - 1) * limit);
    }

    const [rows] = await pool.query(sql, params);

    // Conta totale separato solo quando c'è paginazione
    if (limit > 0) {
      let countSql = 'SELECT COUNT(*) AS totale FROM candidates';
      const countParams = [];
      if (q) {
        countSql += ` WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?
                     OR current_role LIKE ? OR macro_sector LIKE ? OR location LIKE ?)`;
        const like = `%${q}%`;
        countParams.push(like, like, like, like, like, like);
      }
      const [[{ totale }]] = await pool.query(countSql, countParams);
      return res.json({ dati: rows, totale, page, limit, pagine: Math.ceil(totale / limit) });
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ errore: 'Errore nel recupero dei candidati', dettaglio: err.message });
  }
});

// ── PUT /api/candidates/:id/status ───────────────────────────────────────────
app.put('/api/candidates/:id/status', autenticazione, async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;

  if (!status || !STATI_CANDIDATO.includes(status)) {
    return res.status(400).json({ errore: `Stato non valido. Valori ammessi: ${STATI_CANDIDATO.join(', ')}` });
  }

  try {
    const [result] = await pool.query('UPDATE candidates SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ errore: 'Candidato non trovato' });
    res.json({ messaggio: 'Stato aggiornato con successo' });
  } catch (err) {
    res.status(500).json({ errore: 'Errore aggiornamento stato', dettaglio: err.message });
  }
});

// ── PUT /api/candidates/:id — aggiornamento anagrafica ────────────────────────
app.put('/api/candidates/:id', autenticazione, async (req, res) => {
  const { id }    = req.params;
  const payload   = req.body;
  const aggiornamenti = {};

  for (const [chiave, valore] of Object.entries(payload)) {
    if (CAMPI_SOLA_LETTURA.has(chiave)) continue;
    if (!CAMPI_TABELLA.has(chiave)) continue;
    if (chiave === 'status' && !STATI_CANDIDATO.includes(valore)) continue;
    aggiornamenti[chiave] = typeof valore === 'object' && valore !== null
      ? JSON.stringify(valore)
      : valore;
  }

  if (Object.keys(aggiornamenti).length === 0) {
    return res.status(400).json({ errore: 'Nessun campo valido da aggiornare' });
  }

  const set    = Object.keys(aggiornamenti).map(k => `${k} = ?`).join(', ');
  const valori = [...Object.values(aggiornamenti), id];

  try {
    const [result] = await pool.query(`UPDATE candidates SET ${set} WHERE id = ?`, valori);
    if (result.affectedRows === 0) return res.status(404).json({ errore: 'Candidato non trovato' });
    const [[candidato]] = await pool.query('SELECT * FROM candidates WHERE id = ?', [id]);
    res.json(candidato);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ errore: 'Email già in uso da un altro candidato' });
    }
    res.status(500).json({ errore: 'Errore aggiornamento anagrafica', dettaglio: err.message });
  }
});

// ── GET /api/candidates/export ───────────────────────────────────────────────
app.get('/api/candidates/export', autenticazione, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM candidates ORDER BY created_at ASC');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="candidati_${new Date().toISOString().slice(0,10)}.json"`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ errore: 'Errore esportazione', dettaglio: err.message });
  }
});

// ── POST /api/candidates/import ──────────────────────────────────────────────
app.post('/api/candidates/import', autenticazione, async (req, res) => {
  const lista = req.body;
  if (!Array.isArray(lista) || lista.length === 0) {
    return res.status(400).json({ errore: 'Body deve essere un array di candidati non vuoto' });
  }

  let inseriti = 0, aggiornati = 0, errori = 0;

  for (const candidato of lista) {
    const campi = {};
    for (const [k, v] of Object.entries(candidato)) {
      if (CAMPI_SOLA_LETTURA.has(k)) continue;
      if (!CAMPI_TABELLA.has(k)) continue;
      campi[k] = typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
    }
    if (!campi.email && !campi.first_name) { errori++; continue; }

    try {
      if (campi.email) {
        const colonne    = Object.keys(campi).join(', ');
        const segnaposto = Object.keys(campi).map(() => '?').join(', ');
        const aggiorna   = Object.keys(campi).map(k => `${k} = VALUES(${k})`).join(', ');
        await pool.query(
          `INSERT INTO candidates (${colonne}) VALUES (${segnaposto}) ON DUPLICATE KEY UPDATE ${aggiorna}`,
          Object.values(campi)
        );
      } else {
        const colonne    = Object.keys(campi).join(', ');
        const segnaposto = Object.keys(campi).map(() => '?').join(', ');
        await pool.query(`INSERT INTO candidates (${colonne}) VALUES (${segnaposto})`, Object.values(campi));
      }
      inseriti++;
    } catch { errori++; }
  }

  res.json({ messaggio: 'Importazione completata', inseriti, errori });
});

// ── GET /api/candidates/:id ──────────────────────────────────────────────────
app.get('/api/candidates/:id', autenticazione, async (req, res) => {
  try {
    const [[candidato]] = await pool.query('SELECT * FROM candidates WHERE id = ?', [req.params.id]);
    if (!candidato) return res.status(404).json({ errore: 'Candidato non trovato' });
    res.json(candidato);
  } catch (err) {
    res.status(500).json({ errore: 'Errore nel recupero del candidato', dettaglio: err.message });
  }
});

// ── DELETE /api/candidates/:id ───────────────────────────────────────────────
app.delete('/api/candidates/:id', autenticazione, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM candidates WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ errore: 'Candidato non trovato' });
    res.json({ messaggio: 'Candidato eliminato' });
  } catch (err) {
    res.status(500).json({ errore: 'Errore eliminazione candidato', dettaglio: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server ATS avviato su http://localhost:${PORT}`);
});
