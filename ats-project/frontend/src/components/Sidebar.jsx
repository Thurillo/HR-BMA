import { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const VOCI = [
  {
    id: 'dashboard',
    etichetta: 'Dashboard',
    icona: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
      </svg>
    ),
  },
  {
    id: 'candidati',
    etichetta: 'Candidati',
    icona: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z"/>
      </svg>
    ),
  },
  {
    id: 'posizioni',
    etichetta: 'Posizioni aperte',
    icona: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-9-4h2a2 2 0 012 2v2H9V5a2 2 0 012-2z"/>
      </svg>
    ),
  },
  {
    id: 'email',
    etichetta: 'Email',
    icona: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
      </svg>
    ),
  },
  {
    id: 'aggiornamenti',
    etichetta: 'Aggiornamenti',
    icona: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.583 9.065"/>
      </svg>
    ),
  },
];

export default function Sidebar({ paginaAttiva, onChange }) {
  const [espanso, setEspanso]                     = useState(false);
  const [aggiornamentoDisponibile, setAggiornamentoDisponibile] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/api/sistema/versione`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setAggiornamentoDisponibile(d.aggiornamento_disponibile))
      .catch(() => {});
  }, []);

  return (
    <aside
      className={`shrink-0 flex flex-col transition-all duration-300 ${espanso ? 'w-[220px]' : 'w-16'}`}
      style={{ background: '#0d1f1e' }}
    >
      {/* Brand */}
      <div className={`border-b border-white/8 shrink-0 flex items-center ${espanso ? 'px-4 py-5 gap-3' : 'px-0 py-5 justify-center'}`}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}
        >
          <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        </div>
        {espanso && (
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-none tracking-tight truncate">HR-BMA</p>
            <p className="text-slate-500 text-xs mt-1 leading-none truncate">Gestione personale</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 flex flex-col gap-0.5 ${espanso ? 'px-3' : 'px-2'}`}>
        {!espanso && (
          <p className="text-center text-slate-700 text-[10px] font-bold uppercase tracking-widest pb-2 select-none">•••</p>
        )}
        {espanso && (
          <p className="px-2 pb-2 text-xs font-bold text-slate-600 uppercase tracking-widest">Menu</p>
        )}
        {VOCI.map(voce => {
          const attiva = paginaAttiva === voce.id;
          return (
            <button
              key={voce.id}
              onClick={() => onChange(voce.id)}
              title={!espanso ? voce.etichetta : undefined}
              className={`w-full flex items-center rounded-xl text-sm font-semibold transition-all duration-200
                ${espanso ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-2.5'}
                ${attiva
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'
                }`}
            >
              <span className={`flex items-center justify-center shrink-0 transition-all duration-200 rounded-lg
                ${espanso ? 'w-7 h-7' : 'w-8 h-8'}
                ${attiva ? 'text-white' : 'text-slate-500'}`}>
                {voce.icona}
              </span>
              {espanso && <span className="flex-1 text-left">{voce.etichetta}</span>}
              {voce.id === 'aggiornamenti' && aggiornamentoDisponibile && (
                <span className={`w-2 h-2 rounded-full shrink-0 ${attiva ? 'bg-white' : 'bg-teal-400'}`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Toggle espandi/comprimi */}
      <div className={`border-t border-white/8 py-4 flex ${espanso ? 'px-3 justify-end' : 'justify-center'}`}>
        <button
          onClick={() => setEspanso(e => !e)}
          title={espanso ? 'Comprimi menu' : 'Espandi menu'}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition"
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ${espanso ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>

      {/* Footer (solo espansa) */}
      {espanso && (
        <div className="px-5 pb-4">
          <p className="text-xs text-slate-700">© 2026 HR-BMA</p>
        </div>
      )}
    </aside>
  );
}
