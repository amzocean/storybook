import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// New categories that may not be in the DB yet — upserted on first GET
const NEW_CATEGORIES = [
  { id: 'funny', name: 'Funny', emoji: '😂', color: '#FFEB3B' },
  { id: 'learning', name: 'Learning', emoji: '🧠', color: '#8BC34A' },
  { id: 'fantasy', name: 'Fantasy', emoji: '🧙', color: '#673AB7' },
  { id: 'sports', name: 'Sports', emoji: '⚽', color: '#E91E63' },
];

let seeded = false;

export async function GET() {
  // One-time seed of new categories (idempotent via upsert)
  if (!seeded) {
    await supabase.from('categories').upsert(NEW_CATEGORIES, { onConflict: 'id' });
    seeded = true;
  }

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(categories);
}
