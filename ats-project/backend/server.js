import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db.js';
import sistemaRouter from './routes/sistema.js';
import posizioniRouter from './routes/posizioni.js';
import emailTemplatesRouter from './routes/emailTemplates.js';

const app = express();
const PORT = process.env.PORT || 3001;

const CAMPI_TABELLA = new Set([
  'first_name', 'last_name', 'email', 'phone', 'location',
  'current_role', 'years_experience', 'max_education', 'executive_summary',
  'file_path_smb', 'linkedin_url', 'portfolio_url', 'seniority',
  'settore_prevalente', 'hard_skills', 'soft_skills', 'ambito_studi',
  'universita', 'certificazioni', 'preavviso', 'ral_indicata',
  'modalita_lavoro', 'status', 'macro_sector', 'extra_data', 'note',
]);

app.use(cors());
app.use(express.json());
app.use('/api/sistema', sistemaRouter);
app.use('/api/posizioni', posizioniRouter);
app.use('/api/email-templates', emailTemplatesRouter);

// GET /api/candidates — recupera tutti i candidati
app.get('/api/candidates', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM candidates ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ errore: 'Errore nel recupero dei candidati', dettaglio: err.message });
  }
});

// PUT /api/candidates/:id/status — aggiorna lo stato Kanban
app.put('/api/candidates/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const statiValidi = ['Nuovo', '1° Colloquio', '2° Colloquio', 'Offerta', 'Assunto', 'Scartato'];
  if (!status || !statiValidi.includes(status)) {
    return res.status(400).json({ errore: `Stato non valido. Valori ammessi: ${statiValidi.join(', ')}` });
  }

  try {
    const [result] = await pool.query(
      'UPDATE candidates SET status = ? WHERE id = ?',
      [status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ errore: 'Candidato non trovato' });
    }
    res.json({ messaggio: 'Stato aggiornato con successo' });
  } catch (err) {
    res.status(500).json({ errore: 'Errore aggiornamento stato', dettaglio: err.message });
  }
});

// PUT /api/candidates/:id — aggiorna l'anagrafica completa di un candidato
app.put('/api/candidates/:id', async (req, res) => {
  const { id } = req.params;
  const payload = req.body;

  const CAMPI_SOLA_LETTURA = new Set(['id', 'created_at', 'updated_at']);
  const aggiornamenti = {};

  for (const [chiave, valore] of Object.entries(payload)) {
    if (CAMPI_SOLA_LETTURA.has(chiave)) continue;
    if (!CAMPI_TABELLA.has(chiave)) continue;
    aggiornamenti[chiave] = typeof valore === 'object' && valore !== null
      ? JSON.stringify(valore)
      : valore;
  }

  if (Object.keys(aggiornamenti).length === 0) {
    return res.status(400).json({ errore: 'Nessun campo valido da aggiornare' });
  }

  const set = Object.keys(aggiornamenti).map(k => `${k} = ?`).join(', ');
  const valori = [...Object.values(aggiornamenti), id];

  try {
    const [result] = await pool.query(
      `UPDATE candidates SET ${set} WHERE id = ?`,
      valori
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ errore: 'Candidato non trovato' });
    }
    const [[candidato]] = await pool.query('SELECT * FROM candidates WHERE id = ?', [id]);
    res.json(candidato);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ errore: 'Email già in uso da un altro candidato' });
    }
    res.status(500).json({ errore: 'Errore aggiornamento anagrafica', dettaglio: err.message });
  }
});

// GET /api/candidates/export — esporta tutti i candidati in JSON
app.get('/api/candidates/export', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM candidates ORDER BY created_at ASC');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="candidati_${new Date().toISOString().slice(0,10)}.json"`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ errore: 'Errore esportazione', dettaglio: err.message });
  }
});

// POST /api/candidates/import — importa candidati da JSON
app.post('/api/candidates/import', async (req, res) => {
  const lista = req.body;
  if (!Array.isArray(lista) || lista.length === 0) {
    return res.status(400).json({ errore: 'Body deve essere un array di candidati non vuoto' });
  }

  const CAMPI_SOLA_LETTURA = new Set(['id', 'created_at', 'updated_at']);
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
        // Upsert per email
        const colonne = Object.keys(campi).join(', ');
        const segnaposto = Object.keys(campi).map(() => '?').join(', ');
        const aggiorna = Object.keys(campi).map(k => `${k} = VALUES(${k})`).join(', ');
        await pool.query(
          `INSERT INTO candidates (${colonne}) VALUES (${segnaposto}) ON DUPLICATE KEY UPDATE ${aggiorna}`,
          Object.values(campi)
        );
      } else {
        const colonne = Object.keys(campi).join(', ');
        const segnaposto = Object.keys(campi).map(() => '?').join(', ');
        await pool.query(`INSERT INTO candidates (${colonne}) VALUES (${segnaposto})`, Object.values(campi));
      }
      inseriti++;
    } catch { errori++; }
  }

  res.json({ messaggio: `Importazione completata`, inseriti, errori });
});

// GET /api/candidates/:id — recupera un singolo candidato completo
app.get('/api/candidates/:id', async (req, res) => {
  try {
    const [[candidato]] = await pool.query('SELECT * FROM candidates WHERE id = ?', [req.params.id]);
    if (!candidato) return res.status(404).json({ errore: 'Candidato non trovato' });
    res.json(candidato);
  } catch (err) {
    res.status(500).json({ errore: 'Errore nel recupero del candidato', dettaglio: err.message });
  }
});

// DELETE /api/candidates/:id — elimina un candidato
app.delete('/api/candidates/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM candidates WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ errore: 'Candidato non trovato' });
    res.json({ messaggio: 'Candidato eliminato' });
  } catch (err) {
    res.status(500).json({ errore: 'Errore eliminazione candidato', dettaglio: err.message });
  }
});

// POST /api/candidates — ricezione dati da n8n
app.post('/api/candidates', async (req, res) => {
  const payload = req.body;

  const campiStandard = {};
  const campiExtra = {};

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

  const colonne = Object.keys(campiStandard).join(', ');
  const segnaposto = Object.keys(campiStandard).map(() => '?').join(', ');
  const valori = Object.values(campiStandard);

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

app.listen(PORT, () => {
  console.log(`Server ATS avviato su http://localhost:${PORT}`);
});
