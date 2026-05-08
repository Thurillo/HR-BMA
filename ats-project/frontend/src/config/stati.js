// Fonte unica di verità per stati e mapping colori — importare da qui, non ridichiarare
export const STATI_CANDIDATO = ['Nuovo', '1° Colloquio', '2° Colloquio', 'Offerta', 'Assunto', 'Scartato'];
export const STATI_POSIZIONE  = ['Aperta', 'In pausa', 'Chiusa'];

export const DOT_STATUS = {
  'Nuovo':          'bg-slate-400',
  '1° Colloquio':   'bg-blue-500',
  '2° Colloquio':   'bg-indigo-500',
  'Offerta':        'bg-amber-500',
  'Assunto':        'bg-emerald-500',
  'Scartato':       'bg-red-500',
};

export const LABEL_STATUS = {
  'Nuovo':          'text-slate-600',
  '1° Colloquio':   'text-blue-700',
  '2° Colloquio':   'text-indigo-700',
  'Offerta':        'text-amber-700',
  'Assunto':        'text-emerald-700',
  'Scartato':       'text-red-600',
};

export const BADGE_STATUS = {
  'Nuovo':          { bg: 'bg-slate-100',   text: 'text-slate-700',   dot: 'bg-slate-400'  },
  '1° Colloquio':   { bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-500'   },
  '2° Colloquio':   { bg: 'bg-indigo-100',  text: 'text-indigo-800',  dot: 'bg-indigo-500' },
  'Offerta':        { bg: 'bg-amber-100',   text: 'text-amber-800',   dot: 'bg-amber-500'  },
  'Assunto':        { bg: 'bg-green-100',   text: 'text-green-800',   dot: 'bg-green-500'  },
  'Scartato':       { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500'    },
};

export const BADGE_KANBAN = {
  'Nuovo':          'bg-slate-100 text-slate-600 border-slate-200',
  '1° Colloquio':   'bg-blue-50 text-blue-700 border-blue-200',
  '2° Colloquio':   'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Offerta':        'bg-amber-50 text-amber-700 border-amber-200',
  'Assunto':        'bg-green-50 text-green-700 border-green-200',
  'Scartato':       'bg-red-50 text-red-600 border-red-200',
};

export const COL_HEADER_KANBAN = {
  'Nuovo':          'bg-slate-50 border-slate-200 text-slate-600',
  '1° Colloquio':   'bg-blue-50 border-blue-200 text-blue-700',
  '2° Colloquio':   'bg-indigo-50 border-indigo-200 text-indigo-700',
  'Offerta':        'bg-amber-50 border-amber-200 text-amber-700',
  'Assunto':        'bg-green-50 border-green-200 text-green-700',
  'Scartato':       'bg-red-50 border-red-200 text-red-600',
};
