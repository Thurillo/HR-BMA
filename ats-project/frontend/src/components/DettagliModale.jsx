const ETICHETTE = {
  first_name: 'Nome', last_name: 'Cognome', email: 'Email', phone: 'Telefono',
  location: 'Località', current_role: 'Ruolo attuale', years_experience: 'Anni esperienza',
  max_education: 'Titolo di studio', executive_summary: 'Sintesi', file_path_smb: 'Percorso file',
  linkedin_url: 'LinkedIn', portfolio_url: 'Portfolio', seniority: 'Seniority',
  settore_prevalente: 'Settore prevalente', hard_skills: 'Hard Skills', soft_skills: 'Soft Skills',
  ambito_studi: 'Ambito studi', universita: 'Università', certificazioni: 'Certificazioni',
  preavviso: 'Preavviso', ral_indicata: 'RAL indicata', modalita_lavoro: 'Modalità lavoro',
  macro_sector: 'Macro settore', status: 'Stato',
};

const CAMPI_NASCOSTI = new Set(['id', 'created_at', 'updated_at', 'extra_data']);

function formattaValore(chiave, valore) {
  if (valore === null || valore === undefined || valore === '') return null;
  if (Array.isArray(valore)) return valore.join(', ');
  if (typeof valore === 'object') return JSON.stringify(valore);
  if ((chiave === 'linkedin_url' || chiave === 'portfolio_url') && String(valore).startsWith('http')) {
    return <a href={valore} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">{valore}</a>;
  }
  return String(valore);
}

export default function DettagliModale({ candidato, onChiudi }) {
  if (!candidato) return null;

  const campiExtra = candidato.extra_data
    ? (typeof candidato.extra_data === 'string' ? JSON.parse(candidato.extra_data) : candidato.extra_data)
    : {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onChiudi()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Intestazione */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {candidato.first_name} {candidato.last_name}
            </h2>
            <p className="text-sm text-slate-500">{candidato.current_role || '—'}</p>
          </div>
          <button
            onClick={onChiudi}
            className="text-slate-400 hover:text-slate-700 text-2xl leading-none"
            aria-label="Chiudi"
          >
            &times;
          </button>
        </div>

        {/* Corpo scrollabile */}
        <div className="overflow-y-auto px-6 py-4 space-y-4">
          {/* Campi standard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {Object.entries(candidato).map(([chiave, valore]) => {
              if (CAMPI_NASCOSTI.has(chiave)) return null;
              if (chiave === 'first_name' || chiave === 'last_name') return null;
              const etichetta = ETICHETTE[chiave] || chiave;
              const testo = formattaValore(chiave, valore);
              if (testo === null) return null;
              const isLarga = chiave === 'executive_summary';
              return (
                <div key={chiave} className={isLarga ? 'sm:col-span-2' : ''}>
                  <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{etichetta}</dt>
                  <dd className="mt-0.5 text-sm text-slate-700 break-words">{testo}</dd>
                </div>
              );
            })}
          </div>

          {/* Campi extra da n8n */}
          {Object.keys(campiExtra).length > 0 && (
            <div className="border-t border-dashed border-slate-200 pt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Dati aggiuntivi (n8n)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {Object.entries(campiExtra).map(([chiave, valore]) => {
                  const testo = formattaValore(chiave, valore);
                  if (testo === null) return null;
                  return (
                    <div key={chiave}>
                      <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{chiave}</dt>
                      <dd className="mt-0.5 text-sm text-slate-700 break-words">{testo}</dd>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
