-- ATS HR Custom — Schema Database
-- Eseguire sul database: ats_database

CREATE TABLE IF NOT EXISTS `candidates` (
  `id`                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `first_name`        VARCHAR(100)    NOT NULL,
  `last_name`         VARCHAR(100)    NOT NULL,
  `email`             VARCHAR(255)        NULL,
  `phone`             VARCHAR(50)         NULL,
  `location`          VARCHAR(255)        NULL,
  `current_role`      VARCHAR(255)        NULL,
  `years_experience`  DECIMAL(4,1)        NULL,
  `max_education`     VARCHAR(255)        NULL,
  `executive_summary` TEXT                NULL,
  `file_path_smb`     VARCHAR(500)        NULL,
  -- Logica Kanban
  `status`            ENUM(
                        'Nuovo',
                        '1° Colloquio',
                        '2° Colloquio',
                        'Offerta',
                        'Assunto',
                        'Scartato'
                      ) NOT NULL DEFAULT 'Nuovo',
  `macro_sector`      VARCHAR(150)        NULL,
  -- Scalabilità: dati extra inviati da n8n
  `extra_data`        JSON                NULL,
  `created_at`        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`),
  INDEX `idx_status`       (`status`),
  INDEX `idx_macro_sector` (`macro_sector`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
