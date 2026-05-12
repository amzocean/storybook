import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://storysparks.fun';

  // Fetch all published stories
  const { data: stories } = await supabase
    .from('stories')
    .select('id, updated_at, created_at')
    .eq('status', 'published');

  const storyEntries: MetadataRoute.Sitemap = (stories || []).map((story) => ({
    url: `${baseUrl}/read/${story.id}`,
    lastModified: story.updated_at || story.created_at,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // Fetch categories for category pages (if they exist)
  const { data: categories } = await supabase
    .from('categories')
    .select('id');

  const categoryEntries: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
    url: `${baseUrl}/?category=${cat.id}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/admin/create`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...storyEntries,
    ...categoryEntries,
  ];
}
