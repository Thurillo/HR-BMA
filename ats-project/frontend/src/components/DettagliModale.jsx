import { useState, useRef } from 'react';
import { aggiornaAnagrafica } from '../api/candidati';
import { STATI_CANDIDATO, BADGE_STATUS } from '../config/stati';

const CAMPI_NASCOSTI = new Set(['id', 'created_at', 'updated_at', 'extra_data', 'note']);
const CAMPI_JSON     = new Set(['hard_skills', 'soft_skills', 'certificazioni']);

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

const PILL_STYLE = {
  hard_skills:    'bg-blue-50 text-blue-800 border border-blue-200',
  soft_skills:    'bg-emerald-50 text-emerald-800 border border-emerald-200',
  certificazioni: 'bg-amber-50 text-amber-800 border border-amber-200',
};

const SEZIONI_VISTA = [
  { id: 'contatti',   titolo: 'Contatti',               accent: 'bg-sky-500',    campi: ['email', 'phone', 'location', 'linkedin_url', 'portfolio_url', 'file_path_smb'] },
  { id: 'profilo',    titolo: 'Profilo professionale',   accent: 'bg-blue-600',   campi: ['current_role', 'years_experience', 'seniority', 'macro_sector', 'settore_prevalente', 'modalita_lavoro', 'ral_indicata', 'preavviso'] },
  { id: 'formazione', titolo: 'Formazione & Competenze', accent: 'bg-violet-500', campi: ['max_education', 'ambito_studi', 'universita', 'hard_skills', 'soft_skills', 'certificazioni'] },
  { id: 'sintesi',    titolo: 'Sintesi professionale',   accent: 'bg-slate-500',  campi: ['executive_summary'] },
];

const SEZIONI_FORM = [
  { titolo: 'Anagrafica',              campi: ['first_name', 'last_name', 'email', 'phone', 'location'] },
  { titolo: 'Profilo professionale',   campi: ['current_role', 'years_experience', 'seniority', 'macro_sector', 'settore_prevalente', 'modalita_lavoro', 'ral_indicata', 'preavviso', 'status'] },
  { titolo: 'Formazione & Competenze', campi: ['max_education', 'ambito_studi', 'universita', 'hard_skills', 'soft_skills', 'certificazioni'] },
  { titolo: 'Sintesi & Link',          campi: ['executive_summary', 'linkedin_url', 'portfolio_url', 'file_path_smb'] },
];

function parseJson(v) {
  if (!v) return v;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return v; } }
  return v;
}
function arrayToString(v) { return Array.isArray(v) ? v.join(', ') : (v ?? ''); }
function stringToArray(t) { return t.split(',').map(s => s.trim()).filter(Boolean); }
function iniziali(c) { return `${c.first_name?.[0] ?? ''}${c.last_name?.[0] ?? ''}`.toUpperCase(); }

