import { useState, useCallback } from 'react';

/**
 * Hook per fetch API con gestione centralizzata di caricamento ed errori.
 * Aggiunge automaticamente il JWT dall'auth context se disponibile.
 */
export function useApi() {
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore]           = useState(null);

  const chiama = useCallback(async (fn, { onSuccesso, onErrore } = {}) => {
    setCaricamento(true);
    setErrore(null);
    try {
      const risultato = await fn();
      onSuccesso?.(risultato);
      return risultato;
    } catch (err) {
      const msg = err.message || 'Errore sconosciuto';
      setErrore(msg);
      onErrore?.(msg);
      throw err;
    } finally {
      setCaricamento(false);
    }
  }, []);

  return { caricamento, errore, chiama, setErrore };
}
