import { useState, useEffect, useCallback } from 'react';
import {
  getCandidatiPosizione, aggiungiCandidatoPosizione,
  rimuoviCandidatoPosizione, aggiornaPosizione, eliminaPosizione,
} from '../api/posizioni';
import { getCandidati } from '../api/candidati';

const BADGE_STATO = {
  'Aperta':    'bg-emerald-100 text-emerald-700',
  'In pausa':  'bg-amber-100 text-amber-700',
  'Chiusa':    'bg-slate-100 text-slate-500',
};

const STATI_POSIZIONE = ['Aperta', 'In pausa', 'Chiusa'];

const BADGE_KANBAN = {
  'Nuovo':         'bg-slate-100 text-slate-600',
  '1° Colloquio':  'bg-blue-100 text-blue-700',
  '2° Colloquio':  'bg-violet-100 text-violet-700',
  'Offerta':       'bg-amber-100 text-amber-700',
  'Assunto':       'bg-emerald-100 text-emerald-700',
  'Scartato':      'bg-red-100 text-red-600',
};

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];

function avatarColor(id) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function initials(first, last) {
  return `${(first?.[0] ?? '').toUpperCase()}${(last?.[0] ?? '').toUpperCase()}`;
}

export default function ModalePosizioneDettaglio({ posizione, onChiudi, onAggiornata, onEliminata }) {
  const [candidatiAssociati, setCandidatiAssociati] = useState([]);
  const [tuttiCandidati, setTuttiCandidati] = useState([]);
  const [modalitaModifica, setModalitaModifica] = useState(false);
  const [mostraAggiungi, setMostraAggiungi] = useState(false);
  const [ricerca, setRicerca] = useState('');
  const [form, setForm] = useState({ titolo: posizione.titolo, descrizione: posizione.descrizione ?? '', stato: posizione.stato });
  const [salvataggio, setSalvataggio] = useState(false);
  const [errore, setErrore] = useState(null);

  const caricaCandidatiAssociati = useCallback(async () => {
    try {
      const dati = await getCandidatiPosizione(posizione.id);
      setCandidatiAssociati(dati);
    } catch { /* silenzioso */ }
  }, [posizione.id]);

  useEffect(() => { caricaCandidatiAssociati(); }, [caricaCandidatiAssociati]);

  async function apriAggiungi() {
    if (tuttiCandidati.length === 0) {
      const dati = await getCandidati();
      setTuttiCandidati(dati);
    }
    setRicerca('');
    setMostraAggiungi(true);
  }

  async function aggiungi(candidato) {
    await aggiungiCandidatoPosizione(posizione.id, candidato.id);
    await caricaCandidatiAssociati();
    setMostraAggiungi(false);
  }

  async function rimuovi(candidatoId) {
    await rimuoviCandidatoPosizione(posizione.id, candidatoId);
    setCandidatiAssociati(prev => prev.filter(c => c.id !== candidatoId));
  }

  async function salva() {
    if (!form.titolo.trim()) return setErrore('Il titolo è obbligatorio');
    setSalvataggio(true);
    setErrore(null);
    try {
      const aggiornata = await aggiornaPosizione(posizione.id, form);
      onAggiornata(aggiornata);
      setModalitaModifica(false);
    } catch (err) {
      setErrore(err.message);
    } finally {
      setSalvataggio(false);
    }
  }

  async function elimina() {
    if (!confirm(`Eliminare la posizione "${posizione.titolo}"? L'operazione è irreversibile.`)) return;
    await eliminaPosizione(posizione.id);
    onEliminata(posizione.id);
    onChiudi();
  }

  const idAssociati = new Set(candidatiAssociati.map(c => c.id));
  const candidatiFiltrati = tuttiCandidati
    .filter(c => !idAssociati.has(c.id))
    .filter(c => {
      const q = ricerca.toLowerCase();
      return !q || `${c.first_name} ${c.last_name} ${c.current_role ?? ''}`.toLowerCase().includes(q);
    });

  const cls = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition bg-white";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onChiudi()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Intestazione */}
        <div className="shrink-0">
          <div className="px-6 py-5 bg-gradient-to-r from-indigo-50/60 to-violet-50/60 border-b border-slate-100">
            {modalitaModifica ? (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Titolo</label>
                  <input type="text" value={form.titolo}
                    onChange={e => setForm(p => ({ ...p, titolo: e.target.value }))}
                    className={cls} autoFocus />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Descrizione</label>
                  <textarea rows={2} value={form.descrizione}
                    onChange={e => setForm(p => ({ ...p, descrizione: e.target.value }))}
                    className={`${cls} resize-none`} />
                </div>
                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Stato</label>
                    <select value={form.stato}
                      onChange={e => setForm(p => ({ ...p, stato: e.target.value }))}
                      className={cls}>
                      {STATI_POSIZIONE.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setModalitaModifica(false); setErrore(null); }} disabled={salvataggio}
                      className="text-sm text-slate-600 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-white transition">
                      Annulla
                    </button>
                    <button onClick={salva} disabled={salvataggio}
                      className="text-sm font-semibold bg-emerald-500 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-600 transition disabled:opacity-60">
                      {salvataggio ? 'Salvo…' : 'Salva'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900 truncate">{posizione.titolo}</h2>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE_STATO[posizione.stato]}`}>
                      {posizione.stato}
                    </span>
                  </div>
                  {posizione.descrizione && (
                    <p className="text-sm text-slate-500 mt-1.5">{posizione.descrizione}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setModalitaModifica(true)}
                    className="text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-2 rounded-xl hover:bg-indigo-100 transition">
                    Modifica
                  </button>
                  <button onClick={elimina}
                    className="text-sm font-medium text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 transition">
                    Elimina
                  </button>
                  <button onClick={onChiudi}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition ml-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
          {errore && (
            <div className="mx-6 mt-3 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              {errore}
            </div>
          )}
        </div>

        {/* Corpo */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Candidati associati */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">
                Candidati associati
                <span className="ml-2 text-slate-400 font-normal text-xs">({candidatiAssociati.length})</span>
              </h3>
              <button onClick={apriAggiungi}
                className="flex items-center gap-1.5 text-xs font-semibold text-white px-3.5 py-2 rounded-xl transition shadow-sm hover:shadow-md"
                style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Aggiungi
              </button>
            </div>

            {candidatiAssociati.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
                <p className="text-sm text-slate-400">Nessun candidato associato a questa posizione.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {candidatiAssociati.map(c => (
                  <div key={c.id} className="flex items-center gap-3 bg-slate-50/80 border border-slate-100 rounded-xl px-4 py-3 hover:bg-white hover:border-slate-200 transition">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(c.id)}`}>
                      {initials(c.first_name, c.last_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{c.first_name} {c.last_name}</p>
                      {c.current_role && <p className="text-xs text-slate-500 truncate">{c.current_role}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.status && (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${BADGE_KANBAN[c.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {c.status}
                        </span>
                      )}
                      <button onClick={() => rimuovi(c.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                        title="Rimuovi dalla posizione">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pannello aggiungi candidato */}
          {mostraAggiungi && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-indigo-800">Seleziona un candidato</p>
                <button onClick={() => setMostraAggiungi(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <input
                type="text"
                placeholder="Cerca per nome o ruolo…"
                value={ricerca}
                onChange={e => setRicerca(e.target.value)}
                className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-violet-400"
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5">
                {candidatiFiltrati.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-3">Nessun risultato</p>
                ) : candidatiFiltrati.map(c => (
                  <button key={c.id} onClick={() => aggiungi(c)}
                    className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2.5 hover:border-indigo-300 hover:bg-indigo-50/50 transition text-left">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(c.id)}`}>
                      {initials(c.first_name, c.last_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{c.first_name} {c.last_name}</p>
                      {c.current_role && <p className="text-xs text-slate-500 truncate">{c.current_role}</p>}
                    </div>
                    {c.status && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${BADGE_KANBAN[c.status] ?? ''}`}>
                        {c.status}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
