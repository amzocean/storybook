import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all') === 'true';

  let query = supabase.from('stories_with_page_count').select('*');
  if (!all) {
    query = query.eq('status', 'published');
  }
  const { data: stories, error } = await query.order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(stories);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id, title, description, category, tags, cover_image, age_range, status } = body;

  const { error } = await supabase.from('stories').insert({
    id,
    title,
    description,
    category,
    tags: tags || [],
    cover_image,
    age_range: age_range || '5-8',
    status: status || 'draft',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id });
}
