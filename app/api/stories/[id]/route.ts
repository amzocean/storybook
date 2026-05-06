import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(id);
  if (!story) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const pages = db.prepare('SELECT * FROM pages WHERE story_id = ? ORDER BY page_number').all(id);
  return NextResponse.json({ ...story, pages });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { title, description, category, tags, cover_image, age_range, status } = body;

  const fields: string[] = [];
  const values: any[] = [];
  
  if (title !== undefined) { fields.push('title=?'); values.push(title); }
  if (description !== undefined) { fields.push('description=?'); values.push(description); }
  if (category !== undefined) { fields.push('category=?'); values.push(category); }
  if (tags !== undefined) { fields.push('tags=?'); values.push(JSON.stringify(tags)); }
  if (cover_image !== undefined) { fields.push('cover_image=?'); values.push(cover_image); }
  if (age_range !== undefined) { fields.push('age_range=?'); values.push(age_range); }
  if (status !== undefined) { fields.push('status=?'); values.push(status); }
  fields.push("updated_at=datetime('now')");
  
  values.push(id);
  db.prepare(`UPDATE stories SET ${fields.join(', ')} WHERE id=?`).run(...values);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.prepare('DELETE FROM pages WHERE story_id = ?').run(id);
  db.prepare('DELETE FROM stories WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