function StatusBadge({ status }) {
  const s = BADGE_STATUS[status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

// ── Campo in sola lettura ─────────────────────────────────────────────────────
function CampoVista({ chiave, valore }) {
  if (valore === null || valore === undefined || valore === '') return null;
  const parsed = parseJson(valore);
  if (Array.isArray(parsed) && parsed.length === 0) return null;

  const isFull = chiave === 'executive_summary';
  let contenuto;

  if (Array.isArray(parsed)) {
    contenuto = (
      <div className="flex flex-wrap gap-2 mt-3">
        {parsed.map((v, i) => (
          <span key={i} className={`text-sm font-medium px-3.5 py-2 rounded-xl ${PILL_STYLE[chiave] ?? 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
            {v}
          </span>
        ))}
      </div>
    );
  } else if ((chiave === 'linkedin_url' || chiave === 'portfolio_url') && String(parsed).startsWith('http')) {
    contenuto = (
      <a href={parsed} target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 hover:underline text-base mt-2 break-all">
        {parsed}
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
        </svg>
      </a>
    );
  } else {
    contenuto = <p className="text-base text-slate-800 mt-2 leading-relaxed break-words">{String(parsed)}</p>;
  }

  return (
    <div className={isFull ? 'col-span-2' : ''}>
      <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">{ETICHETTE[chiave] || chiave}</p>
      {contenuto}
    </div>
  );
}

// ── Campo in modifica ─────────────────────────────────────────────────────────
function CampoModifica({ chiave, valore, onChange }) {
  const etichetta = ETICHETTE[chiave] || chiave;
  const isFull = ['executive_summary', 'file_path_smb'].includes(chiave);
  const cls = "mt-2 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-0 transition";

  let campo;
  if (chiave === 'status') {
    campo = (
      <select value={valore ?? ''} onChange={e => onChange(chiave, e.target.value)} className={cls}>
        {STATI_CANDIDATO.map(s => <option key={s}>{s}</option>)}
      </select>
    );
  } else if (chiave === 'executive_summary') {
    campo = <textarea rows={5} value={valore ?? ''} onChange={e => onChange(chiave, e.target.value)} className={`${cls} resize-y`} />;
  } else if (CAMPI_JSON.has(chiave)) {
    campo = (
      <div>
        <input type="text" value={valore ?? ''} onChange={e => onChange(chiave, e.target.value)}
          placeholder="es. React, Node.js, SQL" className={cls} />
        <p className="text-sm text-slate-400 mt-2 ml-1">Separa i valori con una virgola</p>
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
      <label className="text-sm font-bold text-slate-600">{etichetta}</label>
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
      setForm(iniziale); setErrore(null); setModalita('modifica');
    } catch { setErrore('File JSON non valido'); }
  }

  function avviaModifica() {
    const iniziale = {};
    for (const [k, v] of Object.entries(candidato)) {
      if (CAMPI_NASCOSTI.has(k)) continue;
      iniziale[k] = CAMPI_JSON.has(k) ? arrayToString(parseJson(v)) : (v ?? '');
    }
    iniziale.note = candidato.note ?? '';
    setForm(iniziale); setErrore(null); setModalita('modifica');
  }

  function aggiornaForm(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function salva() {
    setSalvataggio(true); setErrore(null);
    try {
      const payload = { ...form };
      for (const k of CAMPI_JSON) {
        if (payload[k] !== undefined) payload[k] = stringToArray(payload[k]);
      }
      const aggiornato = await aggiornaAnagrafica(candidato.id, payload);
      onAggiornato(aggiornato); setModalita('vista');
    } catch (err) { setErrore(err.message); }
    finally { setSalvataggio(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(2,6,23,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onChiudi()}>

      <div className="bg-slate-50 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{ boxShadow: '0 40px 80px -16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}>

        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 px-10 pt-10 pb-8 shrink-0">

          {/* Icone angolo */}
          <div className="absolute top-5 right-5 flex items-center gap-1">
            <button onClick={esporta} title="Esporta JSON"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 8l-3-3m3 3l3-3"/>
              </svg>
            </button>
            <button onClick={() => inputImportRef.current?.click()} title="Importa JSON"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-3 3m3-3l3 3"/>
              </svg>
            </button>
            <input ref={inputImportRef} type="file" accept=".json" className="hidden" onChange={onFileImport} />
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button onClick={onChiudi}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Identità */}
          <div className="flex items-center gap-6 pr-36">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg">
              <span className="text-white text-3xl font-extrabold tracking-tight">{iniziali(candidato)}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-3xl font-extrabold text-white leading-tight">
                {candidato.first_name} {candidato.last_name}
              </h2>
              <p className="text-slate-400 text-base mt-1.5">{candidato.current_role || 'Ruolo non specificato'}</p>
            </div>
          </div>

          {/* Barra stato + azioni */}
          <div className="flex items-center justify-between mt-7 pt-6 border-t border-white/10">
            {candidato.status ? <StatusBadge status={candidato.status} /> : <span />}
            <div className="flex items-center gap-3">
              {modalita === 'vista' ? (
                <button onClick={avviaModifica}
                  className="flex items-center gap-2 text-sm font-bold bg-white text-slate-800 px-5 py-2.5 rounded-xl hover:bg-blue-50 transition shadow">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"/>
                  </svg>
                  Modifica scheda
                </button>
              ) : (
                <>
                  <button onClick={() => { setModalita('vista'); setErrore(null); }} disabled={salvataggio}
                    className="text-sm font-semibold text-slate-400 hover:text-white px-5 py-2.5 rounded-xl hover:bg-white/10 transition">
                    Annulla
                  </button>
                  <button onClick={salva} disabled={salvataggio}
                    className="flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-xl transition shadow disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                    {salvataggio
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvataggio…</>
                      : '✓ Salva modifiche'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Errore */}
        {errore && (
          <div className="mx-8 mt-5 px-5 py-4 bg-red-50 border-2 border-red-200 rounded-2xl text-sm font-medium text-red-700 shrink-0">
            ⚠️ {errore}
          </div>
        )}

        {/* ── Corpo scrollabile ── */}
        <div className="overflow-y-auto flex-1 bg-slate-50">
          {modalita === 'vista' ? (

            <div className="px-8 py-8 flex flex-col gap-4">
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
                  <div key={sezione.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Intestazione sezione con accent colorato */}
                    <div className="flex items-center gap-3 px-7 py-5 border-b border-slate-100">
                      <div className={`w-1.5 h-6 rounded-full ${sezione.accent}`} />
                      <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest">
                        {sezione.titolo}
                      </h3>
                    </div>
                    <div className="px-7 py-6">
                      {isSintesi ? (
                        <p className="text-base text-slate-700 leading-loose whitespace-pre-wrap">
                          {candidato.executive_summary}
                        </p>
                      ) : (
                        <dl className="grid grid-cols-2 gap-x-12 gap-y-7">
                          {campiPresenti.map(k => (
                            <CampoVista key={k} chiave={k} valore={candidato[k]} />
                          ))}
                        </dl>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Dati extra n8n */}
              {Object.keys(campiExtra).length > 0 && (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-7 py-5 border-b border-dashed border-slate-200">
                    <div className="w-1.5 h-6 rounded-full bg-slate-300" />
                    <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest">Dati aggiuntivi (n8n)</h3>
                  </div>
                  <div className="px-7 py-6">
                    <dl className="grid grid-cols-2 gap-x-12 gap-y-7">
                      {Object.entries(campiExtra).map(([k, v]) => (
                        <CampoVista key={k} chiave={k} valore={v} />
                      ))}
                    </dl>
                  </div>
                </div>
              )}

              {/* Note */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-7 py-5 border-b border-slate-100">
                  <div className="w-1.5 h-6 rounded-full bg-yellow-400" />
                  <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest">Note</h3>
                </div>
                <div className="px-7 py-6">
                  {candidato.note
                    ? <p className="text-base text-slate-700 leading-loose whitespace-pre-wrap">{candidato.note}</p>
                    : <p className="text-base text-slate-300 italic">Nessuna nota aggiunta</p>
                  }
                </div>
              </div>

              {/* Timestamp */}
              <div className="flex gap-10 px-2 pb-2">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Inserito il</p>
                  <p className="text-base text-slate-600 mt-1.5">{new Date(candidato.created_at).toLocaleString('it-IT')}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Aggiornato il</p>
                  <p className="text-base text-slate-600 mt-1.5">{new Date(candidato.updated_at).toLocaleString('it-IT')}</p>
                </div>
              </div>
            </div>

          ) : (

            /* ── Form modifica ── */
            <div className="px-8 py-8 flex flex-col gap-4">
              {SEZIONI_FORM.map(sezione => (
                <div key={sezione.titolo} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-7 py-5 border-b border-slate-100">
                    <h3 className="text-sm font-extrabold text-slate-600 uppercase tracking-widest">{sezione.titolo}</h3>
                  </div>
                  <div className="px-7 py-6 grid grid-cols-2 gap-x-8 gap-y-6">
                    {sezione.campi.filter(k => k in form).map(k => (
                      <CampoModifica key={k} chiave={k} valore={form[k]} onChange={aggiornaForm} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Note */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-7 py-5 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-600 uppercase tracking-widest">Note</h3>
                </div>
                <div className="px-7 py-6">
                  <textarea rows={5} value={form.note ?? ''} onChange={e => aggiornaForm('note', e.target.value)}
                    placeholder="Aggiungi note, osservazioni, impressioni sul candidato…"
                    className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder-slate-300 resize-y focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
