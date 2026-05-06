import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { deleteStoryImages } from '@/lib/storage';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !story) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .eq('story_id', id)
    .order('page_number');

  return NextResponse.json({ ...story, pages: pages || [] });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { title, description, category, tags, cover_image, age_range, status } = body;

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;
  if (tags !== undefined) updates.tags = tags;
  if (cover_image !== undefined) updates.cover_image = cover_image;
  if (age_range !== undefined) updates.age_range = age_range;
  if (status !== undefined) updates.status = status;

  const { error } = await supabase.from('stories').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Delete pages (cascade should handle it, but be explicit)
  await supabase.from('pages').delete().eq('story_id', id);
  await supabase.from('stories').delete().eq('id', id);
  // Clean up images from storage
  await deleteStoryImages(id);

  return NextResponse.json({ success: true });
}
