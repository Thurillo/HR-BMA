import { useState, useEffect } from 'react';
import { getCandidati } from '../api/candidati';
import { getPosizioni } from '../api/posizioni';
import { STATI_CANDIDATO, BADGE_STATUS } from '../config/stati';

function tempoRelativo(dataStr) {
  const diff = Date.now() - new Date(dataStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min || 1} min fa`;
  const ore = Math.floor(min / 60);
  if (ore < 24) return `${ore} ore fa`;
  const gg = Math.floor(ore / 24);
  return `${gg} ${gg === 1 ? 'giorno' : 'giorni'} fa`;
}

function iniziali(c) {
  return `${c.first_name?.[0] ?? ''}${c.last_name?.[0] ?? ''}`.toUpperCase();
}

function KpiCard({ etichetta, valore, sublabel, accentClass, icona }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex">
      <div className={`w-1.5 shrink-0 ${accentClass}`} />
      <div className="flex-1 px-6 py-5 flex items-center gap-5">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accentClass} bg-opacity-15`}>
          {icona}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{valore}</p>
          <p className="text-xs font-medium text-slate-500 mt-1.5 leading-none">{etichetta}</p>
          {sublabel && <p className="text-xs text-slate-400 mt-1 leading-none">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = BADGE_STATUS[status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

export default function Dashboard() {
  const [candidati, setCandidati]   = useState([]);
  const [posizioni, setPosizioni]   = useState([]);
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

  const settimanaScorsa   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const nuoviSettimana    = candidati.filter(c => new Date(c.created_at) >= settimanaScorsa).length;
  const posizioniAperte   = posizioni.filter(p => p.stato === 'Aperta').length;
  const inColloquio       = candidati.filter(c => c.status === '1° Colloquio' || c.status === '2° Colloquio').length;

  const perStato = Object.fromEntries(
    STATI_CANDIDATO.map(s => [s, candidati.filter(c => c.status === s).length])
  );

  const recenti = [...candidati]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8);

  if (caricamento) {
    return (
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          etichetta="Totale candidati"
          valore={candidati.length}
          accentClass="bg-teal-600"
          icona={
            <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          }
        />
        <KpiCard
          etichetta="Nuovi questa settimana"
          valore={nuoviSettimana}
          sublabel="ultimi 7 giorni"
          accentClass="bg-blue-500"
          icona={
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
          }
        />
        <KpiCard
          etichetta="Posizioni aperte"
          valore={posizioniAperte}
          sublabel={`di ${posizioni.length} totali`}
          accentClass="bg-violet-500"
          icona={
            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-9-4h2a2 2 0 012 2v2H9V5a2 2 0 012-2z"/>
            </svg>
          }
        />
        <KpiCard
          etichetta="In colloquio"
          valore={inColloquio}
          sublabel="1° e 2° colloquio"
          accentClass="bg-amber-500"
          icona={
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          }
        />
      </div>

      {/* Pipeline + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pipeline per stato */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Pipeline candidati</h2>
            <p className="text-xs text-slate-400 mt-0.5">Distribuzione per stato</p>
          </div>
          <div className="px-6 py-5 flex flex-col gap-3">
            {candidati.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-6">Nessun candidato</p>
            ) : STATI_CANDIDATO.map(stato => {
              const n    = perStato[stato] ?? 0;
              const perc = candidati.length > 0 ? Math.round((n / candidati.length) * 100) : 0;
              const s    = BADGE_STATUS[stato] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
              return (
                <div key={stato} className="flex items-center gap-3">
                  <div className="w-28 shrink-0 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                    <span className="text-xs font-medium text-slate-600 truncate">{stato}</span>
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${s.dot}`}
                      style={{ width: `${perc}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 w-6 text-right tabular-nums">{n}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feed recenti */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Ultimi inserimenti</h2>
            <p className="text-xs text-slate-400 mt-0.5">8 candidati più recenti</p>
          </div>
          <div className="divide-y divide-slate-50">
            {recenti.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-10">Nessun candidato inserito</p>
            ) : recenti.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{iniziali(c)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {c.first_name} {c.last_name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{c.current_role || 'Ruolo non specificato'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {c.status && <StatusBadge status={c.status} />}
                  <span className="text-[10px] text-slate-400">{c.created_at ? tempoRelativo(c.created_at) : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
