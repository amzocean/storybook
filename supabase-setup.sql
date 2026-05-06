-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This creates all tables and seeds default categories

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'adventure',
  tags JSONB DEFAULT '[]'::jsonb,
  cover_image TEXT,
  age_range TEXT DEFAULT '5-8',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pages table
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  image_path TEXT,
  image_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📖',
  color TEXT DEFAULT '#4ECDC4'
);

-- Seed default categories
INSERT INTO categories (id, name, emoji, color) VALUES
  ('dinosaurs', 'Dinosaurs', '🦕', '#4CAF50'),
  ('space', 'Space', '🚀', '#3F51B5'),
  ('pirates', 'Pirates', '🏴‍☠️', '#FF5722'),
  ('animals', 'Animals', '🐾', '#FF9800'),
  ('fairy-tales', 'Fairy Tales', '🧚', '#9C27B0'),
  ('adventure', 'Adventure', '⚔️', '#F44336'),
  ('underwater', 'Underwater', '🐠', '#00BCD4'),
  ('robots', 'Robots', '🤖', '#607D8B')
ON CONFLICT (id) DO NOTHING;

-- Create index for faster page lookups
CREATE INDEX IF NOT EXISTS idx_pages_story_id ON pages(story_id);

-- Create a view for stories with page counts (used by the stories list API)
CREATE OR REPLACE VIEW stories_with_page_count AS
SELECT s.*, COALESCE(pc.page_count, 0) AS page_count
FROM stories s
LEFT JOIN (
  SELECT story_id, COUNT(*) AS page_count
  FROM pages
  GROUP BY story_id
) pc ON pc.story_id = s.id;

-- Enable Row Level Security (allow all for now via service role key)
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies: allow everything (we use service_role key server-side)
CREATE POLICY "Allow all on stories" ON stories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pages" ON pages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
