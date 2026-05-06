import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function generateStoryOutline(premise: string, category: string, pageCount: number = 6) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a children's storybook author. Create engaging, age-appropriate stories for kids aged 5-8. 
        Stories should have clear morals, colorful descriptions perfect for illustration, and simple vocabulary.
        Keep each page to 2-3 short sentences maximum.`
      },
      {
        role: 'user',
        content: `Create a ${pageCount}-page children's storybook outline about: "${premise}"
        Category: ${category}
        
        Return a JSON array with exactly ${pageCount} objects, each having:
        - "pageNumber": number (1-based)
        - "text": the story text for that page (2-3 short sentences, simple words)
        - "imageDescription": a vivid description of what the illustration should show (for DALL-E)
        
        Make it fun, colorful, and with a positive message at the end!
        Return ONLY valid JSON, no markdown fencing.`
      }
    ],
    temperature: 0.8,
  });

  const content = response.choices[0].message.content || '[]';
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

export async function generateImage(prompt: string): Promise<string> {
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: `Children's storybook illustration, colorful, friendly, cartoon style, suitable for ages 5-8: ${prompt}`,
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
