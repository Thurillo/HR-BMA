const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export async function getPosizioni() {
  const res = await fetch(`${BASE_URL}/api/posizioni`);
  if (!res.ok) throw new Error('Errore nel caricamento delle posizioni');
  return res.json();
}

export async function creaPosizione(dati) {
  const res = await fetch(`${BASE_URL}/api/posizioni`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dati),
  });
  const corpo = await res.json();
  if (!res.ok) throw new Error(corpo.errore || 'Errore creazione posizione');
  return corpo;
}

export async function aggiornaPosizione(id, dati) {
  const res = await fetch(`${BASE_URL}/api/posizioni/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dati),
  });
  const corpo = await res.json();
  if (!res.ok) throw new Error(corpo.errore || 'Errore aggiornamento posizione');
  return corpo;
}

export async function eliminaPosizione(id) {
  const res = await fetch(`${BASE_URL}/api/posizioni/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Errore eliminazione posizione');
}

export async function getCandidatiPosizione(id) {
  const res = await fetch(`${BASE_URL}/api/posizioni/${id}/candidati`);
  if (!res.ok) throw new Error('Errore nel caricamento dei candidati');
  return res.json();
}

export async function aggiungiCandidatoPosizione(posId, candidateId) {
  const res = await fetch(`${BASE_URL}/api/posizioni/${posId}/candidati`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidate_id: candidateId }),
  });
  if (!res.ok) throw new Error('Errore aggiunta candidato');
}

export async function aggiornStatusCandidatoPosizione(posId, cid, status) {
  const res = await fetch(`${BASE_URL}/api/posizioni/${posId}/candidati/${cid}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Errore aggiornamento stato candidato');
}

export async function rimuoviCandidatoPosizione(posId, candidateId) {
  const res = await fetch(`${BASE_URL}/api/posizioni/${posId}/candidati/${candidateId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Errore rimozione candidato');
}
