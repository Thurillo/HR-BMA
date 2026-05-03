import { useState, useEffect, useRef, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export default function PaginaAggiornamenti() {
  const [versione, setVersione] = useState(null);
  const [fase, setFase] = useState('inattivo'); // inattivo | verifica | aggiornamento | completato | errore
  const [log, setLog] = useState([]);
  const logRef = useRef(null);
  const sseRef = useRef(null);

  const verificaVersione = useCallback(async () => {
    setFase('verifica');
    try {
      const res = await fetch(`${BASE_URL}/api/sistema/versione`);
      if (!res.ok) throw new Error('Backend non raggiungibile');
      const dati = await res.json();
      setVersione(dati);
      setFase('inattivo');
    } catch (err) {
      setVersione(null);
      setFase('errore');
    }
  }, []);

  useEffect(() => {
    verificaVersione();
    return () => sseRef.current?.close();
  }, [verificaVersione]);

  // Scroll automatico del log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  function aggiungiLog(messaggio, tipo = 'log') {
    setLog(prev => [...prev, { messaggio, tipo, id: Date.now() + Math.random() }]);
  }

  function avviaAggiornamento() {
    if (sseRef.current) sseRef.current.close();
    setLog([]);
    setFase('aggiornamento');

    const es = new EventSource(`${BASE_URL}/api/sistema/aggiorna/stream`);
    sseRef.current = es;

    es.addEventListener('log', e => {
      const dati = JSON.parse(e.data);
      aggiungiLog(`[${dati.ts}] ${dati.messaggio}`, 'log');
    });

    es.addEventListener('completato', e => {
      const dati = JSON.parse(e.data);
      aggiungiLog(`[${dati.ts}] ${dati.messaggio}`, 'completato');
      es.close();
      setFase('completato');
      // Attende riavvio backend e ricarica pagina
      let tentativi = 0;
      const attendi = setInterval(async () => {
        tentativi++;
        try {
          const r = await fetch(`${BASE_URL}/api/sistema/versione`);
          if (r.ok) { clearInterval(attendi); window.location.reload(); }
        } catch { /* backend ancora offline */ }
        if (tentativi > 45) clearInterval(attendi); // max 90s
      }, 2000);
    });

    es.addEventListener('errore', e => {
      const dati = JSON.parse(e.data);
      aggiungiLog(`[${dati.ts}] ✗ ${dati.messaggio}`, 'errore');
      es.close();
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

  // ── UI ────────────────────────────────────────────────────────────────────
  const aggDisponibile = versione?.aggiornamento_disponibile;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">

      {/* Titolo */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Aggiornamenti software</h2>
        <p className="text-sm text-slate-500 mt-0.5">Verifica e applica gli aggiornamenti disponibili su GitHub</p>
      </div>

      {/* Card stato versione */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Versione attuale</h3>

        {!versione && fase !== 'verifica' ? (
          <p className="text-sm text-slate-500">Informazioni non disponibili — verifica la connessione al backend.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400">Versione</p>
              <p className="font-semibold text-slate-800 mt-0.5">{versione?.versione ?? '…'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Branch attivo</p>
              <p className="font-mono text-slate-700 mt-0.5">{versione?.branch_locale ?? '…'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Commit installato</p>
              <p className="font-mono text-slate-700 mt-0.5">{versione?.commit_locale ?? '…'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Commit su GitHub ({versione?.branch_aggiornamento})</p>
              <p className="font-mono text-slate-700 mt-0.5">{versione?.commit_remoto ?? '…'}</p>
            </div>
          </div>
        )}

        {/* Banner stato */}
        {versione && (
          <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
            ${aggDisponibile
              ? 'bg-blue-50 border border-blue-200 text-blue-800'
              : 'bg-green-50 border border-green-200 text-green-800'
            }`}>
            {aggDisponibile ? (
              <>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3"/>
                </svg>
                Aggiornamento disponibile: <span className="font-mono">{versione.commit_locale} → {versione.commit_remoto}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                Il software è aggiornato all'ultima versione
              </>
            )}
          </div>
        )}

        {/* Pulsanti */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={verificaVersione}
            disabled={fase === 'verifica' || fase === 'aggiornamento'}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${fase === 'verifica' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.583 9.065"/>
            </svg>
            {fase === 'verifica' ? 'Verifica in corso…' : 'Controlla aggiornamenti'}
          </button>

          {aggDisponibile && (
            <button
              onClick={avviaAggiornamento}
              disabled={fase === 'aggiornamento'}
              className="flex items-center gap-2 text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
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
            {fase === 'aggiornamento' && (
              <span className="flex items-center gap-1.5 text-xs text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/>
                In corso…
              </span>
            )}
            {fase === 'completato' && (
              <span className="flex items-center gap-1.5 text-xs text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500"/>
                Completato — ricarico la pagina…
              </span>
            )}
            {fase === 'errore' && (
              <span className="flex items-center gap-1.5 text-xs text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-500"/>
                Aggiornamento interrotto
              </span>
            )}
          </div>
          <div
            ref={logRef}
            className="bg-slate-900 font-mono text-xs p-4 h-64 overflow-y-auto flex flex-col gap-1"
          >
            {log.map(riga => (
              <span
                key={riga.id}
                className={
                  riga.tipo === 'errore'    ? 'text-red-400' :
                  riga.tipo === 'completato' ? 'text-green-400' :
                  'text-slate-300'
                }
              >
                {riga.messaggio}
              </span>
            ))}
            {fase === 'aggiornamento' && (
              <span className="text-slate-500 animate-pulse">▌</span>
            )}
          </div>
        </div>
      )}

      {/* Note operative */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">Note operative</p>
        <ul className="list-disc list-inside space-y-1 text-amber-700">
          <li>L'aggiornamento recupera l'ultima versione dal branch <code className="bg-amber-100 px-1 rounded">main</code> di GitHub</li>
          <li>Il servizio backend si riavvierà automaticamente al termine — la pagina si ricaricherà da sola</li>
          <li>La build del frontend può richiedere fino a 2-3 minuti</li>
          <li>Non chiudere questa pagina durante l'aggiornamento</li>
        </ul>
      </div>
    </div>
  );
}
