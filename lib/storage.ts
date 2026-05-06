import { supabase, getStoragePublicUrl } from './supabase';

const BUCKET = 'story-images';

export async function downloadAndSaveImage(url: string, storyId: string, filename: string): Promise<string> {
  // Download image from URL (e.g. DALL·E)
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const storagePath = `${storyId}/${filename}`;

  // Upload to Supabase Storage (upsert to overwrite if exists)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) throw new Error(`Failed to upload image: ${error.message}`);

  return getStoragePublicUrl(BUCKET, storagePath);
}

export async function deleteStoryImages(storyId: string) {
  // List all files in the story folder
  const { data: files } = await supabase.storage
    .from(BUCKET)
    .list(storyId);

  if (files && files.length > 0) {
    const paths = files.map(f => `${storyId}/${f.name}`);
    await supabase.storage.from(BUCKET).remove(paths);
  }
}
