import { useState, useRef } from 'react';
import { aggiornaAnagrafica } from '../api/candidati';

const CAMPI_NASCOSTI = new Set(['id', 'created_at', 'updated_at', 'extra_data', 'note']);
const CAMPI_JSON     = new Set(['hard_skills', 'soft_skills', 'certificazioni']);
const STATI_VALIDI   = ['Nuovo', '1° Colloquio', '2° Colloquio', 'Offerta', 'Assunto', 'Scartato'];

const ETICHETTE = {
  first_name: 'Nome', last_name: 'Cognome', email: 'Email', phone: 'Telefono',
  location: 'Località', current_role: 'Ruolo attuale', years_experience: 'Anni di esperienza',
  max_education: 'Titolo di studio', executive_summary: 'Sintesi professionale',
  file_path_smb: 'Percorso file', linkedin_url: 'LinkedIn', portfolio_url: 'Portfolio',
  seniority: 'Seniority', settore_prevalente: 'Settore prevalente',
  hard_skills: 'Hard Skills', soft_skills: 'Soft Skills', ambito_studi: 'Ambito studi',
  universita: 'Università', certificazioni: 'Certificazioni', preavviso: 'Preavviso',
  ral_indicata: 'RAL indicata', modalita_lavoro: 'Modalità di lavoro',
  macro_sector: 'Macro settore', status: 'Stato',
};

const BADGE_STATUS = {
  'Nuovo':         'bg-slate-100 text-slate-600',
  '1° Colloquio':  'bg-blue-100 text-blue-700',
  '2° Colloquio':  'bg-indigo-100 text-indigo-700',
  'Offerta':       'bg-amber-100 text-amber-700',
  'Assunto':       'bg-green-100 text-green-700',
  'Scartato':      'bg-red-100 text-red-600',
};

const PILL_COLORS = {
  hard_skills:    'bg-blue-50 text-blue-700 border border-blue-200',
  soft_skills:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  certificazioni: 'bg-amber-50 text-amber-700 border border-amber-200',
};

// Sezioni della vista lettura
const SEZIONI_VISTA = [
  {
    id: 'contatti',
    titolo: 'Contatti',
    campi: ['email', 'phone', 'location', 'linkedin_url', 'portfolio_url', 'file_path_smb'],
  },
  {
    id: 'professionale',
    titolo: 'Profilo professionale',
    campi: ['current_role', 'years_experience', 'seniority', 'macro_sector', 'settore_prevalente', 'modalita_lavoro', 'ral_indicata', 'preavviso'],
  },
  {
    id: 'formazione',
    titolo: 'Formazione & Competenze',
    campi: ['max_education', 'ambito_studi', 'universita', 'hard_skills', 'soft_skills', 'certificazioni'],
  },
  {
    id: 'sintesi',
    titolo: 'Sintesi professionale',
    campi: ['executive_summary'],
  },
];

// Sezioni del form di modifica (ordine + raggruppamento)
const SEZIONI_FORM = [
  {
    titolo: 'Anagrafica',
    campi: ['first_name', 'last_name', 'email', 'phone', 'location'],
  },
  {
    titolo: 'Profilo professionale',
    campi: ['current_role', 'years_experience', 'seniority', 'macro_sector', 'settore_prevalente', 'modalita_lavoro', 'ral_indicata', 'preavviso', 'status'],
  },
  {
    titolo: 'Formazione & Competenze',
    campi: ['max_education', 'ambito_studi', 'universita', 'hard_skills', 'soft_skills', 'certificazioni'],
  },
  {
    titolo: 'Altro',
    campi: ['linkedin_url', 'portfolio_url', 'file_path_smb', 'executive_summary'],
  },
];

// ── Utilità ───────────────────────────────────────────────────────────────────
function parseJson(valore) {
  if (!valore) return valore;
  if (typeof valore === 'string') {
    try { return JSON.parse(valore); } catch { return valore; }
  }
  return valore;
}
function arrayToString(valore) {
  if (Array.isArray(valore)) return valore.join(', ');
  return valore ?? '';
}
function stringToArray(testo) {
  return testo.split(',').map(s => s.trim()).filter(Boolean);
}
function iniziali(c) {
  return `${c.first_name?.[0] ?? ''}${c.last_name?.[0] ?? ''}`.toUpperCase();
}

