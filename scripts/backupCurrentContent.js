import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import content
const articlesModule = await import('../src/data/articles.js');
const destinationsModule = await import('../src/data/destinations.js');

const articles = articlesModule.articles;
const destinations = destinationsModule.destinations;

// Create backups directory
const backupDir = join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Create backup with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = {
  date: new Date().toISOString(),
  version: '1.0',
  type: 'pre-migration-backup',
  articles: articles,
  destinations: destinations,
  stats: {
    articleCount: Object.keys(articles).length,
    destinationCount: Object.keys(destinations).length
  }
};

const filename = `content-backup-${timestamp}.json`;
const filepath = join(backupDir, filename);

fs.writeFileSync(
  filepath,
  JSON.stringify(backup, null, 2)
);

console.log('✅ Backup created successfully!');
console.log(`📁 File: ${filename}`);
console.log(`📊 Articles: ${backup.stats.articleCount}`);
console.log(`📍 Destinations: ${backup.stats.destinationCount}`);
console.log(`\n💾 You can restore from this backup anytime using:`);
console.log(`   node scripts/restoreFromBackup.js backups/${filename}`);
