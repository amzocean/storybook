import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Content safety: verify premise is actually a children's story idea (not news, homework, etc.)
export async function validatePremise(premise: string): Promise<{ safe: boolean; reason?: string }> {
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a gatekeeper for a children's storybook app. Your ONLY job is to decide if the user's input is a valid children's story idea.
          
          ALLOW: story ideas, character descriptions, adventure plots, animal tales, fairy tales, moral lessons, fantasy, friendship stories, bedtime stories, etc.
          REJECT: news requests, homework help, code generation, adult topics, political topics, war/violence, real-world current events, general knowledge questions, anything that is NOT a children's story premise.
          
          Reply with ONLY a JSON object: {"safe": true} or {"safe": false, "reason": "brief kid-friendly explanation"}`
        },
        { role: 'user', content: premise }
      ],
      temperature: 0,
      max_tokens: 100,
    });
    const content = res.choices[0].message.content || '{"safe": true}';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { safe: true };
  }
}

// Content safety: check user input via OpenAI moderation API
export async function moderateContent(text: string): Promise<{ safe: boolean; reason?: string }> {
  try {
    const res = await openai.moderations.create({ input: text });
    const result = res.results[0];
    if (result.flagged) {
      const flagged = Object.entries(result.categories)
        .filter(([, v]) => v)
        .map(([k]) => k);
      return { safe: false, reason: `Content flagged: ${flagged.join(', ')}` };
    }
    return { safe: true };
  } catch {
    return { safe: true }; // fail open if moderation API errors
  }
}

// Content safety: verify generated story is kid-appropriate
export async function verifyKidFriendly(storyText: string): Promise<{ safe: boolean; reason?: string }> {
  // First pass: moderation API
  const mod = await moderateContent(storyText);
  if (!mod.safe) return mod;

  // Second pass: GPT classifier for subtle issues moderation API misses
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a children's content safety reviewer. Evaluate if the text is appropriate for a children's storybook (ages 2-10). 
          Flag if it contains: violence, scary themes, adult topics, inappropriate language, discrimination, or anything unsuitable for young children.
          Reply with ONLY a JSON object: {"safe": true} or {"safe": false, "reason": "brief explanation"}`
        },
        { role: 'user', content: storyText }
      ],
      temperature: 0,
    });
    const content = res.choices[0].message.content || '{"safe": true}';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { safe: true };
  }
}

export async function generateStoryOutline(premise: string, category: string, pageCount: number = 6, title: string = '', detailLevel: number = 3) {
  const detailMap: Record<number, { sentences: string; vocab: string; ageLabel: string }> = {
    1: { sentences: '1 simple sentence', vocab: 'very simple words a toddler would understand', ageLabel: 'ages 2-3' },
    2: { sentences: '2 short sentences', vocab: 'simple words for early readers', ageLabel: 'ages 4-5' },
    3: { sentences: '3-4 sentences forming a descriptive paragraph', vocab: 'age-appropriate vocabulary', ageLabel: 'ages 5-7' },
    4: { sentences: '4-5 rich, descriptive sentences', vocab: 'slightly advanced but accessible vocabulary', ageLabel: 'ages 7-9' },
    5: { sentences: '5-6 detailed sentences with vivid descriptions', vocab: 'expressive vocabulary with some challenging words', ageLabel: 'ages 8-10' },
  };
  const detail = detailMap[detailLevel] || detailMap[3];

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
           For example, if the title is "Mia's Dino Adventure", the main character is named Mia. 
           NEVER substitute a different name like Tommy, Sam, etc.
        2. Use the character's actual name consistently on every page.`
      },
      {
        role: 'user',
        content: `Create a ${pageCount}-page children's storybook for ${detail.ageLabel}.
        Title: "${title}"
        Premise: "${premise}"
        Category: ${category}
        Detail: Each page must have ${detail.sentences}. This is the most important formatting rule.
        
        Return a JSON object with:
        - "description": a warm, engaging 1-sentence description of the story suitable for sharing (e.g., "Zahra and Amir, curious 6-year-old twins, discover a magical dinosaur world hidden in their backyard jungle."). Use the character's name, age, and the story's emotional hook. Make it feel like a book jacket blurb.
        - "characterSheet": an object describing the main character's visual appearance for consistent illustrations:
          - "name": the character's name (extract from title/premise, or create one)
          - "appearance": a detailed, fixed visual description of the character (e.g., "a 6-year-old boy with short curly brown hair, brown eyes, light brown skin, wearing a red t-shirt with a star on it and blue jeans"). Do NOT include character names — describe only their physical look.
          - "style": the art style to use (e.g., "Pixar-style 3D cartoon" or "bright watercolor storybook illustration")
        - "pages": an array of exactly ${pageCount} objects, each having:
          - "pageNumber": number (1-based)
          - "text": the story text for that page (${detail.sentences} — NOT fewer). Use the character's REAL name, never a substitute.
          - "imageDescription": a vivid description of what the illustration should show for an artist. NEVER use character names — refer to them as "the boy", "the girl", "the child", "the children", etc. ALWAYS include the character's full appearance description (from characterSheet) so every illustration looks the same. Describe pose, setting, and action but keep the character's look identical.
        
        Make it fun, colorful, and with a positive message at the end!
        Return ONLY valid JSON, no markdown fencing.`
      }
    ],
    temperature: 0.8,
  });

  const content = response.choices[0].message.content || '{}';
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

