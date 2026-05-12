import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import StoryReader from './StoryReader';

interface Props {
  params: Promise<{ id: string }>;
}

async function getStory(id: string) {
  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !story) return null;

  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .eq('story_id', id)
    .order('page_number');

  // Fetch category metadata
  let categoryEmoji = '';
  let categoryName = '';
  if (story.category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('name, emoji')
      .eq('id', story.category)
      .single();
    if (cat) {
      categoryEmoji = cat.emoji;
      categoryName = cat.name;
    }
  }

  return {
    ...story,
    pages: pages || [],
    categoryEmoji,
    categoryName,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const story = await getStory(id);

  if (!story) {
    return { title: 'Story Not Found — Story Sparks ✨' };
  }

  const authorLine = story.author_name
    ? story.author_credit === 'authored' ? `Written by ${story.author_name}`
    : story.author_credit === 'coauthored' ? `Co-authored by ${story.author_name}`
    : `Imagined by ${story.author_name}`
    : 'A Story Sparks creation';

  const pageCount = story.pages?.length || 0;
  const ageLabel = story.age_range ? `Ages ${story.age_range}` : '';
  const description = story.description
    || `${authorLine}. ${pageCount}-page illustrated story${ageLabel ? ` for ${ageLabel}` : ''}. Read it free on Story Sparks!`;

  return {
    title: `${story.title} — Story Sparks ✨`,
    description,
    openGraph: {
      title: story.title,
      description,
      type: 'article',
      siteName: 'Story Sparks ✨',
      images: story.cover_image
        ? [{ url: story.cover_image, width: 1024, height: 1024, alt: story.title }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: story.title,
      description,
      images: story.cover_image ? [story.cover_image] : [],
    },
  };
}

export default async function ReadStoryPage({ params }: Props) {
  const { id } = await params;
  const story = await getStory(id);

  if (!story) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-4">😢</div>
          <p className="text-amber-700 text-2xl font-bold">Story not found</p>
          <a href="/" className="mt-4 inline-block px-6 py-2 bg-amber-500 text-white rounded-full font-bold">
            🏠 Go Home
          </a>
        </div>
      </div>
    );
  }

  return <StoryReader story={story} />;
}
