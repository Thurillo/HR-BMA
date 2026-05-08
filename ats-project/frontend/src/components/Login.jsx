import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore]     = useState(null);
  const [caricamento, setCaricamento] = useState(false);

  async function invia(e) {
    e.preventDefault();
    if (!username.trim() || !password) return setErrore('Inserisci username e password');
    setCaricamento(true);
    setErrore(null);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setErrore(err.message);
    } finally {
      setCaricamento(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">

        <div className="px-8 pt-10 pb-8 text-center" style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-white">HR-BMA ATS</h1>
          <p className="text-white/70 text-sm mt-1">Accedi per continuare</p>
        </div>

        <form onSubmit={invia} className="px-8 py-8 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition bg-slate-50"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition bg-slate-50"
            />
          </div>

          {errore && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{errore}</p>
          )}

          <button
            type="submit"
            disabled={caricamento}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition shadow-sm hover:shadow-md disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}
          >
            {caricamento ? 'Accesso in corso…' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}
