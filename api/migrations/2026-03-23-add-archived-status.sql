-- 2026-03-23: Add 'archived' to articles status ENUM
-- Run once in Hostinger phpMyAdmin.
-- Articles that were previously archived may have been stored as '' (empty string)
-- due to the missing ENUM value. After running this migration, manually review
-- and update any such rows: UPDATE articles SET status='archived' WHERE status='';

ALTER TABLE articles
  MODIFY COLUMN status ENUM('draft','published','archived') DEFAULT 'draft';
