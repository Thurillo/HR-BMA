-- Aggiunge il campo note a candidates e positions
-- Eseguire sul database: ats_database

ALTER TABLE `candidates`
  ADD COLUMN `note` TEXT NULL AFTER `extra_data`;

ALTER TABLE `positions`
  ADD COLUMN `note` TEXT NULL AFTER `descrizione`;
