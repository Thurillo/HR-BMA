import { useState, useRef } from 'react';
import { aggiornaAnagrafica, aggiornaStatus } from '../api/candidati';
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
  soft_skills:    'bg-teal-50 text-teal-800 border border-teal-200',
  certificazioni: 'bg-amber-50 text-amber-800 border border-amber-200',
};

const SEZIONI_VISTA = [
  { id: 'contatti',   titolo: 'Anagrafica & Contatti',     accent: 'bg-teal-500',   campi: ['email', 'phone', 'location'] },
  { id: 'profilo',    titolo: 'Profilo professionale',      accent: 'bg-blue-500',   campi: ['current_role', 'years_experience', 'seniority', 'macro_sector', 'settore_prevalente', 'modalita_lavoro', 'ral_indicata', 'preavviso'] },
  { id: 'formazione', titolo: 'Formazione',                 accent: 'bg-violet-500', campi: ['max_education', 'ambito_studi', 'universita'] },
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

// ── Sezione collassabile ──────────────────────────────────────────────────────
function Sezione({ titolo, accent, children, defaultOpen = true }) {
  const [aperta, setAperta] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setAperta(a => !a)}
        className="w-full flex items-center gap-3 px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition text-left"
      >
        <div className={`w-1.5 h-5 rounded-full shrink-0 ${accent}`} />
        <h3 className="flex-1 text-xs font-extrabold text-slate-700 uppercase tracking-widest">{titolo}</h3>
        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${aperta ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {aperta && <div className="px-6 py-5">{children}</div>}
    </div>
  );
}

