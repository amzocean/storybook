import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.prepare("UPDATE stories SET status = 'published', updated_at = datetime('now') WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
