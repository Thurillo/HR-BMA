import { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  getPosizioni, creaPosizione, aggiornaPosizione, eliminaPosizione,
  getCandidatiPosizione, aggiungiCandidatoPosizione, rimuoviCandidatoPosizione,
  aggiornStatusCandidatoPosizione,
} from '../api/posizioni';
import { getCandidati, getCandidato } from '../api/candidati';
import { getEmailTemplates } from '../api/emailTemplates';
import DettagliModale from './DettagliModale';
import ModaleEmailTemplate from './ModaleEmailTemplate';

const BADGE_STATO = {
  'Aperta':   'bg-green-100 text-green-700',
  'In pausa': 'bg-amber-100 text-amber-700',
  'Chiusa':   'bg-slate-100 text-slate-500',
};
const STATI_POSIZIONE = ['Aperta', 'In pausa', 'Chiusa'];

const COLONNE_KANBAN = ['Nuovo', '1° Colloquio', '2° Colloquio', 'Offerta', 'Assunto', 'Scartato'];

const BADGE_KANBAN = {
  'Nuovo':          'bg-slate-100 text-slate-600 border-slate-200',
  '1° Colloquio':   'bg-blue-50 text-blue-700 border-blue-200',
  '2° Colloquio':   'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Offerta':        'bg-amber-50 text-amber-700 border-amber-200',
  'Assunto':        'bg-green-50 text-green-700 border-green-200',
  'Scartato':       'bg-red-50 text-red-600 border-red-200',
};

const COL_HEADER = {
  'Nuovo':          'bg-slate-50 border-slate-200 text-slate-600',
  '1° Colloquio':   'bg-blue-50 border-blue-200 text-blue-700',
  '2° Colloquio':   'bg-indigo-50 border-indigo-200 text-indigo-700',
  'Offerta':        'bg-amber-50 border-amber-200 text-amber-700',
  'Assunto':        'bg-green-50 border-green-200 text-green-700',
  'Scartato':       'bg-red-50 border-red-200 text-red-600',
};

// ── Utility ──────────────────────────────────────────────────────────────────
function raggruppaPerStatus(candidati) {
  const mappa = {};
  for (const col of COLONNE_KANBAN) mappa[col] = [];
  for (const c of candidati) {
    const col = COLONNE_KANBAN.includes(c.status_posizione) ? c.status_posizione : 'Nuovo';
    mappa[col].push(c);
  }
  return mappa;
}

