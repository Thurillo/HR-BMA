import { apiJson, apiFetch } from './client.js';

const BASE = '/api/email-templates';

export async function getEmailTemplates() {
  return apiJson(BASE);
}

export async function creaEmailTemplate(dati) {
  return apiJson(BASE, { method: 'POST', body: JSON.stringify(dati) });
}

export async function aggiornaEmailTemplate(id, dati) {
  return apiJson(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(dati) });
}

export async function eliminaEmailTemplate(id) {
  const res = await apiFetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const c = await res.json().catch(() => ({}));
    throw new Error(c.errore || 'Errore eliminazione');
  }
}

export function applicaSegnaposto(testo, { nome = '', cognome = '', email = '', telefono = '', ruolo_candidato = '', posizione = '' } = {}) {
  return testo
    .replace(/\{\{nome\}\}/gi, nome)
    .replace(/\{\{cognome\}\}/gi, cognome)
    .replace(/\{\{email\}\}/gi, email)
    .replace(/\{\{telefono\}\}/gi, telefono)
    .replace(/\{\{ruolo_candidato\}\}/gi, ruolo_candidato)
    .replace(/\{\{posizione\}\}/gi, posizione);
}
