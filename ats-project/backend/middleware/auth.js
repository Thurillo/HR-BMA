import jwt from 'jsonwebtoken';

const JWT_SECRET   = process.env.JWT_SECRET || 'ats-dev-secret-change-in-prod';
const AUTH_ENABLED = process.env.AUTH_ENABLED === 'true';

export function autenticazione(req, res, next) {
  if (!AUTH_ENABLED) return next();

  const header = req.headers.authorization ?? '';
  // Accetta token sia da header sia da query param (per download diretto browser)
  const token  = header.startsWith('Bearer ') ? header.slice(7) : (req.query.token ?? null);
  if (!token) return res.status(401).json({ errore: 'Autenticazione richiesta' });

  try {
    req.utente = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ errore: 'Token non valido o scaduto' });
  }
}

export function generaToken(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
}

export { JWT_SECRET, AUTH_ENABLED };
