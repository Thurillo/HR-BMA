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
    async function controlla() {
      try {
        const res = await fetch(`${BASE_URL}/api/sistema/versione`);
        if (res.ok) {
          const d = await res.json();
          setAggiornamentoDisponibile(d.aggiornamento_disponibile);
        }
      } catch { /* silenzioso */ }
    }
    controlla();
  }, []);

  return (
    <aside className="w-64 shrink-0 bg-white border-r-2 border-slate-200 flex flex-col py-6 px-3 gap-1"
      style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>

      <p className="px-4 pb-3 text-xs font-black text-slate-400 uppercase tracking-widest">Navigazione</p>

      {VOCI.map(voce => {
        const attiva = paginaAttiva === voce.id;
        return (
          <button key={voce.id} onClick={() => onChange(voce.id)}
            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all text-left
              ${attiva
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <span className={`shrink-0 ${attiva ? 'text-white' : 'text-slate-400'}`}>
              {voce.icona}
            </span>
            <span className="flex-1 leading-none tracking-tight">{voce.etichetta}</span>
            {voce.id === 'aggiornamenti' && aggiornamentoDisponibile && (
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${attiva ? 'bg-white' : 'bg-blue-500'}`}
                title="Aggiornamento disponibile" />
            )}
          </button>
        );
      })}
    </aside>
  );
}
