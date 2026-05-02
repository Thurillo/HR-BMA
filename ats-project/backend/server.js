import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3001;

// Campi colonna della tabella candidates (tutti tranne id, created_at, updated_at)
const CAMPI_TABELLA = new Set([
  'first_name', 'last_name', 'email', 'phone', 'location',
  'current_role', 'years_experience', 'max_education', 'executive_summary',
  'file_path_smb', 'linkedin_url', 'portfolio_url', 'seniority',
  'settore_prevalente', 'hard_skills', 'soft_skills', 'ambito_studi',
  'universita', 'certificazioni', 'preavviso', 'ral_indicata',
  'modalita_lavoro', 'status', 'macro_sector', 'extra_data',
]);

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT || 3306,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
});

app.use(cors());
app.use(express.json());

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

// POST /api/candidates — ricezione dati da n8n
// I campi noti vanno nelle colonne dedicate; tutto il resto finisce in extra_data
app.post('/api/candidates', async (req, res) => {
  const payload = req.body;

  const campiStandard = {};
  const campiExtra = {};

  for (const [chiave, valore] of Object.entries(payload)) {
    if (chiave === 'extra_data') continue; // ignorato: gestiamo noi l'aggregazione
    if (CAMPI_TABELLA.has(chiave)) {
      // I campi JSON vanno serializzati se arrivano come stringa
      campiStandard[chiave] = typeof valore === 'object' ? JSON.stringify(valore) : valore;
    } else {
      campiExtra[chiave] = valore;
    }
  }

  // Aggiunge extra_data solo se ci sono campi non mappati
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
    // Duplicato email
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ errore: 'Candidato già presente (email duplicata)' });
    }
    res.status(500).json({ errore: 'Errore inserimento candidato', dettaglio: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server ATS avviato su http://localhost:${PORT}`);
});
