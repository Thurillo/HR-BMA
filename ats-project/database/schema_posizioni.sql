-- ATS HR Custom — Posizioni Lavorative
-- Eseguire sul database: ats_database (dopo schema.sql)

CREATE TABLE IF NOT EXISTS `positions` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `titolo`      VARCHAR(255)    NOT NULL,
  `descrizione` TEXT                NULL,
  `stato`       ENUM('Aperta','In pausa','Chiusa') NOT NULL DEFAULT 'Aperta',
  `created_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_stato` (`stato`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `position_candidates` (
  `position_id`  INT UNSIGNED NOT NULL,
  `candidate_id` INT UNSIGNED NOT NULL,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`position_id`, `candidate_id`),
  FOREIGN KEY (`position_id`)  REFERENCES `positions`(`id`)  ON DELETE CASCADE,
  FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
