import { useState, useEffect } from 'react';
import { getCandidati } from '../api/candidati';
import { getPosizioni } from '../api/posizioni';
import { STATI_CANDIDATO, BADGE_STATUS, DOT_STATUS } from '../config/stati';

/* ── Helpers ─────────────────────────────────────────────────────── */
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

/* ── Skeleton ────────────────────────────────────────────────────── */
function Skeleton({ h = 'h-6', w = 'w-full', rounded = 'rounded-xl' }) {
  return <div className={`skeleton ${h} ${w} ${rounded}`} />;
}

/* ════════════════════════════════════════════════════════════
   KPI CARD — spazio generoso, gerarchia tipografica chiara
   ════════════════════════════════════════════════════════════ */
function KpiCard({ etichetta, valore, sublabel, icon, accentColor, accentBg, trendLabel, trendUp, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl w-full text-left group"
      style={{
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s ease, transform 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Accent top stripe */}
      <div className="h-1 w-full rounded-t-2xl" style={{ background: accentColor }} />

      <div className="p-6">
        {/* Row: label + icon */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <p
            className="text-xs font-semibold uppercase tracking-wider leading-relaxed"
            style={{ color: '#94a3b8' }}
          >
            {etichetta}
          </p>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: accentBg }}
          >
            <span style={{ color: accentColor }}>{icon}</span>
          </div>
        </div>

        {/* Big number */}
        <p
          className="text-4xl font-extrabold tabular-nums leading-none"
          style={{ color: '#0f172a' }}
        >
          {valore ?? '—'}
        </p>

        {/* Sublabel */}
        {sublabel && (
          <p className="text-xs mt-2 leading-relaxed" style={{ color: '#94a3b8' }}>
            {sublabel}
          </p>
        )}

        {/* Trend badge */}
        {trendLabel !== undefined && (
          <div
            className="inline-flex items-center gap-1 mt-3 text-xs font-semibold px-2 py-1 rounded-lg"
            style={{
              background: trendUp ? '#f0fdf4' : '#fef2f2',
              color: trendUp ? '#16a34a' : '#dc2626',
            }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d={trendUp ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
            </svg>
            {trendLabel}
          </div>
        )}
      </div>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   STATUS BADGE
   ════════════════════════════════════════════════════════════ */
function StatusBadge({ status }) {
  const s = BADGE_STATUS[status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {status}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════
   PIPELINE BAR ROW — spaziatura generosa, barra più spessa
   ════════════════════════════════════════════════════════════ */
function PipelineBar({ stato, n, tot }) {
  const perc = tot > 0 ? Math.round((n / tot) * 100) : 0;
  const dotClass = DOT_STATUS[stato] ?? 'bg-slate-400';

  return (
    <div className="flex items-center gap-4 py-1">
      {/* Dot + Label — larghezza fissa per allineamento */}
      <div className="flex items-center gap-2.5 shrink-0" style={{ width: '130px' }}>
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass}`} />
        <span className="text-sm font-medium text-slate-700 truncate">{stato}</span>
      </div>

      {/* Progress bar */}
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: '8px', background: '#f1f5f9' }}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${dotClass}`}
          style={{ width: `${perc}%`, minWidth: n > 0 ? '4px' : '0' }}
        />
      </div>

      {/* Count + % */}
      <div className="flex items-center gap-2 shrink-0 text-right" style={{ minWidth: '56px' }}>
        <span className="text-sm font-bold text-slate-800 tabular-nums">{n}</span>
        <span className="text-xs text-slate-400 tabular-nums">{perc}%</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   FEED ROW — candidato recente, layout robusto anti-overflow
   ════════════════════════════════════════════════════════════ */
function FeedRow({ c, onClick }) {
  const nome = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim();
  return (
    <button
      onClick={onClick}
      className="w-full text-left group transition-colors"
      style={{ borderBottom: '1px solid #f8fafc' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div className="flex items-center gap-4 px-6 py-4">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-sm font-bold shadow-sm"
          style={{ background: avatarGradient(nome) }}
        >
          {iniziali(c)}
        </div>

        {/* Name + role — flex-1 con min-w-0 per truncate sicuro */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-700 transition-colors"
            title={nome}
          >
            {c.first_name} {c.last_name}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 truncate" title={c.current_role || ''}>
            {c.current_role || 'Ruolo non specificato'}
          </p>
        </div>

        {/* Badge + timestamp — colonna destra fissa */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {c.status && <StatusBadge status={c.status} />}
          {c.created_at && (
            <span className="text-[11px] text-slate-400 tabular-nums">
              {tempoRelativo(c.created_at)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   CARD HEADER — consistente in tutta la dashboard
   ════════════════════════════════════════════════════════════ */
function CardHeader({ titolo, sublabel, action, onAction }) {
  return (
    <div
      className="flex items-center justify-between px-6 py-5"
      style={{ borderBottom: '1px solid #f1f5f9' }}
    >
      <div className="min-w-0 pr-4">
        <h2 className="text-sm font-bold text-slate-800 leading-none">{titolo}</h2>
        {sublabel && (
          <p className="text-xs text-slate-400 mt-1.5 leading-none">{sublabel}</p>
        )}
      </div>
      {action && (
        <button
          onClick={onAction}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition shrink-0 whitespace-nowrap"
        >
          {action} →
        </button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CARD WRAPPER — bordo arrotondato + ombra coerente
   ════════════════════════════════════════════════════════════ */
function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden ${className}`}
      style={{
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SKELETON LOADING
   ════════════════════════════════════════════════════════════ */
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {/* Greeting skeleton */}
      <div className="flex flex-col gap-2">
        <Skeleton h="h-7" w="w-52" />
        <Skeleton h="h-4" w="w-72" />
      </div>
      {/* KPI skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} h="h-36" rounded="rounded-2xl" />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton h="h-80" rounded="rounded-2xl" />
        <Skeleton h="h-80" rounded="rounded-2xl" />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   DASHBOARD — componente principale
   ════════════════════════════════════════════════════════════ */
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

  if (caricamento) return <DashboardSkeleton />;

  /* Calcoli metriche */
  const ora             = new Date();
  const settimanaScorsa = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const nuoviSettimana  = candidati.filter(c => new Date(c.created_at) >= settimanaScorsa).length;
  const posizioniAperte = posizioni.filter(p => p.stato === 'Aperta').length;
  const inColloquio     = candidati.filter(c =>
    c.status === '1° Colloquio' || c.status === '2° Colloquio'
  ).length;
  const assunti = candidati.filter(c => c.status === 'Assunto').length;

  const perStato = Object.fromEntries(
    STATI_CANDIDATO.map(s => [s, candidati.filter(c => c.status === s).length])
  );

  const recenti = [...candidati]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  /* Greeting dinamico */
  const h = ora.getHours();
  const greeting = h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera';

  /* Icone KPI */
  const iconCandidati = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
  const iconNuovi = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
  const iconPosizioni = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-9-4h2a2 2 0 012 2v2H9V5a2 2 0 012-2z" />
    </svg>
  );
  const iconColloquio = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  return (
    <div className="flex flex-col gap-8 max-w-screen-2xl">

      {/* ── Greeting + CTA ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 leading-tight">
            {greeting} 👋
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            {ora.toLocaleDateString('it-IT', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
            {' '}·{' '}
            <span className="font-semibold text-slate-700">{candidati.length}</span>
            {' '}candidat{candidati.length === 1 ? 'o' : 'i'} in database
          </p>
        </div>
        <button
          onClick={() => onNavigate?.('candidati')}
          className="btn-primary shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Aggiungi candidato
        </button>
      </div>

      {/* ── KPI Cards (4 colonne) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          etichetta="Totale candidati"
          valore={candidati.length}
          accentColor="#6366f1"
          accentBg="#eef2ff"
          icon={iconCandidati}
          onClick={() => onNavigate?.('candidati')}
        />
        <KpiCard
          etichetta="Nuovi questa settimana"
          valore={nuoviSettimana}
          sublabel="Ultimi 7 giorni"
          accentColor="#3b82f6"
          accentBg="#eff6ff"
          icon={iconNuovi}
          trendLabel={nuoviSettimana > 0 ? `+${nuoviSettimana} arrivi` : 'Nessun nuovo'}
          trendUp={nuoviSettimana > 0}
          onClick={() => onNavigate?.('candidati')}
        />
        <KpiCard
          etichetta="Posizioni aperte"
          valore={posizioniAperte}
          sublabel={`di ${posizioni.length} totali`}
          accentColor="#8b5cf6"
          accentBg="#f5f3ff"
          icon={iconPosizioni}
          onClick={() => onNavigate?.('posizioni')}
        />
        <KpiCard
          etichetta="In colloquio"
          valore={inColloquio}
          sublabel={assunti > 0 ? `${assunti} già assunti` : '1° e 2° colloquio'}
          accentColor="#f59e0b"
          accentBg="#fffbeb"
          icon={iconColloquio}
        />
      </div>

      {/* ── Pipeline + Feed (2 colonne) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pipeline candidati */}
        <Card>
          <CardHeader
            titolo="Pipeline candidati"
            sublabel="Distribuzione per fase di selezione"
            action="Vedi tutti"
            onAction={() => onNavigate?.('candidati')}
          />

          <div className="px-6 py-5 flex flex-col gap-2">
            {candidati.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400 italic">Nessun candidato nel sistema</p>
              </div>
            ) : (
              STATI_CANDIDATO.map(stato => (
                <PipelineBar
                  key={stato}
                  stato={stato}
                  n={perStato[stato] ?? 0}
                  tot={candidati.length}
                />
              ))
            )}
          </div>

          {/* Footer mini-stats */}
          {candidati.length > 0 && (
            <div
              className="grid grid-cols-2 divide-x divide-slate-100"
              style={{ borderTop: '1px solid #f1f5f9' }}
            >
              <div className="px-6 py-4 text-center">
                <p className="text-xs text-slate-400 leading-none mb-1.5">Tasso conversione</p>
                <p className="text-lg font-extrabold leading-none" style={{ color: '#16a34a' }}>
                  {Math.round((assunti / candidati.length) * 100)}%
                </p>
              </div>
              <div className="px-6 py-4 text-center">
                <p className="text-xs text-slate-400 leading-none mb-1.5">Scartati</p>
                <p className="text-lg font-extrabold leading-none" style={{ color: '#dc2626' }}>
                  {perStato['Scartato'] ?? 0}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Feed ultimi inserimenti */}
        <Card>
          <CardHeader
            titolo="Ultimi inserimenti"
            sublabel={`${Math.min(recenti.length, 10)} candidati più recenti`}
            action="Tutti i candidati"
            onAction={() => onNavigate?.('candidati')}
          />

          <div>
            {recenti.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400 italic">Nessun candidato inserito</p>
              </div>
            ) : (
              recenti.map(c => (
                <FeedRow key={c.id} c={c} onClick={() => onNavigate?.('candidati')} />
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ── Posizioni aperte (chip list) ── */}
      {posizioniAperte > 0 && (
        <Card>
          <CardHeader
            titolo="Posizioni aperte attive"
            sublabel={`${posizioniAperte} posizione${posizioniAperte !== 1 ? 'i' : ''} in ricerca attiva`}
            action="Gestisci posizioni"
            onAction={() => onNavigate?.('posizioni')}
          />
          <div className="px-6 py-5 flex flex-wrap gap-2.5">
            {posizioni
              .filter(p => p.stato === 'Aperta')
              .slice(0, 12)
              .map(p => (
                <button
                  key={p.id}
                  onClick={() => onNavigate?.('posizioni')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; }}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate max-w-[200px]">
                    {p.titolo || p.title || `Posizione #${p.id}`}
                  </span>
                  {p.location && (
                    <span className="text-xs text-emerald-600/60 shrink-0">
                      · {p.location}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </Card>
      )}

    </div>
  );
}
