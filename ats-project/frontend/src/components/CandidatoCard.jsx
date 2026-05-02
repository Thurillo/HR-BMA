import { Draggable } from '@hello-pangea/dnd';

export default function CandidatoCard({ candidato, indice, onClick }) {
  return (
    <Draggable draggableId={String(candidato.id)} index={indice}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(candidato)}
          className={`bg-white rounded-xl p-4 shadow-sm border border-slate-200 cursor-pointer
            hover:shadow-md hover:border-blue-300 transition-all select-none
            ${snapshot.isDragging ? 'shadow-lg rotate-1 border-blue-400' : ''}`}
        >
          <p className="font-semibold text-slate-800 text-sm leading-snug">
            {candidato.first_name} {candidato.last_name}
          </p>
          {candidato.current_role && (
            <p className="text-xs text-slate-500 mt-1 truncate">{candidato.current_role}</p>
          )}
          {candidato.macro_sector && (
            <span className="inline-block mt-2 text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 font-medium">
              {candidato.macro_sector}
            </span>
          )}
        </div>
      )}
    </Draggable>
  );
}
