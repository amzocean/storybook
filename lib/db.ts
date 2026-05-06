import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'storynook.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('busy_timeout = 5000');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'adventure',
      tags TEXT DEFAULT '[]',
      cover_image TEXT,
      age_range TEXT DEFAULT '5-8',
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      text TEXT NOT NULL,
      image_path TEXT,
      image_prompt TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT DEFAULT '📖',
      color TEXT DEFAULT '#4ECDC4'
    );
  `);

  const catCount = _db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (catCount.count === 0) {
    const insertCat = _db.prepare('INSERT INTO categories (id, name, emoji, color) VALUES (?, ?, ?, ?)');
    const defaultCategories = [
      ['dinosaurs', 'Dinosaurs', '🦕', '#4CAF50'],
      ['space', 'Space', '🚀', '#3F51B5'],
      ['pirates', 'Pirates', '🏴‍☠️', '#FF5722'],
      ['animals', 'Animals', '🐾', '#FF9800'],
      ['fairy-tales', 'Fairy Tales', '🧚', '#9C27B0'],
      ['adventure', 'Adventure', '⚔️', '#F44336'],
      ['underwater', 'Underwater', '🐠', '#00BCD4'],
      ['robots', 'Robots', '🤖', '#607D8B'],
    ];
    for (const cat of defaultCategories) {
      insertCat.run(...cat);
    }
  }

  return _db;
}

const db = new Proxy({} as Database.Database, {
  get(_, prop) {
    const instance = getDb();
    const val = (instance as any)[prop];
    if (typeof val === 'function') return val.bind(instance);
    return val;
  }
});

export default db;
