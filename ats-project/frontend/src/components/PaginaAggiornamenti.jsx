import { useState, useEffect, useRef, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export default function PaginaAggiornamenti() {
  const [infoLocale, setInfoLocale] = useState(null);
  const [infoRemota, setInfoRemota] = useState(null);
  const [fase, setFase]       = useState('inattivo');
  const [errMsg, setErrMsg]   = useState(null);
  const [log, setLog]         = useState([]);
  const logRef  = useRef(null);
  const sseRef  = useRef(null);

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

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

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

  const aggDisponibile = infoRemota?.aggiornamento_disponibile;
  const inCorso        = fase === 'aggiornamento';
  const inControllo    = fase === 'controlla';

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">

      {/* Card versione */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}>
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-800">Versione installata</h3>
          </div>
          <span className="text-xs text-slate-400">Branch: <code className="bg-slate-100 px-1.5 py-0.5 rounded-md font-mono">main</code></span>
        </div>

        <div className="px-6 py-5">
          {fase === 'carica' ? (
            <p className="text-sm text-slate-400 animate-pulse">Lettura informazioni…</p>
          ) : fase === 'errore' && !infoLocale ? (
            <p className="text-sm text-red-600">{errMsg}</p>
          ) : infoLocale ? (
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Versione</p>
                <p className="font-semibold text-slate-800">{infoLocale.versione}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Branch attivo</p>
                <p className="font-mono text-slate-700">{infoLocale.branch_locale}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Commit installato</p>
                <p className="font-mono text-slate-700 text-xs">{infoLocale.commit_locale}</p>
              </div>
              {infoRemota && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Commit su GitHub</p>
                  <p className="font-mono text-slate-700 text-xs">{infoRemota.commit_remoto}</p>
                </div>
              )}
            </div>
          ) : null}

          {/* Banner esito controllo */}
          {infoRemota && !inCorso && (
            <div className={`mt-5 flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-medium
              ${aggDisponibile
                ? 'bg-blue-50 border border-blue-100 text-blue-800'
                : 'bg-emerald-50 border border-emerald-100 text-emerald-800'}`}>
              {aggDisponibile ? (
                <>
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3"/>
                  </svg>
                  Aggiornamento disponibile —&nbsp;
                  <span className="font-mono text-xs">{infoLocale?.commit_locale} → {infoRemota.commit_remoto}</span>
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
            <div className="mt-5 px-4 py-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              {errMsg}
            </div>
          )}

          {/* Pulsanti */}
          <div className="flex gap-2 mt-5 flex-wrap">
            <button
              onClick={controllaAggiornamenti}
              disabled={inCorso || inControllo}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-200 transition disabled:opacity-50">
              <svg className={`w-4 h-4 ${inControllo ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.583 9.065"/>
              </svg>
              {inControllo ? 'Verifica in corso…' : 'Controlla aggiornamenti'}
            </button>

            {aggDisponibile && !inCorso && (
              <button
                onClick={avviaAggiornamento}
                className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition shadow-sm hover:shadow-md"
                style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3"/>
                </svg>
                Avvia aggiornamento
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Console log */}
      {log.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <h3 className="text-xs font-semibold text-slate-500 ml-1">Log aggiornamento</h3>
            </div>
            <div>
              {inCorso && (
                <span className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"/>In corso…
                </span>
              )}
              {fase === 'completato' && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>Completato — ricarico…
                </span>
              )}
              {fase === 'errore' && log.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"/>Interrotto
                </span>
              )}
            </div>
          </div>
          <div ref={logRef} className="bg-[#0d1117] font-mono text-xs p-5 h-64 overflow-y-auto flex flex-col gap-0.5">
            {log.map(riga => (
              <span key={riga.id} className={
                riga.tipo === 'errore'     ? 'text-red-400' :
                riga.tipo === 'completato' ? 'text-emerald-400' :
                'text-slate-400'
              }>
                {riga.messaggio}
              </span>
            ))}
            {inCorso && <span className="text-slate-600 animate-pulse">▌</span>}
          </div>
        </div>
      )}

      {/* Note operative */}
      <div className="bg-white border border-slate-100 border-l-4 border-l-amber-400 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-sm font-semibold text-slate-700">Note operative</p>
        </div>
        <ul className="space-y-1.5 text-sm text-slate-600">
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>Premi <strong>Controlla aggiornamenti</strong> per confrontare con GitHub</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>Se disponibile, premi <strong>Avvia aggiornamento</strong> per installare</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>Il servizio si riavvia automaticamente — la pagina si ricaricherà da sola</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>La build del frontend può richiedere fino a 2-3 minuti</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>Non chiudere questa pagina durante l'aggiornamento</li>
        </ul>
      </div>
    </div>
  );
}
