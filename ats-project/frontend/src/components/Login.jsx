import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore]     = useState(null);
  const [caricamento, setCaricamento] = useState(false);
  const [mostraPass, setMostraPass] = useState(false);

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
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f1729 0%, #1a1040 50%, #0d1520 100%)' }}
    >
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            width: 600, height: 600,
            top: '-200px', right: '-100px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 400, height: 400,
            bottom: '-100px', left: '-50px',
            background: 'radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)',
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-sm mx-4"
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.1))',
            filter: 'blur(24px)',
            transform: 'scale(1.05)',
          }}
        />

        <div
          className="relative bg-white/[0.06] rounded-3xl overflow-hidden"
          style={{
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 32px 64px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          {/* Header */}
          <div className="px-8 pt-10 pb-8 text-center">
            {/* Logo */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
              }}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight">HR-BMA</h1>
            <p className="text-white/40 text-sm mt-1.5 font-medium">Applicant Tracking System</p>

            {/* Divisore decorativo */}
            <div className="flex items-center gap-3 mt-6">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-[11px] text-white/25 font-semibold tracking-widest uppercase">Accedi</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={invia} className="px-8 pb-10 flex flex-col gap-4">
            {/* Username */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(148,163,184,0.8)' }}>
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ color: 'rgba(148,163,184,0.5)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                  autoComplete="username"
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1.5px solid rgba(255,255,255,0.10)',
                    color: '#ffffff',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(129,140,248,0.6)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.10)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(148,163,184,0.8)' }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ color: 'rgba(148,163,184,0.5)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <input
                  type={mostraPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-sm font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1.5px solid rgba(255,255,255,0.10)',
                    color: '#ffffff',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(129,140,248,0.6)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.10)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setMostraPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition"
                  style={{ color: 'rgba(148,163,184,0.5)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    {mostraPass
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            {/* Errore */}
            {errore && (
              <div
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px]"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#fca5a5',
                }}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                {errore}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={caricamento}
              className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 mt-1"
              style={{
                background: caricamento
                  ? 'rgba(99,102,241,0.5)'
                  : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                boxShadow: caricamento ? 'none' : '0 4px 16px rgba(99,102,241,0.4)',
                transition: 'all 0.15s',
                cursor: caricamento ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!caricamento) e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
            >
              {caricamento ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Accesso in corso…
                </>
              ) : (
                <>
                  Accedi
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] mt-5" style={{ color: 'rgba(148,163,184,0.3)' }}>
          HR-BMA ATS · Self-hosted · © 2026
        </p>
      </div>
    </div>
  );
}
