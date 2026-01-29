import { supabase } from '../src/lib/supabase.js';
import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function restoreFromBackup() {
  const backupFile = process.argv[2];

  if (!backupFile) {
    console.error('❌ Please provide a backup file path');
    console.log('\nUsage: node scripts/restoreFromBackup.js backups/content-backup-2026-01-28.json');
    rl.close();
    process.exit(1);
  }

  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Backup file not found: ${backupFile}`);
    rl.close();
    process.exit(1);
  }

  console.log('⚠️  WARNING: This will DELETE all existing data and restore from backup');
  const answer = await question('Are you sure you want to continue? (yes/no): ');

  if (answer.toLowerCase() !== 'yes') {
    console.log('Restore cancelled');
    rl.close();
    process.exit(0);
  }

  console.log('\n📥 Loading backup...');
  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

  console.log(`\n📦 Backup Details:`);
  console.log(`  Date: ${backup.date}`);
  console.log(`  Articles: ${backup.stats.articleCount}`);
  console.log(`  Destinations: ${backup.stats.destinationCount}`);

  console.log('\n🗑️  Deleting existing data...');

  // Delete all current data
  const { error: deleteArticlesError } = await supabase
    .from('articles')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteArticlesError) {
    console.error('Error deleting articles:', deleteArticlesError);
  }

  const { error: deleteDestsError } = await supabase
    .from('destinations')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteDestsError) {
    console.error('Error deleting destinations:', deleteDestsError);
  }

  console.log('✅ Existing data deleted\n');

  console.log('📦 Restoring from backup...');

  let restored = 0;
  let errors = 0;

  // Restore articles
  for (const [slug, article] of Object.entries(backup.articles)) {
    try {
      const dbArticle = {
        slug: article.slug,
        title: article.title,
        subtitle: article.subtitle,
        category: article.category,
        tags: article.tags,
        issue: article.issue,
        author_name: article.author.name,
        author_role: article.author.role,
        author_bio: article.author.bio,
        author_avatar_url: article.author.avatar,
        read_time: article.readTime,
        location_name: article.location.name,
        location_coordinates: `(${article.location.coordinates[0]}, ${article.location.coordinates[1]})`,
        hero_image_url: article.heroImage || '/placeholder.jpg',
        content: article.content,
        plates: article.plates,
        map_data: article.mapData,
        status: 'published',
        published_date: article.publishedDate,
        is_featured: article.featured || true
      };

      await supabase.from('articles').insert(dbArticle);
      console.log(`  ✅ Restored: ${article.title}`);
      restored++;
    } catch (error) {
      console.error(`  ❌ Error restoring ${slug}:`, error.message);
      errors++;
    }
  }

  // Restore destinations
  for (const [slug, destination] of Object.entries(backup.destinations)) {
    try {
      const dbDestination = {
        slug: destination.slug,
        name: destination.name,
        tagline: destination.tagline,
        description: destination.description,
        hero_image_url: destination.heroImage,
        coordinates: `(${destination.coordinates[0]}, ${destination.coordinates[1]})`,
        region: destination.region,
        highlights: destination.highlights,
        stats: destination.stats,
        events: destination.events,
        things_to_do: destination.thingsToDo,
        status: 'published'
      };

      await supabase.from('destinations').insert(dbDestination);
      console.log(`  ✅ Restored: ${destination.name}`);
      restored++;
    } catch (error) {
      console.error(`  ❌ Error restoring ${slug}:`, error.message);
      errors++;
    }
  }

  console.log('\n📊 Restore Summary:');
  console.log(`✅ Restored: ${restored} items`);
  console.log(`❌ Errors: ${errors} items`);
  console.log('\n✨ Restore complete!');

  rl.close();
}

restoreFromBackup().catch((error) => {
  console.error('\n💥 Restore failed:', error);
  rl.close();
  process.exit(1);
});
