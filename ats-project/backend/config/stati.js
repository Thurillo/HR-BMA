// Fonte unica di verità per gli stati candidato e posizione — importare qui, non ridichiarare
export const STATI_CANDIDATO = ['Nuovo', '1° Colloquio', '2° Colloquio', 'Offerta', 'Assunto', 'Scartato'];
export const STATI_POSIZIONE  = ['Aperta', 'In pausa', 'Chiusa'];

// Colonne usate nella lista candidati (esclude campi pesanti o di dettaglio)
export const COLONNE_LISTA_CANDIDATI = `
  id, first_name, last_name, email, phone, location,
  current_role, years_experience, seniority, macro_sector,
  settore_prevalente, modalita_lavoro, ral_indicata, preavviso,
  linkedin_url, status, created_at, updated_at
`.trim();
