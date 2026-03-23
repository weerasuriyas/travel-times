-- 2026-03-23: Add body_font column to articles
-- Run once in Hostinger phpMyAdmin.

ALTER TABLE articles
  ADD COLUMN body_font VARCHAR(50) DEFAULT 'serif' AFTER subtitle_style;
