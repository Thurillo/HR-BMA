import { Router } from 'express';
import { generaToken, AUTH_ENABLED } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  if (!AUTH_ENABLED) {
    return res.json({ autenticazioneAbilitata: false, token: null });
  }

  const { username, password } = req.body ?? {};
  const utente  = process.env.ADMIN_USER     || 'admin';
  const passEnv = process.env.ADMIN_PASSWORD || '';

  if (!passEnv) {
    return res.status(503).json({ errore: 'ADMIN_PASSWORD non configurato nel file .env' });
  }
  if (!username || !password || username !== utente || password !== passEnv) {
    return res.status(401).json({ errore: 'Credenziali non valide' });
  }

  const token = generaToken(username);
  res.json({ token, username });
});

// GET /api/auth/verifica — controlla se il token è valido
router.get('/verifica', (req, res) => {
  res.json({ autenticazioneAbilitata: AUTH_ENABLED, utente: req.utente?.username ?? null });
});

export default router;
