import { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const VOCI = [
  {
    id: 'candidati',
    etichetta: 'Candidati',
    icona: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z"/>
      </svg>
    ),
  },
  {
    id: 'posizioni',
    etichetta: 'Posizioni aperte',
    icona: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-9-4h2a2 2 0 012 2v2H9V5a2 2 0 012-2z"/>
      </svg>
    ),
  },
  {
    id: 'aggiornamenti',
    etichetta: 'Aggiornamenti',
    icona: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.583 9.065"/>
      </svg>
    ),
  },
];

export default function Sidebar({ paginaAttiva, onChange }) {
  const [aggiornamentoDisponibile, setAggiornamentoDisponibile] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/api/sistema/versione`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setAggiornamentoDisponibile(d.aggiornamento_disponibile))
      .catch(() => {});
  }, []);

  return (
    <aside className="w-72 shrink-0 flex flex-col" style={{ background: '#0f172a' }}>

      {/* Brand */}
      <div className="px-7 py-8 border-b border-white/8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-extrabold text-base leading-none tracking-tight">HR-BMA</p>
            <p className="text-slate-500 text-xs mt-1.5 leading-none">Gestione del personale</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-5 py-7 flex flex-col gap-2">
        <p className="px-3 pb-4 text-xs font-bold text-slate-600 uppercase tracking-widest">Menu</p>
        {VOCI.map(voce => {
          const attiva = paginaAttiva === voce.id;
          return (
            <button key={voce.id} onClick={() => onChange(voce.id)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-semibold transition-all text-left
                ${attiva
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/6'
                }`}
              style={attiva ? { background: 'linear-gradient(135deg,#6366f1,#4f46e5)' } : {}}
            >
              <span className={attiva ? 'text-white' : 'text-slate-500'}>{voce.icona}</span>
              <span className="flex-1">{voce.etichetta}</span>
              {voce.id === 'aggiornamenti' && aggiornamentoDisponibile && (
                <span className={`w-2 h-2 rounded-full ${attiva ? 'bg-white' : 'bg-indigo-400'}`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-7 py-6 border-t border-white/8">
        <p className="text-xs text-slate-600">© 2026 HR-BMA</p>
      </div>
    </aside>
  );
}
