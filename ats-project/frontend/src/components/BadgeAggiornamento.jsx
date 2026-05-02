import { useState, useEffect, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const INTERVALLO_MS = 5 * 60 * 1000; // controlla ogni 5 minuti

export default function BadgeAggiornamento() {
  const [stato, setStato] = useState(null);   // null | oggetto versione
  const [fase, setFase] = useState('inattivo'); // 'inattivo' | 'verifica' | 'aggiornamento' | 'errore'

  const verificaAggiornamenti = useCallback(async () => {
    setFase('verifica');
    try {
      const res = await fetch(`${BASE_URL}/api/sistema/versione`);
      if (!res.ok) throw new Error();
      const dati = await res.json();
      setStato(dati);
      setFase('inattivo');
    } catch {
      setFase('errore');
    }
  }, []);

  useEffect(() => {
    verificaAggiornamenti();
    const timer = setInterval(verificaAggiornamenti, INTERVALLO_MS);
    return () => clearInterval(timer);
  }, [verificaAggiornamenti]);

  async function avviaAggiornamento() {
    if (!confirm('Avviare l\'aggiornamento? Il servizio si riavvierà automaticamente.')) return;
    setFase('aggiornamento');
    try {
      await fetch(`${BASE_URL}/api/sistema/aggiorna`, { method: 'POST' });
      // Attende il riavvio del backend (max 60s) poi ricarica la pagina
      let tentativi = 0;
      const attendi = setInterval(async () => {
        tentativi++;
        try {
          const res = await fetch(`${BASE_URL}/api/sistema/versione`);
          if (res.ok) {
            clearInterval(attendi);
            window.location.reload();
          }
        } catch { /* backend ancora offline */ }
        if (tentativi > 30) {
          clearInterval(attendi);
          setFase('errore');
        }
      }, 2000);
    } catch {
      setFase('errore');
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (fase === 'aggiornamento') {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 animate-pulse">
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Aggiornamento in corso…
      </div>
    );
  }

  if (stato?.aggiornamento_disponibile) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3"/>
          </svg>
          Aggiornamento disponibile
          <span className="text-blue-400 font-mono">{stato.commit_locale} → {stato.commit_remoto}</span>
        </div>
        <button
          onClick={avviaAggiornamento}
          className="text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
        >
          Aggiorna ora
        </button>
      </div>
    );
  }

  if (stato && !stato.aggiornamento_disponibile) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
        v{stato.versione} · aggiornato
        <button onClick={verificaAggiornamenti} className="ml-1 hover:text-slate-600 transition" title="Verifica aggiornamenti">
          <svg className={`w-3 h-3 ${fase === 'verifica' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 104.583 9.065"/>
          </svg>
        </button>
      </div>
    );
  }

  return null;
}
