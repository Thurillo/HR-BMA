import { Droppable } from '@hello-pangea/dnd';
import CandidatoCard from './CandidatoCard';

const COLORI_COLONNA = {
  'Nuovo':          'bg-slate-100 border-slate-300',
  '1° Colloquio':   'bg-blue-50 border-blue-300',
  '2° Colloquio':   'bg-violet-50 border-violet-300',
  'Offerta':        'bg-amber-50 border-amber-300',
  'Assunto':        'bg-green-50 border-green-300',
  'Scartato':       'bg-red-50 border-red-300',
};

const COLORI_TITOLO = {
  'Nuovo':          'text-slate-600',
  '1° Colloquio':   'text-blue-700',
  '2° Colloquio':   'text-violet-700',
  'Offerta':        'text-amber-700',
  'Assunto':        'text-green-700',
  'Scartato':       'text-red-600',
};

export default function KanbanColonna({ stato, candidati, onCardClick }) {
  return (
    <div className={`flex flex-col rounded-2xl border ${COLORI_COLONNA[stato]} min-w-[220px] w-full`}>
      {/* Intestazione colonna */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
        <span className={`text-sm font-bold ${COLORI_TITOLO[stato]}`}>{stato}</span>
        <span className="text-xs font-semibold text-slate-400 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
          {candidati.length}
        </span>
      </div>

      {/* Area droppable */}
      <Droppable droppableId={stato}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-3 p-3 flex-1 min-h-[120px] transition-colors rounded-b-2xl
              ${snapshot.isDraggingOver ? 'bg-white/60' : ''}`}
          >
            {candidati.map((c, i) => (
              <CandidatoCard
                key={c.id}
                candidato={c}
                indice={i}
                onClick={onCardClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
