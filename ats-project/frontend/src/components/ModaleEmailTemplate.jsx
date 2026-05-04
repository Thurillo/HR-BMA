import { useState } from 'react';
import { applicaSegnaposto } from '../api/emailTemplates';

const BADGE_FASE = {
  'Nuovo':          'bg-slate-100 text-slate-700',
  '1° Colloquio':   'bg-blue-100 text-blue-800',
  '2° Colloquio':   'bg-indigo-100 text-indigo-800',
  'Offerta':        'bg-amber-100 text-amber-800',
  'Assunto':        'bg-emerald-100 text-emerald-800',
  'Scartato':       'bg-red-100 text-red-700',
};

export default function ModaleEmailTemplate({ fase, candidato, posizione, modelli, onChiudi }) {
  const [selezionato, setSelezionato] = useState(null);
  const [copiato, setCopiato]         = useState(false);

  const ctx = {
    nome:             candidato?.first_name ?? '',
    cognome:          candidato?.last_name  ?? '',
    email:            candidato?.email      ?? '',
    telefono:         candidato?.phone      ?? '',
    ruolo_candidato:  candidato?.current_role ?? '',
    posizione:        posizione?.titolo     ?? '',
  };

  const modelliDellaFase = modelli.filter(m => m.fase === fase);

  const oggettoCompilato = selezionato ? applicaSegnaposto(selezionato.oggetto ?? '', ctx) : '';
  const corpoCompilato   = selezionato ? applicaSegnaposto(selezionato.corpo, ctx) : '';

  async function copiaAppunti() {
    if (!selezionato) return;
    const testo = oggettoCompilato
      ? `Oggetto: ${oggettoCompilato}\n\n${corpoCompilato}`
      : corpoCompilato;
    await navigator.clipboard.writeText(testo);
    setCopiato(true);
    setTimeout(() => setCopiato(false), 2500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onChiudi()}>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0 bg-gradient-to-r from-indigo-50/50 to-violet-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">
                {candidato?.first_name} {candidato?.last_name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Modelli per la fase <span className={`font-semibold px-1.5 py-0.5 rounded ml-1 ${BADGE_FASE[fase]}`}>{fase}</span>
              </p>
            </div>
          </div>
          <button onClick={onChiudi}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Lista modelli */}
          <div className="w-52 shrink-0 border-r border-slate-100 overflow-y-auto py-2 bg-slate-50/30">
            {modelliDellaFase.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-slate-400">Nessun modello per questa fase.</p>
                <p className="text-xs text-slate-400 mt-2">Creane uno dalla sezione Email.</p>
              </div>
            ) : modelliDellaFase.map(m => (
              <button key={m.id} onClick={() => { setSelezionato(m); setCopiato(false); }}
                className={`w-full text-left px-4 py-3.5 text-sm transition-all ${
                  selezionato?.id === m.id
                    ? 'bg-white text-indigo-700 font-semibold border-r-2 border-indigo-500 shadow-sm'
                    : 'text-slate-600 hover:bg-white/70 font-medium'
                }`}>
                {m.nome}
              </button>
            ))}
          </div>

          {/* Anteprima */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            {!selezionato ? (
              <div className="flex items-center justify-center h-full text-slate-300">
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <svg className="w-7 h-7 opacity-50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400">Seleziona un modello</p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Destinatario</p>
                  <p className="text-sm text-slate-700">{candidato?.email || <span className="text-slate-300 italic">email non disponibile</span>}</p>
                </div>

                {oggettoCompilato && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Oggetto</p>
                    <p className="text-sm text-slate-800 font-medium">{oggettoCompilato}</p>
                  </div>
                )}

                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Messaggio</p>
                  <pre className="text-sm text-slate-700 font-sans whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                    {corpoCompilato}
                  </pre>
                </div>

                <button onClick={copiaAppunti}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    copiato
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'text-white shadow-sm hover:shadow-md'
                  }`}
                  style={copiato ? {} : { background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}>
                  {copiato ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      Copiato negli appunti!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                      Copia negli appunti
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
