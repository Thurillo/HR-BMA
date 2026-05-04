import { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export default function StatoDB() {
  const [stato, setStato] = useState('verifica');

  useEffect(() => {
    let attivo = true;
    async function verifica() {
      try {
        const res = await fetch(`${BASE_URL}/api/sistema/stato`);
        if (attivo) setStato(res.ok ? 'connesso' : 'errore');
      } catch { if (attivo) setStato('errore'); }
    }
    verifica();
    const t = setInterval(verifica, 30000);
    return () => { attivo = false; clearInterval(t); };
  }, []);

  const cfg = {
    verifica: { dot: 'bg-slate-400 animate-pulse', pill: 'bg-slate-50 border-slate-200 text-slate-500', label: 'Connessione…' },
    connesso: { dot: 'bg-emerald-400',             pill: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'Database connesso' },
    errore:   { dot: 'bg-red-400 animate-pulse',   pill: 'bg-red-50 border-red-200 text-red-600', label: 'DB non raggiungibile' },
  }[stato];

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </div>
  );
}
