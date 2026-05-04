import { useState, useEffect, useCallback } from 'react';
import {
  getEmailTemplates, creaEmailTemplate,
  aggiornaEmailTemplate, eliminaEmailTemplate,
} from '../api/emailTemplates';

const FASI = ['Nuovo', '1° Colloquio', '2° Colloquio', 'Offerta', 'Assunto', 'Scartato'];
const MAX_PER_FASE = 10;

const BADGE_FASE = {
  'Nuovo':          'bg-slate-100 text-slate-700',
  '1° Colloquio':   'bg-blue-100 text-blue-800',
  '2° Colloquio':   'bg-indigo-100 text-indigo-800',
  'Offerta':        'bg-amber-100 text-amber-800',
  'Assunto':        'bg-emerald-100 text-emerald-800',
  'Scartato':       'bg-red-100 text-red-700',
};

const SEGNAPOSTO = ['{{nome}}', '{{cognome}}', '{{email}}', '{{telefono}}', '{{ruolo_candidato}}', '{{posizione}}'];

const FORM_VUOTO = { fase: 'Nuovo', nome: '', oggetto: '', corpo: '' };

function ModaleForm({ modello, onSalva, onChiudi, conteggioPerFase }) {
  const modifica = !!modello;
  const [form, setForm]     = useState(modello ?? FORM_VUOTO);
  const [errore, setErrore] = useState(null);
  const [invio, setInvio]   = useState(false);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function inserisciSegnaposto(tag) {
    const el = document.getElementById('corpo-email');
    if (!el) { set('corpo', form.corpo + tag); return; }
    const s = el.selectionStart, e = el.selectionEnd;
    const nuovo = form.corpo.slice(0, s) + tag + form.corpo.slice(e);
    set('corpo', nuovo);
    setTimeout(() => { el.focus(); el.setSelectionRange(s + tag.length, s + tag.length); }, 0);
  }

  async function salva(ev) {
    ev.preventDefault();
    if (!form.nome.trim()) return setErrore('Il nome del modello è obbligatorio');
    if (!form.corpo.trim()) return setErrore('Il corpo del messaggio è obbligatorio');
    setInvio(true); setErrore(null);
    try {
      await onSalva(form);
      onChiudi();
    } catch (err) {
      setErrore(err.message);
    } finally {
      setInvio(false);
    }
  }

  const limiteRaggiunto = !modifica && (conteggioPerFase[form.fase] ?? 0) >= MAX_PER_FASE;

  const cls = "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
          <h3 className="text-base font-bold text-slate-800">
            {modifica ? 'Modifica modello email' : 'Nuovo modello email'}
          </h3>
          <button onClick={onChiudi} className="text-slate-400 hover:text-slate-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={salva} className="overflow-y-auto flex-1 px-7 py-6 flex flex-col gap-5">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Fase *</label>
              <select value={form.fase} onChange={e => set('fase', e.target.value)} className={cls}>
                {FASI.map(f => (
                  <option key={f} value={f} disabled={!modifica && (conteggioPerFase[f] ?? 0) >= MAX_PER_FASE}>
                    {f}{!modifica && (conteggioPerFase[f] ?? 0) >= MAX_PER_FASE ? ' (pieno)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Nome modello *</label>
              <input type="text" value={form.nome} onChange={e => set('nome', e.target.value)}
                placeholder="es. Invito colloquio" className={cls} autoFocus />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Oggetto email</label>
            <input type="text" value={form.oggetto} onChange={e => set('oggetto', e.target.value)}
              placeholder="es. Candidatura {{cognome}} — {{posizione}}" className={cls} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Corpo messaggio *</label>
              <div className="flex flex-wrap gap-1.5">
                {SEGNAPOSTO.map(tag => (
                  <button key={tag} type="button" onClick={() => inserisciSegnaposto(tag)}
                    className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 transition">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              id="corpo-email"
              rows={10}
              value={form.corpo}
              onChange={e => set('corpo', e.target.value)}
              placeholder={"Gentile {{nome}} {{cognome}},\n\nLa ringraziamo per aver candidato per la posizione {{posizione}}…"}
              className={`${cls} resize-y font-mono text-sm leading-relaxed`}
            />
            <p className="text-xs text-slate-400 mt-2">
              Clicca un segnaposto per inserirlo nel punto del cursore. I segnaposto vengono sostituiti automaticamente quando usi il modello.
            </p>
          </div>

          {limiteRaggiunto && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl">
              Hai raggiunto il limite di {MAX_PER_FASE} modelli per la fase "{form.fase}". Seleziona un'altra fase o elimina un modello esistente.
            </p>
          )}

          {errore && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{errore}</p>}

          <div className="flex gap-3 justify-end pt-1 pb-1">
            <button type="button" onClick={onChiudi} className="text-sm font-medium text-slate-600 px-5 py-2.5 rounded-xl hover:bg-slate-100 transition">
              Annulla
            </button>
            <button type="submit" disabled={invio || limiteRaggiunto}
              className="text-sm font-semibold text-white px-6 py-2.5 rounded-xl transition disabled:opacity-60 shadow-sm"
              style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
              {invio ? 'Salvataggio…' : modifica ? 'Salva modifiche' : 'Crea modello'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PaginaEmail() {
  const [modelli, setModelli]           = useState([]);
  const [caricamento, setCaricamento]   = useState(true);
  const [errore, setErrore]             = useState(null);
  const [faseAttiva, setFaseAttiva]     = useState('Nuovo');
  const [mostraForm, setMostraForm]     = useState(false);
  const [inModifica, setInModifica]     = useState(null);
  const [daEliminare, setDaEliminare]   = useState(null);
  const [eliminando, setEliminando]     = useState(false);

  const carica = useCallback(async () => {
    try {
      setCaricamento(true); setErrore(null);
      setModelli(await getEmailTemplates());
    } catch (err) { setErrore(err.message); }
    finally { setCaricamento(false); }
  }, []);

  useEffect(() => { carica(); }, [carica]);

  const conteggioPerFase = Object.fromEntries(
    FASI.map(f => [f, modelli.filter(m => m.fase === f).length])
  );

  const modelliVista = modelli.filter(m => m.fase === faseAttiva);

  async function salva(form) {
    if (inModifica) {
      const aggiornato = await aggiornaEmailTemplate(inModifica.id, form);
      setModelli(prev => prev.map(m => m.id === aggiornato.id ? aggiornato : m));
    } else {
      const nuovo = await creaEmailTemplate(form);
      setModelli(prev => [...prev, nuovo]);
    }
  }

  async function confermaElimina() {
    if (!daEliminare) return;
    setEliminando(true);
    try {
      await eliminaEmailTemplate(daEliminare.id);
      setModelli(prev => prev.filter(m => m.id !== daEliminare.id));
      setDaEliminare(null);
    } catch { /* ignora */ }
    finally { setEliminando(false); }
  }

  if (caricamento) return <div className="flex items-center justify-center h-64 text-slate-500">Caricamento modelli…</div>;
  if (errore) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-600">
      <p>{errore}</p>
      <button onClick={carica} className="text-sm bg-red-100 px-4 py-2 rounded-xl hover:bg-red-200 transition">Riprova</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-4xl">

      {/* Tab fasi */}
      <div className="flex items-center gap-2 flex-wrap">
        {FASI.map(f => {
          const n = conteggioPerFase[f] ?? 0;
          const attiva = faseAttiva === f;
          return (
            <button key={f} onClick={() => setFaseAttiva(f)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                attiva
                  ? 'text-white shadow-sm'
                  : 'text-slate-600 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
              }`}
              style={attiva ? { background: 'linear-gradient(135deg,#6366f1,#4f46e5)' } : {}}>
              {f}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${attiva ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {n}/{MAX_PER_FASE}
              </span>
            </button>
          );
        })}
        <button
          onClick={() => { setInModifica(null); setMostraForm(true); }}
          className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-white px-5 py-2.5 rounded-xl shadow-sm transition"
          style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Nuovo modello
        </button>
      </div>

      {/* Intestazione fase corrente */}
      <div className="flex items-center gap-3">
        <span className={`text-xs font-bold px-3 py-1.5 rounded ${BADGE_FASE[faseAttiva]}`}>{faseAttiva}</span>
        <p className="text-sm text-slate-500">
          {modelliVista.length === 0
            ? 'Nessun modello per questa fase'
            : `${modelliVista.length} modell${modelliVista.length === 1 ? 'o' : 'i'}`}
        </p>
      </div>

      {/* Lista modelli */}
      {modelliVista.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <svg className="w-10 h-10 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          <p className="text-slate-400 text-sm mb-4">Nessun modello per la fase <strong>{faseAttiva}</strong></p>
          <button
            onClick={() => { setInModifica(null); setMostraForm(true); }}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition">
            + Crea il primo modello
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {modelliVista.map(m => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-start justify-between gap-4 px-7 py-5 border-b border-slate-100">
                <div className="min-w-0">
                  <p className="text-base font-bold text-slate-800">{m.nome}</p>
                  {m.oggetto && (
                    <p className="text-sm text-slate-500 mt-1 truncate">
                      <span className="font-medium text-slate-400 mr-1">Oggetto:</span>{m.oggetto}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => { setInModifica(m); setMostraForm(true); }}
                    className="text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-xl hover:bg-indigo-100 transition">
                    Modifica
                  </button>
                  <button onClick={() => setDaEliminare(m)}
                    className="text-sm font-semibold text-red-500 bg-red-50 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-100 transition">
                    Elimina
                  </button>
                </div>
              </div>
              <div className="px-7 py-5">
                <pre className="text-sm text-slate-700 font-sans whitespace-pre-wrap leading-relaxed line-clamp-5">
                  {m.corpo}
                </pre>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {SEGNAPOSTO.filter(t => m.corpo.includes(t) || m.oggetto?.includes(t)).map(t => (
                    <span key={t} className="text-xs font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale form crea/modifica */}
      {mostraForm && (
        <ModaleForm
          modello={inModifica}
          conteggioPerFase={conteggioPerFase}
          onSalva={salva}
          onChiudi={() => { setMostraForm(false); setInModifica(null); }}
        />
      )}

      {/* Modale conferma elimina */}
      {daEliminare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-7 w-full max-w-sm mx-4">
            <h3 className="text-base font-bold text-slate-800 mb-2">Elimina modello</h3>
            <p className="text-sm text-slate-600 mb-6">
              Vuoi eliminare il modello <span className="font-semibold">"{daEliminare.nome}"</span>? L'operazione è irreversibile.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDaEliminare(null)} className="text-sm font-medium text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition">Annulla</button>
              <button onClick={confermaElimina} disabled={eliminando}
                className="text-sm font-semibold bg-red-600 text-white px-4 py-2.5 rounded-xl hover:bg-red-700 transition disabled:opacity-60">
                {eliminando ? 'Eliminazione…' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
