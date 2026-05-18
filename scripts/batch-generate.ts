/**
 * Batch Story Generator for Story Sparks / StoryNook
 * 
 * Generates N stories (default 20) with full text + images, and publishes them to Supabase.
 * 
 * Usage:
 *   npx tsx scripts/batch-generate.ts              # Generate 20 stories
 *   npx tsx scripts/batch-generate.ts --count 10    # Generate 10 stories
 *   npx tsx scripts/batch-generate.ts --text-only   # Text only, no DALL-E images
 *   npx tsx scripts/batch-generate.ts --dry-run     # Preview what would be generated
 *   npx tsx scripts/batch-generate.ts --resume      # Skip stories already in DB by title
 * 
 * Requires: .env.local with OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from project root
config({ path: resolve(__dirname, '..', '.env.local') });

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { v4 as uuid } from 'uuid';
import { pickRandomSeeds, randomAuthor, type StorySeed } from './story-seeds';

// ─── Config ───
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_KEY = process.env.OPENAI_API_KEY!;
const BUCKET = 'story-images';

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  console.error('❌ Missing env vars. Ensure .env.local has OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_KEY });

// ─── CLI Args ───
const args = process.argv.slice(2);
const COUNT = parseInt(args.find((_, i, a) => a[i - 1] === '--count') || '20', 10);
const TEXT_ONLY = args.includes('--text-only');
const DRY_RUN = args.includes('--dry-run');
const RESUME = args.includes('--resume');

// ─── Helpers ───
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const detailMap: Record<number, { sentences: string; vocab: string; ageLabel: string }> = {
  1: { sentences: '1 simple sentence', vocab: 'very simple words a toddler would understand', ageLabel: 'ages 2-3' },
  2: { sentences: '2 short sentences', vocab: 'simple words for early readers', ageLabel: 'ages 4-5' },
  3: { sentences: '3-4 sentences forming a descriptive paragraph', vocab: 'age-appropriate vocabulary', ageLabel: 'ages 5-7' },
  4: { sentences: '4-5 rich, descriptive sentences', vocab: 'slightly advanced but accessible vocabulary', ageLabel: 'ages 7-9' },
  5: { sentences: '5-6 detailed sentences with vivid descriptions', vocab: 'expressive vocabulary with some challenging words', ageLabel: 'ages 8-10' },
};

const ageRangeMap: Record<number, string> = {
  1: '2-3', 2: '4-5', 3: '5-7', 4: '7-9', 5: '8-10',
};

async function generateOutline(seed: StorySeed) {
  const detail = detailMap[seed.detailLevel] || detailMap[3];
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a children's storybook author. Create engaging, age-appropriate stories for ${detail.ageLabel}. 
        Stories should have clear morals, colorful descriptions perfect for illustration, and ${detail.vocab}.
        Each page MUST have exactly ${detail.sentences} — this is critical, do not write less.
        
        IMPORTANT RULES:
        1. If the title or premise contains a person's name, that MUST be the main character's name.
        2. Use the character's actual name consistently on every page.`
      },
      {
        role: 'user',
        content: `Create a ${seed.pageCount}-page children's storybook for ${detail.ageLabel}.
        Title: "${seed.title}"
        Premise: "${seed.premise}"
        Category: ${seed.category}
        Detail: Each page must have ${detail.sentences}. This is the most important formatting rule.
        
        Return a JSON object with:
        - "description": a warm, engaging 1-sentence description suitable for sharing
        - "characterSheet": { "name": "...", "appearance": "detailed visual description", "style": "art style" }
        - "pages": array of ${seed.pageCount} objects with:
          - "pageNumber": number (1-based)
          - "text": the story text (${detail.sentences})
          - "imageDescription": vivid illustration description (NO character names, use "the boy/girl/child")
        
        Return ONLY valid JSON, no markdown fencing.`
      }
    ],
    temperature: 0.8,
  });

  const content = response.choices[0].message.content || '{}';
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

async function generateAndUploadImage(
  prompt: string,
  storyId: string,
  filename: string,
  characterSheet?: { name: string; appearance: string; style: string }
): Promise<string> {
  let fullPrompt: string;
  if (characterSheet) {
    const names = characterSheet.name.split(/\s+and\s+|\s*,\s*/).map((n: string) => n.trim()).filter(Boolean);
    const namePattern = names.length > 0 ? new RegExp(`\\b(${names.join('|')})\\b`, 'gi') : null;
    const stripNames = (text: string) => namePattern ? text.replace(namePattern, 'the character') : text;
    fullPrompt = `${characterSheet.style} children's storybook illustration, colorful, friendly, suitable for ages 5-8.
CHARACTER (must look EXACTLY like this): ${stripNames(characterSheet.appearance)}
SCENE: ${stripNames(prompt)}
IMPORTANT: Maintain perfect visual consistency. Do NOT include any text or words in the image.`;
  } else {
    fullPrompt = `Children's storybook illustration, colorful, friendly, cartoon style, suitable for ages 5-8: ${prompt}. Do NOT include any text or words in the image.`;
  }

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: fullPrompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) throw new Error('No image URL returned from DALL-E');

  // Download and upload to Supabase
  const imgResponse = await fetch(imageUrl);
  if (!imgResponse.ok) throw new Error(`Failed to download image: ${imgResponse.statusText}`);

  const buffer = Buffer.from(await imgResponse.arrayBuffer());
  const storagePath = `${storyId}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: 'image/png', upsert: true });

  if (error) throw new Error(`Failed to upload image: ${error.message}`);

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

async function generateSingleStory(seed: StorySeed, index: number, total: number): Promise<boolean> {
  const storyId = uuid();
  const authorName = randomAuthor();

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📖 [${index + 1}/${total}] "${seed.title}"`);
  console.log(`   Category: ${seed.category} | Age: ${ageRangeMap[seed.detailLevel]} | Pages: ${seed.pageCount}`);
  console.log(`   Author: ${authorName}`);
  console.log(`${'─'.repeat(60)}`);

  try {
    // Step 1: Generate story text
    console.log('   📝 Generating story text...');
    const outline = await generateOutline(seed);
    const pages = outline.pages || [];
    const description = outline.description || seed.premise;
    const characterSheet = outline.characterSheet || null;
    console.log(`   ✅ Got ${pages.length} pages + description`);

    // Step 2: Generate images (unless text-only)
    let coverImageUrl = '';
    const pageImages: Map<number, string> = new Map();

    if (!TEXT_ONLY) {
      // Cover image
      console.log('   🎨 Generating cover image...');
      try {
        const safeTitle = characterSheet
          ? seed.title.replace(new RegExp(`\\b(${characterSheet.name.split(/\s+and\s+|\s*,\s*/).join('|')})\\b`, 'gi'), 'the character')
          : seed.title;
        coverImageUrl = await generateAndUploadImage(
          `Book cover: ${safeTitle}. ${description}`,
          storyId,
          'cover.png',
          characterSheet
        );
        console.log('   ✅ Cover image uploaded');
      } catch (err: any) {
        console.log(`   ⚠️  Cover image failed: ${err.message} — continuing without cover`);
      }

      // Page images (sequential to respect rate limits)
      for (const page of pages) {
        console.log(`   🎨 Generating page ${page.pageNumber}/${pages.length} image...`);
        try {
          const imgUrl = await generateAndUploadImage(
            page.imageDescription,
            storyId,
            `page-${page.pageNumber}.png`,
            characterSheet
          );
          pageImages.set(page.pageNumber, imgUrl);
          console.log(`   ✅ Page ${page.pageNumber} image uploaded`);
        } catch (err: any) {
          console.log(`   ⚠️  Page ${page.pageNumber} image failed: ${err.message} — skipping`);
        }
        // Small delay between DALL-E calls to avoid rate limiting
        await sleep(1000);
      }
    }

    // Step 3: Insert story into Supabase
    console.log('   💾 Saving to database...');
    const { error: storyError } = await supabase.from('stories').insert({
      id: storyId,
      title: seed.title,
      description,
      category: seed.category,
      tags: seed.tags,
      cover_image: coverImageUrl || null,
      age_range: ageRangeMap[seed.detailLevel] || '5-7',
      detail_level: seed.detailLevel,
      author_name: authorName,
      author_credit: 'imagined',
      status: 'published', // Auto-publish seed stories
    });

    if (storyError) throw new Error(`Story insert failed: ${storyError.message}`);

    // Step 4: Insert pages
    const pageRows = pages.map((page: any) => ({
      id: uuid(),
      story_id: storyId,
      page_number: page.pageNumber,
      text: page.text,
      image_path: pageImages.get(page.pageNumber) || null,
      image_prompt: page.imageDescription || null,
    }));

    const { error: pagesError } = await supabase.from('pages').insert(pageRows);
    if (pagesError) throw new Error(`Pages insert failed: ${pagesError.message}`);

    console.log(`   ✅ Published! Story ID: ${storyId}`);
    return true;

  } catch (err: any) {
    console.error(`   ❌ FAILED: ${err.message}`);
    // Clean up partial data
    await supabase.from('pages').delete().eq('story_id', storyId);
    await supabase.from('stories').delete().eq('id', storyId);
    return false;
  }
}

