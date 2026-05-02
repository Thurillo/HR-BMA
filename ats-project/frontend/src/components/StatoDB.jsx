import { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export default function StatoDB() {
  const [stato, setStato] = useState('verifica'); // 'verifica' | 'connesso' | 'errore'

  useEffect(() => {
    let attivo = true;

    async function verifica() {
      try {
        const res = await fetch(`${BASE_URL}/api/sistema/stato`);
        if (!attivo) return;
        setStato(res.ok ? 'connesso' : 'errore');
      } catch {
        if (attivo) setStato('errore');
      }
    }

    verifica();
    const timer = setInterval(verifica, 30000);
    return () => { attivo = false; clearInterval(timer); };
  }, []);

  if (stato === 'verifica') return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400">
      <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
      DB…
    </div>
  );

  if (stato === 'connesso') return (
    <div className="flex items-center gap-1.5 text-xs text-green-700" title="Database connesso">
      <span className="w-2 h-2 rounded-full bg-green-500" />
      DB connesso
    </div>
  );

  return (
    <div className="flex items-center gap-1.5 text-xs text-red-600" title="Impossibile raggiungere il database">
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      DB non raggiungibile
    </div>
  );
}
