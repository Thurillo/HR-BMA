CREATE TABLE `email_templates` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `fase`       ENUM('Nuovo','1° Colloquio','2° Colloquio','Offerta','Assunto','Scartato') NOT NULL,
  `nome`       VARCHAR(100) NOT NULL,
  `oggetto`    VARCHAR(255) NOT NULL DEFAULT '',
  `corpo`      TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_fase` (`fase`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
