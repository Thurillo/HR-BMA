import { Router } from 'express';
import pool from '../db.js';
import { STATI_CANDIDATO } from '../config/stati.js';

const router = Router();
const FASI_VALIDE = STATI_CANDIDATO;
const MAX_PER_FASE = 10;

// GET /api/email-templates — tutti i modelli, ordinati per fase e nome
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, fase, nome, oggetto, corpo, created_at FROM email_templates ORDER BY fase, nome'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ errore: 'Errore recupero modelli', dettaglio: err.message });
  }
});

// POST /api/email-templates — crea un nuovo modello
router.post('/', async (req, res) => {
  const { fase, nome, oggetto, corpo } = req.body;
  if (!fase || !FASI_VALIDE.includes(fase)) return res.status(400).json({ errore: 'Fase non valida' });
  if (!nome?.trim()) return res.status(400).json({ errore: 'Nome obbligatorio' });
  if (!corpo?.trim()) return res.status(400).json({ errore: 'Corpo obbligatorio' });

  try {
    const [[{ n }]] = await pool.query(
      'SELECT COUNT(*) AS n FROM email_templates WHERE fase = ?', [fase]
    );
    if (n >= MAX_PER_FASE) {
      return res.status(409).json({ errore: `Massimo ${MAX_PER_FASE} modelli per fase raggiunto` });
    }
    const [result] = await pool.query(
      'INSERT INTO email_templates (fase, nome, oggetto, corpo) VALUES (?, ?, ?, ?)',
      [fase, nome.trim(), (oggetto ?? '').trim(), corpo.trim()]
    );
    const [[riga]] = await pool.query('SELECT * FROM email_templates WHERE id = ?', [result.insertId]);
    res.status(201).json(riga);
  } catch (err) {
    res.status(500).json({ errore: 'Errore creazione modello', dettaglio: err.message });
  }
});

// PUT /api/email-templates/:id — aggiorna un modello
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { fase, nome, oggetto, corpo } = req.body;
  if (fase && !FASI_VALIDE.includes(fase)) return res.status(400).json({ errore: 'Fase non valida' });

  try {
    const [[esistente]] = await pool.query('SELECT * FROM email_templates WHERE id = ?', [id]);
    if (!esistente) return res.status(404).json({ errore: 'Modello non trovato' });

    const nuovaFase  = fase  ?? esistente.fase;
    const nuovoNome  = nome  != null ? nome.trim()    : esistente.nome;
    const nuovoOgg   = oggetto != null ? oggetto.trim() : esistente.oggetto;
    const nuovoCorpo = corpo != null ? corpo.trim()   : esistente.corpo;

    if (!nuovoNome)  return res.status(400).json({ errore: 'Nome obbligatorio' });
    if (!nuovoCorpo) return res.status(400).json({ errore: 'Corpo obbligatorio' });

    // Se cambia fase, verifica limite
    if (nuovaFase !== esistente.fase) {
      const [[{ n }]] = await pool.query(
        'SELECT COUNT(*) AS n FROM email_templates WHERE fase = ?', [nuovaFase]
      );
      if (n >= MAX_PER_FASE) {
        return res.status(409).json({ errore: `Massimo ${MAX_PER_FASE} modelli per fase raggiunto` });
      }
    }

    await pool.query(
      'UPDATE email_templates SET fase=?, nome=?, oggetto=?, corpo=? WHERE id=?',
      [nuovaFase, nuovoNome, nuovoOgg, nuovoCorpo, id]
    );
    const [[aggiornato]] = await pool.query('SELECT * FROM email_templates WHERE id = ?', [id]);
    res.json(aggiornato);
  } catch (err) {
    res.status(500).json({ errore: 'Errore aggiornamento modello', dettaglio: err.message });
  }
});

// DELETE /api/email-templates/:id
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM email_templates WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ errore: 'Modello non trovato' });
    res.json({ messaggio: 'Modello eliminato' });
  } catch (err) {
    res.status(500).json({ errore: 'Errore eliminazione modello', dettaglio: err.message });
  }
});

export default router;
