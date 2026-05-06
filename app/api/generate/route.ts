import { NextRequest, NextResponse } from 'next/server';
import { generateStoryOutline, regeneratePageText, generateImage, generateCoverImage } from '@/lib/openai';
import { downloadAndSaveImage } from '@/lib/storage';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {
      case 'outline': {
        const { premise, category, pageCount, title } = body;
        const result = await generateStoryOutline(premise, category, pageCount || 6, title || '');
        // New format returns { characterSheet, pages } — extract both
        const outline = result.pages || result;
        const characterSheet = result.characterSheet || null;
        return NextResponse.json({ outline, characterSheet });
      }

      case 'regenerate-page': {
        const { currentText, instruction, storyContext } = body;
        const result = await regeneratePageText(currentText, instruction, storyContext);
        return NextResponse.json(result);
      }

      case 'generate-image': {
        const { prompt, storyId, pageNumber, characterSheet } = body;
        const imageUrl = await generateImage(prompt, characterSheet || undefined);
        const savedPath = await downloadAndSaveImage(imageUrl, storyId, `page-${pageNumber}.png`);
        return NextResponse.json({ imageUrl: savedPath });
      }

      case 'generate-cover': {
        const { title, description, category, storyId } = body;
        const imageUrl = await generateCoverImage(title, description, category);
        const savedPath = await downloadAndSaveImage(imageUrl, storyId, 'cover.png');
        return NextResponse.json({ imageUrl: savedPath });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
