// In produzione (nginx) l'URL è relativo; in sviluppo usa la variabile d'ambiente
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export async function getCandidati() {
  const res = await fetch(`${BASE_URL}/api/candidates`);
  if (!res.ok) throw new Error('Errore nel caricamento dei candidati');
  return res.json();
}

export async function aggiornaStatus(id, status) {
  const res = await fetch(`${BASE_URL}/api/candidates/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Errore aggiornamento stato');
  return res.json();
}

export async function aggiornaAnagrafica(id, dati) {
  const res = await fetch(`${BASE_URL}/api/candidates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dati),
  });
  if (!res.ok) {
    const corpo = await res.json().catch(() => ({}));
    throw new Error(corpo.errore || 'Errore salvataggio anagrafica');
  }
  return res.json();
}
