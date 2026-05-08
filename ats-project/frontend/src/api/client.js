// Client HTTP centralizzato — aggiunge automaticamente il JWT se presente in localStorage
const BASE_URL  = import.meta.env.VITE_API_URL ?? '';
const TOKEN_KEY = 'ats_jwt_token';

function getHeaders(extra = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: getHeaders(options.headers),
  });

  if (res.status === 401) {
    // Token scaduto o non valido: rimuovi e forza reload per mostrare login
    localStorage.removeItem(TOKEN_KEY);
    window.location.reload();
    throw new Error('Sessione scaduta, effettua di nuovo il login');
  }

  return res;
}

export async function apiJson(path, options = {}) {
  const res  = await apiFetch(path, options);
  const corpo = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(corpo.errore || `Errore HTTP ${res.status}`);
  return corpo;
}

export { BASE_URL };
