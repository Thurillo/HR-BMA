import { useState, useEffect, useCallback } from 'react';
import { getPosizioni, creaPosizione } from '../api/posizioni';
import ModalePosizioneDettaglio from './ModalePosizioneDettaglio';

const BADGE_STATO = {
  'Aperta':   'bg-green-100 text-green-700',
  'In pausa': 'bg-amber-100 text-amber-700',
  'Chiusa':   'bg-slate-100 text-slate-500',
};

const STATI_POSIZIONE = ['Aperta', 'In pausa', 'Chiusa'];

export default function PaginaPosizioni() {
  const [posizioni, setPosizioni] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(null);
  const [mostraForm, setMostraForm] = useState(false);
  const [posizioneSelezionata, setPosizioneSelezionata] = useState(null);
  const [form, setForm] = useState({ titolo: '', descrizione: '', stato: 'Aperta' });
  const [invio, setInvio] = useState(false);
  const [erroreForm, setErroreForm] = useState(null);

  const carica = useCallback(async () => {
    try {
      setCaricamento(true);
      setErrore(null);
      setPosizioni(await getPosizioni());
    } catch (err) {
      setErrore(err.message);
    } finally {
      setCaricamento(false);
    }
  }, []);

  useEffect(() => { carica(); }, [carica]);

  async function crea(e) {
    e.preventDefault();
    if (!form.titolo.trim()) return setErroreForm('Il titolo è obbligatorio');
    setInvio(true);
    setErroreForm(null);
    try {
      const nuova = await creaPosizione(form);
      setPosizioni(prev => [nuova, ...prev]);
      setForm({ titolo: '', descrizione: '', stato: 'Aperta' });
      setMostraForm(false);
    } catch (err) {
      setErroreForm(err.message);
    } finally {
      setInvio(false);
    }
  }

  if (caricamento) return (
    <div className="flex items-center justify-center h-64 text-slate-500">Caricamento posizioni…</div>
  );

  if (errore) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-600">
      <p>Errore: {errore}</p>
      <button onClick={carica} className="text-sm bg-red-100 px-4 py-1.5 rounded-lg hover:bg-red-200 transition">Riprova</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header pagina */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Posizioni aperte</h2>
          <p className="text-sm text-slate-500 mt-0.5">{posizioni.length} posizione{posizioni.length !== 1 ? 'i' : 'e'} totali</p>
        </div>
        <button
          onClick={() => { setMostraForm(true); setErroreForm(null); }}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Nuova posizione
        </button>
      </div>

      {/* Form nuova posizione */}
      {mostraForm && (
        <form onSubmit={crea} className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Nuova posizione lavorativa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Titolo *</label>
              <input
                type="text"
                value={form.titolo}
                onChange={e => setForm(p => ({ ...p, titolo: e.target.value }))}
                placeholder="es. Senior Backend Developer"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoFocus
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Descrizione</label>
              <textarea
                rows={3}
                value={form.descrizione}
                onChange={e => setForm(p => ({ ...p, descrizione: e.target.value }))}
                placeholder="Descrizione della posizione, requisiti, note…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Stato</label>
              <select
                value={form.stato}
                onChange={e => setForm(p => ({ ...p, stato: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {STATI_POSIZIONE.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {erroreForm && (
            <p className="mt-3 text-sm text-red-600">{erroreForm}</p>
          )}
          <div className="flex gap-2 mt-4 justify-end">
            <button type="button" onClick={() => setMostraForm(false)}
              className="text-sm text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-100 transition">
              Annulla
            </button>
            <button type="submit" disabled={invio}
              className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60">
              {invio ? 'Creazione…' : 'Crea posizione'}
            </button>
          </div>
        </form>
      )}

      {/* Lista posizioni */}
      {posizioni.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-9-4h2a2 2 0 012 2v2H9V5a2 2 0 012-2z"/>
          </svg>
          <p className="text-sm">Nessuna posizione ancora creata.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {posizioni.map(pos => (
            <button
              key={pos.id}
              onClick={() => setPosizioneSelezionata(pos)}
              className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-800 leading-snug">{pos.titolo}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${BADGE_STATO[pos.stato]}`}>
                  {pos.stato}
                </span>
              </div>
              {pos.descrizione && (
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{pos.descrizione}</p>
              )}
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                  {pos.num_candidati} candidat{pos.num_candidati === 1 ? 'o' : 'i'}
                </span>
                <span>{new Date(pos.created_at).toLocaleDateString('it-IT')}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modale dettaglio */}
      {posizioneSelezionata && (
        <ModalePosizioneDettaglio
          posizione={posizioneSelezionata}
          onChiudi={() => setPosizioneSelezionata(null)}
          onAggiornata={(aggiornata) => {
            setPosizioni(prev => prev.map(p => p.id === aggiornata.id ? { ...aggiornata, num_candidati: p.num_candidati } : p));
            setPosizioneSelezionata(aggiornata);
          }}
          onEliminata={(id) => {
            setPosizioni(prev => prev.filter(p => p.id !== id));
          }}
        />
      )}
    </div>
  );
}
