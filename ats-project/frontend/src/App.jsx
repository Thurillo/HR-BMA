import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import PaginaCandidati from './components/PaginaCandidati';
import PaginaPosizioni from './components/PaginaPosizioni';
import PaginaAggiornamenti from './components/PaginaAggiornamenti';
import PaginaEmail from './components/PaginaEmail';
import Sidebar from './components/Sidebar';
import StatoDB from './components/StatoDB';
import Login from './components/Login';

const TITOLI = {
  candidati:     'Candidati',
  posizioni:     'Posizioni aperte',
  email:         'Modelli Email',
  aggiornamenti: 'Aggiornamenti',
};

function AppInterna() {
  const { autenticato, verificando, authAbilitata, utente, logout } = useAuth();
  const [paginaAttiva, setPaginaAttiva] = useState('candidati');

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-slate-400 text-sm animate-pulse">Avvio in corso…</div>
      </div>
    );
  }

  if (!autenticato) return <Login />;

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>
      <Sidebar paginaAttiva={paginaAttiva} onChange={setPaginaAttiva} />

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <header className="bg-white border-b border-slate-100 shadow-sm px-12 h-[72px] flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{TITOLI[paginaAttiva]}</h1>
          <div className="flex items-center gap-4">
            {authAbilitata && utente && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{utente}</span>
                <button onClick={logout}
                  className="text-xs text-slate-500 hover:text-red-600 px-2.5 py-1 rounded-lg hover:bg-red-50 border border-slate-200 transition">
                  Esci
                </button>
              </div>
            )}
            <StatoDB />
          </div>
        </header>

        <main className="flex-1 overflow-auto px-12 py-10">
          {paginaAttiva === 'candidati'     && <PaginaCandidati />}
          {paginaAttiva === 'posizioni'     && <PaginaPosizioni />}
          {paginaAttiva === 'email'         && <PaginaEmail />}
          {paginaAttiva === 'aggiornamenti' && <PaginaAggiornamenti />}
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
