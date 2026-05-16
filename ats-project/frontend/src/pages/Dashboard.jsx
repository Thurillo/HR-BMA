import { useState, useEffect } from 'react';
import { getCandidati } from '../api/candidati';
import { getPosizioni } from '../api/posizioni';
import { STATI_CANDIDATO, BADGE_STATUS, DOT_STATUS } from '../config/stati';

/* ── Helpers ────────────────────────────────────────────────────── */
function tempoRelativo(dataStr) {
  const diff = Date.now() - new Date(dataStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min || 1} min fa`;
  const ore = Math.floor(min / 60);
  if (ore < 24) return `${ore}h fa`;
  const gg = Math.floor(ore / 24);
  return `${gg} ${gg === 1 ? 'giorno' : 'giorni'} fa`;
}

function iniziali(c) {
  return `${c.first_name?.[0] ?? ''}${c.last_name?.[0] ?? ''}`.toUpperCase();
}

/* Genera un colore avatar consistente per nome */
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#4f46e5)',
  'linear-gradient(135deg,#14b8a6,#0d9488)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#3b82f6,#2563eb)',
  'linear-gradient(135deg,#8b5cf6,#7c3aed)',
  'linear-gradient(135deg,#ec4899,#db2777)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f97316,#ea580c)',
];
function avatarGradient(nome = '') {
  let h = 0;
  for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

/* ── Skeleton ───────────────────────────────────────────────────── */
function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

/* ── KPI Card premium ───────────────────────────────────────────── */
function KpiCard({ etichetta, valore, sublabel, icon, accentColor, accentBg, trendUp, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl text-left group w-full overflow-hidden"
      style={{
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s, transform 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(0,0,0,0.10)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Accent top border */}
      <div className="h-0.5 w-full" style={{ background: accentColor }} />

      <div className="px-5 py-5 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>{etichetta}</p>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums leading-none">{valore ?? '—'}</p>
          {sublabel && (
            <p className="text-[11px] text-slate-400 mt-2 leading-none">{sublabel}</p>
          )}
          {trendUp !== undefined && (
            <div className={`inline-flex items-center gap-1 mt-2 text-[11px] font-semibold ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={trendUp ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}/>
              </svg>
              {trendUp ? 'In crescita' : 'In calo'}
            </div>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: accentBg }}
        >
          <span style={{ color: accentColor }}>{icon}</span>
        </div>
      </div>
    </button>
  );
}

