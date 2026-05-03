import { useState, useEffect, useCallback } from 'react';
import { getCandidati, eliminaCandidato } from '../api/candidati';
import DettagliModale from './DettagliModale';

const COLONNE = [
  { key: 'last_name',         label: 'Cognome' },
  { key: 'first_name',        label: 'Nome' },
  { key: 'current_role',      label: 'Ruolo' },
  { key: 'macro_sector',      label: 'Settore' },
  { key: 'seniority',         label: 'Seniority' },
  { key: 'status',            label: 'Stato' },
  { key: 'ral_indicata',      label: 'RAL' },
  { key: 'modalita_lavoro',   label: 'Modalità' },
  { key: 'location',          label: 'Sede' },
];

const BADGE_STATUS = {
  'Nuovo':          'bg-slate-100 text-slate-600',
  '1° Colloquio':   'bg-blue-100 text-blue-700',
  '2° Colloquio':   'bg-indigo-100 text-indigo-700',
  'Offerta':        'bg-amber-100 text-amber-700',
  'Assunto':        'bg-green-100 text-green-700',
  'Scartato':       'bg-red-100 text-red-600',
};

function IconSort({ attiva, dir }) {
  return (
    <svg className={`w-3 h-3 inline ml-1 ${attiva ? 'text-blue-600' : 'text-slate-300'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      {dir === 'asc'
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/>
        : <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>}
    </svg>
  );
}

export default function PaginaCandidati() {
  const [candidati, setCandidati]       = useState([]);
  const [caricamento, setCaricamento]   = useState(true);
  const [errore, setErrore]             = useState(null);
  const [sortKey, setSortKey]           = useState('last_name');
  const [sortDir, setSortDir]           = useState('asc');
  const [filtro, setFiltro]             = useState('');
  const [selezionato, setSelezionato]   = useState(null);
  const [daEliminare, setDaEliminare]   = useState(null);
  const [eliminando, setEliminando]     = useState(false);

  const carica = useCallback(async () => {
    try {
      setCaricamento(true);
      setErrore(null);
      setCandidati(await getCandidati());
    } catch (err) {
      setErrore(err.message);
    } finally {
      setCaricamento(false);
    }
  }, []);

  useEffect(() => { carica(); }, [carica]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  function val(c, k) {
    const v = c[k];
    if (v === null || v === undefined) return '';
    return String(v).toLowerCase();
  }

  const filtrati = candidati.filter(c => {
    if (!filtro.trim()) return true;
    const q = filtro.toLowerCase();
    return [
      c.first_name, c.last_name, c.email, c.current_role,
      c.macro_sector, c.location, c.status,
    ].some(v => v && String(v).toLowerCase().includes(q));
  });

  const ordinati = [...filtrati].sort((a, b) => {
    const va = val(a, sortKey);
    const vb = val(b, sortKey);
    const cmp = va.localeCompare(vb, 'it', { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  async function confermaElimina() {
    if (!daEliminare) return;
    setEliminando(true);
    try {
      await eliminaCandidato(daEliminare.id);
      setCandidati(prev => prev.filter(c => c.id !== daEliminare.id));
      setDaEliminare(null);
    } catch {
      /* non bloccare la UI */
    } finally {
      setEliminando(false);
    }
  }

  if (caricamento) return (
    <div className="flex items-center justify-center h-64 text-slate-500">Caricamento candidati…</div>
  );

  if (errore) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-600">
      <p>Errore: {errore}</p>
      <button onClick={carica} className="text-sm bg-red-100 px-4 py-1.5 rounded-lg hover:bg-red-200">Riprova</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Candidati</h2>
          <p className="text-sm text-slate-500 mt-0.5">{filtrati.length} di {candidati.length} candidati</p>
        </div>
        <input
          type="text"
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          placeholder="Cerca per nome, ruolo, settore…"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-72"
        />
      </div>

      {/* Tabella */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {COLONNE.map(col => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-700 whitespace-nowrap"
                  >
                    {col.label}
                    <IconSort attiva={sortKey === col.key} dir={sortKey === col.key ? sortDir : 'asc'} />
                  </th>
                ))}
                <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ordinati.length === 0 ? (
                <tr>
                  <td colSpan={COLONNE.length + 1} className="text-center py-12 text-slate-400">
                    Nessun candidato trovato
                  </td>
                </tr>
              ) : ordinati.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  {COLONNE.map(col => (
                    <td key={col.key} className="px-3 py-2.5 text-slate-700 max-w-[180px] truncate">
                      {col.key === 'status' ? (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE_STATUS[c.status] ?? 'bg-slate-100 text-slate-500'}`}>
                          {c.status ?? '—'}
                        </span>
                      ) : (
                        <span title={c[col.key] ?? ''}>{c[col.key] ?? <span className="text-slate-300">—</span>}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelezionato(c)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => setDaEliminare(c)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition ml-1"
                    >
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale dettaglio/modifica */}
      {selezionato && (
        <DettagliModale
          candidato={selezionato}
          onChiudi={() => setSelezionato(null)}
          onAggiornato={aggiornato => {
            setCandidati(prev => prev.map(c => c.id === aggiornato.id ? aggiornato : c));
            setSelezionato(aggiornato);
          }}
        />
      )}

      {/* Modale conferma eliminazione */}
      {daEliminare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-bold text-slate-800 mb-2">Elimina candidato</h3>
            <p className="text-sm text-slate-600 mb-5">
              Vuoi eliminare <span className="font-semibold">{daEliminare.first_name} {daEliminare.last_name}</span>?
              L'operazione è irreversibile.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDaEliminare(null)}
                className="text-sm px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              >
                Annulla
              </button>
              <button
                onClick={confermaElimina}
                disabled={eliminando}
                className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60"
              >
                {eliminando ? 'Eliminazione…' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
