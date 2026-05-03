import { useState } from 'react';
import PaginaCandidati from './components/PaginaCandidati';
import PaginaPosizioni from './components/PaginaPosizioni';
import PaginaAggiornamenti from './components/PaginaAggiornamenti';
import Sidebar from './components/Sidebar';
import StatoDB from './components/StatoDB';

export default function App() {
  const [paginaAttiva, setPaginaAttiva] = useState('candidati');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f1f5f9' }}>

      {/* Header */}
      <header className="bg-white border-b-2 border-slate-200 px-8 py-4 flex items-center justify-between gap-4 shrink-0"
        style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 shadow-md">
            <span className="text-white text-xs font-extrabold tracking-tight">ATS</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-800 leading-none tracking-tight">HR Candidati</h1>
            <p className="text-xs text-slate-400 mt-1 leading-none">Gestione selezione del personale</p>
          </div>
        </div>
        <StatoDB />
      </header>

      <div className="flex flex-1 min-h-0">
        <Sidebar paginaAttiva={paginaAttiva} onChange={setPaginaAttiva} />
        <main className="flex-1 overflow-auto p-8">
          {paginaAttiva === 'candidati'     && <PaginaCandidati />}
          {paginaAttiva === 'posizioni'     && <PaginaPosizioni />}
          {paginaAttiva === 'aggiornamenti' && <PaginaAggiornamenti />}
        </main>
      </div>

    </div>
  );
}
