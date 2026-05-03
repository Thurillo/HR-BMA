import { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const VOCI = [
  {
    id: 'candidati',
    etichetta: 'Candidati',
    icona: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
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
          const dati = await res.json();
          setAggiornamentoDisponibile(dati.aggiornamento_disponibile);
        }
      } catch { /* silenzioso */ }
    }
    controlla();
  }, []);

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col py-4 gap-1">
      {VOCI.map(voce => (
        <button
          key={voce.id}
          onClick={() => onChange(voce.id)}
          className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
            ${paginaAttiva === voce.id
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}
        >
          {voce.icona}
          <span className="flex-1">{voce.etichetta}</span>
          {voce.id === 'aggiornamenti' && aggiornamentoDisponibile && (
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Aggiornamento disponibile"/>
          )}
        </button>
      ))}
    </aside>
  );
}
