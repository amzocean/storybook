import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: storyId } = await params;
  const body = await request.json();
  const { pages } = body; // Array of { pageNumber, text, image_path, image_prompt }

  const insert = db.prepare(`
    INSERT OR REPLACE INTO pages (id, story_id, page_number, text, image_path, image_prompt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((pages: any[]) => {
    // Clear existing pages for this story
    db.prepare('DELETE FROM pages WHERE story_id = ?').run(storyId);
    for (const page of pages) {
      insert.run(
        page.id || uuid(),
        storyId,
        page.pageNumber,
        page.text,
        page.image_path || null,
        page.image_prompt || null
      );
    }
  });

  insertMany(pages);
  return NextResponse.json({ success: true });
}