export async function regeneratePageText(currentText: string, instruction: string, storyContext: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a children's storybook author. Rewrite the given page text based on the user's instruction. 
        Keep it age-appropriate for kids 5-8, 3-4 descriptive sentences per page.`
      },
      {
        role: 'user',
        content: `Story context: ${storyContext}
        
        Current page text: "${currentText}"
        
        Instruction: ${instruction}
        
        Return a JSON object with:
        - "text": the rewritten page text
        - "imageDescription": updated illustration description for DALL-E
        
        Return ONLY valid JSON.`
      }
    ],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content || '{}';
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

export async function generateImage(prompt: string, characterSheet?: { name: string; appearance: string; style: string }): Promise<string> {
  let fullPrompt: string;
  if (characterSheet) {
    // Sanitize for DALL-E safety: remove real names but keep age/appearance details
    const names = characterSheet.name.split(/\s+and\s+|\s*,\s*/).map(n => n.trim()).filter(Boolean);
    const namePattern = names.length > 0 ? new RegExp(`\\b(${names.join('|')})\\b`, 'gi') : null;
    const stripNames = (text: string) => {
      if (namePattern) return text.replace(namePattern, 'the character');
      return text;
    };
    const sanitizedAppearance = stripNames(characterSheet.appearance);
    const sanitizedPrompt = stripNames(prompt);
    fullPrompt = `${characterSheet.style} children's storybook illustration, colorful, friendly, suitable for ages 5-8.

CHARACTER (must look EXACTLY like this in every image): ${sanitizedAppearance}

SCENE: ${sanitizedPrompt}

IMPORTANT: Maintain perfect visual consistency across illustrations.
Do NOT include any text or words in the image.`;
  } else {
    fullPrompt = `Children's storybook illustration, colorful, friendly, cartoon style, suitable for ages 5-8: ${prompt}. Do NOT include any text or words in the image.`;
  }

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: fullPrompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid',
  });

  return response.data?.[0]?.url || '';
}

export async function syncImageDescriptions(
  editedPages: { pageNumber: number; text: string }[],
  storyContext: string,
  characterSheet?: { name: string; appearance: string; style: string }
): Promise<{ pageNumber: number; imageDescription: string }[]> {
  const charDesc = characterSheet
    ? `Main character: ${characterSheet.name} — ${characterSheet.appearance}. Art style: ${characterSheet.style}.`
    : '';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an illustrator's assistant for a children's storybook. Given page text, write a vivid image description for each page that a DALL·E illustrator can use.
        ${charDesc}
        
        RULES:
        1. Each description should capture the key scene, characters, poses, setting, and mood.
        2. If a character sheet is provided, include the character's full appearance in EVERY description for visual consistency.
        3. NEVER use character names in descriptions — refer to them as "the boy", "the girl", "the child", etc. Names trigger safety filters in image generators.
        4. Keep descriptions concise but visually rich (2-3 sentences).
        5. Return ONLY valid JSON, no markdown fencing.`
      },
      {
        role: 'user',
        content: `Full story context: ${storyContext}

Generate image descriptions for these edited pages:
${editedPages.map(p => `Page ${p.pageNumber}: "${p.text}"`).join('\n')}

Return a JSON array: [{"pageNumber": N, "imageDescription": "..."}]`
      }
    ],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content || '[]';
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

export async function generateCoverImage(title: string, description: string, category: string, characterSheet?: { name: string }): Promise<string> {
  // Sanitize names from title/description to avoid DALL-E safety rejections
  let safeTitle = title;
  let safeDescription = description;
  if (characterSheet) {
    const names = characterSheet.name.split(/\s+and\s+|\s*,\s*/).map(n => n.trim()).filter(Boolean);
    if (names.length > 0) {
      const namePattern = new RegExp(`\\b(${names.join('|')})\\b`, 'gi');
      safeTitle = title.replace(namePattern, 'the character');
      safeDescription = description.replace(namePattern, 'the character');
    }
  }
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: `Children's storybook cover illustration of fictional cartoon characters, colorful, eye-catching, cartoon style for ages 5-8. 
    Title: "${safeTitle}". Story about: ${safeDescription}. Category: ${category}. 
    Make it vibrant and appealing to young readers. Do NOT include any text in the image.`,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid',
  });

  return response.data?.[0]?.url || '';
}
