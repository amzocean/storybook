import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

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
           For example, if the title is "Burhanuddin's Dino Adventure", the main character is named Burhanuddin. 
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
        - "characterSheet": an object describing the main character's visual appearance for consistent illustrations:
          - "name": the character's name (extract from title/premise, or create one)
          - "appearance": a detailed, fixed visual description (e.g., "a 7-year-old boy with short curly brown hair, brown eyes, light brown skin, wearing a red t-shirt with a star on it and blue jeans") 
          - "style": the art style to use (e.g., "Pixar-style 3D cartoon" or "bright watercolor storybook illustration")
        - "pages": an array of exactly ${pageCount} objects, each having:
          - "pageNumber": number (1-based)
          - "text": the story text for that page (${detail.sentences} — NOT fewer). Use the character's REAL name, never a substitute.
          - "imageDescription": a vivid description of what the illustration should show. ALWAYS include the character's full appearance description (from characterSheet) so every illustration looks the same. Describe pose, setting, and action but keep the character's look identical.
        
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
    fullPrompt = `${characterSheet.style} children's storybook illustration, colorful, friendly, suitable for ages 5-8.

MAIN CHARACTER (must look EXACTLY like this in every image): ${characterSheet.name} - ${characterSheet.appearance}

SCENE: ${prompt}

IMPORTANT: The character's face, hair, skin tone, and clothing must be exactly as described above. Maintain perfect visual consistency.
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

export async function generateCoverImage(title: string, description: string, category: string): Promise<string> {
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: `Children's storybook cover illustration, colorful, eye-catching, cartoon style for ages 5-8. 
    Title: "${title}". Story about: ${description}. Category: ${category}. 
    Make it vibrant and appealing to young readers. Do NOT include any text in the image.`,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid',
  });

  return response.data?.[0]?.url || '';
}
