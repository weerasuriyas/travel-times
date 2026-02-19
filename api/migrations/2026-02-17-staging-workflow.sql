-- 2026-02-17 staging workflow migration
-- Run once on existing Hostinger DBs that already have base schema.

CREATE TABLE staged_ingestions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  folder_name VARCHAR(255),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  subtitle TEXT,
  category VARCHAR(100),
  tags JSON,
  issue VARCHAR(255),
  author_name VARCHAR(255) DEFAULT 'Editorial Team',
  author_role VARCHAR(255),
  read_time INT,
  destination_slug VARCHAR(255),
  event_slug VARCHAR(255),
  body LONGTEXT NOT NULL,
  desired_status ENUM('draft','published') DEFAULT 'draft',
  review_status ENUM('pending','approved','rejected') DEFAULT 'pending',
  review_notes TEXT,
  submitted_by VARCHAR(255),
  approved_by VARCHAR(255),
  approved_at DATETIME,
  rejected_at DATETIME,
  final_article_id INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_review_status (review_status),
  INDEX idx_slug (slug),
  INDEX idx_final_article (final_article_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE staged_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  staging_id INT UNSIGNED NOT NULL,
  filename VARCHAR(500) NOT NULL,
  stored_filename VARCHAR(500) NOT NULL,
  storage_path VARCHAR(1000) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  alt_text VARCHAR(500),
  role ENUM('hero','gallery','section','author_avatar','cover') DEFAULT 'gallery',
  sort_order INT DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_staging (staging_id),
  FOREIGN KEY (staging_id) REFERENCES staged_ingestions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE articles
  ADD COLUMN staging_ingestion_id INT UNSIGNED NULL AFTER destination_id,
  ADD INDEX idx_staging_ingestion (staging_ingestion_id);

ALTER TABLE images
  ADD COLUMN staging_ingestion_id INT UNSIGNED NULL AFTER sort_order,
  ADD COLUMN staging_image_id INT UNSIGNED NULL AFTER staging_ingestion_id,
  ADD INDEX idx_staging_refs (staging_ingestion_id, staging_image_id);
