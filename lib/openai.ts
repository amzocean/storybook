import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function generateStoryOutline(premise: string, category: string, pageCount: number = 6, title: string = '') {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a children's storybook author. Create engaging, age-appropriate stories for kids aged 5-8. 
        Stories should have clear morals, colorful descriptions perfect for illustration, and simple vocabulary.
        Keep each page to 2-3 short sentences maximum.
        
        IMPORTANT RULES:
        1. If the title or premise contains a person's name, that MUST be the main character's name. 
           For example, if the title is "Burhanuddin's Dino Adventure", the main character is named Burhanuddin. 
           NEVER substitute a different name like Tommy, Sam, etc.
        2. Use the character's actual name consistently on every page.`
      },
      {
        role: 'user',
        content: `Create a ${pageCount}-page children's storybook.
        Title: "${title}"
        Premise: "${premise}"
        Category: ${category}
        
        Return a JSON object with:
        - "characterSheet": an object describing the main character's visual appearance for consistent illustrations:
          - "name": the character's name (extract from title/premise, or create one)
          - "appearance": a detailed, fixed visual description (e.g., "a 7-year-old boy with short curly brown hair, brown eyes, light brown skin, wearing a red t-shirt with a star on it and blue jeans") 
          - "style": the art style to use (e.g., "Pixar-style 3D cartoon" or "bright watercolor storybook illustration")
        - "pages": an array of exactly ${pageCount} objects, each having:
          - "pageNumber": number (1-based)
          - "text": the story text for that page (2-3 short sentences, simple words). Use the character's REAL name, never a substitute.
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
        Keep it age-appropriate for kids 5-8, 2-3 short sentences max.`
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
