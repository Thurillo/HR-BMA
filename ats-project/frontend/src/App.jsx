import KanbanBoard from './components/KanbanBoard';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Barra superiore */}
      <header className="bg-white border-b border-slate-200 shadow-sm px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white text-sm font-bold">ATS</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 leading-none">HR Candidati</h1>
          <p className="text-xs text-slate-400 mt-0.5">Gestione selezione del personale</p>
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 p-6">
        <KanbanBoard />
      </main>
    </div>
  );
}
