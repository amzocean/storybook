import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: storyId } = await params;
  const body = await request.json();
  const { pages } = body; // Array of { pageNumber, text, image_path, image_prompt }

  // Clear existing pages for this story
  await supabase.from('pages').delete().eq('story_id', storyId);

  // Insert new pages
  const rows = pages.map((page: any) => ({
    id: page.id || uuid(),
    story_id: storyId,
    page_number: page.pageNumber,
    text: page.text,
    image_path: page.image_path || null,
    image_prompt: page.image_prompt || null,
  }));

  const { error } = await supabase.from('pages').insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
