import { useState, useEffect, useCallback, useRef } from 'react';
import { getCandidati, creaCandidato, eliminaCandidato } from '../api/candidati';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';
import DettagliModale from './DettagliModale';

const STATI_VALIDI = ['Nuovo', '1° Colloquio', '2° Colloquio', 'Offerta', 'Assunto', 'Scartato'];

const FORM_VUOTO = {
  first_name: '', last_name: '', email: '', phone: '', location: '',
  current_role: '', years_experience: '', seniority: '', macro_sector: '',
  settore_prevalente: '', modalita_lavoro: '', ral_indicata: '', preavviso: '',
  linkedin_url: '', executive_summary: '', status: 'Nuovo',
};

const DOT_STATUS = {
  'Nuovo':          'bg-slate-400',
  '1° Colloquio':   'bg-blue-500',
  '2° Colloquio':   'bg-indigo-500',
  'Offerta':        'bg-amber-500',
  'Assunto':        'bg-emerald-500',
  'Scartato':       'bg-red-500',
};

const LABEL_STATUS = {
  'Nuovo':          'text-slate-600',
  '1° Colloquio':   'text-blue-700',
  '2° Colloquio':   'text-indigo-700',
  'Offerta':        'text-amber-700',
  'Assunto':        'text-emerald-700',
  'Scartato':       'text-red-600',
};

