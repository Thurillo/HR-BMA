import { useState } from 'react';
import KanbanBoard from './components/KanbanBoard';
import PaginaPosizioni from './components/PaginaPosizioni';
import PaginaAggiornamenti from './components/PaginaAggiornamenti';
import Sidebar from './components/Sidebar';
import StatoDB from './components/StatoDB';

export default function App() {
  const [paginaAttiva, setPaginaAttiva] = useState('candidati');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">ATS</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">HR Candidati</h1>
            <p className="text-xs text-slate-400 mt-0.5">Gestione selezione del personale</p>
          </div>
        </div>
        <StatoDB />
      </header>

      {/* Layout principale */}
      <div className="flex flex-1 min-h-0">
        <Sidebar paginaAttiva={paginaAttiva} onChange={setPaginaAttiva} />

        <main className="flex-1 overflow-auto p-6">
          {paginaAttiva === 'candidati'    && <KanbanBoard />}
          {paginaAttiva === 'posizioni'    && <PaginaPosizioni />}
          {paginaAttiva === 'aggiornamenti' && <PaginaAggiornamenti />}
        </main>
      </div>

    </div>
  );
}
