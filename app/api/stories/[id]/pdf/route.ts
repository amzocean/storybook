import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { StoryPDF } from '@/lib/pdf-template';

export const maxDuration = 300;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch story
  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  // Fetch pages
  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .eq('story_id', id)
    .order('page_number');

  // Fetch category
  let categoryName = '';
  let categoryEmoji = '';
  if (story.category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('name, emoji')
      .eq('id', story.category)
      .single();
    if (cat) {
      categoryName = cat.name;
      categoryEmoji = cat.emoji;
    }
  }

  // Render PDF
  const buffer = await renderToBuffer(
    React.createElement(StoryPDF, {
      title: story.title,
      description: story.description,
      cover_image: story.cover_image,
      author_name: story.author_name,
      author_credit: story.author_credit,
      age_range: story.age_range,
      categoryName,
      categoryEmoji,
      pages: pages || [],
    })
  );

  // Sanitize title for filename
  const safeTitle = story.title
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 60)
    .toLowerCase();
  const filename = `${safeTitle}-storysparks.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}

