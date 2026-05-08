import { apiJson, apiFetch, BASE_URL } from './client.js';

export async function getCandidato(id) {
  return apiJson(`/api/candidates/${id}`);
}

export async function getCandidati(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== 0))
  ).toString();
  return apiJson(`/api/candidates${qs ? `?${qs}` : ''}`);
}

export async function aggiornaStatus(id, status) {
  return apiJson(`/api/candidates/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function creaCandidato(dati) {
  return apiJson('/api/candidates', {
    method: 'POST',
    body: JSON.stringify(dati),
  });
}

export async function eliminaCandidato(id) {
  const res = await apiFetch(`/api/candidates/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Errore eliminazione candidato');
}

export async function aggiornaAnagrafica(id, dati) {
  return apiJson(`/api/candidates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dati),
  });
}

export function urlExport() {
  const token = localStorage.getItem('ats_jwt_token');
  const qs    = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${BASE_URL}/api/candidates/export${qs}`;
}

export async function importaCandidati(lista) {
  return apiJson('/api/candidates/import', {
    method: 'POST',
    body: JSON.stringify(lista),
  });
}
