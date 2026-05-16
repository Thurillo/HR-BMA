import { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

/* ── Icone SVG inline ────────────────────────────────────────────── */
const Icon = {
  dashboard: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  candidati: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z"/>
    </svg>
  ),
  posizioni: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-9-4h2a2 2 0 012 2v2H9V5a2 2 0 012-2z"/>
    </svg>
  ),
  email: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
  ),
  aggiornamenti: (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.583 9.065"/>
    </svg>
  ),
  chevronLeft: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
    </svg>
  ),
  chevronRight: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
    </svg>
  ),
};

const VOCI = [
  { id: 'dashboard',     etichetta: 'Dashboard',       icona: Icon.dashboard },
  { id: 'candidati',     etichetta: 'Candidati',       icona: Icon.candidati },
  { id: 'posizioni',     etichetta: 'Posizioni aperte', icona: Icon.posizioni },
  { id: 'email',         etichetta: 'Email',           icona: Icon.email },
  { id: 'aggiornamenti', etichetta: 'Aggiornamenti',   icona: Icon.aggiornamenti },
];

/* ── Logo brand SVG ─────────────────────────────────────────────── */
function LogoBrand() {
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
      style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)',
        boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
      }}
    >
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z"/>
      </svg>
    </div>
  );
}

export default function Sidebar({ paginaAttiva, onChange }) {
  const [espanso, setEspanso] = useState(false);
  const [aggiornamentoDisponibile, setAggiornamentoDisponibile] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/api/sistema/versione`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setAggiornamentoDisponibile(d.aggiornamento_disponibile))
      .catch(() => {});
  }, []);

  return (
    <aside
      className={`shrink-0 flex flex-col transition-all duration-300 ease-in-out ${espanso ? 'w-[220px]' : 'w-[64px]'}`}
      style={{
        background: 'linear-gradient(180deg, #0f1729 0%, #0d1520 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* ── Brand ── */}
      <div
        className={`shrink-0 flex items-center gap-3 px-4 py-5`}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <LogoBrand />
        {espanso && (
          <div className="min-w-0 overflow-hidden" style={{ animation: 'fadeIn 0.2s ease-out both' }}>
            <p className="text-white font-bold text-[13px] leading-none tracking-tight truncate">HR-BMA</p>
            <p className="text-[11px] mt-1 leading-none truncate" style={{ color: '#64748b' }}>
              Gestione candidati
            </p>
          </div>
        )}
      </div>

      {/* ── Navigazione ── */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5">
        {!espanso && (
          <p className="text-center text-[10px] font-bold uppercase tracking-widest pb-2 select-none" style={{ color: '#334155' }}>···</p>
        )}
        {espanso && (
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#334155' }}>Menu</p>
        )}

        {VOCI.map(voce => {
          const attiva = paginaAttiva === voce.id;
          const haNotifica = voce.id === 'aggiornamenti' && aggiornamentoDisponibile;

          return (
            <button
              key={voce.id}
              onClick={() => onChange(voce.id)}
              data-tooltip={!espanso ? voce.etichetta : undefined}
              className={`nav-link relative ${espanso ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-2.5'} ${attiva ? 'active' : ''}`}
            >
              {/* Icona */}
              <span className={`flex items-center justify-center shrink-0 rounded-lg transition-colors
                ${espanso ? 'w-7 h-7' : 'w-9 h-9'}
                ${attiva ? 'text-indigo-300' : 'text-slate-500'}`}
              >
                {voce.icona}
              </span>

              {/* Label (solo espanso) */}
              {espanso && (
                <span className="flex-1 text-left text-[13px]">{voce.etichetta}</span>
              )}

              {/* Badge notifica */}
              {haNotifica && (
                <span
                  className={`shrink-0 rounded-full ${espanso ? 'w-2 h-2' : 'absolute top-1.5 right-1.5 w-2 h-2'}`}
                  style={{ background: '#f59e0b', boxShadow: '0 0 6px rgba(245,158,11,0.6)' }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Divider ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

      {/* ── Toggle expand/collapse ── */}
      <div className={`py-3 flex ${espanso ? 'px-3 justify-end' : 'justify-center'}`}>
        <button
          onClick={() => setEspanso(e => !e)}
          title={espanso ? 'Comprimi' : 'Espandi menu'}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition"
          style={{ color: '#475569' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
        >
          <span style={{ transition: 'transform 0.3s', display: 'flex', transform: espanso ? 'rotate(0deg)' : 'rotate(180deg)' }}>
            {Icon.chevronLeft}
          </span>
        </button>
      </div>

      {/* ── Footer versione (solo espanso) ── */}
      {espanso && (
        <div className="px-4 pb-4" style={{ animation: 'fadeIn 0.2s ease-out both' }}>
          <p className="text-[10px]" style={{ color: '#1e293b' }}>© 2026 HR-BMA</p>
        </div>
      )}
    </aside>
  );
}
