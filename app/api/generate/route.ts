import { NextRequest, NextResponse } from 'next/server';
import { generateStoryOutline, regeneratePageText, generateImage, generateCoverImage, moderateContent, verifyKidFriendly } from '@/lib/openai';
import { downloadAndSaveImage } from '@/lib/storage';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {
      case 'outline': {
        const { premise, category, pageCount, title, detailLevel } = body;

        // Safety check 1: moderate user input
        const inputCheck = await moderateContent(`${title} ${premise}`);
        if (!inputCheck.safe) {
          return NextResponse.json({ error: `🚫 ${inputCheck.reason}. Please keep it kid-friendly!` }, { status: 400 });
        }

        const result = await generateStoryOutline(premise, category, pageCount || 6, title || '', detailLevel || 3);
        const outline = result.pages || result;
        const characterSheet = result.characterSheet || null;

        // Safety check 2: verify generated story is kid-appropriate
        const storyText = (outline as any[]).map((p: any) => p.text).join('\n');
        const outputCheck = await verifyKidFriendly(storyText);
        if (!outputCheck.safe) {
          return NextResponse.json({ error: `🚫 Generated story wasn't kid-friendly (${outputCheck.reason}). Try a different premise!` }, { status: 400 });
        }

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
