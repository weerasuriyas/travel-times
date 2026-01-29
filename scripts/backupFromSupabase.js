import { supabase } from '../src/lib/supabase.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function backupFromSupabase() {
  console.log('📥 Downloading all content from Supabase...\n');

  // Fetch all articles
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('*')
    .order('created_at');

  if (articlesError) {
    console.error('❌ Error fetching articles:', articlesError.message);
    process.exit(1);
  }

  // Fetch all destinations
  const { data: destinations, error: destsError } = await supabase
    .from('destinations')
    .select('*')
    .order('created_at');

  if (destsError) {
    console.error('❌ Error fetching destinations:', destsError.message);
    process.exit(1);
  }

  // Fetch all accommodations
  const { data: accommodations, error: accomError } = await supabase
    .from('accommodations')
    .select('*');

  if (accomError) {
    console.error('⚠️  Warning: Could not fetch accommodations:', accomError.message);
  }

  // Fetch all restaurants
  const { data: restaurants, error: restError } = await supabase
    .from('restaurants')
    .select('*');

  if (restError) {
    console.error('⚠️  Warning: Could not fetch restaurants:', restError.message);
  }

  const backup = {
    date: new Date().toISOString(),
    type: 'supabase-backup',
    articles,
    destinations,
    accommodations: accommodations || [],
    restaurants: restaurants || [],
    stats: {
      articleCount: articles.length,
      destinationCount: destinations.length,
      accommodationCount: accommodations?.length || 0,
      restaurantCount: restaurants?.length || 0
    }
  };

  // Create backups directory
  const backupDir = join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `supabase-backup-${timestamp}.json`;
  const filepath = join(backupDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

  console.log('✅ Backup saved successfully!');
  console.log(`📁 File: ${filename}`);
  console.log(`📊 Stats:`);
  console.log(`   - Articles: ${backup.stats.articleCount}`);
  console.log(`   - Destinations: ${backup.stats.destinationCount}`);
  console.log(`   - Accommodations: ${backup.stats.accommodationCount}`);
  console.log(`   - Restaurants: ${backup.stats.restaurantCount}`);
  console.log(`\n💾 You can restore from this backup using:`);
  console.log(`   node scripts/restoreFromBackup.js backups/${filename}`);
}

backupFromSupabase().catch((error) => {
  console.error('💥 Backup failed:', error);
  process.exit(1);
});
