import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { generaToken, AUTH_ENABLED, JWT_SECRET } from '../middleware/auth.js';

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

// GET /api/auth/verifica — controlla se auth è abilitata e se il token è valido
router.get('/verifica', (req, res) => {
  const header = req.headers.authorization ?? '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : (req.query.token ?? null);

  let utente = null;
  if (token) {
    try { utente = jwt.verify(token, JWT_SECRET).username; } catch { /* token scaduto o invalido */ }
  }

  res.json({ autenticazioneAbilitata: AUTH_ENABLED, utente });
});

export default router;
