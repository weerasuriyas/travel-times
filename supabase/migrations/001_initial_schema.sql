-- Travel Times Sri Lanka - Initial Database Schema
-- Created: 2026-01-28
-- Migration: 001

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ARTICLES TABLE
-- ============================================================================
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  category TEXT,
  tags TEXT[],
  issue TEXT,
  published_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ DEFAULT NOW(),

  -- Author info
  author_name TEXT NOT NULL,
  author_role TEXT,
  author_bio TEXT,
  author_avatar_url TEXT,

  -- Reading metadata
  read_time INTEGER, -- minutes
  word_count INTEGER,
  featured_type TEXT,

  -- Location
  location_name TEXT,
  location_coordinates POINT,
  location_region TEXT,
  location_country TEXT DEFAULT 'Sri Lanka',

  -- Images
  hero_image_url TEXT NOT NULL,
  hero_image_alt TEXT,
  hero_image_caption TEXT,

  -- Content (stored as JSONB for flexibility)
  content JSONB NOT NULL,
  -- Structure: { introduction, sections, featured }

  -- Visual plates
  plates JSONB,
  -- Structure: [{ id, image, label, description, backgroundColor, icon }]

  -- Map data
  map_data JSONB,
  -- Structure: { center, zoom, routes, landmarks }

  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  social_image_url TEXT,

  -- Status & visibility
  status TEXT DEFAULT 'draft', -- 'draft', 'published', 'archived'
  is_featured BOOLEAN DEFAULT false,

  -- Layout preferences
  layout_preferences JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for articles
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_date ON articles(published_date DESC);
CREATE INDEX idx_articles_featured ON articles(is_featured) WHERE is_featured = true;
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_tags ON articles USING GIN(tags);

-- Comment
COMMENT ON TABLE articles IS 'Main articles/stories table - Created: 2026-01-28, Migration 001';

-- ============================================================================
-- DESTINATIONS TABLE
-- ============================================================================
CREATE TABLE destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT NOT NULL,
  hero_image_url TEXT NOT NULL,
  coordinates POINT NOT NULL,
  region TEXT NOT NULL,

  -- Highlights
  highlights TEXT[],

  -- Stats
  stats JSONB NOT NULL,
  -- Structure: { elevation, temperature, bestTime }

  -- Events
  events JSONB,
  -- Structure: [{ name, slug, type, month, duration, image, description, featured }]

  -- Things to do
  things_to_do JSONB,
  -- Structure: [{ name, category, duration, image, description, price }]

  -- Status
  status TEXT DEFAULT 'published', -- 'draft', 'published'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for destinations
CREATE INDEX idx_destinations_slug ON destinations(slug);
CREATE INDEX idx_destinations_status ON destinations(status);
CREATE INDEX idx_destinations_region ON destinations(region);

COMMENT ON TABLE destinations IS 'Destinations database - Created: 2026-01-28, Migration 001';

-- ============================================================================
-- ACCOMMODATIONS TABLE
-- ============================================================================
CREATE TABLE accommodations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  price_range TEXT,
  rating DECIMAL(2,1),
  description TEXT,
  image_url TEXT,
  tags TEXT[],
  coordinates POINT NOT NULL,
  amenities TEXT[],
  booking_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for accommodations
CREATE INDEX idx_accommodations_article ON accommodations(article_id);
CREATE INDEX idx_accommodations_rating ON accommodations(rating DESC);

COMMENT ON TABLE accommodations IS 'Hotels and accommodations linked to articles';

-- ============================================================================
-- RESTAURANTS TABLE
-- ============================================================================
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  price_range TEXT,
  rating DECIMAL(2,1),
  description TEXT,
  image_url TEXT,
  tags TEXT[],
  coordinates POINT NOT NULL,
  specialty TEXT,
  hours TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for restaurants
CREATE INDEX idx_restaurants_article ON restaurants(article_id);
CREATE INDEX idx_restaurants_rating ON restaurants(rating DESC);

COMMENT ON TABLE restaurants IS 'Restaurants and dining options linked to articles';

-- ============================================================================
-- ARTICLE ARCHIVE TABLE (Version History)
-- ============================================================================
CREATE TABLE article_archive (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  archived_data JSONB NOT NULL, -- Full snapshot of article
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  archived_by TEXT -- user email or ID
);

-- Indexes for archive
CREATE INDEX idx_archive_article ON article_archive(article_id, version DESC);

COMMENT ON TABLE article_archive IS 'Version history for articles - stores snapshots of every update';

-- ============================================================================
-- IMAGES TABLE (Optional - track all uploaded images)
-- ============================================================================
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  size_bytes INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  uploaded_by TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for images
CREATE INDEX idx_images_uploaded_at ON images(uploaded_at DESC);

COMMENT ON TABLE images IS 'Track all uploaded images for asset management';

-- ============================================================================
-- ADMIN USERS TABLE (Role-based access control)
-- ============================================================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'editor', -- 'super_admin', 'admin', 'editor'
  permissions JSONB, -- Custom permissions if needed
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_login TIMESTAMPTZ,
  UNIQUE(user_id)
);

-- Indexes for admin users
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_active ON admin_users(is_active) WHERE is_active = true;

COMMENT ON TABLE admin_users IS 'Admin users with role-based permissions';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own admin record
CREATE POLICY "Users can view their own admin record"
  ON admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- Only super admins can create new admin users
CREATE POLICY "Super admins can create admin users"
  ON admin_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Public read access for published content
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Anyone can read published articles
CREATE POLICY "Public can read published articles"
  ON articles FOR SELECT
  USING (status = 'published');

-- Anyone can read published destinations
CREATE POLICY "Public can read published destinations"
  ON destinations FOR SELECT
  USING (status = 'published');

-- Anyone can read accommodations
CREATE POLICY "Public can read accommodations"
  ON accommodations FOR SELECT
  USING (true);

-- Anyone can read restaurants
CREATE POLICY "Public can read restaurants"
  ON restaurants FOR SELECT
  USING (true);

-- Admins can do everything
CREATE POLICY "Admins can manage articles"
  ON articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage destinations"
  ON destinations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- ============================================================================
-- TRIGGER: Auto-archive article versions
-- ============================================================================

CREATE OR REPLACE FUNCTION archive_article_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO article_archive (article_id, version, archived_data, archived_by)
  VALUES (
    NEW.id,
    (SELECT COALESCE(MAX(version), 0) + 1 FROM article_archive WHERE article_id = NEW.id),
    to_jsonb(NEW),
    current_user
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires on every update
CREATE TRIGGER article_version_trigger
  AFTER UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION archive_article_version();

COMMENT ON FUNCTION archive_article_version IS 'Automatically creates version history snapshots when articles are updated';

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to articles
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to destinations
CREATE TRIGGER update_destinations_updated_at
  BEFORE UPDATE ON destinations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL SETUP COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 001 completed successfully';
  RAISE NOTICE '📊 Created tables: articles, destinations, accommodations, restaurants, article_archive, images, admin_users';
  RAISE NOTICE '🔒 RLS policies enabled for security';
  RAISE NOTICE '⚙️  Triggers configured for auto-versioning and timestamps';
END $$;