// ── Vista dettaglio posizione (Kanban) ────────────────────────────────────────
function DettaglioPosizione({ posizione: posizioneIniziale, onTorna, onEliminata, onAggiornata }) {
  const [posizione, setPosizione]       = useState(posizioneIniziale);
  const [candidati, setCandidati]       = useState([]);
  const [colonneMap, setColonneMap]     = useState({});
  const [caricamento, setCaricamento]   = useState(true);
  const [tuttiCandidati, setTuttiCandidati] = useState([]);
  const [mostraAggiungi, setMostraAggiungi] = useState(false);
  const [cercaAgg, setCercaAgg]         = useState('');
  const [aggiungendo, setAggiungendo]   = useState(null);
  const [confermaElimina, setConfermaElimina] = useState(false);
  const [eliminando, setEliminando]     = useState(false);
  const [cambiandoStato, setCambiandoStato] = useState(false);
  const [candidatoDettaglio, setCandidatoDettaglio] = useState(null);
  const [caricandoDettaglio, setCaricandoDettaglio] = useState(null);
  const [emailCtx, setEmailCtx]                     = useState(null); // { candidato, fase }
  const [emailModelli, setEmailModelli]              = useState([]);
  const [nota, setNota]                 = useState(posizioneIniziale.note ?? '');
  const [salvandoNota, setSalvandoNota] = useState(false);
  const notaTimerRef                    = useRef(null);

  async function salvaNotaDebounced(valore) {
    setNota(valore);
    clearTimeout(notaTimerRef.current);
    notaTimerRef.current = setTimeout(async () => {
      setSalvandoNota(true);
      try {
        await aggiornaPosizione(posizione.id, { note: valore });
      } finally {
        setSalvandoNota(false);
      }
    }, 800);
  }

  async function apriDettaglioCandidato(id) {
    setCaricandoDettaglio(id);
    try {
      const completo = await getCandidato(id);
      setCandidatoDettaglio(completo);
    } finally {
      setCaricandoDettaglio(null);
    }
  }

  async function cambiaStato(nuovoStato) {
    setCambiandoStato(true);
    try {
      const aggiornata = await aggiornaPosizione(posizione.id, { stato: nuovoStato });
      setPosizione(prev => ({ ...prev, ...aggiornata }));
      onAggiornata({ ...posizione, ...aggiornata });
    } finally {
      setCambiandoStato(false);
    }
  }

  const caricaCandidati = useCallback(async () => {
    setCaricamento(true);
    try {
      const lista = await getCandidatiPosizione(posizione.id);
      setCandidati(lista);
      setColonneMap(raggruppaPerStatus(lista));
    } finally {
      setCaricamento(false);
    }
  }, [posizione.id]);

  useEffect(() => { caricaCandidati(); }, [caricaCandidati]);

  useEffect(() => {
    getEmailTemplates().then(setEmailModelli).catch(() => {});
  }, []);

  async function apriAggiungi() {
    setMostraAggiungi(true);
    setCercaAgg('');
    const tutti = await getCandidati();
    const associati = new Set(candidati.map(c => c.id));
    setTuttiCandidati(tutti.filter(c => !associati.has(c.id)));
  }

  async function aggiungi(candidateId) {
    setAggiungendo(candidateId);
    try {
      await aggiungiCandidatoPosizione(posizione.id, candidateId);
      await caricaCandidati();
      // aggiorna lista disponibili
      setTuttiCandidati(prev => prev.filter(c => c.id !== candidateId));
    } finally {
      setAggiungendo(null);
    }
  }

  async function rimuovi(candidateId) {
    await rimuoviCandidatoPosizione(posizione.id, candidateId);
    setCandidati(prev => prev.filter(c => c.id !== candidateId));
    setColonneMap(prev => {
      const copia = { ...prev };
      for (const col of COLONNE_KANBAN) {
        copia[col] = (copia[col] || []).filter(c => c.id !== candidateId);
      }
      return copia;
    });
  }

  async function onDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const candidateId = parseInt(draggableId, 10);
    const nuovoStatus = destination.droppableId;

    // aggiorna UI ottimisticamente
    setColonneMap(prev => {
      const copia = {};
      for (const col of COLONNE_KANBAN) copia[col] = [...(prev[col] || [])];
      const card = copia[source.droppableId].find(c => c.id === candidateId);
      copia[source.droppableId] = copia[source.droppableId].filter(c => c.id !== candidateId);
      if (card) {
        const aggiornata = { ...card, status_posizione: nuovoStatus };
        copia[destination.droppableId].splice(destination.index, 0, aggiornata);
      }
      return copia;
    });

    await aggiornStatusCandidatoPosizione(posizione.id, candidateId, nuovoStatus).catch(() => {
      // rollback in caso di errore
      caricaCandidati();
    });
  }

  async function eseguiElimina() {
    setEliminando(true);
    try {
      await eliminaPosizione(posizione.id);
      onEliminata(posizione.id);
      onTorna();
    } finally {
      setEliminando(false);
    }
  }

  const candidatiDisponibili = tuttiCandidati.filter(c => {
    if (!cercaAgg.trim()) return true;
    const q = cercaAgg.toLowerCase();
    return [c.first_name, c.last_name, c.current_role, c.email].some(v => v && v.toLowerCase().includes(q));
  });

  return (
    <div className="flex flex-col gap-4">

      {/* Header dettaglio */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onTorna} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Posizioni
        </button>
        <span className="text-slate-300">/</span>
        <h2 className="text-xl font-bold text-slate-800 flex-1">{posizione.titolo}</h2>
        <select
          value={posizione.stato}
          onChange={e => cambiaStato(e.target.value)}
          disabled={cambiandoStato}
          className={`text-xs font-semibold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60 ${BADGE_STATO[posizione.stato]}`}
        >
          {STATI_POSIZIONE.map(s => <option key={s}>{s}</option>)}
        </select>
        <button
          onClick={apriAggiungi}
          className="flex items-center gap-1.5 text-sm font-semibold text-white px-3.5 py-2 rounded-xl transition shadow-sm"
          style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Aggiungi candidato
        </button>
        <button
          onClick={() => setConfermaElimina(true)}
          className="text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
        >
          Elimina posizione
        </button>
      </div>

      {posizione.descrizione && (
        <p className="text-sm text-slate-500">{posizione.descrizione}</p>
      )}

      {/* Pannello aggiungi candidato */}
      {mostraAggiungi && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-700">Aggiungi candidato</h3>
            <button onClick={() => setMostraAggiungi(false)} className="text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <input
            type="text"
            value={cercaAgg}
            onChange={e => setCercaAgg(e.target.value)}
            placeholder="Cerca per nome, ruolo…"
            autoFocus
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {candidatiDisponibili.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Nessun candidato disponibile</p>
            ) : candidatiDisponibili.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 px-1">
                <div>
                  <p className="text-sm font-medium text-slate-800">{c.first_name} {c.last_name}</p>
                  <p className="text-xs text-slate-400">{c.current_role}{c.macro_sector ? ` · ${c.macro_sector}` : ''}</p>
                </div>
                <button
                  onClick={() => aggiungi(c.id)}
                  disabled={aggiungendo === c.id}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded-lg hover:bg-indigo-50 transition disabled:opacity-50"
                >
                  {aggiungendo === c.id ? '…' : 'Aggiungi'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note posizione */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Note sulla posizione</label>
          {salvandoNota && <span className="text-xs text-slate-400 animate-pulse">Salvataggio…</span>}
        </div>
        <textarea
          rows={6}
          value={nota}
          onChange={e => salvaNotaDebounced(e.target.value)}
          placeholder="Scrivi note, requisiti, dettagli o qualsiasi informazione sulla posizione…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Kanban board */}
      {caricamento ? (
        <div className="text-center py-12 text-slate-400">Caricamento candidati…</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {COLONNE_KANBAN.map(col => (
              <div key={col} className="flex flex-col gap-2 min-w-[180px] w-[180px] shrink-0">
                <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wide ${COL_HEADER[col]}`}>
                  <span>{col}</span>
                  <span className="opacity-60">{(colonneMap[col] || []).length}</span>
                </div>
                <Droppable droppableId={col}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex flex-col gap-2 min-h-[80px] rounded-xl p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50' : 'bg-slate-50'}`}
                    >
                      {(colonneMap[col] || []).map((c, idx) => (
                        <Draggable key={c.id} draggableId={String(c.id)} index={idx}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={`bg-white border rounded-xl p-2.5 shadow-sm text-xs cursor-grab active:cursor-grabbing select-none ${snap.isDragging ? 'shadow-md rotate-1' : ''} ${BADGE_KANBAN[col]}`}
                            >
                              <button
                                onMouseDown={e => e.stopPropagation()}
                                onClick={() => apriDettaglioCandidato(c.id)}
                                disabled={caricandoDettaglio === c.id}
                                className="w-full text-left disabled:opacity-60"
                              >
                                <p className="font-semibold text-slate-800 leading-tight hover:text-blue-700 transition-colors">
                                  {caricandoDettaglio === c.id ? '…' : `${c.first_name} ${c.last_name}`}
                                </p>
                                {c.current_role && <p className="text-slate-500 mt-0.5 truncate">{c.current_role}</p>}
                              </button>
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  onMouseDown={e => e.stopPropagation()}
                                  onClick={() => setEmailCtx({ candidato: c, fase: col })}
                                  title="Modelli email"
                                  className="text-indigo-400 hover:text-indigo-600 transition"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                  </svg>
                                </button>
                                <button
                                  onMouseDown={e => e.stopPropagation()}
                                  onClick={() => rimuovi(c.id)}
                                  className="text-red-400 hover:text-red-600 text-[10px] font-medium"
                                >
                                  Rimuovi
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Modale email template */}
      {emailCtx && (
        <ModaleEmailTemplate
          fase={emailCtx.fase}
          candidato={emailCtx.candidato}
          posizione={posizione}
          modelli={emailModelli}
          onChiudi={() => setEmailCtx(null)}
        />
      )}

      {/* Dettaglio candidato */}
      {candidatoDettaglio && (
        <DettagliModale
          candidato={candidatoDettaglio}
          onChiudi={() => setCandidatoDettaglio(null)}
          onAggiornato={aggiornato => {
            setCandidatoDettaglio(aggiornato);
            setCandidati(prev => prev.map(c => c.id === aggiornato.id ? { ...c, first_name: aggiornato.first_name, last_name: aggiornato.last_name, current_role: aggiornato.current_role } : c));
            setColonneMap(prev => {
              const copia = {};
              for (const col of COLONNE_KANBAN) {
                copia[col] = (prev[col] || []).map(c => c.id === aggiornato.id
                  ? { ...c, first_name: aggiornato.first_name, last_name: aggiornato.last_name, current_role: aggiornato.current_role }
                  : c);
              }
              return copia;
            });
          }}
        />
      )}

      {/* Conferma eliminazione posizione */}
      {confermaElimina && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-bold text-slate-800 mb-2">Elimina posizione</h3>
            <p className="text-sm text-slate-600 mb-5">
              Vuoi eliminare la posizione <span className="font-semibold">{posizione.titolo}</span>?
              Tutti i candidati associati verranno scollegati.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfermaElimina(false)} className="text-sm px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition">
                Annulla
              </button>
              <button onClick={eseguiElimina} disabled={eliminando} className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60">
                {eliminando ? 'Eliminazione…' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Vista lista posizioni ─────────────────────────────────────────────────────
export default function PaginaPosizioni() {
  const [posizioni, setPosizioni]             = useState([]);
  const [caricamento, setCaricamento]         = useState(true);
  const [errore, setErrore]                   = useState(null);
  const [mostraForm, setMostraForm]           = useState(false);
  const [posizioneAperta, setPosizioneAperta] = useState(null);
  const [form, setForm]                       = useState({ titolo: '', descrizione: '', stato: 'Aperta' });
  const [invio, setInvio]                     = useState(false);
  const [erroreForm, setErroreForm]           = useState(null);

  const carica = useCallback(async () => {
    try {
      setCaricamento(true);
      setErrore(null);
      setPosizioni(await getPosizioni());
    } catch (err) {
      setErrore(err.message);
    } finally {
      setCaricamento(false);
    }
  }, []);

  useEffect(() => { carica(); }, [carica]);

  async function crea(e) {
    e.preventDefault();
    if (!form.titolo.trim()) return setErroreForm('Il titolo è obbligatorio');
    setInvio(true);
    setErroreForm(null);
    try {
      const nuova = await creaPosizione(form);
      setPosizioni(prev => [{ ...nuova, num_candidati: 0 }, ...prev]);
      setForm({ titolo: '', descrizione: '', stato: 'Aperta' });
      setMostraForm(false);
    } catch (err) {
      setErroreForm(err.message);
    } finally {
      setInvio(false);
    }
  }

  if (posizioneAperta) {
    return (
      <DettaglioPosizione
        posizione={posizioneAperta}
        onTorna={() => setPosizioneAperta(null)}
        onEliminata={id => setPosizioni(prev => prev.filter(p => p.id !== id))}
        onAggiornata={aggiornata => {
          setPosizioni(prev => prev.map(p => p.id === aggiornata.id ? { ...p, ...aggiornata } : p));
          setPosizioneAperta(prev => ({ ...prev, ...aggiornata }));
        }}
      />
    );
  }

  if (caricamento) return (
    <div className="flex items-center justify-center h-64 text-slate-500">Caricamento posizioni…</div>
  );

  if (errore) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-600">
      <p>Errore: {errore}</p>
      <button onClick={carica} className="text-sm bg-red-100 px-4 py-1.5 rounded-lg hover:bg-red-200">Riprova</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-400">{posizioni.length} posizion{posizioni.length !== 1 ? 'i' : 'e'}</p>
        <button
          onClick={() => { setMostraForm(true); setErroreForm(null); }}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm"
          style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Nuova posizione
        </button>
      </div>

      {/* Form nuova posizione */}
      {mostraForm && (
        <form onSubmit={crea} className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Nuova posizione lavorativa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Titolo *</label>
              <input
                type="text"
                value={form.titolo}
                onChange={e => setForm(p => ({ ...p, titolo: e.target.value }))}
                placeholder="es. Senior Backend Developer"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                autoFocus
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Descrizione</label>
              <textarea
                rows={3}
                value={form.descrizione}
                onChange={e => setForm(p => ({ ...p, descrizione: e.target.value }))}
                placeholder="Descrizione della posizione, requisiti, note…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Stato</label>
              <select
                value={form.stato}
                onChange={e => setForm(p => ({ ...p, stato: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {STATI_POSIZIONE.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {erroreForm && <p className="mt-3 text-sm text-red-600">{erroreForm}</p>}
          <div className="flex gap-2 mt-4 justify-end">
            <button type="button" onClick={() => setMostraForm(false)} className="text-sm text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-100 transition">
              Annulla
            </button>
            <button type="submit" disabled={invio} className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60">
              {invio ? 'Creazione…' : 'Crea posizione'}
            </button>
          </div>
        </form>
      )}

      {/* Lista posizioni */}
      {posizioni.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-9-4h2a2 2 0 012 2v2H9V5a2 2 0 012-2z"/>
          </svg>
          <p className="text-sm">Nessuna posizione ancora creata.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {posizioni.map(pos => (
            <button
              key={pos.id}
              onClick={() => setPosizioneAperta(pos)}
              className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-800 leading-snug">{pos.titolo}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${BADGE_STATO[pos.stato]}`}>
                  {pos.stato}
                </span>
              </div>
              {pos.descrizione && (
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{pos.descrizione}</p>
              )}
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                  {pos.num_candidati} candidat{pos.num_candidati === 1 ? 'o' : 'i'}
                </span>
                <span>{new Date(pos.created_at).toLocaleDateString('it-IT')}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
