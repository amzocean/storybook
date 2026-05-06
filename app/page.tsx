'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

const STORY_CTAS = [
  '💡 I Have a Story Idea!',
  '✨ Imagine a Story!',
  '🌟 Create a Story!',
];

interface Story {
  id: string;
  title: string;
  description: string;
  category: string;
  cover_image: string;
  page_count: number;
  tags: string;
  detail_level: number;
  age_range: string;
  author_name: string | null;
  author_credit: string | null;
}

interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export default function HomePage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedReader, setSelectedReader] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const storyCta = useMemo(() => STORY_CTAS[Math.floor(Math.random() * STORY_CTAS.length)], []);

  const readerLevels = [
    { id: 'all', label: '🌟 All Levels', levels: [] as number[] },
    { id: 'toddler', label: '🍼 Toddler', levels: [1] },
    { id: 'early', label: '🧒 Early Reader', levels: [2] },
    { id: 'storytime', label: '📖 Story Time', levels: [3] },
    { id: 'chapter', label: '📚 Chapter', levels: [4] },
    { id: 'advanced', label: '🎓 Advanced', levels: [5] },
  ];

  useEffect(() => {
    Promise.all([
      fetch('/api/stories').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([storiesData, categoriesData]) => {
      setStories(storiesData);
      setCategories(categoriesData);
      setLoading(false);
    });
  }, []);

  const filteredStories = stories.filter(s => {
    const catMatch = selectedCategory === 'all' || s.category === selectedCategory;
    const readerMatch = selectedReader === 'all' || 
      readerLevels.find(r => r.id === selectedReader)?.levels.includes(s.detail_level || 3);
    return catMatch && readerMatch;
  });

  const getCategoryInfo = (catId: string) => categories.find(c => c.id === catId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl animate-bounce mb-4">🚀</div>
          <p className="text-sky-800 text-2xl font-bold">Loading adventures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100 relative overflow-hidden">
      {/* Floating decorations */}
      <div className="absolute top-20 left-10 text-5xl animate-float opacity-40 pointer-events-none">⭐</div>
      <div className="absolute top-40 right-16 text-4xl animate-float-slow opacity-30 pointer-events-none">🌈</div>
      <div className="absolute top-64 left-1/4 text-3xl animate-float opacity-20 pointer-events-none">☁️</div>
      <div className="absolute top-32 right-1/3 text-6xl animate-float-slow opacity-20 pointer-events-none">☁️</div>
      <div className="absolute bottom-40 right-10 text-4xl animate-wiggle opacity-30 pointer-events-none">🦕</div>
      <div className="absolute bottom-20 left-20 text-3xl animate-float opacity-25 pointer-events-none">🚀</div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <span className="text-3xl sm:text-4xl animate-wiggle">✨</span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white drop-shadow-lg">
              Story Sparks
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all text-lg"
              title="Manage Stories"
            >
              ⚙️
            </Link>
            <Link
              href="/admin/create"
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-full text-sm sm:text-base font-extrabold transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 animate-pulse hover:animate-none whitespace-nowrap"
              title="Create Story"
            >
              ✏️ Create!
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {stories.length > 0 ? (
        <section className="relative px-4 sm:px-6 pt-8 pb-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-yellow-300">
              <div className="flex flex-col md:flex-row">
                {/* Cover image */}
                <div className="md:w-1/3 aspect-square md:aspect-auto">
                  {stories[0]?.cover_image ? (
                    <img
                      src={stories[0].cover_image}
                      alt={stories[0].title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full min-h-[200px] bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <span className="text-8xl">📖</span>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold mb-3 w-fit">
                    ⭐ Latest Story
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 mb-2">{stories[0]?.title}</h2>
                  <p className="text-gray-500 text-base sm:text-lg mb-2 line-clamp-2">{stories[0]?.description}</p>
                  {stories[0]?.author_name && (
                    <p className="text-gray-400 text-sm mb-4 italic">
                      {stories[0].author_credit === 'authored' ? '✨ By' : stories[0].author_credit === 'coauthored' ? '🤝 Co-authored by' : '💭 Imagined by'} {stories[0].author_name}
                    </p>
                  )}
                  <Link
                    href={`/read/${stories[0]?.id}`}
                    className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 text-white font-bold rounded-full transition-all text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 w-fit"
                  >
                    📖 Read Now!
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Category Filter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-700 mb-3 sm:mb-4">🗂️ Pick a Category!</h2>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 hide-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-sm sm:text-base whitespace-nowrap transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 ${
              selectedCategory === 'all'
                ? 'bg-yellow-400 text-gray-800 ring-4 ring-yellow-200'
                : 'bg-white text-gray-600 hover:bg-yellow-50'
            }`}
          >
            🌟 All Stories
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-sm sm:text-base whitespace-nowrap transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 ${
                selectedCategory === cat.id
                  ? 'text-white ring-4 ring-white/50'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              style={selectedCategory === cat.id ? { backgroundColor: cat.color } : {}}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Reader Level Filter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-4 sm:pb-6">
        <h2 className="text-lg sm:text-xl font-extrabold text-gray-700 mb-2 sm:mb-3">📏 Reader Level</h2>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 hide-scrollbar">
          {readerLevels.map(level => (
            <button
              key={level.id}
              onClick={() => setSelectedReader(level.id)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 ${
                selectedReader === level.id
                  ? 'bg-purple-500 text-white ring-4 ring-purple-200'
                  : 'bg-white text-gray-600 hover:bg-purple-50'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </section>

      {/* Story Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {stories.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <div className="text-7xl sm:text-8xl mb-4 animate-bounce">🦖</div>
            <h3 className="text-gray-700 text-2xl sm:text-3xl font-extrabold mb-2">No stories yet!</h3>
            <p className="text-gray-500 text-base sm:text-lg mb-6">Let&apos;s create your first adventure!</p>
            <Link
              href="/admin/create"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold rounded-full text-lg shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              {storyCta}
            </Link>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-gray-700 text-xl font-bold mb-2">No stories in this category yet!</h3>
            <button onClick={() => setSelectedCategory('all')} className="text-blue-500 font-bold hover:underline text-lg">
              Show all stories →
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-700 mb-4 sm:mb-6">
              {selectedCategory === 'all' ? '📚 All Adventures' : `${getCategoryInfo(selectedCategory)?.emoji} ${getCategoryInfo(selectedCategory)?.name} Stories`}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {filteredStories.map(story => {
                const cat = getCategoryInfo(story.category);
                return (
                  <Link key={story.id} href={`/read/${story.id}`} className="group">
                    <div className="relative aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden bg-white border-4 border-white shadow-lg group-hover:shadow-2xl transition-all group-hover:scale-105 group-hover:-rotate-1 active:scale-95">
                      {story.cover_image ? (
                        <img
                          src={story.cover_image}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
                          <span className="text-6xl sm:text-7xl">{cat?.emoji || '📖'}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute top-2 right-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/90 text-gray-700 font-bold shadow">
                          {story.age_range ? `Ages ${story.age_range}` : 'Ages 5-7'}
                        </span>
                      </div>
                      <div className="absolute bottom-0 p-3 sm:p-4">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full text-white font-bold mb-1.5 inline-block"
                          style={{ backgroundColor: cat?.color || '#888' }}
                        >
                          {cat?.emoji} {cat?.name}
                        </span>
                        <h3 className="text-white font-extrabold text-sm sm:text-base leading-tight drop-shadow-lg">{story.title}</h3>
                        <p className="text-white/80 text-xs mt-0.5 font-medium">{story.page_count} pages 📄</p>
                        {story.author_name && (
                          <p className="text-white/70 text-xs mt-0.5 italic">
                            {story.author_credit === 'authored' ? '✨ By' : story.author_credit === 'coauthored' ? '🤝 Co-authored by' : '💭 Imagined by'} {story.author_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Fun footer */}
      <footer className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 py-4 text-center">
        <p className="text-white font-bold text-sm sm:text-base">
          Made with 💖 for Burhanuddin — Sparking stories for kids everywhere ✨
        </p>
      </footer>
    </div>
  );
}