// ── Campo in vista lettura ────────────────────────────────────────────────────
function CampoVista({ chiave, valore }) {
  if (valore === null || valore === undefined || valore === '') return null;
  const parsed = parseJson(valore);
  const etichetta = ETICHETTE[chiave] || chiave;
  const isFullWidth = chiave === 'executive_summary';

  let contenuto;
  if (Array.isArray(parsed) && parsed.length > 0) {
    contenuto = (
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {parsed.map((v, i) => (
          <span key={i} className={`text-xs font-medium rounded-full px-3 py-1 ${PILL_COLORS[chiave] ?? 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
            {v}
          </span>
        ))}
      </div>
    );
  } else if ((chiave === 'linkedin_url' || chiave === 'portfolio_url') && String(parsed).startsWith('http')) {
    contenuto = (
      <a href={parsed} target="_blank" rel="noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline text-sm break-all mt-1 block">
        {parsed}
      </a>
    );
  } else if (chiave === 'status') {
    contenuto = (
      <span className={`inline-flex mt-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE_STATUS[parsed] ?? 'bg-slate-100 text-slate-600'}`}>
        {String(parsed)}
      </span>
    );
  } else {
    contenuto = (
      <p className="text-sm text-slate-800 mt-1 break-words whitespace-pre-wrap leading-relaxed">{String(parsed)}</p>
    );
  }

  return (
    <div className={isFullWidth ? 'col-span-2' : ''}>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{etichetta}</p>
      {contenuto}
    </div>
  );
}

// ── Campo in modifica ─────────────────────────────────────────────────────────
function CampoModifica({ chiave, valore, onChange }) {
  const etichetta = ETICHETTE[chiave] || chiave;
  const isFullWidth = chiave === 'executive_summary';
  const cls = "mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition";

  let campo;
  if (chiave === 'status') {
    campo = (
      <select value={valore ?? ''} onChange={e => onChange(chiave, e.target.value)} className={cls}>
        {STATI_VALIDI.map(s => <option key={s}>{s}</option>)}
      </select>
    );
  } else if (chiave === 'executive_summary') {
    campo = (
      <textarea rows={4} value={valore ?? ''} onChange={e => onChange(chiave, e.target.value)}
        className={`${cls} resize-y`} />
    );
  } else if (CAMPI_JSON.has(chiave)) {
    campo = (
      <div>
        <input type="text" value={valore ?? ''} onChange={e => onChange(chiave, e.target.value)}
          placeholder="es. React, Node.js, SQL" className={cls} />
        <p className="text-[11px] text-slate-400 mt-1">Separa i valori con una virgola</p>
      </div>
    );
  } else if (chiave === 'years_experience') {
    campo = <input type="number" min="0" step="0.5" value={valore ?? ''} onChange={e => onChange(chiave, e.target.value)} className={cls} />;
  } else if (chiave === 'email') {
    campo = <input type="email" value={valore ?? ''} onChange={e => onChange(chiave, e.target.value)} className={cls} />;
  } else if (chiave === 'phone') {
    campo = <input type="tel" value={valore ?? ''} onChange={e => onChange(chiave, e.target.value)} className={cls} />;
  } else if (chiave === 'linkedin_url' || chiave === 'portfolio_url') {
    campo = <input type="url" value={valore ?? ''} onChange={e => onChange(chiave, e.target.value)} placeholder="https://…" className={cls} />;
  } else {
    campo = <input type="text" value={valore ?? ''} onChange={e => onChange(chiave, e.target.value)} className={cls} />;
  }

  return (
    <div className={isFullWidth ? 'col-span-2' : ''}>
      <label className="text-xs font-semibold text-slate-500">{etichetta}</label>
      {campo}
    </div>
  );
}

// ── Modale principale ─────────────────────────────────────────────────────────
export default function DettagliModale({ candidato, onChiudi, onAggiornato }) {
  const [modalita, setModalita]     = useState('vista');
  const [form, setForm]             = useState({});
  const [salvataggio, setSalvataggio] = useState(false);
  const [errore, setErrore]         = useState(null);
  const inputImportRef              = useRef(null);

  if (!candidato) return null;

  const campiExtra = parseJson(candidato.extra_data) ?? {};

  // ── Export / Import ───────────────────────────────────────────────────────
  function esporta() {
    const nome = `${candidato.first_name}_${candidato.last_name}`.replace(/\s+/g, '_');
    const blob = new Blob([JSON.stringify(candidato, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${nome}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  async function onFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    try {
      const dati = JSON.parse(await file.text());
      const iniziale = {};
      for (const [k, v] of Object.entries(dati)) {
        if (CAMPI_NASCOSTI.has(k)) continue;
        if (CAMPI_JSON.has(k)) iniziale[k] = arrayToString(parseJson(v));
        else iniziale[k] = v ?? '';
      }
      iniziale.note = dati.note ?? '';
      setForm(iniziale);
      setErrore(null);
      setModalita('modifica');
    } catch {
      setErrore('File JSON non valido');
    }
  }

  // ── Modifica ──────────────────────────────────────────────────────────────
  function avviaModifica() {
    const iniziale = {};
    for (const [k, v] of Object.entries(candidato)) {
      if (CAMPI_NASCOSTI.has(k)) continue;
      iniziale[k] = CAMPI_JSON.has(k) ? arrayToString(parseJson(v)) : (v ?? '');
    }
    iniziale.note = candidato.note ?? '';
    setForm(iniziale);
    setErrore(null);
    setModalita('modifica');
  }

  function aggiornaForm(chiave, valore) {
    setForm(prev => ({ ...prev, [chiave]: valore }));
  }

  async function salva() {
    setSalvataggio(true);
    setErrore(null);
    try {
      const payload = { ...form };
      for (const chiave of CAMPI_JSON) {
        if (payload[chiave] !== undefined) payload[chiave] = stringToArray(payload[chiave]);
      }
      const aggiornato = await aggiornaAnagrafica(candidato.id, payload);
      onAggiornato(aggiornato);
      setModalita('vista');
    } catch (err) {
      setErrore(err.message);
    } finally {
      setSalvataggio(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onChiudi()}>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Header colorato ── */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 pt-5 pb-4 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <span className="text-white text-lg font-bold">{iniziali(candidato)}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">
                  {candidato.first_name} {candidato.last_name}
                </h2>
                <p className="text-blue-200 text-sm mt-0.5">{candidato.current_role || 'Ruolo non specificato'}</p>
              </div>
            </div>

            {/* Azioni */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={esporta} title="Esporta JSON"
                className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/20 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 8l-3-3m3 3l3-3"/>
                </svg>
              </button>
              <button onClick={() => inputImportRef.current?.click()} title="Importa JSON"
                className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/20 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-3 3m3-3l3 3"/>
                </svg>
              </button>
              <input ref={inputImportRef} type="file" accept=".json" className="hidden" onChange={onFileImport} />

              <div className="w-px h-5 bg-white/20 mx-1" />

              {modalita === 'vista' ? (
                <button onClick={avviaModifica}
                  className="flex items-center gap-1.5 text-sm font-semibold bg-white text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"/>
                  </svg>
                  Modifica
                </button>
              ) : (
                <>
                  <button onClick={() => { setModalita('vista'); setErrore(null); }} disabled={salvataggio}
                    className="text-sm font-medium text-blue-100 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/20 transition">
                    Annulla
                  </button>
                  <button onClick={salva} disabled={salvataggio}
                    className="text-sm font-semibold bg-white text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition disabled:opacity-60">
                    {salvataggio ? 'Salvataggio…' : 'Salva'}
                  </button>
                </>
              )}
              <button onClick={onChiudi}
                className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/20 transition ml-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Badge stato sotto l'header */}
          {candidato.status && (
            <div className="mt-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE_STATUS[candidato.status] ?? 'bg-white/20 text-white'}`}>
                {candidato.status}
              </span>
            </div>
          )}
        </div>

        {/* Errore */}
        {errore && (
          <div className="mx-5 mt-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 shrink-0">
            {errore}
          </div>
        )}

        {/* ── Corpo scrollabile ── */}
        <div className="overflow-y-auto flex-1">

          {modalita === 'vista' ? (
            <div className="px-6 py-5 flex flex-col gap-6">

              {/* Sezioni principali */}
              {SEZIONI_VISTA.map(sezione => {
                const campiPresenti = sezione.campi.filter(k => {
                  const v = candidato[k];
                  if (v === null || v === undefined || v === '') return false;
                  const parsed = parseJson(v);
                  if (Array.isArray(parsed)) return parsed.length > 0;
                  return true;
                });
                if (campiPresenti.length === 0) return null;

                return (
                  <div key={sezione.id}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">
                      {sezione.titolo}
                    </h3>
                    <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
                      {campiPresenti.map(k => (
                        <CampoVista key={k} chiave={k} valore={candidato[k]} />
                      ))}
                    </dl>
                  </div>
                );
              })}

              {/* Dati extra da n8n */}
              {Object.keys(campiExtra).length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-dashed border-slate-200">
                    Dati aggiuntivi (n8n)
                  </h3>
                  <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {Object.entries(campiExtra).map(([k, v]) => (
                      <CampoVista key={k} chiave={k} valore={v} />
                    ))}
                  </dl>
                </div>
              )}

              {/* Note */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">
                  Note
                </h3>
                {candidato.note
                  ? <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{candidato.note}</p>
                  : <p className="text-sm text-slate-400 italic">Nessuna nota aggiunta</p>
                }
              </div>

              {/* Timestamp */}
              <div className="flex gap-8 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Inserito il</p>
                  <p className="text-xs text-slate-600 mt-0.5">{new Date(candidato.created_at).toLocaleString('it-IT')}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Aggiornato il</p>
                  <p className="text-xs text-slate-600 mt-0.5">{new Date(candidato.updated_at).toLocaleString('it-IT')}</p>
                </div>
              </div>
            </div>

          ) : (
            /* ── Form di modifica ── */
            <div className="px-6 py-5 flex flex-col gap-6">
              {SEZIONI_FORM.map(sezione => (
                <div key={sezione.titolo}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">
                    {sezione.titolo}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {sezione.campi.filter(k => k in form).map(chiave => (
                      <CampoModifica key={chiave} chiave={chiave} valore={form[chiave]} onChange={aggiornaForm} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Note */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">
                  Note
                </h3>
                <textarea
                  rows={5}
                  value={form.note ?? ''}
                  onChange={e => aggiornaForm('note', e.target.value)}
                  placeholder="Aggiungi note, osservazioni, impressioni sul candidato…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
