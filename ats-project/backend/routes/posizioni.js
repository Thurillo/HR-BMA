import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/posizioni
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*,
        COUNT(pc.candidate_id) AS num_candidati
      FROM positions p
      LEFT JOIN position_candidates pc ON pc.position_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ errore: 'Errore nel recupero delle posizioni', dettaglio: err.message });
  }
});

// POST /api/posizioni
router.post('/', async (req, res) => {
  const { titolo, descrizione, stato } = req.body;
  if (!titolo?.trim()) {
    return res.status(400).json({ errore: 'Il titolo è obbligatorio' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO positions (titolo, descrizione, stato) VALUES (?, ?, ?)',
      [titolo.trim(), descrizione ?? null, stato ?? 'Aperta']
    );
    const [[posizione]] = await pool.query('SELECT * FROM positions WHERE id = ?', [result.insertId]);
    res.status(201).json(posizione);
  } catch (err) {
    res.status(500).json({ errore: 'Errore nella creazione della posizione', dettaglio: err.message });
  }
});

// PUT /api/posizioni/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { titolo, descrizione, stato } = req.body;
  if (titolo !== undefined && !titolo?.trim()) {
    return res.status(400).json({ errore: 'Il titolo non può essere vuoto' });
  }
  const campi = {};
  if (titolo !== undefined) campi.titolo = titolo.trim();
  if (descrizione !== undefined) campi.descrizione = descrizione;
  if (stato !== undefined) campi.stato = stato;

  if (Object.keys(campi).length === 0) {
    return res.status(400).json({ errore: 'Nessun campo da aggiornare' });
  }

  try {
    const set = Object.keys(campi).map(k => `${k} = ?`).join(', ');
    const [result] = await pool.query(`UPDATE positions SET ${set} WHERE id = ?`, [...Object.values(campi), id]);
    if (result.affectedRows === 0) return res.status(404).json({ errore: 'Posizione non trovata' });
    const [[posizione]] = await pool.query('SELECT * FROM positions WHERE id = ?', [id]);
    res.json(posizione);
  } catch (err) {
    res.status(500).json({ errore: 'Errore aggiornamento posizione', dettaglio: err.message });
  }
});

// DELETE /api/posizioni/:id
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM positions WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ errore: 'Posizione non trovata' });
    res.json({ messaggio: 'Posizione eliminata' });
  } catch (err) {
    res.status(500).json({ errore: 'Errore eliminazione posizione', dettaglio: err.message });
  }
});

// GET /api/posizioni/:id/candidati
router.get('/:id/candidati', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.first_name, c.last_name, c.current_role, c.macro_sector, c.email,
             pc.status AS status_posizione
      FROM position_candidates pc
      JOIN candidates c ON c.id = pc.candidate_id
      WHERE pc.position_id = ?
      ORDER BY c.last_name, c.first_name
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ errore: 'Errore nel recupero dei candidati', dettaglio: err.message });
  }
});

// POST /api/posizioni/:id/candidati
router.post('/:id/candidati', async (req, res) => {
  const { candidate_id, status } = req.body;
  if (!candidate_id) return res.status(400).json({ errore: 'candidate_id obbligatorio' });
  const statusValido = status || 'Nuovo';
  try {
    await pool.query(
      'INSERT IGNORE INTO position_candidates (position_id, candidate_id, status) VALUES (?, ?, ?)',
      [req.params.id, candidate_id, statusValido]
    );
    res.status(201).json({ messaggio: 'Candidato aggiunto alla posizione' });
  } catch (err) {
    res.status(500).json({ errore: 'Errore aggiunta candidato', dettaglio: err.message });
  }
});

// PUT /api/posizioni/:id/candidati/:cid/status
router.put('/:id/candidati/:cid/status', async (req, res) => {
  const { status } = req.body;
  const statiValidi = ['Nuovo', '1° Colloquio', '2° Colloquio', 'Offerta', 'Assunto', 'Scartato'];
  if (!status || !statiValidi.includes(status)) {
    return res.status(400).json({ errore: 'Stato non valido' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE position_candidates SET status = ? WHERE position_id = ? AND candidate_id = ?',
      [status, req.params.id, req.params.cid]
    );
    if (result.affectedRows === 0) return res.status(404).json({ errore: 'Associazione non trovata' });
    res.json({ messaggio: 'Stato aggiornato' });
  } catch (err) {
    res.status(500).json({ errore: 'Errore aggiornamento stato', dettaglio: err.message });
  }
});

// DELETE /api/posizioni/:id/candidati/:cid
router.delete('/:id/candidati/:cid', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM position_candidates WHERE position_id = ? AND candidate_id = ?',
      [req.params.id, req.params.cid]
    );
    res.json({ messaggio: 'Candidato rimosso dalla posizione' });
  } catch (err) {
    res.status(500).json({ errore: 'Errore rimozione candidato', dettaglio: err.message });
  }
});

export default router;
