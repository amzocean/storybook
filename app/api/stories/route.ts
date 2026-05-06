import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all') === 'true';
  
  const stories = db.prepare(`
    SELECT s.*, COUNT(p.id) as page_count 
    FROM stories s 
    LEFT JOIN pages p ON p.story_id = s.id 
    ${all ? '' : "WHERE s.status = 'published'"}
    GROUP BY s.id 
    ORDER BY s.created_at DESC
  `).all();
  return NextResponse.json(stories);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id, title, description, category, tags, cover_image, age_range, status } = body;

  db.prepare(`
    INSERT INTO stories (id, title, description, category, tags, cover_image, age_range, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description, category, JSON.stringify(tags || []), cover_image, age_range || '5-8', status || 'draft');

  return NextResponse.json({ success: true, id });
}
