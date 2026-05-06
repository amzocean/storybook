'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Page {
  id: string;
  page_number: number;
  text: string;
  image_path: string | null;
}

interface Story {
  id: string;
  title: string;
  pages: Page[];
}

export default function ReadStory() {
  const params = useParams();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const touchRef = useRef<{ startX: number; startY: number } | null>(null);

  useEffect(() => {
    fetch(`/api/stories/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setStory(data);
        setLoading(false);
      });
  }, [params.id]);

  const goNext = useCallback(() => {
    if (story && currentPage < story.pages.length - 1) {
      setCurrentPage(p => p + 1);
    }
  }, [story, currentPage]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
    }
  }, [currentPage]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') router.push('/');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, router]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    const dy = e.changedTouches[0].clientY - touchRef.current.startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchRef.current = null;
  }, [goNext, goPrev]);

  if (loading || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl animate-bounce mb-4">📖</div>
          <p className="text-amber-700 text-2xl font-bold">Opening your book...</p>
        </div>
      </div>
    );
  }

  const page = story.pages[currentPage];
  const progress = ((currentPage + 1) / story.pages.length) * 100;
  const isLastPage = currentPage === story.pages.length - 1;
  const isFirstPage = currentPage === 0;

  return (
    <div
      className="min-h-[100dvh] bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 flex flex-col select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bar */}
      <div className="h-2 bg-amber-100 flex-shrink-0 rounded-full mx-2 mt-2">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3 flex-shrink-0">
        <button
          onClick={() => router.push('/')}
          className="px-3 py-1.5 bg-white/80 hover:bg-white text-gray-700 rounded-full text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95"
        >
          🏠 Home
        </button>
        <h2 className="text-gray-700 font-extrabold text-xs sm:text-sm truncate max-w-[50%] text-center">{story.title}</h2>
        <span className="px-3 py-1.5 bg-white/80 text-gray-600 rounded-full text-xs sm:text-sm font-bold shadow-md">
          📄 {currentPage + 1}/{story.pages.length}
        </span>
      </div>

      {/* Page Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Left nav (desktop) */}
        <button
          onClick={goPrev}
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white shadow-lg rounded-full items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all disabled:opacity-20"
          disabled={isFirstPage}
        >
          ⬅️
        </button>

        {/* Right nav (desktop) */}
        <button
          onClick={goNext}
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white shadow-lg rounded-full items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all disabled:opacity-20"
          disabled={isLastPage}
        >
          ➡️
        </button>

        {/* The page itself */}
        <div className="max-w-2xl w-full">
          {page?.image_path && (
            <div className="relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden mb-4 sm:mb-6 shadow-xl border-4 border-white">
              <img
                src={page.image_path}
                alt={`Page ${currentPage + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          )}
          <div className="bg-white/80 rounded-2xl px-5 sm:px-8 py-4 sm:py-6 shadow-lg border-2 border-amber-200/50">
            <p className="text-gray-800 text-lg sm:text-xl md:text-2xl lg:text-3xl text-center leading-relaxed sm:leading-relaxed font-semibold">
              {page?.text}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile nav buttons */}
      <div className="flex sm:hidden items-center justify-between px-6 py-3 flex-shrink-0">
        <button
          onClick={goPrev}
          disabled={isFirstPage}
          className="px-5 py-2.5 bg-white rounded-full text-gray-700 font-bold text-sm disabled:opacity-30 active:scale-95 shadow-lg transition-all"
        >
          ⬅️ Back
        </button>
        <button
          onClick={goNext}
          disabled={isLastPage}
          className="px-5 py-2.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full text-white font-bold text-sm disabled:opacity-30 active:scale-95 shadow-lg transition-all"
        >
          Next ➡️
        </button>
      </div>

      {/* Page dots */}
      <div className="flex justify-center gap-1.5 sm:gap-2 pb-4 sm:pb-6 flex-shrink-0 flex-wrap px-4">
        {story.pages.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all shadow-sm ${
              i === currentPage
                ? 'bg-gradient-to-r from-green-400 to-emerald-500 scale-125 ring-2 ring-green-200'
                : 'bg-amber-200 hover:bg-amber-300'
            }`}
          />
        ))}
      </div>

      {/* End of story celebration */}
      {isLastPage && (
        <div className="text-center pb-6">
          <p className="text-2xl font-extrabold text-amber-700 animate-bounce">🎉 The End! 🎉</p>
        </div>
      )}
    </div>
  );
}
