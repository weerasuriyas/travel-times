import { supabase } from '../src/lib/supabase.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import content
const articlesModule = await import('../src/data/articles.js');
const destinationsModule = await import('../src/data/destinations.js');

const articles = articlesModule.articles;
const destinations = destinationsModule.destinations;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function migrateWithSafety() {
  console.log('🔍 Starting safe migration to Supabase...\n');

  // 1. Check connection
  console.log('Testing Supabase connection...');
  const { data: testData, error: testError } = await supabase
    .from('articles')
    .select('count', { count: 'exact', head: true });

  if (testError) {
    console.error('❌ Cannot connect to Supabase:', testError.message);
    console.error('\nPlease ensure:');
    console.error('1. Your .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    console.error('2. The articles table exists in your Supabase database');
    console.error('3. You have run the database migrations');
    rl.close();
    process.exit(1);
  }

  console.log('✅ Connected to Supabase\n');

  // 2. Check if articles already exist
  const { count } = testData || { count: 0 };
  if (count > 0) {
    console.warn(`⚠️  Database already has ${count} articles`);
    const answer = await question('Continue? This may create duplicates. (yes/no): ');

    if (answer.toLowerCase() !== 'yes') {
      console.log('Migration cancelled');
      rl.close();
      process.exit(0);
    }
  }

  console.log('\n📦 Starting content migration...\n');

  // 3. Migrate articles
  const results = {
    articles: { success: [], errors: [] },
    destinations: { success: [], errors: [] },
    accommodations: { success: 0, errors: 0 },
    restaurants: { success: 0, errors: 0 }
  };

  // Migrate articles
  for (const [slug, article] of Object.entries(articles)) {
    try {
      console.log(`Migrating article: ${article.title}...`);

      // Transform article to database format
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

      const { data, error } = await supabase
        .from('articles')
        .insert(dbArticle)
        .select()
        .single();

      if (error) throw error;

      // Migrate accommodations for this article
      if (article.accommodations && article.accommodations.length > 0) {
        const accommodationsData = article.accommodations.map((acc, index) => ({
          article_id: data.id,
          name: acc.name,
          type: acc.type,
          price_range: acc.price,
          rating: acc.rating,
          description: acc.description,
          image_url: acc.image,
          tags: acc.tags,
          coordinates: `(${acc.coordinates[0]}, ${acc.coordinates[1]})`,
          display_order: index
        }));

        const { error: accomError } = await supabase
          .from('accommodations')
          .insert(accommodationsData);

        if (accomError) {
          console.warn(`  ⚠️  Could not migrate accommodations: ${accomError.message}`);
          results.accommodations.errors += accommodationsData.length;
        } else {
          results.accommodations.success += accommodationsData.length;
        }
      }

      // Migrate restaurants for this article
      if (article.restaurants && article.restaurants.length > 0) {
        const restaurantsData = article.restaurants.map((rest, index) => ({
          article_id: data.id,
          name: rest.name,
          type: rest.type,
          price_range: rest.price,
          rating: rest.rating,
          description: rest.description,
          image_url: rest.image,
          tags: rest.tags,
          coordinates: `(${rest.coordinates[0]}, ${rest.coordinates[1]})`,
          specialty: rest.specialty,
          hours: rest.hours,
          display_order: index
        }));

        const { error: restError } = await supabase
          .from('restaurants')
          .insert(restaurantsData);

        if (restError) {
          console.warn(`  ⚠️  Could not migrate restaurants: ${restError.message}`);
          results.restaurants.errors += restaurantsData.length;
        } else {
          results.restaurants.success += restaurantsData.length;
        }
      }

      results.articles.success.push(slug);
      console.log(`  ✅ Migrated: ${article.title}`);

    } catch (error) {
      console.error(`  ❌ Error migrating ${slug}:`, error.message);
      results.articles.errors.push({ slug, error: error.message });
    }
  }

  console.log('\n');

  // Migrate destinations
  for (const [slug, destination] of Object.entries(destinations)) {
    try {
      console.log(`Migrating destination: ${destination.name}...`);

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

      const { error } = await supabase
        .from('destinations')
        .insert(dbDestination)
        .select()
        .single();

      if (error) throw error;

      results.destinations.success.push(slug);
      console.log(`  ✅ Migrated: ${destination.name}`);

    } catch (error) {
      console.error(`  ❌ Error migrating ${slug}:`, error.message);
      results.destinations.errors.push({ slug, error: error.message });
    }
  }

  // 4. Save migration report
  const report = {
    date: new Date().toISOString(),
    articles: {
      success: results.articles.success.length,
      failed: results.articles.errors.length,
      details: results.articles
    },
    destinations: {
      success: results.destinations.success.length,
      failed: results.destinations.errors.length,
      details: results.destinations
    },
    accommodations: results.accommodations,
    restaurants: results.restaurants
  };

  const reportPath = join(__dirname, '../backups', `migration-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n📊 Migration Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Articles: ${results.articles.success.length} migrated`);
  console.log(`✅ Destinations: ${results.destinations.success.length} migrated`);
  console.log(`✅ Accommodations: ${results.accommodations.success} migrated`);
  console.log(`✅ Restaurants: ${results.restaurants.success} migrated`);

  if (results.articles.errors.length > 0) {
    console.log(`\n❌ Article errors: ${results.articles.errors.length}`);
    results.articles.errors.forEach(err => {
      console.log(`   - ${err.slug}: ${err.error}`);
    });
  }

  if (results.destinations.errors.length > 0) {
    console.log(`\n❌ Destination errors: ${results.destinations.errors.length}`);
    results.destinations.errors.forEach(err => {
      console.log(`   - ${err.slug}: ${err.error}`);
    });
  }

  console.log(`\n📄 Full report saved to: ${reportPath}`);
  console.log('\n✨ Migration complete!');

  rl.close();
}

migrateWithSafety().catch((error) => {
  console.error('\n💥 Migration failed:', error);
  rl.close();
  process.exit(1);
});
