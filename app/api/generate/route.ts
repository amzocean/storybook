import { NextRequest, NextResponse } from 'next/server';
import { generateStoryOutline, regeneratePageText, generateImage, generateCoverImage, syncImageDescriptions, moderateContent, verifyKidFriendly, validatePremise } from '@/lib/openai';
import { downloadAndSaveImage } from '@/lib/storage';
import { checkRateLimit } from '@/lib/rate-limit';

// DALL-E 3 image generation + download + Supabase upload can exceed 60s
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {
      case 'outline': {
        const { premise, category, pageCount, title, detailLevel } = body;

        // Rate limit check (IP-based, 5 stories/hour)
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const rateCheck = checkRateLimit(ip);
        if (!rateCheck.allowed) {
          return NextResponse.json({ error: rateCheck.message }, { status: 429 });
        }

        // Safety check 1: moderation API (catches overtly harmful content)
        const inputCheck = await moderateContent(`${title} ${premise}`);
        if (!inputCheck.safe) {
          return NextResponse.json({ error: `🚫 ${inputCheck.reason}. Please keep it kid-friendly!` }, { status: 400 });
        }

        // Safety check 2: validate premise is actually a children's story idea
        const premiseCheck = await validatePremise(`${title} ${premise}`);
        if (!premiseCheck.safe) {
          return NextResponse.json({ error: `🚫 ${premiseCheck.reason || "That doesn't look like a story idea!"} Try something like "A brave kitten who learns to fly" 🐱` }, { status: 400 });
        }

        const result = await generateStoryOutline(premise, category, pageCount || 6, title || '', detailLevel || 3);
        const outline = result.pages || result;
        const characterSheet = result.characterSheet || null;

        // Safety check 3: verify generated story is kid-appropriate
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

      case 'sync-descriptions': {
        const { editedPages, storyContext, characterSheet } = body;
        const results = await syncImageDescriptions(editedPages, storyContext, characterSheet || undefined);
        return NextResponse.json({ descriptions: results });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