// ── Box AI Sintesi ────────────────────────────────────────────────────────────
function AiSintesiBox({ testo }) {
  if (!testo) return null;
  return (
    <div className="rounded-xl px-5 py-4" style={{ background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)', border: '1px solid #c7d2fe' }}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-white text-[10px] font-bold px-2 py-1 rounded-lg tracking-wide" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>✦ AI</span>
        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Sintesi professionale</span>
      </div>
      <p className="text-sm text-indigo-900 leading-relaxed whitespace-pre-wrap">{testo}</p>
    </div>
  );
}

// ── Skills tags ───────────────────────────────────────────────────────────────
function SkillsSection({ candidato }) {
  const hard = parseJson(candidato.hard_skills);
  const soft = parseJson(candidato.soft_skills);
  const cert = parseJson(candidato.certificazioni);

  const haHard = Array.isArray(hard) && hard.length > 0;
  const haSoft = Array.isArray(soft) && soft.length > 0;
  const haCert = Array.isArray(cert) && cert.length > 0;

  if (!haHard && !haSoft && !haCert) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className="w-1.5 h-5 rounded-full shrink-0 bg-slate-400" />
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Competenze & Certificazioni</h3>
      </div>
      <div className="px-6 py-5 flex flex-col gap-4">
        {haHard && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hard Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {hard.map((v, i) => <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">{v}</span>)}
            </div>
          </div>
        )}
        {haSoft && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Soft Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {soft.map((v, i) => <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">{v}</span>)}
            </div>
          </div>
        )}
        {haCert && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Certificazioni</p>
            <div className="flex flex-wrap gap-1.5">
              {cert.map((v, i) => <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">{v}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Campo vista ───────────────────────────────────────────────────────────────
function CampoVista({ chiave, valore }) {
  if (valore === null || valore === undefined || valore === '') return null;
  const parsed = parseJson(valore);
  if (Array.isArray(parsed) && parsed.length === 0) return null;

  const isFull = chiave === 'executive_summary';
  let contenuto;

  if (Array.isArray(parsed)) {
    contenuto = (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {parsed.map((v, i) => (
          <span key={i} className={`text-xs font-medium px-2.5 py-1 rounded-lg ${PILL_STYLE[chiave] ?? 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
            {v}
          </span>
        ))}
      </div>
    );
  } else if ((chiave === 'linkedin_url' || chiave === 'portfolio_url') && String(parsed).startsWith('http')) {
    contenuto = (
      <a href={parsed} target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-800 hover:underline text-sm mt-1.5 break-all">
        {parsed}
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
        </svg>
      </a>
    );
  } else {
    contenuto = <p className="text-sm text-slate-800 mt-1.5 leading-relaxed break-words">{String(parsed)}</p>;
  }

  return (
    <div className={isFull ? 'col-span-2' : ''}>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{ETICHETTE[chiave] || chiave}</p>
      {contenuto}
    </div>
  );
}

// ── Campo modifica ────────────────────────────────────────────────────────────
function CampoModifica({ chiave, valore, onChange }) {
  const etichetta = ETICHETTE[chiave] || chiave;
  const isFull = ['executive_summary', 'file_path_smb'].includes(chiave);
  const cls = "mt-1.5 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-teal-500 focus:ring-0 transition";

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
      <label className="text-xs font-bold text-slate-600">{etichetta}</label>
      {campo}
    </div>
  );
}

// ── Pannello destro: Status card ──────────────────────────────────────────────
function StatusCard({ candidato, onStatusChange }) {
  const [cambio, setCambio]   = useState(false);
  const [errore, setErrore]   = useState(null);
  const s = BADGE_STATUS[candidato.status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };

  async function handleChange(e) {
    const nuovoStato = e.target.value;
    setCambio(true); setErrore(null);
    try {
      await aggiornaStatus(candidato.id, nuovoStato);
      onStatusChange(nuovoStato);
    } catch { setErrore('Errore aggiornamento stato'); }
    finally { setCambio(false); }
  }

  return (
    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stato candidato</p>
      <span className={`status-pill w-fit ${s.bg} ${s.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full inline-block ${s.dot}`} />
        {candidato.status || 'Non impostato'}
      </span>
      <div>
        <label className="text-[11px] text-slate-400 mb-1.5 block font-medium">Cambia stato</label>
        <select value={candidato.status ?? ''} onChange={handleChange} disabled={cambio}
          className="w-full rounded-xl text-sm focus:outline-none transition disabled:opacity-60 px-3 py-2"
          style={{ border: '1.5px solid #e2e8f0', background: '#ffffff' }}
          onFocus={e => { e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 0 3px rgba(129,140,248,0.15)'; }}
          onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}>
          {STATI_CANDIDATO.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      {errore && <p className="text-xs text-red-600">{errore}</p>}
    </div>
  );
}

// ── Pannello destro: Note reclutatore ─────────────────────────────────────────
function NoteReclutatore({ nota, candidatoId, onNoteAggiornate }) {
  const [testo, setTesto]     = useState(nota ?? '');
  const [salv, setSalv]       = useState(false);
  const [salvato, setSalvato] = useState(false);

  async function salva() {
    setSalv(true); setSalvato(false);
    try {
      await aggiornaAnagrafica(candidatoId, { note: testo });
      onNoteAggiornate(testo);
      setSalvato(true);
      setTimeout(() => setSalvato(false), 2000);
    } catch { /* silenzioso */ }
    finally { setSalv(false); }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Note reclutatore</p>
      <textarea
        rows={5}
        value={testo}
        onChange={e => { setTesto(e.target.value); setSalvato(false); }}
        placeholder="Impressioni, osservazioni, follow-up…"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 resize-y focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
      />
      <button onClick={salva} disabled={salv}
        className="text-xs font-semibold px-3 py-2 rounded-lg transition self-end"
        style={salvato
          ? { background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }
          : { background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', opacity: salv ? 0.6 : 1 }
        }>
        {salv ? 'Salvataggio…' : salvato ? '✓ Salvato' : 'Salva nota'}
      </button>
    </div>
  );
}

// ── Pannello destro: Link ─────────────────────────────────────────────────────
function LinksCard({ candidato }) {
  const links = [
    { label: 'LinkedIn', val: candidato.linkedin_url, icona: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z' },
    { label: 'Portfolio', val: candidato.portfolio_url, icona: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' },
    { label: 'File SMB', val: candidato.file_path_smb, icona: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ].filter(l => l.val);

  if (links.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Link & Documenti</p>
      {links.map(l => (
        <a key={l.label} href={l.val.startsWith('http') ? l.val : undefined}
          target="_blank" rel="noreferrer"
          className="flex items-center gap-2 text-sm text-teal-700 hover:text-teal-900 hover:underline py-1 truncate">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={l.icona}/>
          </svg>
          <span className="truncate">{l.label}</span>
        </a>
      ))}
    </div>
  );
}

// ── Pannello destro: Metadata ─────────────────────────────────────────────────
function MetadataCard({ candidato }) {
  return (
    <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inserito il</p>
        <p className="text-xs text-slate-600 mt-0.5">{new Date(candidato.created_at).toLocaleString('it-IT')}</p>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aggiornato il</p>
        <p className="text-xs text-slate-600 mt-0.5">{new Date(candidato.updated_at).toLocaleString('it-IT')}</p>
      </div>
    </div>
  );
}

// ── Modale principale ─────────────────────────────────────────────────────────
export default function DettagliModale({ candidato: candidatoIniziale, onChiudi, onAggiornato }) {
  const [candidato, setCandidato]     = useState(candidatoIniziale);
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
      setCandidato(aggiornato);
      onAggiornato(aggiornato);
      setModalita('vista');
    } catch (err) { setErrore(err.message); }
    finally { setSalvataggio(false); }
  }

  function handleStatusChange(nuovoStato) {
    const aggiornato = { ...candidato, status: nuovoStato };
    setCandidato(aggiornato);
    onAggiornato(aggiornato);
  }

  function handleNoteAggiornate(nuoveNote) {
    const aggiornato = { ...candidato, note: nuoveNote };
    setCandidato(aggiornato);
    onAggiornato(aggiornato);
  }

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onChiudi()}
    >
      <div
        className="bg-slate-50 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{ boxShadow: '0 40px 80px -16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)', animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1) both' }}>

        {/* ── Header ── */}
        <div className="px-9 pt-9 pb-7 shrink-0 relative" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%)' }}>

          {/* Icone angolo */}
          <div className="absolute top-4 right-4 flex items-center gap-1">
            <button onClick={esporta} title="Esporta JSON"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 8l-3-3m3 3l3-3"/>
              </svg>
            </button>
            <button onClick={() => inputImportRef.current?.click()} title="Importa JSON"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-3 3m3-3l3 3"/>
              </svg>
            </button>
            <input ref={inputImportRef} type="file" accept=".json" className="hidden" onChange={onFileImport} />
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button onClick={onChiudi}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Identità */}
          <div className="flex items-center gap-5 pr-36">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              <span className="text-white text-2xl font-extrabold tracking-tight">{iniziali(candidato)}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold text-white leading-tight">
                {candidato.first_name} {candidato.last_name}
              </h2>
              <p className="text-teal-200 text-sm mt-1">{candidato.current_role || 'Ruolo non specificato'}</p>
            </div>
          </div>

          {/* Barra stato + azioni */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/10">
            <div />
            <div className="flex items-center gap-3">
              {modalita === 'vista' ? (
                <button onClick={avviaModifica}
                  className="flex items-center gap-2 text-sm font-bold bg-white text-indigo-700 px-4 py-2 rounded-xl hover:bg-indigo-50 transition shadow">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"/>
                  </svg>
                  Modifica scheda
                </button>
              ) : (
                <>
                  <button onClick={() => { setModalita('vista'); setErrore(null); }} disabled={salvataggio}
                    className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10 transition">
                    Annulla
                  </button>
                  <button onClick={salva} disabled={salvataggio}
                    className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2 rounded-xl transition shadow disabled:opacity-60"
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
          <div className="mx-6 mt-4 px-5 py-3.5 bg-red-50 border-2 border-red-200 rounded-2xl text-sm font-medium text-red-700 shrink-0">
            ⚠️ {errore}
          </div>
        )}

        {/* ── Corpo due colonne ── */}
        <div className="flex flex-1 overflow-hidden lg:flex-row flex-col">

          {/* Colonna sinistra — profilo */}
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50 flex flex-col gap-3">
            {modalita === 'vista' ? (
              <>
                <AiSintesiBox testo={candidato.executive_summary} />

                {SEZIONI_VISTA.map(sezione => {
                  const campiPresenti = sezione.campi.filter(k => {
                    const v = candidato[k];
                    if (v === null || v === undefined || v === '') return false;
                    const p = parseJson(v);
                    return Array.isArray(p) ? p.length > 0 : true;
                  });
                  if (campiPresenti.length === 0) return null;
                  return (
                    <Sezione key={sezione.id} titolo={sezione.titolo} accent={sezione.accent}>
                      <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
                        {campiPresenti.map(k => <CampoVista key={k} chiave={k} valore={candidato[k]} />)}
                      </dl>
                    </Sezione>
                  );
                })}

                <SkillsSection candidato={candidato} />

                {/* Dati extra n8n */}
                {Object.keys(campiExtra).length > 0 && (
                  <Sezione titolo="Dati aggiuntivi (n8n)" accent="bg-slate-300" defaultOpen={false}>
                    <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
                      {Object.entries(campiExtra).map(([k, v]) => <CampoVista key={k} chiave={k} valore={v} />)}
                    </dl>
                  </Sezione>
                )}
              </>
            ) : (
              /* Form modifica */
              <>
                {SEZIONI_FORM.map(sezione => (
                  <div key={sezione.titolo} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                      <h3 className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">{sezione.titolo}</h3>
                    </div>
                    <div className="px-6 py-5 grid grid-cols-2 gap-x-6 gap-y-5">
                      {sezione.campi.filter(k => k in form).map(k => (
                        <CampoModifica key={k} chiave={k} valore={form[k]} onChange={aggiornaForm} />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Colonna destra — pannello azioni */}
          <div className="w-full lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white overflow-y-auto px-5 py-5 flex flex-col gap-5">
            <StatusCard candidato={candidato} onStatusChange={handleStatusChange} />
            <NoteReclutatore
              nota={candidato.note}
              candidatoId={candidato.id}
              onNoteAggiornate={handleNoteAggiornate}
            />
            <LinksCard candidato={candidato} />
            <MetadataCard candidato={candidato} />
          </div>
        </div>

      </div>
    </div>
  );
}
