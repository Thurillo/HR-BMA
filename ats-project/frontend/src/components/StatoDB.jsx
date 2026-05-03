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
    verifica: { dot: 'bg-slate-400 animate-pulse', text: 'text-slate-500', label: 'Connessione…' },
    connesso: { dot: 'bg-emerald-400',             text: 'text-emerald-600', label: 'Database connesso' },
    errore:   { dot: 'bg-red-400 animate-pulse',   text: 'text-red-500',    label: 'DB non raggiungibile' },
  }[stato];

  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${cfg.text}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </div>
  );
}