/* ── Status Badge ───────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const s = BADGE_STATUS[status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`status-pill ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${s.dot}`} />
      {status}
    </span>
  );
}

/* ── Pipeline Bar ───────────────────────────────────────────────── */
function PipelineBar({ stato, n, tot }) {
  const perc = tot > 0 ? Math.round((n / tot) * 100) : 0;
  const dotClass = DOT_STATUS[stato] ?? 'bg-slate-400';
  const s = BADGE_STATUS[stato] ?? { dot: 'bg-slate-400' };

  return (
    <div className="flex items-center gap-3 group">
      {/* Label */}
      <div className="w-32 shrink-0 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
        <span className="text-[12px] font-medium text-slate-600 truncate">{stato}</span>
      </div>

      {/* Bar */}
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${dotClass}`}
          style={{ width: `${perc}%` }}
        />
      </div>

      {/* Count */}
      <div className="flex items-center gap-2 shrink-0 w-12 justify-end">
        <span className="text-[12px] font-bold text-slate-700 tabular-nums">{n}</span>
        <span className="text-[10px] text-slate-400 tabular-nums">{perc}%</span>
      </div>
    </div>
  );
}

/* ── Componente candidato recente ───────────────────────────────── */
function FeedRow({ c, onClick }) {
  const nome = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim();
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-indigo-50/40 transition-colors text-left group"
      style={{ borderBottom: '1px solid #f8fafc' }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm"
        style={{ background: avatarGradient(nome) }}
      >
        {iniziali(c)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
          {c.first_name} {c.last_name}
        </p>
        <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.current_role || 'Ruolo non specificato'}</p>
      </div>

      {/* Stato + timestamp */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {c.status && <StatusBadge status={c.status} />}
        <span className="text-[10px] text-slate-400">{c.created_at ? tempoRelativo(c.created_at) : ''}</span>
      </div>
    </button>
  );
}

/* ── Quick stat section header ──────────────────────────────────── */
function SectionHeader({ titolo, sublabel, action, onAction }) {
  return (
    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
      <div>
        <h2 className="text-[13px] font-bold text-slate-700">{titolo}</h2>
        {sublabel && <p className="text-[11px] text-slate-400 mt-0.5">{sublabel}</p>}
      </div>
      {action && (
        <button
          onClick={onAction}
          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition"
        >
          {action} →
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD PRINCIPALE
   ═══════════════════════════════════════════════════════ */
export default function Dashboard({ onNavigate }) {
  const [candidati, setCandidati] = useState([]);
  const [posizioni, setPosizioni] = useState([]);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    Promise.all([getCandidati(), getPosizioni()])
      .then(([c, p]) => {
        setCandidati(Array.isArray(c) ? c : (c.dati ?? []));
        setPosizioni(Array.isArray(p) ? p : (p.dati ?? []));
      })
      .catch(() => {})
      .finally(() => setCaricamento(false));
  }, []);

  const ora                = new Date();
  const settimanaScorsa    = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const nuoviSettimana     = candidati.filter(c => new Date(c.created_at) >= settimanaScorsa).length;
  const posizioniAperte    = posizioni.filter(p => p.stato === 'Aperta').length;
  const inColloquio        = candidati.filter(c => c.status === '1° Colloquio' || c.status === '2° Colloquio').length;
  const assunti            = candidati.filter(c => c.status === 'Assunto').length;

  const perStato = Object.fromEntries(
    STATI_CANDIDATO.map(s => [s, candidati.filter(c => c.status === s).length])
  );

  const recenti = [...candidati]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  /* Greeting */
  const ora_num = ora.getHours();
  const greeting = ora_num < 12 ? 'Buongiorno' : ora_num < 18 ? 'Buon pomeriggio' : 'Buonasera';

  /* ── Skeleton ── */
  if (caricamento) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">

      {/* ── Greeting ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">{greeting} 👋</h2>
          <p className="text-sm text-slate-500 mt-1">
            {ora.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
            <span className="font-medium text-slate-700">{candidati.length}</span> candidati in database
          </p>
        </div>
        <button
          onClick={() => onNavigate?.('candidati')}
          className="btn-primary shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Aggiungi candidato
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          etichetta="Totale candidati"
          valore={candidati.length}
          accentColor="#6366f1"
          accentBg="#eef2ff"
          onClick={() => onNavigate?.('candidati')}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          }
        />
        <KpiCard
          etichetta="Nuovi questa settimana"
          valore={nuoviSettimana}
          sublabel="Ultimi 7 giorni"
          accentColor="#3b82f6"
          accentBg="#eff6ff"
          trendUp={nuoviSettimana > 0}
          onClick={() => onNavigate?.('candidati')}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
          }
        />
        <KpiCard
          etichetta="Posizioni aperte"
          valore={posizioniAperte}
          sublabel={`di ${posizioni.length} totali`}
          accentColor="#8b5cf6"
          accentBg="#f5f3ff"
          onClick={() => onNavigate?.('posizioni')}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-9-4h2a2 2 0 012 2v2H9V5a2 2 0 012-2z"/>
            </svg>
          }
        />
        <KpiCard
          etichetta="In colloquio"
          valore={inColloquio}
          sublabel={assunti > 0 ? `${assunti} già assunti` : '1° e 2° colloquio'}
          accentColor="#f59e0b"
          accentBg="#fffbeb"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          }
        />
      </div>

      {/* ── Pipeline + Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Pipeline per stato */}
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <SectionHeader
            titolo="Pipeline candidati"
            sublabel="Distribuzione per fase di selezione"
            action="Vedi tutti"
            onAction={() => onNavigate?.('candidati')}
          />
          <div className="px-5 py-5 flex flex-col gap-4">
            {candidati.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                </div>
                <p className="text-sm text-slate-400 italic">Nessun candidato</p>
              </div>
            ) : STATI_CANDIDATO.map(stato => (
              <PipelineBar
                key={stato}
                stato={stato}
                n={perStato[stato] ?? 0}
                tot={candidati.length}
              />
            ))}
          </div>

          {/* Mini stat footer */}
          {candidati.length > 0 && (
            <div
              className="grid grid-cols-2 divide-x"
              style={{ borderTop: '1px solid #f1f5f9' }}
            >
              <div className="px-5 py-3 text-center">
                <p className="text-[11px] text-slate-400">Tasso conversione</p>
                <p className="text-[15px] font-bold text-emerald-600 mt-0.5">
                  {candidati.length > 0 ? `${Math.round((assunti / candidati.length) * 100)}%` : '—'}
                </p>
              </div>
              <div className="px-5 py-3 text-center">
                <p className="text-[11px] text-slate-400">Scartati</p>
                <p className="text-[15px] font-bold text-red-500 mt-0.5">
                  {perStato['Scartato'] ?? 0}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Feed ultimi arrivi */}
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <SectionHeader
            titolo="Ultimi inserimenti"
            sublabel={`${recenti.length} candidati più recenti`}
            action="Tutti i candidati"
            onAction={() => onNavigate?.('candidati')}
          />
          <div className="overflow-hidden">
            {recenti.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                <p className="text-sm text-slate-400 italic">Nessun candidato inserito</p>
              </div>
            ) : recenti.map(c => (
              <FeedRow key={c.id} c={c} onClick={() => onNavigate?.('candidati')} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Posizioni aperte (mini lista) ── */}
      {posizioni.filter(p => p.stato === 'Aperta').length > 0 && (
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <SectionHeader
            titolo="Posizioni aperte attive"
            sublabel={`${posizioniAperte} posizione${posizioniAperte !== 1 ? 'i' : ''} in ricerca`}
            action="Gestisci posizioni"
            onAction={() => onNavigate?.('posizioni')}
          />
          <div className="px-5 py-4 flex flex-wrap gap-2">
            {posizioni
              .filter(p => p.stato === 'Aperta')
              .slice(0, 8)
              .map(p => (
                <button
                  key={p.id}
                  onClick={() => onNavigate?.('posizioni')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium transition"
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  {p.titolo || p.title || `Posizione #${p.id}`}
                  {p.location && <span className="text-emerald-600/60 text-[10px]">· {p.location}</span>}
                </button>
              ))}
          </div>
        </div>
      )}

    </div>
  );
}
