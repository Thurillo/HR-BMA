import { apiJson, apiFetch } from './client.js';

export async function getPosizioni() {
  return apiJson('/api/posizioni');
}

export async function creaPosizione(dati) {
  return apiJson('/api/posizioni', { method: 'POST', body: JSON.stringify(dati) });
}

export async function aggiornaPosizione(id, dati) {
  return apiJson(`/api/posizioni/${id}`, { method: 'PUT', body: JSON.stringify(dati) });
}

export async function eliminaPosizione(id) {
  const res = await apiFetch(`/api/posizioni/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Errore eliminazione posizione');
}

export async function getCandidatiPosizione(id) {
  return apiJson(`/api/posizioni/${id}/candidati`);
}

export async function aggiungiCandidatoPosizione(posId, candidateId) {
  return apiJson(`/api/posizioni/${posId}/candidati`, {
    method: 'POST',
    body: JSON.stringify({ candidate_id: candidateId }),
  });
}

export async function aggiornStatusCandidatoPosizione(posId, cid, status) {
  return apiJson(`/api/posizioni/${posId}/candidati/${cid}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function rimuoviCandidatoPosizione(posId, candidateId) {
  const res = await apiFetch(`/api/posizioni/${posId}/candidati/${candidateId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Errore rimozione candidato');
}
