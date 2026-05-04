import { useState } from 'react';
import PaginaCandidati from './components/PaginaCandidati';
import PaginaPosizioni from './components/PaginaPosizioni';
import PaginaAggiornamenti from './components/PaginaAggiornamenti';
import PaginaEmail from './components/PaginaEmail';
import Sidebar from './components/Sidebar';
import StatoDB from './components/StatoDB';

const TITOLI = {
  candidati:     'Candidati',
  posizioni:     'Posizioni aperte',
  email:         'Modelli Email',
  aggiornamenti: 'Aggiornamenti',
};

export default function App() {
  const [paginaAttiva, setPaginaAttiva] = useState('candidati');

  return (
    <div className="min-h-screen flex" style={{ background: '#f1f5f9' }}>
      <Sidebar paginaAttiva={paginaAttiva} onChange={setPaginaAttiva} />

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-12 h-[72px] flex items-center justify-between shrink-0">
          <h1 className="text-lg font-bold text-slate-800">{TITOLI[paginaAttiva]}</h1>
          <StatoDB />
        </header>

        {/* Contenuto */}
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
