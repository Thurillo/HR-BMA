-- Aggiunge status per-posizione alla tabella position_candidates
-- Eseguire sul database: ats_database

ALTER TABLE `position_candidates`
  ADD COLUMN `status` ENUM(
    'Nuovo',
    '1° Colloquio',
    '2° Colloquio',
    'Offerta',
    'Assunto',
    'Scartato'
  ) NOT NULL DEFAULT 'Nuovo' AFTER `candidate_id`;
