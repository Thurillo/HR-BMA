import { useState, useRef } from 'react';
import { aggiornaAnagrafica } from '../api/candidati';

// ── Metadati campi ────────────────────────────────────────────────────────────
const CAMPI_NASCOSTI = new Set(['id', 'created_at', 'updated_at', 'extra_data', 'note']);

const CAMPI_JSON = new Set(['hard_skills', 'soft_skills', 'certificazioni']);

const STATI_VALIDI = ['Nuovo', '1° Colloquio', '2° Colloquio', 'Offerta', 'Assunto', 'Scartato'];

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

// ── Componente vista (solo lettura) ───────────────────────────────────────────
function CampoVisualizza({ chiave, valore }) {
  if (valore === null || valore === undefined || valore === '') return null;
  const parsed = parseJson(valore);
  let contenuto;

  if (Array.isArray(parsed)) {
    contenuto = (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {parsed.map((v, i) => (
          <span key={i} className="bg-slate-100 text-slate-700 text-xs rounded-full px-2.5 py-0.5">{v}</span>
        ))}
      </div>
    );
  } else if ((chiave === 'linkedin_url' || chiave === 'portfolio_url') && String(parsed).startsWith('http')) {
    contenuto = (
      <a href={parsed} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all text-sm">
        {parsed}
      </a>
    );
  } else {
    contenuto = <p className="text-sm text-slate-700 mt-0.5 break-words whitespace-pre-wrap">{String(parsed)}</p>;
  }

  return (
    <div className={chiave === 'executive_summary' ? 'sm:col-span-2' : ''}>
      <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{ETICHETTE[chiave] || chiave}</dt>
      {contenuto}
    </div>
  );
}

