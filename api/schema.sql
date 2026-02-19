-- schema.sql — Run in Hostinger phpMyAdmin

CREATE TABLE destinations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(500),
  description LONGTEXT,
  hero_image VARCHAR(500),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  region VARCHAR(255),
  highlights JSON,
  stats JSON,
  status ENUM('draft','published') DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  destination_id INT UNSIGNED,
  slug VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(500) NOT NULL,
  type VARCHAR(255),
  month VARCHAR(100),
  season VARCHAR(100),
  duration VARCHAR(100),
  hero_image VARCHAR(500),
  description LONGTEXT,
  featured BOOLEAN DEFAULT FALSE,
  start_date DATE,
  end_date DATE,
  status ENUM('draft','published') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_dates (start_date, end_date),
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE articles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id INT UNSIGNED,
  destination_id INT UNSIGNED,
  staging_ingestion_id INT UNSIGNED,
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  subtitle TEXT,
  category VARCHAR(100),
  tags JSON,
  issue VARCHAR(255),
  author_name VARCHAR(255) DEFAULT 'Editorial Team',
  author_role VARCHAR(255),
  author_bio TEXT,
  author_avatar VARCHAR(500),
  read_time INT,
  body LONGTEXT NOT NULL,
  excerpt TEXT,
  cover_image VARCHAR(500),
  content JSON COMMENT 'sections, featured, introduction — structured content',
  status ENUM('draft','published') DEFAULT 'draft',
  published_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_status (status),
  INDEX idx_staging_ingestion (staging_ingestion_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(500) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  alt_text VARCHAR(500),
  role ENUM('hero','gallery','section','author_avatar','cover') DEFAULT 'gallery',
  entity_type ENUM('article','event','destination') NOT NULL,
  entity_id INT UNSIGNED,
  sort_order INT DEFAULT 0,
  staging_ingestion_id INT UNSIGNED,
  staging_image_id INT UNSIGNED,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_staging_refs (staging_ingestion_id, staging_image_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE accommodations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id INT UNSIGNED,
  destination_id INT UNSIGNED,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  price_range VARCHAR(100),
  rating DECIMAL(3,1),
  description TEXT,
  image VARCHAR(500),
  tags JSON,
  coordinates JSON,
  booking_url VARCHAR(1000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE things_to_do (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  destination_id INT UNSIGNED,
  event_id INT UNSIGNED,
  title VARCHAR(500) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  image VARCHAR(500),
  duration VARCHAR(100),
  price VARCHAR(100),
  tags JSON,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE SET NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
