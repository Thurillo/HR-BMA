import { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import KanbanColonna from './KanbanColonna';
import DettagliModale from './DettagliModale';
import { getCandidati, aggiornaStatus } from '../api/candidati';
import { STATI_CANDIDATO as STATI } from '../config/stati';

export default function KanbanBoard() {
  const [candidati, setCandidati] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState(null);
  const [candidatoSelezionato, setCandidatoSelezionato] = useState(null);

  const caricaCandidati = useCallback(async () => {
    try {
      setCaricamento(true);
      setErrore(null);
      const dati = await getCandidati();
      setCandidati(Array.isArray(dati) ? dati : (dati.dati ?? []));
    } catch (err) {
      setErrore(err.message);
    } finally {
      setCaricamento(false);
    }
  }, []);

  useEffect(() => { caricaCandidati(); }, [caricaCandidati]);

  async function onDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;

    const nuovoStatus = destination.droppableId;
    const id = parseInt(draggableId, 10);

    // Aggiornamento ottimistico
    setCandidati(prev =>
      prev.map(c => c.id === id ? { ...c, status: nuovoStatus } : c)
    );

    try {
      await aggiornaStatus(id, nuovoStatus);
    } catch {
      // Rollback in caso di errore
      setCandidati(prev =>
        prev.map(c => c.id === id ? { ...c, status: source.droppableId } : c)
      );
    }
  }

  if (caricamento) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      Caricamento candidati…
    </div>
  );

  if (errore) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-600">
      <p>Errore: {errore}</p>
      <button onClick={caricaCandidati} className="text-sm bg-red-100 px-4 py-1.5 rounded-lg hover:bg-red-200 transition">
        Riprova
      </button>
    </div>
  );

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 items-start">
          {STATI.map(stato => (
            <KanbanColonna
              key={stato}
              stato={stato}
              candidati={candidati.filter(c => c.status === stato)}
              onCardClick={setCandidatoSelezionato}
            />
          ))}
        </div>
      </DragDropContext>

      {candidatoSelezionato && (
        <DettagliModale
          candidato={candidatoSelezionato}
          onChiudi={() => setCandidatoSelezionato(null)}
          onAggiornato={(aggiornato) => {
            setCandidati(prev => prev.map(c => c.id === aggiornato.id ? aggiornato : c));
            setCandidatoSelezionato(aggiornato);
          }}
        />
      )}
    </>
  );
}