// ── Componente campo modifica ─────────────────────────────────────────────────
function CampoModifica({ chiave, valore, onChange }) {
  const etichetta = ETICHETTE[chiave] || chiave;
  const classeInput = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";

  let campo;
  if (chiave === 'status') {
    campo = (
      <select value={valore ?? ''} onChange={e => onChange(chiave, e.target.value)} className={classeInput}>
        {STATI_VALIDI.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    );
  } else if (chiave === 'executive_summary') {
    campo = (
      <textarea
        rows={4}
        value={valore ?? ''}
        onChange={e => onChange(chiave, e.target.value)}
        className={`${classeInput} resize-y`}
      />
    );
  } else if (CAMPI_JSON.has(chiave)) {
    campo = (
      <>
        <input
          type="text"
          value={valore ?? ''}
          onChange={e => onChange(chiave, e.target.value)}
          placeholder="es. React, Node.js, SQL"
          className={classeInput}
        />
        <p className="text-xs text-slate-400 mt-0.5">Separa i valori con una virgola</p>
      </>
    );
  } else if (chiave === 'years_experience') {
    campo = (
      <input
        type="number"
        min="0"
        step="0.5"
        value={valore ?? ''}
        onChange={e => onChange(chiave, e.target.value)}
        className={classeInput}
      />
    );
  } else {
    campo = (
      <input
        type="text"
        value={valore ?? ''}
        onChange={e => onChange(chiave, e.target.value)}
        className={classeInput}
      />
    );
  }

  return (
    <div className={chiave === 'executive_summary' ? 'sm:col-span-2' : ''}>
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{etichetta}</label>
      {campo}
    </div>
  );
}

// ── Modale principale ─────────────────────────────────────────────────────────
export default function DettagliModale({ candidato, onChiudi, onAggiornato }) {
  const [modalita, setModalita] = useState('vista'); // 'vista' | 'modifica'
  const [form, setForm] = useState({});
  const [salvataggio, setSalvataggio] = useState(false);
  const [errore, setErrore] = useState(null);
  const inputImportRef = useRef(null);

  if (!candidato) return null;

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
      // Prepopola il form con i dati importati e passa in modalità modifica
      const iniziale = {};
      for (const [k, v] of Object.entries(dati)) {
        if (CAMPI_NASCOSTI.has(k)) continue;
        if (CAMPI_JSON.has(k)) iniziale[k] = arrayToString(parseJson(v));
        else iniziale[k] = v ?? '';
      }
      setForm(iniziale);
      setErrore(null);
      setModalita('modifica');
    } catch {
      setErrore('File JSON non valido');
    }
  }

  const campiExtra = parseJson(candidato.extra_data) ?? {};

  function avviaModifica() {
    // Prepopola il form: i campi JSON array diventano stringhe CSV
    const iniziale = {};
    for (const [k, v] of Object.entries(candidato)) {
      if (CAMPI_NASCOSTI.has(k)) continue;
      if (CAMPI_JSON.has(k)) {
        iniziale[k] = arrayToString(parseJson(v));
      } else {
        iniziale[k] = v ?? '';
      }
    }
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
      // Riconverti i campi CSV → array JSON prima di inviare
      const payload = { ...form };
      for (const chiave of CAMPI_JSON) {
        if (payload[chiave] !== undefined) {
          payload[chiave] = stringToArray(payload[chiave]);
        }
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={e => e.target === e.currentTarget && onChiudi()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* ── Intestazione ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {candidato.first_name} {candidato.last_name}
            </h2>
            <p className="text-sm text-slate-500">{candidato.current_role || '—'}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Esporta / Importa sempre visibili */}
            <button onClick={esporta} title="Esporta candidato in JSON" className="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg hover:bg-slate-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 8l-3-3m3 3l3-3"/>
              </svg>
            </button>
            <button onClick={() => inputImportRef.current?.click()} title="Importa da JSON" className="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg hover:bg-slate-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-3 3m3-3l3 3"/>
              </svg>
            </button>
            <input ref={inputImportRef} type="file" accept=".json" className="hidden" onChange={onFileImport} />
            {modalita === 'vista' ? (
              <button
                onClick={avviaModifica}
                className="flex items-center gap-1.5 text-sm font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"/>
                </svg>
                Modifica
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setModalita('vista'); setErrore(null); }}
                  disabled={salvataggio}
                  className="text-sm font-medium text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  Annulla
                </button>
                <button
                  onClick={salva}
                  disabled={salvataggio}
                  className="flex items-center gap-1.5 text-sm font-medium bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
                >
                  {salvataggio ? 'Salvataggio…' : 'Salva modifiche'}
                </button>
              </>
            )}
            <button onClick={onChiudi} className="text-slate-400 hover:text-slate-700 text-2xl leading-none ml-1">
              &times;
            </button>
          </div>
        </div>

        {/* ── Errore ── */}
        {errore && (
          <div className="mx-6 mt-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 shrink-0">
            {errore}
          </div>
        )}

        {/* ── Corpo scrollabile ── */}
        <div className="overflow-y-auto px-6 py-4 space-y-4">
          {modalita === 'vista' ? (
            <>
              {/* Campi standard in sola lettura */}
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {Object.entries(candidato).map(([k, v]) => {
                  if (CAMPI_NASCOSTI.has(k)) return null;
                  if (k === 'first_name' || k === 'last_name') return null;
                  return <CampoVisualizza key={k} chiave={k} valore={v} />;
                })}
              </dl>

              {/* Dati extra da n8n */}
              {Object.keys(campiExtra).length > 0 && (
                <div className="border-t border-dashed border-slate-200 pt-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Dati aggiuntivi (n8n)
                  </p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {Object.entries(campiExtra).map(([k, v]) => (
                      <CampoVisualizza key={k} chiave={k} valore={v} />
                    ))}
                  </dl>
                </div>
              )}

              {/* Note */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Note</p>
                {candidato.note
                  ? <p className="text-sm text-slate-700 whitespace-pre-wrap">{candidato.note}</p>
                  : <p className="text-sm text-slate-400 italic">Nessuna nota</p>
                }
              </div>

              {/* Date */}
              <div className="border-t border-slate-100 pt-3 flex gap-6">
                <div>
                  <p className="text-xs text-slate-400">Inserito il</p>
                  <p className="text-xs text-slate-600">{new Date(candidato.created_at).toLocaleString('it-IT')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Aggiornato il</p>
                  <p className="text-xs text-slate-600">{new Date(candidato.updated_at).toLocaleString('it-IT')}</p>
                </div>
              </div>
            </>
          ) : (
            /* ── Form di modifica ── */
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {Object.keys(form).filter(k => k !== 'note').map(chiave => (
                  <CampoModifica
                    key={chiave}
                    chiave={chiave}
                    valore={form[chiave]}
                    onChange={aggiornaForm}
                  />
                ))}
              </div>
              {/* Note — campo dedicato a piena larghezza */}
              <div className="border-t border-slate-100 pt-4">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Note</label>
                <textarea
                  rows={6}
                  value={form.note ?? ''}
                  onChange={e => aggiornaForm('note', e.target.value)}
                  placeholder="Aggiungi note sul candidato…"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
