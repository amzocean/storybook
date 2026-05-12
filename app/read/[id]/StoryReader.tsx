'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';

interface PageData {
  id: string;
  page_number: number;
  text: string;
  image_path: string | null;
}

interface StoryData {
  id: string;
  title: string;
  description?: string;
  category?: string;
  cover_image?: string;
  age_range?: string;
  detail_level?: number;
  author_name?: string;
  author_credit?: string;
  pages: PageData[];
  categoryEmoji?: string;
  categoryName?: string;
}

function getReadingTime(pages: PageData[]): string {
  const totalWords = pages.reduce((sum, p) => sum + (p.text?.split(/\s+/).length || 0), 0);
  const minutes = Math.max(1, Math.ceil(totalWords / 150)); // ~150 wpm for kids
  return `${minutes} min read`;
}

function getAuthorLabel(credit?: string): string {
  if (credit === 'authored') return 'Written by';
  if (credit === 'coauthored') return 'Co-authored by';
  return 'Imagined by';
}

function getAuthorEmoji(credit?: string): string {
  if (credit === 'authored') return '✏️';
  if (credit === 'coauthored') return '🤝';
  return '💭';
}

export default function StoryReader({ story }: { story: StoryData }) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(-1); // -1 = cover page
  const [copied, setCopied] = useState(false);
  const touchRef = useRef<{ startX: number; startY: number } | null>(null);

  const totalPages = story.pages.length;
  const isOnCover = currentPage === -1;
  const isOnEnd = currentPage === totalPages; // end page after last story page
  const isLastPage = currentPage === totalPages; // end is the true last page
  const isFirstPage = currentPage === -1;

  const handleShare = async () => {
    const url = window.location.href;
    const title = story.title;
    const authorLine = story.author_name
      ? story.author_credit === 'authored' ? `, written by ${story.author_name}`
      : story.author_credit === 'coauthored' ? `, co-authored by ${story.author_name}`
      : `, imagined by ${story.author_name}`
      : '';
    const text = `Read "${title}"${authorLine} on Story Sparks! ✨`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const goNext = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(p => p + 1);
    }
  }, [currentPage, totalPages]);

  const goPrev = useCallback(() => {
    if (currentPage > -1) {
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

  const progress = ((currentPage + 2) / (totalPages + 2)) * 100; // cover(-1) + pages(0..N-1) + end(N)

  // Cover page view
  if (isOnCover) {
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 bg-white/80 hover:bg-white text-gray-700 rounded-full text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95"
            >
              {copied ? '✅ Copied!' : '📤 Share'}
            </button>
          </div>
        </div>

        {/* Cover content */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-lg w-full text-center">
            {/* Big cover image */}
            {story.cover_image && (
              <div className="relative aspect-square rounded-3xl overflow-hidden mb-6 shadow-2xl border-4 border-white mx-auto max-w-sm">
                <img
                  src={story.cover_image}
                  alt={story.title}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-amber-800 mb-3 leading-tight">
              {story.title}
            </h1>

            {/* Description */}
            {story.description && (
              <p className="text-amber-700/80 text-base sm:text-lg mb-4 italic">
                {story.description}
              </p>
            )}

            {/* Metadata badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
              {story.categoryEmoji && story.categoryName && (
                <span className="px-3 py-1 bg-white/80 rounded-full text-sm font-bold shadow-sm border border-amber-200/50">
                  {story.categoryEmoji} {story.categoryName}
                </span>
              )}
              {story.age_range && (
                <span className="px-3 py-1 bg-white/80 rounded-full text-sm font-bold shadow-sm border border-amber-200/50">
                  👶 Ages {story.age_range}
                </span>
              )}
              <span className="px-3 py-1 bg-white/80 rounded-full text-sm font-bold shadow-sm border border-amber-200/50">
                📖 {totalPages} pages
              </span>
              <span className="px-3 py-1 bg-white/80 rounded-full text-sm font-bold shadow-sm border border-amber-200/50">
                ⏱️ {getReadingTime(story.pages)}
              </span>
            </div>

            {/* Author credit */}
            {story.author_name && (
              <div className="bg-white/60 rounded-2xl px-5 py-3 inline-block shadow-sm border border-amber-200/30 mb-6">
                <p className="text-amber-700 font-semibold text-base sm:text-lg">
                  {getAuthorEmoji(story.author_credit)} {getAuthorLabel(story.author_credit)}{' '}
                  <span className="text-amber-900 font-bold">{story.author_name}</span>
                </p>
              </div>
            )}

            {/* Start reading button */}
            <div>
              <button
                onClick={goNext}
                className="px-8 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-extrabold text-lg rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all animate-pulse"
              >
                Start Reading ✨
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // End page view (separate full-screen page like cover)
  if (isOnEnd) {
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
            onClick={() => setCurrentPage(-1)}
            className="px-3 py-1.5 bg-white/80 hover:bg-white text-gray-700 rounded-full text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95"
          >
            📖 Cover
          </button>
          <h2 className="text-gray-700 font-extrabold text-xs sm:text-sm truncate max-w-[40%] text-center">{story.title}</h2>
          <button
            onClick={handleShare}
            className="px-3 py-1.5 bg-white/80 hover:bg-white text-gray-700 rounded-full text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95"
          >
            {copied ? '✅ Copied!' : '📤 Share'}
          </button>
        </div>

        {/* End page content */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
          {/* Left nav (desktop) */}
          <button
            onClick={goPrev}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white shadow-lg rounded-full items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all"
          >
            ⬅️
          </button>

          <div className="max-w-lg w-full text-center">
            {/* Cover image */}
            {story.cover_image && (
              <div className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-2xl overflow-hidden mx-auto mb-5 shadow-xl border-4 border-white">
                <img
                  src={story.cover_image}
                  alt={story.title}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            )}

            <p className="text-3xl sm:text-4xl font-extrabold text-amber-700 mb-1">🎉 The End!</p>
            <h3 className="text-xl sm:text-2xl font-bold text-amber-800 mb-2">{story.title}</h3>

            {story.author_name && (
              <p className="text-amber-600 font-semibold text-base sm:text-lg mb-4">
                {getAuthorEmoji(story.author_credit)} {getAuthorLabel(story.author_credit)}{' '}
                <span className="text-amber-800 font-bold">{story.author_name}</span>
              </p>
            )}

            {/* Metadata badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
              {story.categoryEmoji && story.categoryName && (
                <span className="px-3 py-1 bg-white/80 rounded-full text-sm font-bold shadow-sm border border-amber-200/50">
                  {story.categoryEmoji} {story.categoryName}
                </span>
              )}
              {story.age_range && (
                <span className="px-3 py-1 bg-white/80 rounded-full text-sm font-bold shadow-sm border border-amber-200/50">
                  👶 Ages {story.age_range}
                </span>
              )}
              <span className="px-3 py-1 bg-white/80 rounded-full text-sm font-bold shadow-sm border border-amber-200/50">
                📖 {totalPages} pages
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => router.push('/admin/create')}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                ✨ Make Your Own Story
              </button>
              <button
                onClick={handleShare}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-400 to-cyan-500 text-white font-bold rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                {copied ? '✅ Copied!' : '📤 Share This Story'}
              </button>
              <a
                href={`/api/stories/${story.id}/pdf`}
                download
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all text-center"
              >
                🖨️ Download Printable Storybook
              </a>
              <button
                onClick={() => router.push('/')}
                className="w-full sm:w-auto px-6 py-2.5 bg-white text-amber-700 font-bold rounded-full shadow-lg border-2 border-amber-200 hover:scale-105 active:scale-95 transition-all"
              >
                📚 Read More Stories
              </button>
            </div>

            {/* QR code for sharing */}
            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="bg-white p-3 rounded-xl shadow-md">
                <QRCode
                  value={`https://storysparks.fun/read/${story.id}`}
                  size={96}
                  level="M"
                />
              </div>
              <p className="text-xs text-amber-600 font-medium">Scan to share this story</p>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex sm:hidden items-center justify-center px-6 py-3 flex-shrink-0">
          <button
            onClick={goPrev}
            className="px-5 py-2.5 bg-white rounded-full text-gray-700 font-bold text-sm active:scale-95 shadow-lg transition-all"
          >
            ⬅️ Back
          </button>
        </div>

        {/* Page dots */}
        <div className="flex justify-center gap-1.5 sm:gap-2 pb-4 sm:pb-6 flex-shrink-0 flex-wrap px-4">
          <button
            onClick={() => setCurrentPage(-1)}
            className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all shadow-sm bg-amber-200 hover:bg-amber-300"
            title="Cover"
          />
          {story.pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all shadow-sm bg-amber-200 hover:bg-amber-300"
            />
          ))}
          <button
            onClick={() => setCurrentPage(totalPages)}
            className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all shadow-sm bg-gradient-to-r from-green-400 to-emerald-500 scale-125 ring-2 ring-green-200"
            title="The End"
          />
        </div>
      </div>
    );
  }

  // Regular page view
  const page = story.pages[currentPage];

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
          onClick={() => setCurrentPage(-1)}
          className="px-3 py-1.5 bg-white/80 hover:bg-white text-gray-700 rounded-full text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95"
        >
          📖 Cover
        </button>
        <h2 className="text-gray-700 font-extrabold text-xs sm:text-sm truncate max-w-[40%] text-center">{story.title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="px-3 py-1.5 bg-white/80 hover:bg-white text-gray-700 rounded-full text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95"
          >
            {copied ? '✅ Copied!' : '📤 Share'}
          </button>
          <span className="px-3 py-1.5 bg-white/80 text-gray-600 rounded-full text-xs sm:text-sm font-bold shadow-md">
            📄 {currentPage + 1}/{totalPages}
          </span>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Left nav (desktop) */}
        <button
          onClick={goPrev}
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white shadow-lg rounded-full items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all"
        >
          ⬅️
        </button>

        {/* Right nav (desktop) */}
        <button
          onClick={goNext}
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white shadow-lg rounded-full items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all"
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
          className="px-5 py-2.5 bg-white rounded-full text-gray-700 font-bold text-sm active:scale-95 shadow-lg transition-all"
        >
          ⬅️ Back
        </button>
        <button
          onClick={goNext}
          className="px-5 py-2.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full text-white font-bold text-sm active:scale-95 shadow-lg transition-all"
        >
          Next ➡️
        </button>
      </div>

      {/* Page dots (cover + pages + end) */}
      <div className="flex justify-center gap-1.5 sm:gap-2 pb-4 sm:pb-6 flex-shrink-0 flex-wrap px-4">
        {/* Cover dot */}
        <button
          onClick={() => setCurrentPage(-1)}
          className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all shadow-sm bg-amber-200 hover:bg-amber-300"
          title="Cover"
        />
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
        {/* End dot */}
        <button
          onClick={() => setCurrentPage(totalPages)}
          className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all shadow-sm bg-amber-200 hover:bg-amber-300"
          title="The End"
        />
      </div>
    </div>
  );
}


