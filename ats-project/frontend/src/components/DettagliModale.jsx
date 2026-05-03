import { useState, useRef } from 'react';
import { aggiornaAnagrafica } from '../api/candidati';

const CAMPI_NASCOSTI = new Set(['id', 'created_at', 'updated_at', 'extra_data', 'note']);
const CAMPI_JSON     = new Set(['hard_skills', 'soft_skills', 'certificazioni']);
const STATI_VALIDI   = ['Nuovo', '1° Colloquio', '2° Colloquio', 'Offerta', 'Assunto', 'Scartato'];

const ETICHETTE = {
  first_name: 'Nome', last_name: 'Cognome', email: 'Email', phone: 'Telefono',
  location: 'Località', current_role: 'Ruolo attuale', years_experience: 'Anni di esperienza',
  max_education: 'Titolo di studio', executive_summary: 'Sintesi professionale',
  file_path_smb: 'Percorso file (SMB)', linkedin_url: 'LinkedIn', portfolio_url: 'Portfolio',
  seniority: 'Seniority', settore_prevalente: 'Settore prevalente',
  hard_skills: 'Hard Skills', soft_skills: 'Soft Skills', ambito_studi: 'Ambito studi',
  universita: 'Università', certificazioni: 'Certificazioni', preavviso: 'Preavviso',
  ral_indicata: 'RAL indicata', modalita_lavoro: 'Modalità di lavoro',
  macro_sector: 'Macro settore', status: 'Stato',
};