// ─── Main ───
async function main() {
  console.log(`\n🚀 Story Sparks Batch Generator`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`   Stories to generate: ${COUNT}`);
  console.log(`   Mode: ${TEXT_ONLY ? '📝 Text only (no images)' : '📝+🎨 Text + Images'}`);
  console.log(`   Dry run: ${DRY_RUN ? 'Yes' : 'No'}`);
  console.log(`   Resume: ${RESUME ? 'Yes (skip existing titles)' : 'No'}`);
  console.log(`${'═'.repeat(60)}`);

  // Get existing titles if resuming
  const existingTitles = new Set<string>();
  if (RESUME) {
    const { data } = await supabase.from('stories').select('title');
    if (data) {
      data.forEach(s => existingTitles.add(s.title));
      console.log(`\n📋 Found ${existingTitles.size} existing stories in DB`);
    }
  }

  // Pick seeds
  const seeds = pickRandomSeeds(COUNT, existingTitles);
  console.log(`\n📦 Selected ${seeds.length} story seeds:\n`);

  // Preview
  seeds.forEach((s, i) => {
    const ageRange = ageRangeMap[s.detailLevel] || '5-7';
    console.log(`   ${String(i + 1).padStart(3)}. [${s.category.padEnd(12)}] [${ageRange}] ${s.title}`);
  });

  if (DRY_RUN) {
    console.log('\n🏁 Dry run complete. Remove --dry-run to generate.\n');
    return;
  }

  // Estimate
  if (!TEXT_ONLY) {
    const totalImages = seeds.reduce((sum, s) => sum + s.pageCount + 1, 0); // pages + cover
    const estimatedCost = (totalImages * 0.04).toFixed(2);
    const estimatedMinutes = Math.ceil(totalImages * 0.3); // ~18s per image
    console.log(`\n💰 Estimated cost: ~$${estimatedCost} (${totalImages} images × $0.04)`);
    console.log(`⏱️  Estimated time: ~${estimatedMinutes} minutes`);
  } else {
    console.log(`\n💰 Estimated cost: ~$${(seeds.length * 0.02).toFixed(2)} (text only)`);
    console.log(`⏱️  Estimated time: ~${Math.ceil(seeds.length * 0.15)} minutes`);
  }

  console.log(`\n🏁 Starting generation...\n`);
  const startTime = Date.now();
  let success = 0;
  let failed = 0;

  for (let i = 0; i < seeds.length; i++) {
    const ok = await generateSingleStory(seeds[i], i, seeds.length);
    if (ok) success++;
    else failed++;

    // Small delay between stories
    if (i < seeds.length - 1) await sleep(2000);
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🏁 BATCH COMPLETE`);
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⏱️  Time: ${minutes}m ${seconds}s`);
  console.log(`${'═'.repeat(60)}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
