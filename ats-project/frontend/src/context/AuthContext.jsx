import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';
const TOKEN_KEY = 'ats_jwt_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken]             = useState(() => localStorage.getItem(TOKEN_KEY));
  const [utente, setUtente]           = useState(null);
  const [authAbilitata, setAuthAbilitata] = useState(false);
  const [verificando, setVerificando] = useState(true);

  const verifica = useCallback(async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res  = await fetch(`${BASE_URL}/api/auth/verifica`, { headers });
      const dati = await res.json().catch(() => ({}));
      setAuthAbilitata(dati.autenticazioneAbilitata ?? false);
      setUtente(dati.utente ?? null);
      if (!res.ok) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
    } catch {
      setAuthAbilitata(false);
    } finally {
      setVerificando(false);
    }
  }, [token]);

  useEffect(() => { verifica(); }, [verifica]);

  async function login(username, password) {
    const res   = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const dati = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(dati.errore || 'Login fallito');
    if (dati.token) {
      localStorage.setItem(TOKEN_KEY, dati.token);
      setToken(dati.token);
      setUtente(dati.username);
    }
    setAuthAbilitata(dati.autenticazioneAbilitata ?? false);
    return dati;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUtente(null);
  }

  // Aggiunge automaticamente Authorization header alle fetch delle API
  function intestazioni() {
    return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
  }

  const autenticato = !authAbilitata || !!token;

  return (
    <AuthContext.Provider value={{ token, utente, authAbilitata, autenticato, verificando, login, logout, intestazioni }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