const BADGE_STATUS = {
  'Nuovo':        { bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400'  },
  '1° Colloquio': { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  '2° Colloquio': { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  'Offerta':      { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  'Assunto':      { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  'Scartato':     { bg: 'bg-red-100',    text: 'text-red-600',    dot: 'bg-red-500'    },
};

const PILL_STYLE = {
  hard_skills:    'bg-blue-50 text-blue-700 border border-blue-200',
  soft_skills:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  certificazioni: 'bg-amber-50 text-amber-700 border border-amber-200',
};

// ── Sezioni per la vista lettura ──────────────────────────────────────────────
const SEZIONI_VISTA = [
  { id: 'contatti',    titolo: 'Contatti',                   campi: ['email', 'phone', 'location', 'linkedin_url', 'portfolio_url', 'file_path_smb'] },
  { id: 'profilo',     titolo: 'Profilo professionale',      campi: ['current_role', 'years_experience', 'seniority', 'macro_sector', 'settore_prevalente', 'modalita_lavoro', 'ral_indicata', 'preavviso'] },
  { id: 'formazione',  titolo: 'Formazione & Competenze',    campi: ['max_education', 'ambito_studi', 'universita', 'hard_skills', 'soft_skills', 'certificazioni'] },
  { id: 'sintesi',     titolo: 'Sintesi professionale',      campi: ['executive_summary'] },
];

// ── Sezioni per il form di modifica ──────────────────────────────────────────
const SEZIONI_FORM = [
  { titolo: 'Anagrafica',             campi: ['first_name', 'last_name', 'email', 'phone', 'location'] },
  { titolo: 'Profilo professionale',  campi: ['current_role', 'years_experience', 'seniority', 'macro_sector', 'settore_prevalente', 'modalita_lavoro', 'ral_indicata', 'preavviso', 'status'] },
  { titolo: 'Formazione & Competenze',campi: ['max_education', 'ambito_studi', 'universita', 'hard_skills', 'soft_skills', 'certificazioni'] },
  { titolo: 'Sintesi & Link',         campi: ['executive_summary', 'linkedin_url', 'portfolio_url', 'file_path_smb'] },
];

// ── Utilità ───────────────────────────────────────────────────────────────────
function parseJson(v) {
  if (!v) return v;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return v; } }
  return v;
}
function arrayToString(v) { return Array.isArray(v) ? v.join(', ') : (v ?? ''); }
function stringToArray(t) { return t.split(',').map(s => s.trim()).filter(Boolean); }
function iniziali(c) { return `${c.first_name?.[0] ?? ''}${c.last_name?.[0] ?? ''}`.toUpperCase(); }

// ── Stato badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = BADGE_STATUS[status] ?? { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {status}
    </span>
  );
}

// ── Campo in sola lettura ─────────────────────────────────────────────────────
function CampoVista({ chiave, valore, nascondiLabel }) {
  if (valore === null || valore === undefined || valore === '') return null;
  const parsed = parseJson(valore);
  if (Array.isArray(parsed) && parsed.length === 0) return null;

  const etichetta = ETICHETTE[chiave] || chiave;
  const isFull = ['executive_summary'].includes(chiave);

  let contenuto;
  if (Array.isArray(parsed)) {
    contenuto = (
      <div className="flex flex-wrap gap-2 mt-2">
        {parsed.map((v, i) => (
          <span key={i} className={`text-sm font-medium px-3 py-1.5 rounded-lg ${PILL_STYLE[chiave] ?? 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
            {v}
          </span>
        ))}
      </div>
    );
  } else if ((chiave === 'linkedin_url' || chiave === 'portfolio_url') && String(parsed).startsWith('http')) {
    contenuto = (
      <a href={parsed} target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline text-sm mt-1">
        {parsed}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
        </svg>
      </a>
    );
  } else {
    contenuto = <p className="text-[15px] text-slate-800 mt-1.5 leading-relaxed break-words">{String(parsed)}</p>;
  }

  return (
    <div className={isFull ? 'col-span-2' : ''}>
      {!nascondiLabel && (
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{etichetta}</p>
      )}
      {contenuto}
    </div>
  );
}

// ── Campo in modifica ─────────────────────────────────────────────────────────
function CampoModifica({ chiave, valore, onChange }) {
  const etichetta = ETICHETTE[chiave] || chiave;
  const isFull = ['executive_summary', 'file_path_smb'].includes(chiave);
  const cls = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm";

  let campo;
  if (chiave === 'status') {
    campo = (
      <select value={valore ?? ''} onChange={e => onChange(chiave, e.target.value)} className={cls}>
        {STATI_VALIDI.map(s => <option key={s}>{s}</option>)}
      </select>
    );
  } else if (chiave === 'executive_summary') {
    campo = <textarea rows={5} value={valore ?? ''} onChange={e => onChange(chiave, e.target.value)} className={`${cls} resize-y`} />;
  } else if (CAMPI_JSON.has(chiave)) {
    campo = (
      <div>
        <input type="text" value={valore ?? ''} onChange={e => onChange(chiave, e.target.value)}
          placeholder="es. React, Node.js, SQL (separate da virgola)" className={cls} />
        <p className="text-xs text-slate-400 mt-1.5 ml-1">Separa i valori con una virgola</p>
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
    <div className={isFull ? 'col-span-2' : ''}>
      <label className="text-sm font-semibold text-slate-600">{etichetta}</label>
      {campo}
    </div>
  );
}

// ── Modale principale ─────────────────────────────────────────────────────────
export default function DettagliModale({ candidato, onChiudi, onAggiornato }) {
  const [modalita, setModalita]       = useState('vista');
  const [form, setForm]               = useState({});
  const [salvataggio, setSalvataggio] = useState(false);
  const [errore, setErrore]           = useState(null);
  const inputImportRef                = useRef(null);

  if (!candidato) return null;

  const campiExtra = parseJson(candidato.extra_data) ?? {};

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
        iniziale[k] = CAMPI_JSON.has(k) ? arrayToString(parseJson(v)) : (v ?? '');
      }
      iniziale.note = dati.note ?? '';
      setForm(iniziale);
      setErrore(null);
      setModalita('modifica');
    } catch { setErrore('File JSON non valido'); }
  }

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

  function aggiornaForm(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function salva() {
    setSalvataggio(true);
    setErrore(null);
    try {
      const payload = { ...form };
      for (const k of CAMPI_JSON) {
        if (payload[k] !== undefined) payload[k] = stringToArray(payload[k]);
      }
      const aggiornato = await aggiornaAnagrafica(candidato.id, payload);
      onAggiornato(aggiornato);
      setModalita('vista');
    } catch (err) { setErrore(err.message); }
    finally { setSalvataggio(false); }
  }

  const statoStyle = BADGE_STATUS[candidato.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onChiudi()}>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35)' }}>

        {/* ── Header ── */}
        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 px-8 pt-8 pb-6 shrink-0">

          {/* Controlli angolo */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <button onClick={esporta} title="Esporta JSON"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 8l-3-3m3 3l3-3"/>
              </svg>
            </button>
            <button onClick={() => inputImportRef.current?.click()} title="Importa JSON"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-3 3m3-3l3 3"/>
              </svg>
            </button>
            <input ref={inputImportRef} type="file" accept=".json" className="hidden" onChange={onFileImport} />
            <div className="w-px h-5 bg-white/10 mx-0.5" />
            <button onClick={onChiudi}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Identità */}
          <div className="flex items-center gap-5 pr-32">
            <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0 shadow-lg">
              <span className="text-white text-2xl font-bold tracking-tight">{iniziali(candidato)}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-white leading-tight truncate">
                {candidato.first_name} {candidato.last_name}
              </h2>
              <p className="text-slate-400 text-sm mt-1 truncate">{candidato.current_role || 'Ruolo non specificato'}</p>
            </div>
          </div>

          {/* Barra inferiore: stato + pulsanti azione */}
          <div className="flex items-center justify-between mt-5">
            {candidato.status
              ? <StatusBadge status={candidato.status} />
              : <span />}

            <div className="flex items-center gap-2">
              {modalita === 'vista' ? (
                <button onClick={avviaModifica}
                  className="flex items-center gap-2 text-sm font-semibold bg-white text-slate-800 px-4 py-2 rounded-xl hover:bg-slate-100 transition shadow-sm">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"/>
                  </svg>
                  Modifica
                </button>
              ) : (
                <>
                  <button onClick={() => { setModalita('vista'); setErrore(null); }} disabled={salvataggio}
                    className="text-sm font-medium text-slate-400 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10 transition">
                    Annulla
                  </button>
                  <button onClick={salva} disabled={salvataggio}
                    className="flex items-center gap-2 text-sm font-semibold bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-xl transition shadow-sm disabled:opacity-60">
                    {salvataggio
                      ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Salvataggio…</>
                      : 'Salva modifiche'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Errore */}
        {errore && (
          <div className="mx-8 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 shrink-0">
            {errore}
          </div>
        )}

        {/* ── Corpo ── */}
        <div className="overflow-y-auto flex-1 bg-slate-50">
          {modalita === 'vista' ? (

            <div className="px-8 py-6 flex flex-col gap-1">
              {SEZIONI_VISTA.map(sezione => {
                const campiPresenti = sezione.campi.filter(k => {
                  const v = candidato[k];
                  if (v === null || v === undefined || v === '') return false;
                  const p = parseJson(v);
                  return Array.isArray(p) ? p.length > 0 : true;
                });
                if (campiPresenti.length === 0) return null;
                const isSintesi = sezione.id === 'sintesi';

                return (
                  <div key={sezione.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      {sezione.titolo}
                    </h3>
                    {isSintesi ? (
                      // Sintesi: mostra direttamente il testo senza label duplicata
                      <p className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {candidato.executive_summary}
                      </p>
                    ) : (
                      <dl className="grid grid-cols-2 gap-x-10 gap-y-5">
                        {campiPresenti.map(k => (
                          <CampoVista key={k} chiave={k} valore={candidato[k]} />
                        ))}
                      </dl>
                    )}
                  </div>
                );
              })}

              {/* Dati extra n8n */}
              {Object.keys(campiExtra).length > 0 && (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm p-6 mb-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Dati aggiuntivi (n8n)
                  </h3>
                  <dl className="grid grid-cols-2 gap-x-10 gap-y-5">
                    {Object.entries(campiExtra).map(([k, v]) => (
                      <CampoVista key={k} chiave={k} valore={v} />
                    ))}
                  </dl>
                </div>
              )}

              {/* Note */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Note</h3>
                {candidato.note
                  ? <p className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap">{candidato.note}</p>
                  : <p className="text-sm text-slate-300 italic">Nessuna nota aggiunta</p>
                }
              </div>

              {/* Timestamp */}
              <div className="flex gap-8 px-2 pb-2">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inserito il</p>
                  <p className="text-sm text-slate-500 mt-1">{new Date(candidato.created_at).toLocaleString('it-IT')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aggiornato il</p>
                  <p className="text-sm text-slate-500 mt-1">{new Date(candidato.updated_at).toLocaleString('it-IT')}</p>
                </div>
              </div>
            </div>

          ) : (

            /* ── Form modifica ── */
            <div className="px-8 py-6 flex flex-col gap-3">
              {SEZIONI_FORM.map(sezione => (
                <div key={sezione.titolo} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">
                    {sezione.titolo}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    {sezione.campi.filter(k => k in form).map(k => (
                      <CampoModifica key={k} chiave={k} valore={form[k]} onChange={aggiornaForm} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Note */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Note</h3>
                <textarea
                  rows={5}
                  value={form.note ?? ''}
                  onChange={e => aggiornaForm('note', e.target.value)}
                  placeholder="Aggiungi note, osservazioni, impressioni sul candidato…"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-300 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
