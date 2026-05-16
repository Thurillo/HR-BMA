import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import PaginaCandidati from './components/PaginaCandidati';
import PaginaPosizioni from './components/PaginaPosizioni';
import PaginaAggiornamenti from './components/PaginaAggiornamenti';
import PaginaEmail from './components/PaginaEmail';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import StatoDB from './components/StatoDB';
import Login from './components/Login';

const TITOLI = {
  dashboard:     { label: 'Dashboard',         desc: 'Panoramica generale del sistema' },
  candidati:     { label: 'Candidati',          desc: 'Gestisci e filtra i profili' },
  posizioni:     { label: 'Posizioni aperte',   desc: 'Offerte di lavoro attive' },
  email:         { label: 'Modelli Email',      desc: 'Template per le comunicazioni' },
  aggiornamenti: { label: 'Aggiornamenti',      desc: 'Versione e release notes' },
};

/* ── Avatar utente ────────────────────────────────────────────── */
function UserAvatar({ nome, onLogout }) {
  const [aperto, setAperto] = useState(false);
  const iniziale = nome?.[0]?.toUpperCase() ?? 'U';

  return (
    <div className="relative">
      <button
        onClick={() => setAperto(a => !a)}
        className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition"
        style={{ background: aperto ? '#f1f5f9' : 'transparent' }}
        onMouseEnter={e => { if (!aperto) e.currentTarget.style.background = '#f8fafc'; }}
        onMouseLeave={e => { if (!aperto) e.currentTarget.style.background = 'transparent'; }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
        >
          {iniziale}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-[12px] font-semibold text-slate-700 leading-none">{nome}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-none">Admin</p>
        </div>
        <svg className="w-3.5 h-3.5 text-slate-400 hidden sm:block" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {aperto && (
        <>
          {/* Overlay click-outside */}
          <div className="fixed inset-0 z-40" onClick={() => setAperto(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl z-50 overflow-hidden"
            style={{
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 30px -5px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
              animation: 'slideUp 0.15s cubic-bezier(0.16,1,0.3,1) both',
            }}
          >
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-700">{nome}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Amministratore</p>
            </div>
            <button
              onClick={() => { setAperto(false); onLogout(); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Esci
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── App interna ─────────────────────────────────────────────── */
function AppInterna() {
  const { autenticato, verificando, authAbilitata, utente, logout } = useAuth();
  const [paginaAttiva, setPaginaAttiva] = useState('dashboard');

  /* Loading splash */
  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f1f5f9' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
          <p className="text-sm text-slate-400 animate-pulse">Avvio in corso…</p>
        </div>
      </div>
    );
  }

  if (!autenticato) return <Login />;

  const pagina = TITOLI[paginaAttiva];

  return (
    <div className="min-h-screen flex" style={{ background: '#f1f5f9' }}>
      <Sidebar paginaAttiva={paginaAttiva} onChange={setPaginaAttiva} />

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* ── Topbar ── */}
        <header
          className="shrink-0 flex items-center justify-between px-6 h-[60px] gap-4"
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #e2e8f0',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Titolo pagina */}
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-[15px] font-bold text-slate-800 leading-none truncate">{pagina?.label}</h1>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-none hidden sm:block">{pagina?.desc}</p>
          </div>

          {/* Destra: stato DB + utente */}
          <div className="flex items-center gap-3 shrink-0">
            <StatoDB />

            {/* Divisore */}
            <div className="w-px h-5 bg-slate-200 hidden sm:block" />

            {/* Avatar / logout */}
            {authAbilitata && utente ? (
              <UserAvatar nome={utente} onLogout={logout} />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
            )}
          </div>
        </header>

        {/* ── Contenuto principale ── */}
        <main className="flex-1 overflow-auto px-6 py-6 lg:px-8 lg:py-8">
          <div className="page-enter" key={paginaAttiva}>
            {paginaAttiva === 'dashboard'     && <Dashboard     onNavigate={setPaginaAttiva} />}
            {paginaAttiva === 'candidati'     && <PaginaCandidati />}
            {paginaAttiva === 'posizioni'     && <PaginaPosizioni />}
            {paginaAttiva === 'email'         && <PaginaEmail />}
            {paginaAttiva === 'aggiornamenti' && <PaginaAggiornamenti />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInterna />
    </AuthProvider>
  );
}
