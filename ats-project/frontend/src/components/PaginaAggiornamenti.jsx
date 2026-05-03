import { useState, useEffect, useRef, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export default function PaginaAggiornamenti() {
  // infoLocale: dati sempre disponibili (nessun accesso rete)
  const [infoLocale, setInfoLocale] = useState(null);
  // infoRemota: disponibile solo dopo aver premuto "Controlla"
  const [infoRemota, setInfoRemota] = useState(null);

  const [fase, setFase]       = useState('inattivo'); // inattivo | carica | controlla | aggiornamento | completato | errore
  const [errMsg, setErrMsg]   = useState(null);
  const [log, setLog]         = useState([]);
  const logRef  = useRef(null);
  const sseRef  = useRef(null);

  // Carica info locali all'avvio — sempre affidabile
  const caricaLocale = useCallback(async () => {
    setFase('carica');
    try {
      const res = await fetch(`${BASE_URL}/api/sistema/versione`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setInfoLocale(await res.json());
      setFase('inattivo');
    } catch (err) {
      setErrMsg(`Backend non raggiungibile: ${err.message}`);
      setFase('errore');
    }
  }, []);

  useEffect(() => {
    caricaLocale();
    return () => sseRef.current?.close();
  }, [caricaLocale]);

  // Scroll automatico del log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  // Controlla aggiornamenti su GitHub (può fallire)
  async function controllaAggiornamenti() {
    setFase('controlla');
    setInfoRemota(null);
    setErrMsg(null);
    try {
      const res = await fetch(`${BASE_URL}/api/sistema/controlla`);
      const dati = await res.json();
      if (!res.ok) throw new Error(dati.dettaglio || dati.errore);
      setInfoRemota(dati);
      setFase('inattivo');
    } catch (err) {
      setErrMsg(`Impossibile contattare GitHub: ${err.message}`);
      setFase('errore');
    }
  }

  function aggiungiLog(messaggio, tipo = 'log') {
    setLog(prev => [...prev, { messaggio, tipo, id: Date.now() + Math.random() }]);
  }

  function avviaAggiornamento() {
    if (sseRef.current) sseRef.current.close();
    setLog([]);
    setErrMsg(null);
    setFase('aggiornamento');

    const es = new EventSource(`${BASE_URL}/api/sistema/aggiorna/stream`);
    sseRef.current = es;

    es.addEventListener('log', e => {
      const d = JSON.parse(e.data);
      aggiungiLog(`[${d.ts}]  ${d.messaggio}`);
    });

    es.addEventListener('completato', e => {
      const d = JSON.parse(e.data);
      aggiungiLog(`[${d.ts}]  ${d.messaggio}`, 'completato');
      es.close();
      setFase('completato');
      let t = 0;
      const poll = setInterval(async () => {
        t++;
        try {
          if ((await fetch(`${BASE_URL}/api/sistema/versione`)).ok) {
            clearInterval(poll);
            window.location.reload();
          }
        } catch { /* backend ancora offline */ }
        if (t > 45) clearInterval(poll);
      }, 2000);
    });

    es.addEventListener('errore', e => {
      const d = JSON.parse(e.data);
      aggiungiLog(`[${d.ts}]  ✗ ${d.messaggio}`, 'errore');
      es.close();
      setErrMsg('Aggiornamento interrotto — vedi il log per i dettagli.');
      setFase('errore');
    });

    es.onerror = () => {
      if (fase !== 'completato') {
        aggiungiLog('Connessione SSE interrotta.', 'errore');
        es.close();
        setFase('errore');
      }
    };
  }

  // ── Derivazioni ──────────────────────────────────────────────────────────────
  const aggDisponibile = infoRemota?.aggiornamento_disponibile;
  const inCorso        = fase === 'aggiornamento';
  const inControllo    = fase === 'controlla';

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">

      {/* Card versione */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Versione installata</h3>
          <span className="text-xs text-slate-400">Branch: <code className="bg-slate-100 px-1.5 py-0.5 rounded-md">main</code></span>
        </div>

        {fase === 'carica' ? (
          <p className="text-sm text-slate-400 animate-pulse">Lettura informazioni…</p>
        ) : fase === 'errore' && !infoLocale ? (
          <p className="text-sm text-red-600">{errMsg}</p>
        ) : infoLocale ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">Versione</p>
              <p className="font-semibold text-slate-800">{infoLocale.versione}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Branch attivo</p>
              <p className="font-mono text-slate-700">{infoLocale.branch_locale}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Commit installato</p>
              <p className="font-mono text-slate-700">{infoLocale.commit_locale}</p>
            </div>
            {infoRemota && (
              <div>
                <p className="text-xs text-slate-400">Commit su GitHub</p>
                <p className="font-mono text-slate-700">{infoRemota.commit_remoto}</p>
              </div>
            )}
          </div>
        ) : null}

        {/* Banner esito controllo */}
        {infoRemota && !inCorso && (
          <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
            ${aggDisponibile
              ? 'bg-blue-50 border border-blue-200 text-blue-800'
              : 'bg-green-50 border border-green-200 text-green-800'}`}>
            {aggDisponibile ? (
              <>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3"/>
                </svg>
                Aggiornamento disponibile —&nbsp;
                <span className="font-mono">{infoLocale?.commit_locale} → {infoRemota.commit_remoto}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                Il software è già all'ultima versione
              </>
            )}
          </div>
        )}

        {/* Errore contatto GitHub */}
        {fase === 'errore' && infoLocale && errMsg && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {errMsg}
          </div>
        )}

        {/* Pulsanti */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <button
            onClick={controllaAggiornamenti}
            disabled={inCorso || inControllo}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${inControllo ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.583 9.065"/>
            </svg>
            {inControllo ? 'Verifica in corso…' : 'Controlla aggiornamenti'}
          </button>

          {aggDisponibile && !inCorso && (
            <button
              onClick={avviaAggiornamento}
              className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl transition shadow-sm"
              style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3"/>
              </svg>
              Avvia aggiornamento
            </button>
          )}
        </div>
      </div>

      {/* Console log */}
      {log.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Log aggiornamento</h3>
            {inCorso && (
              <span className="flex items-center gap-1.5 text-xs text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/>In corso…
              </span>
            )}
            {fase === 'completato' && (
              <span className="flex items-center gap-1.5 text-xs text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500"/>Completato — ricarico…
              </span>
            )}
            {fase === 'errore' && log.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-500"/>Interrotto
              </span>
            )}
          </div>
          <div ref={logRef} className="bg-slate-900 font-mono text-xs p-4 h-64 overflow-y-auto flex flex-col gap-1">
            {log.map(riga => (
              <span key={riga.id} className={
                riga.tipo === 'errore'     ? 'text-red-400' :
                riga.tipo === 'completato' ? 'text-green-400' :
                'text-slate-300'
              }>
                {riga.messaggio}
              </span>
            ))}
            {inCorso && <span className="text-slate-500 animate-pulse">▌</span>}
          </div>
        </div>
      )}

      {/* Note operative */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">Note operative</p>
        <ul className="list-disc list-inside space-y-1 text-amber-700">
          <li>Premi <strong>Controlla aggiornamenti</strong> per confrontare con GitHub</li>
          <li>Se disponibile, premi <strong>Avvia aggiornamento</strong> per installare</li>
          <li>Il servizio si riavvia automaticamente — la pagina si ricaricherà da sola</li>
          <li>La build del frontend può richiedere fino a 2-3 minuti</li>
          <li>Non chiudere questa pagina durante l'aggiornamento</li>
        </ul>
      </div>
    </div>
  );
}
