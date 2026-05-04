const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api/email-templates';

export async function getEmailTemplates() {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Errore caricamento modelli');
  return res.json();
}

export async function creaEmailTemplate(dati) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dati),
  });
  const corpo = await res.json();
  if (!res.ok) throw new Error(corpo.errore || 'Errore creazione');
  return corpo;
}

export async function aggiornaEmailTemplate(id, dati) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dati),
  });
  const corpo = await res.json();
  if (!res.ok) throw new Error(corpo.errore || 'Errore aggiornamento');
  return corpo;
}

export async function eliminaEmailTemplate(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) { const c = await res.json(); throw new Error(c.errore || 'Errore eliminazione'); }
}

// Sostituisce i segnaposto nel testo con i dati reali del candidato/posizione
export function applicaSegnaposto(testo, { nome = '', cognome = '', email = '', telefono = '', ruolo_candidato = '', posizione = '' } = {}) {
  return testo
    .replace(/\{\{nome\}\}/gi, nome)
    .replace(/\{\{cognome\}\}/gi, cognome)
    .replace(/\{\{email\}\}/gi, email)
    .replace(/\{\{telefono\}\}/gi, telefono)
    .replace(/\{\{ruolo_candidato\}\}/gi, ruolo_candidato)
    .replace(/\{\{posizione\}\}/gi, posizione);
}
