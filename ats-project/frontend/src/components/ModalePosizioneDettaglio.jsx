import { useState, useEffect, useCallback } from 'react';
import {
  getCandidatiPosizione, aggiungiCandidatoPosizione,
  rimuoviCandidatoPosizione, aggiornaPosizione, eliminaPosizione,
} from '../api/posizioni';
import { getCandidati } from '../api/candidati';

const BADGE_STATO = {
  'Aperta':    'bg-green-100 text-green-700',
  'In pausa':  'bg-amber-100 text-amber-700',
  'Chiusa':    'bg-slate-100 text-slate-500',
};

const STATI_POSIZIONE = ['Aperta', 'In pausa', 'Chiusa'];

const BADGE_KANBAN = {
  'Nuovo':         'bg-slate-100 text-slate-600',
  '1° Colloquio':  'bg-blue-100 text-blue-700',
  '2° Colloquio':  'bg-violet-100 text-violet-700',
  'Offerta':       'bg-amber-100 text-amber-700',
  'Assunto':       'bg-green-100 text-green-700',
  'Scartato':      'bg-red-100 text-red-600',
};

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={e => e.target === e.currentTarget && onChiudi()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Intestazione */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 shrink-0 gap-4">
          {modalitaModifica ? (
            <div className="flex-1 grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Titolo</label>
                <input
                  type="text"
                  value={form.titolo}
                  onChange={e => setForm(p => ({ ...p, titolo: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Descrizione</label>
                <textarea
                  rows={3}
                  value={form.descrizione}
                  onChange={e => setForm(p => ({ ...p, descrizione: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Stato</label>
                <select
                  value={form.stato}
                  onChange={e => setForm(p => ({ ...p, stato: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {STATI_POSIZIONE.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-800 truncate">{posizione.titolo}</h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE_STATO[posizione.stato]}`}>
                  {posizione.stato}
                </span>
              </div>
              {posizione.descrizione && (
                <p className="text-sm text-slate-500 mt-1">{posizione.descrizione}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {modalitaModifica ? (
              <>
                <button onClick={() => { setModalitaModifica(false); setErrore(null); }} disabled={salvataggio}
                  className="text-sm text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition">
                  Annulla
                </button>
                <button onClick={salva} disabled={salvataggio}
                  className="text-sm font-medium bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition disabled:opacity-60">
                  {salvataggio ? 'Salvataggio…' : 'Salva'}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setModalitaModifica(true)}
                  className="text-sm font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
                  Modifica
                </button>
                <button onClick={elimina}
                  className="text-sm font-medium text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                  Elimina
                </button>
              </>
            )}
            <button onClick={onChiudi} className="text-slate-400 hover:text-slate-700 text-2xl leading-none ml-1">&times;</button>
          </div>
        </div>

        {errore && (
          <div className="mx-6 mt-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 shrink-0">
            {errore}
          </div>
        )}

        {/* Corpo */}
        <div className="overflow-y-auto px-6 py-4 flex flex-col gap-4">

          {/* Candidati associati */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700">
                Candidati associati
                <span className="ml-2 text-slate-400 font-normal">({candidatiAssociati.length})</span>
              </h3>
              <button onClick={apriAggiungi}
                className="flex items-center gap-1.5 text-xs font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Aggiungi candidato
              </button>
            </div>

            {candidatiAssociati.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl">
                Nessun candidato associato a questa posizione.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {candidatiAssociati.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{c.first_name} {c.last_name}</p>
                      {c.current_role && <p className="text-xs text-slate-500 truncate">{c.current_role}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {c.status && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${BADGE_KANBAN[c.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {c.status}
                        </span>
                      )}
                      <button onClick={() => rimuovi(c.id)}
                        className="text-slate-400 hover:text-red-500 transition p-1 rounded"
                        title="Rimuovi dalla posizione">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
            <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-blue-800">Seleziona un candidato</p>
                <button onClick={() => setMostraAggiungi(false)} className="text-blue-400 hover:text-blue-700 text-xl leading-none">&times;</button>
              </div>
              <input
                type="text"
                placeholder="Cerca per nome o ruolo…"
                value={ricerca}
                onChange={e => setRicerca(e.target.value)}
                className="w-full rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5">
                {candidatiFiltrati.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-3">Nessun risultato</p>
                ) : candidatiFiltrati.map(c => (
                  <button key={c.id} onClick={() => aggiungi(c)}
                    className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 hover:border-blue-400 hover:bg-blue-50 transition text-left">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{c.first_name} {c.last_name}</p>
                      {c.current_role && <p className="text-xs text-slate-500">{c.current_role}</p>}
                    </div>
                    {c.status && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${BADGE_KANBAN[c.status] ?? ''}`}>
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
