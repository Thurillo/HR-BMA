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
  dashboard:     'Dashboard',
  candidati:     'Candidati',
  posizioni:     'Posizioni aperte',
  email:         'Modelli Email',
  aggiornamenti: 'Aggiornamenti',
};

function AppInterna() {
  const { autenticato, verificando, authAbilitata, utente, logout } = useAuth();
  const [paginaAttiva, setPaginaAttiva] = useState('dashboard');

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm animate-pulse">Avvio in corso…</div>
      </div>
    );
  }

  if (!autenticato) return <Login />;

  return (
    <div className="min-h-screen flex bg-slate-100">
      <Sidebar paginaAttiva={paginaAttiva} onChange={setPaginaAttiva} />

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <header className="bg-white border-b border-slate-100 shadow-sm px-8 h-14 flex items-center justify-between shrink-0">
          <h1 className="text-base font-semibold text-slate-800 tracking-tight">{TITOLI[paginaAttiva]}</h1>
          <div className="flex items-center gap-4">
            {authAbilitata && utente && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{utente}</span>
                <button onClick={logout}
                  className="text-xs text-slate-500 hover:text-teal-700 px-2.5 py-1 rounded-lg hover:bg-teal-50 border border-slate-200 transition">
                  Esci
                </button>
              </div>
            )}
            <StatoDB />
          </div>
        </header>

        <main className="flex-1 overflow-auto px-8 py-8">
          {paginaAttiva === 'dashboard'     && <Dashboard />}
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