function ModaleNuovoCandidato({ onChiudi, onCreato }) {
  const [form, setForm]     = useState(FORM_VUOTO);
  const [errore, setErrore] = useState(null);
  const [invio, setInvio]   = useState(false);

  function set(campo, valore) {
    setForm(prev => ({ ...prev, [campo]: valore }));
  }

  async function invia(e) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      return setErrore('Nome e cognome sono obbligatori');
    }
    setInvio(true);
    setErrore(null);
    try {
      const { id } = await creaCandidato(form);
      const lista = await (await fetch(`${(import.meta.env.VITE_API_URL ?? '')}/api/candidates`)).json();
      const nuovo = lista.find(c => c.id === id) ?? { ...form, id };
      onCreato(nuovo);
      onChiudi();
    } catch (err) {
      setErrore(err.message);
    } finally {
      setInvio(false);
    }
  }

  function campo(label, key, tipo = 'text', props = {}) {
    return (
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">{label}</label>
        <input
          type={tipo}
          value={form[key]}
          onChange={e => set(key, e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition bg-white"
          {...props}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <h3 className="text-base font-bold text-slate-900">Nuovo candidato</h3>
          <button onClick={onChiudi} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={invia} className="overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {campo('Nome *', 'first_name', 'text', { autoFocus: true })}
            {campo('Cognome *', 'last_name')}
            {campo('Email', 'email', 'email')}
            {campo('Telefono', 'phone', 'tel')}
            {campo('Ruolo attuale', 'current_role')}
            {campo('Anni di esperienza', 'years_experience', 'number')}
            {campo('Seniority', 'seniority')}
            {campo('Macro settore', 'macro_sector')}
            {campo('Settore prevalente', 'settore_prevalente')}
            {campo('Modalità di lavoro', 'modalita_lavoro')}
            {campo('RAL indicata', 'ral_indicata')}
            {campo('Preavviso', 'preavviso')}
            {campo('Località', 'location')}
            {campo('LinkedIn', 'linkedin_url', 'url')}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Stato</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition bg-white"
              >
                {STATI_VALIDI.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Sintesi professionale</label>
            <textarea
              rows={3}
              value={form.executive_summary}
              onChange={e => set('executive_summary', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition bg-white"
            />
          </div>

          {errore && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{errore}</p>}

          <div className="flex gap-2 justify-end pt-1 pb-1">
            <button type="button" onClick={onChiudi}
              className="text-sm font-medium text-slate-600 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition">
              Annulla
            </button>
            <button type="submit" disabled={invio}
              className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition disabled:opacity-60 shadow-sm hover:shadow-md"
              style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}>
              {invio ? 'Salvataggio…' : 'Crea candidato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const COLONNE = [
  { key: 'last_name',         label: 'Cognome' },
  { key: 'first_name',        label: 'Nome' },
  { key: 'email',             label: 'Email' },
  { key: 'phone',             label: 'Telefono' },
  { key: 'current_role',      label: 'Ruolo' },
  { key: 'macro_sector',      label: 'Settore' },
  { key: 'seniority',         label: 'Seniority' },
  { key: 'status',            label: 'Stato' },
  { key: 'ral_indicata',      label: 'RAL' },
  { key: 'modalita_lavoro',   label: 'Modalità' },
  { key: 'location',          label: 'Sede' },
];

function IconSort({ attiva, dir }) {
  return (
    <svg className={`w-3 h-3 inline ml-1 ${attiva ? 'text-violet-500' : 'text-slate-300'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      {dir === 'asc'
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/>
        : <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>}
    </svg>
  );
}

function KpiCard({ icona, valore, etichetta, colore }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colore}`}>
        {icona}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none">{valore}</p>
        <p className="text-xs text-slate-500 mt-1">{etichetta}</p>
      </div>
    </div>
  );
}

export default function PaginaCandidati() {
  const [candidati, setCandidati]       = useState([]);
  const [caricamento, setCaricamento]   = useState(true);
  const [errore, setErrore]             = useState(null);
  const [sortKey, setSortKey]           = useState('last_name');
  const [sortDir, setSortDir]           = useState('asc');
  const [filtro, setFiltro]             = useState('');
  const [selezionato, setSelezionato]   = useState(null);
  const [daEliminare, setDaEliminare]   = useState(null);
  const [eliminando, setEliminando]     = useState(false);
  const [mostraNuovo, setMostraNuovo]   = useState(false);
  const [importando, setImportando]     = useState(false);
  const [msgImport, setMsgImport]       = useState(null);
  const inputFileRef                    = useRef(null);

  function esporta() {
    window.open(`${BASE_URL}/api/candidates/export`, '_blank');
  }

  async function onFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setImportando(true);
    setMsgImport(null);
    try {
      const testo = await file.text();
      const lista = JSON.parse(testo);
      const res = await fetch(`${BASE_URL}/api/candidates/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lista),
      });
      const corpo = await res.json();
      if (!res.ok) throw new Error(corpo.errore || 'Errore importazione');
      setMsgImport({ tipo: 'ok', testo: `${corpo.messaggio}: ${corpo.inseriti} candidati processati${corpo.errori ? `, ${corpo.errori} errori` : ''}` });
      await carica();
    } catch (err) {
      setMsgImport({ tipo: 'err', testo: err.message });
    } finally {
      setImportando(false);
    }
  }

  const carica = useCallback(async () => {
    try {
      setCaricamento(true);
      setErrore(null);
      setCandidati(await getCandidati());
    } catch (err) {
      setErrore(err.message);
    } finally {
      setCaricamento(false);
    }
  }, []);

  useEffect(() => { carica(); }, [carica]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  function val(c, k) {
    const v = c[k];
    if (v === null || v === undefined) return '';
    return String(v).toLowerCase();
  }

  const filtrati = candidati.filter(c => {
    if (!filtro.trim()) return true;
    const q = filtro.toLowerCase();
    return [
      c.first_name, c.last_name, c.email, c.current_role,
      c.macro_sector, c.location, c.status,
    ].some(v => v && String(v).toLowerCase().includes(q));
  });

  const ordinati = [...filtrati].sort((a, b) => {
    const va = val(a, sortKey);
    const vb = val(b, sortKey);
    const cmp = va.localeCompare(vb, 'it', { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  async function confermaElimina() {
    if (!daEliminare) return;
    setEliminando(true);
    try {
      await eliminaCandidato(daEliminare.id);
      setCandidati(prev => prev.filter(c => c.id !== daEliminare.id));
      setDaEliminare(null);
    } catch {
      /* non bloccare la UI */
    } finally {
      setEliminando(false);
    }
  }

  const inColloquio = candidati.filter(c => c.status === '1° Colloquio' || c.status === '2° Colloquio').length;
  const assunti = candidati.filter(c => c.status === 'Assunto').length;

  if (caricamento) return (
    <div className="flex items-center justify-center h-64 text-slate-500">Caricamento candidati…</div>
  );

  if (errore) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-600">
      <p>Errore: {errore}</p>
      <button onClick={carica} className="text-sm bg-red-100 px-4 py-1.5 rounded-xl hover:bg-red-200 transition">Riprova</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          valore={candidati.length}
          etichetta="Totale candidati"
          colore="bg-gradient-to-br from-indigo-500 to-violet-600"
          icona={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          }
        />
        <KpiCard
          valore={inColloquio}
          etichetta="In colloquio"
          colore="bg-gradient-to-br from-blue-500 to-indigo-500"
          icona={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          }
        />
        <KpiCard
          valore={assunti}
          etichetta="Assunti"
          colore="bg-gradient-to-br from-emerald-500 to-teal-600"
          icona={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-sm text-slate-400 mr-auto">
          {filtrati.length === candidati.length
            ? `${candidati.length} candidati`
            : `${filtrati.length} di ${candidati.length} candidati`}
        </p>
        <div className="relative">
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input
            type="text"
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            placeholder="Cerca candidati…"
            className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 w-56 shadow-sm transition"
          />
        </div>
        <button onClick={esporta} title="Esporta tutti i candidati in JSON"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition shadow-sm shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 8l-3-3m3 3l3-3"/>
          </svg>
          Esporta
        </button>
        <button onClick={() => inputFileRef.current?.click()} disabled={importando} title="Importa candidati da file JSON"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition shadow-sm shrink-0 disabled:opacity-60">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-3 3m3-3l3 3"/>
          </svg>
          {importando ? 'Importazione…' : 'Importa'}
        </button>
        <input ref={inputFileRef} type="file" accept=".json" className="hidden" onChange={onFileImport} />
        <button onClick={() => setMostraNuovo(true)}
          className="flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition shadow-sm hover:shadow-md shrink-0"
          style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Nuovo candidato
        </button>
        {msgImport && (
          <div className={`w-full text-sm px-4 py-2.5 rounded-xl border ${msgImport.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
            {msgImport.testo}
          </div>
        )}
      </div>

      {/* Tabella */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {COLONNE.map(col => (
                  <th key={col.key} onClick={() => toggleSort(col.key)}
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-violet-600 transition whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      {col.label}
                      <IconSort attiva={sortKey === col.key} dir={sortKey === col.key ? sortDir : 'asc'} />
                    </span>
                  </th>
                ))}
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ordinati.length === 0 ? (
                <tr>
                  <td colSpan={COLONNE.length + 1} className="text-center py-20 text-slate-400 text-sm">
                    Nessun candidato trovato
                  </td>
                </tr>
              ) : ordinati.map(c => (
                <tr key={c.id} className="hover:bg-violet-50/20 transition-colors">
                  {COLONNE.map(col => (
                    <td key={col.key} className="px-6 py-4 max-w-[200px]">
                      {col.key === 'status' ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_STATUS[c.status] ?? 'bg-slate-400'}`} />
                          <span className={`text-xs font-medium ${LABEL_STATUS[c.status] ?? 'text-slate-600'}`}>{c.status ?? '—'}</span>
                        </span>
                      ) : col.key === 'last_name' || col.key === 'first_name' ? (
                        <span className="text-sm font-semibold text-slate-800 truncate block" title={c[col.key] ?? ''}>
                          {c[col.key] ?? <span className="text-slate-300 font-normal">—</span>}
                        </span>
                      ) : col.key === 'email' ? (
                        <span className="text-sm text-slate-500 truncate block" title={c.email ?? ''}>
                          {c.email ?? <span className="text-slate-300">—</span>}
                        </span>
                      ) : col.key === 'phone' ? (
                        <span className="text-sm text-slate-500 whitespace-nowrap block">
                          {c.phone ?? <span className="text-slate-300">—</span>}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-600 truncate block" title={c[col.key] ?? ''}>
                          {c[col.key] ?? <span className="text-slate-300">—</span>}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setSelezionato(c)} title="Apri scheda candidato"
                        className="text-sm font-semibold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 px-3.5 py-1.5 rounded-lg transition whitespace-nowrap">
                        Apri scheda
                      </button>
                      <button onClick={() => setDaEliminare(c)} title="Elimina candidato"
                        className="text-sm font-semibold text-red-500 hover:text-white bg-red-50 hover:bg-red-500 border border-red-200 hover:border-red-500 px-3.5 py-1.5 rounded-lg transition whitespace-nowrap">
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale nuovo candidato */}
      {mostraNuovo && (
        <ModaleNuovoCandidato
          onChiudi={() => setMostraNuovo(false)}
          onCreato={nuovo => setCandidati(prev => [nuovo, ...prev])}
        />
      )}

      {/* Modale dettaglio/modifica */}
      {selezionato && (
        <DettagliModale
          candidato={selezionato}
          onChiudi={() => setSelezionato(null)}
          onAggiornato={aggiornato => {
            setCandidati(prev => prev.map(c => c.id === aggiornato.id ? aggiornato : c));
            setSelezionato(aggiornato);
          }}
        />
      )}

      {/* Modale conferma eliminazione */}
      {daEliminare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm mx-4">
            <h3 className="text-base font-bold text-slate-900 mb-2">Elimina candidato</h3>
            <p className="text-sm text-slate-600 mb-6">
              Vuoi eliminare <span className="font-semibold">{daEliminare.first_name} {daEliminare.last_name}</span>?
              L'operazione è irreversibile.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDaEliminare(null)}
                className="text-sm px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                Annulla
              </button>
              <button onClick={confermaElimina} disabled={eliminando}
                className="text-sm px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60 font-semibold">
                {eliminando ? 'Eliminazione…' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
