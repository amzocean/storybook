'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StarCatcher from '@/app/components/StarCatcher';

interface PageDraft {
  pageNumber: number;
  text: string;
  imageDescription: string;
  image_path?: string;
  generating?: boolean;
}

interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

const STEPS = ['Premise', 'Outline', 'Story & Art', 'Publish'];

export default function CreateStoryPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Premise
  const [premise, setPremise] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['adventure']);
  const [pageCount, setPageCount] = useState(6);
  const [detailLevel, setDetailLevel] = useState(3);
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'ai' | 'write'>('ai');

  // Step 2: Outline
  const [pages, setPages] = useState<PageDraft[]>([]);
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [editedByKid, setEditedByKid] = useState<Set<number>>(new Set());
  const [originalTexts, setOriginalTexts] = useState<Record<number, string>>({});
  const [fixingPage, setFixingPage] = useState<number | null>(null);

  // Step 3: Images
  const [generatingImages, setGeneratingImages] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [characterSheet, setCharacterSheet] = useState<{ name: string; appearance: string; style: string } | null>(null);
  const [generatedDescription, setGeneratedDescription] = useState<string>('');

  // Step 4: Publish
  const [coverImage, setCoverImage] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [authorName, setAuthorName] = useState('');

  // Compute author credit type
  const kidPageRatio = pages.length > 0 ? editedByKid.size / pages.length : 0;
  const authorCredit = mode === 'write' ? 'authored'
    : kidPageRatio >= 0.5 ? 'authored' : kidPageRatio > 0 ? 'coauthored' : 'imagined';
  const creditLine = authorName
    ? authorCredit === 'authored' ? `Story authored by ${authorName} ✨`
    : authorCredit === 'coauthored' ? `Story co-authored by ${authorName}`
    : `Story imagined by ${authorName}`
    : '';

  const storyId = useState(() => crypto.randomUUID())[0];

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories);
  }, []);

  // Generate outline from AI
  const generateOutline = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'outline', premise, category: selectedCategories.join(','), pageCount, title, detailLevel }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPages(data.outline);
      if (data.characterSheet) setCharacterSheet(data.characterSheet);
      if (data.description) setGeneratedDescription(data.description);
      // Store original AI texts for co-author tracking
      const originals: Record<number, string> = {};
      data.outline.forEach((p: PageDraft, i: number) => { originals[i] = p.text; });
      setOriginalTexts(originals);
      setEditedByKid(new Set());
      // Auto-generate a title from the first page
      if (!title) {
        const words = premise.split(' ').slice(0, 5).join(' ');
        setTitle(words.charAt(0).toUpperCase() + words.slice(1));
      }
      setStep(1);
    } catch (e: any) {
      setError(e.message || 'Failed to generate outline');
    }
    setLoading(false);
  };

  // Start with blank pages — kid writes everything
  const startBlankPages = () => {
    setMode('write');
    const blankPages: PageDraft[] = Array.from({ length: pageCount }, (_, i) => ({
      pageNumber: i + 1,
      text: '',
      imageDescription: '',
    }));
    setPages(blankPages);
    // All pages count as kid-written
    setEditedByKid(new Set(blankPages.map((_, i) => i)));
    setOriginalTexts({});
    // Auto-generate a title from the premise if not set
    if (!title && premise) {
      const words = premise.split(' ').slice(0, 5).join(' ');
      setTitle(words.charAt(0).toUpperCase() + words.slice(1));
    }
    setStep(1);
  };

  // Regenerate a single page
  const regeneratePage = async (pageNum: number) => {
    setLoading(true);
    setError('');
    try {
      const storyContext = pages.map(p => p.text).join(' ');
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate-page',
          currentText: pages[pageNum].text,
          instruction: editInstruction,
          storyContext,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const updated = [...pages];
      updated[pageNum] = { ...updated[pageNum], text: data.text, imageDescription: data.imageDescription };
      setPages(updated);
      setEditingPage(null);
      setEditInstruction('');
    } catch (e: any) {
      setError(e.message || 'Failed to regenerate');
    }
    setLoading(false);
  };

  // Polish My Story — AI polishes kid's text while keeping their ideas
  const fixMyStory = async (pageNum: number) => {
    setFixingPage(pageNum);
    try {
      const storyContext = pages.map(p => p.text).join(' ');
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate-page',
          currentText: pages[pageNum].text,
          instruction: 'Polish the grammar, spelling, and flow while keeping the child\'s original ideas, characters, and creativity intact. Do NOT change the story direction.',
          storyContext,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const updated = [...pages];
      updated[pageNum] = { ...updated[pageNum], text: data.text, imageDescription: data.imageDescription };
      setPages(updated);
      // Keep kid-edited flag since they wrote the original
    } catch (e: any) {
      setError(e.message || 'Failed to fix story');
    }
    setFixingPage(null);
  };

  // Surprise Me — AI writes a fresh version (resets kid-edit flag)
  const surpriseMe = async (pageNum: number) => {
    setFixingPage(pageNum);
    try {
      const storyContext = pages.map(p => p.text).join(' ');
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate-page',
          currentText: pages[pageNum].text,
          instruction: 'Write a completely fresh version of this page that fits the overall story. Be creative and fun!',
          storyContext,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const updated = [...pages];
      updated[pageNum] = { ...updated[pageNum], text: data.text, imageDescription: data.imageDescription };
      setPages(updated);
      // Update original text and remove kid-edit flag
      setOriginalTexts(prev => ({ ...prev, [pageNum]: data.text }));
      setEditedByKid(prev => { const next = new Set(prev); next.delete(pageNum); return next; });
    } catch (e: any) {
      setError(e.message || 'Failed to generate');
    }
    setFixingPage(null);
  };

  // Generate all images (parallel with concurrency limit)
  const generateAllImages = async () => {
    setGeneratingImages(true);
    setImageProgress(0);
    const updated = [...pages];

    // Sync image descriptions for manually edited pages
    const staleIndices = [...editedByKid];
    if (staleIndices.length > 0) {
      try {
        const editedPages = staleIndices.map(i => ({
          pageNumber: i + 1,
          text: updated[i].text,
        }));
        const storyContext = updated.map(p => p.text).join(' ');
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync-descriptions',
            editedPages,
            storyContext,
            characterSheet,
          }),
        });
        const data = await res.json();
        if (data.descriptions) {
          for (const desc of data.descriptions) {
            const idx = desc.pageNumber - 1;
            if (idx >= 0 && idx < updated.length) {
              updated[idx] = { ...updated[idx], imageDescription: desc.imageDescription };
            }
          }
          setPages([...updated]);
        }
      } catch (e) {
        console.error('Failed to sync image descriptions, using originals');
      }
    }

    const concurrency = 3;
    let completed = 0;

    // Process pages in parallel batches
    const imageErrors: string[] = [];
    const generatePage = async (i: number) => {
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate-image',
            prompt: updated[i].imageDescription,
            storyId,
            pageNumber: i + 1,
            characterSheet,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          const errMsg = data.error || `HTTP ${res.status}`;
          imageErrors.push(`Page ${i + 1}: ${errMsg}`);
          console.error(`Image gen failed for page ${i + 1}: ${errMsg}`);
        } else if (data.imageUrl) {
          updated[i] = { ...updated[i], image_path: data.imageUrl };
        }
      } catch (e: any) {
        imageErrors.push(`Page ${i + 1}: ${e.message || 'network error'}`);
        console.error(`Failed to generate image for page ${i + 1}`, e);
      }
      completed++;
      setImageProgress(completed);
      setPages([...updated]);
    };

    // Run with concurrency pool
    const queue = [...Array(updated.length).keys()];
    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length > 0) {
        const idx = queue.shift()!;
        await generatePage(idx);
      }
    });
    await Promise.all(workers);

    // Generate cover (can start after pages)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-cover', title, description: premise, category: selectedCategories.join(','), storyId, characterSheet }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        imageErrors.push(`Cover: ${data.error || `HTTP ${res.status}`}`);
      } else if (data.imageUrl) {
        setCoverImage(data.imageUrl);
      }
    } catch (e: any) {
      imageErrors.push(`Cover: ${e.message || 'network error'}`);
      console.error('Failed to generate cover', e);
    }

    if (imageErrors.length > 0) {
      setError(`Some images failed to generate:\n${imageErrors.join('\n')}`);
    }

    setGeneratingImages(false);
    setStep(3);
  };

  // Publish story
  const publishStory = async () => {
    setPublishing(true);
    try {
      // Create story
      await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: storyId, title, description: generatedDescription || premise, category: selectedCategories.join(','),
          tags: selectedCategories, cover_image: coverImage, status: 'published',
          detail_level: detailLevel,
          author_name: authorName || null,
          author_credit: authorCredit,
        }),
      });
      // Save pages
      await fetch(`/api/stories/${storyId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: pages.map((p, i) => ({
            pageNumber: i + 1, text: p.text,
            image_path: p.image_path, image_prompt: p.imageDescription,
          })),
        }),
      });
      // Submit for review
      await fetch(`/api/stories/${storyId}/publish`, { method: 'POST' });
      alert('🎉 Your story has been published and is now live in the library!');
      router.push('/');
    } catch (e: any) {
      setError(e.message || 'Failed to publish');
    }
    setPublishing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100 pb-20 relative overflow-hidden">
      {/* Floating decorations */}
      <div className="absolute top-20 left-10 text-5xl animate-float opacity-40 pointer-events-none">⭐</div>
      <div className="absolute top-40 right-16 text-4xl animate-float-slow opacity-30 pointer-events-none">🌈</div>
      <div className="absolute top-64 left-1/4 text-3xl animate-float opacity-20 pointer-events-none">☁️</div>
      <div className="absolute bottom-40 right-10 text-4xl animate-wiggle opacity-30 pointer-events-none">🦕</div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-white/80 hover:text-white text-sm font-medium">
            ← Back to Library
          </button>
          <h1 className="text-white font-bold text-lg">✨ Story Workshop</h1>
          <div className="text-white/70 text-sm font-medium">Step {step + 1}/4</div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow ${
                i <= step ? 'bg-purple-500 text-white' : 'bg-white/60 text-gray-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-sm hidden sm:block font-medium ${i <= step ? 'text-gray-800' : 'text-gray-400'}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-purple-500' : 'bg-gray-300'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="max-w-4xl mx-auto px-6 mb-4">
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm shadow">
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* STEP 0: Premise */}
      {step === 0 && (
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white/80 backdrop-blur-sm border-4 border-yellow-300 rounded-3xl p-5 sm:p-8 shadow-xl">
            <h2 className="text-gray-800 text-xl sm:text-2xl font-extrabold mb-2">💡 What's your story about?</h2>
            <p className="text-gray-500 mb-6">Describe your idea in a sentence or two. The AI will build a full story from it!</p>

            <label className="text-gray-700 text-sm font-medium mb-2 block">Story Title (optional)</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 mb-4 shadow-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
              placeholder="e.g., Rex's Space Adventure"
            />

            <label className="text-gray-700 text-sm font-medium mb-1 block">Your Story Idea</label>
            <p className="text-gray-400 text-xs mb-2">
              💡 Just a short idea — 1 or 2 sentences is perfect! The AI will turn it into a full story for you.
            </p>
            <textarea
              value={premise}
              onChange={e => {
                if (e.target.value.length <= 200) setPremise(e.target.value);
              }}
              maxLength={200}
              className={`w-full px-4 py-3 bg-white border rounded-xl text-gray-800 h-24 resize-none shadow-sm focus:ring-2 focus:ring-purple-300 ${
                premise.length > 180 ? 'border-amber-400' : 'border-gray-200'
              }`}
              placeholder="e.g., A friendly dinosaur who travels to outer space and makes friends with an alien..."
            />
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-400 text-xs">
                {premise.length === 0
                  ? '✨ Try: "A bunny who finds a magic key in the garden"'
                  : premise.length > 150
                  ? '👍 That\'s plenty! Keep it short — you can edit the full story next.'
                  : ''}
              </p>
              <span className={`text-xs ${premise.length > 180 ? 'text-amber-500' : 'text-gray-400'}`}>
                {premise.length}/200
              </span>
            </div>

            <label className="text-gray-700 text-sm font-medium mb-2 block">Categories <span className="text-gray-400">(pick one or more)</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {categories.map(cat => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategories(prev =>
                        isSelected
                          ? prev.filter(c => c !== cat.id)
                          : [...prev, cat.id]
                      );
                    }}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${
                      isSelected
                        ? 'ring-2 ring-purple-400 bg-purple-100 text-purple-800'
                        : 'bg-white text-gray-600 hover:bg-purple-50'
                    }`}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                );
              })}
            </div>

            <label className="text-gray-700 text-sm font-medium mb-2 block">Number of Pages</label>
            <input
              type="range"
              min={4}
              max={12}
              value={pageCount}
              onChange={e => setPageCount(Number(e.target.value))}
              className="w-full mb-2"
            />
            <p className="text-gray-500 text-sm mb-6">{pageCount} pages</p>

            <label className="text-gray-700 text-sm font-medium mb-2 block">Detail Level</label>
            <input
              type="range"
              min={1}
              max={5}
              value={detailLevel}
              onChange={e => setDetailLevel(Number(e.target.value))}
              className="w-full mb-2"
            />
            <p className="text-gray-500 text-sm mb-6">
              {detailLevel === 1 && '🍼 Toddler — 1 simple sentence per page'}
              {detailLevel === 2 && '🧒 Early Reader — 2 short sentences per page'}
              {detailLevel === 3 && '📖 Story Time — 3-4 sentences per page'}
              {detailLevel === 4 && '📚 Chapter Feel — 4-5 rich sentences per page'}
              {detailLevel === 5 && '🎓 Advanced — 5-6 detailed sentences per page'}
            </p>

            <button
              onClick={() => { setMode('ai'); generateOutline(); }}
              disabled={!premise || loading || selectedCategories.length === 0}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-extrabold rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Writing your story...
                </span>
              ) : '🪄 Generate Story Outline'}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
              <div className="relative flex justify-center"><span className="bg-white/80 px-3 text-gray-400 text-xs">or</span></div>
            </div>

            <button
              onClick={startBlankPages}
              disabled={loading || selectedCategories.length === 0}
              className="w-full py-3 bg-white border border-gray-200 hover:bg-purple-50 text-gray-600 hover:text-purple-700 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              ✏️ I want to write it myself — start with blank pages
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: Outline — Co-Author Mode */}
      {step === 1 && (
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white/80 backdrop-blur-sm border-4 border-yellow-300 rounded-3xl p-5 sm:p-8 shadow-xl">
            <h2 className="text-gray-800 text-xl sm:text-2xl font-extrabold mb-2">
              {mode === 'write' ? '✏️ Write Your Story' : '✏️ Co-Author Mode'}
            </h2>
            <p className="text-gray-500 mb-2">
              {mode === 'write'
                ? 'Write what happens on each page — AI will illustrate your words!'
                : 'Write your own version of each page, or keep the AI\'s suggestion!'}
            </p>
            
            {/* Co-author score — only in AI mode */}
            {mode === 'ai' && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-2 mb-6 flex items-center gap-2">
              <span className="text-yellow-500 text-lg">{'⭐'.repeat(editedByKid.size)}{editedByKid.size === 0 ? '📝' : ''}</span>
              <span className="text-yellow-700 text-sm font-medium">
                {editedByKid.size === 0
                  ? 'Try writing your own pages to earn stars!'
                  : `You wrote ${editedByKid.size}/${pages.length} pages!`}
              </span>
            </div>
            )}

            {characterSheet && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                <h3 className="text-purple-600 text-sm font-bold mb-2">🎭 Character Sheet (used for consistent illustrations)</h3>
                <p className="text-gray-700 text-sm"><strong>Name:</strong> {characterSheet.name}</p>
                <p className="text-gray-700 text-sm"><strong>Look:</strong> {characterSheet.appearance}</p>
                <p className="text-gray-700 text-sm"><strong>Art Style:</strong> {characterSheet.style}</p>
              </div>
            )}

            <div className="space-y-4 mb-8">
              {pages.map((page, i) => (
                <div key={i} className={`bg-white border rounded-xl p-4 transition-all shadow-sm ${
                  editedByKid.has(i) ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-400 text-xs font-bold">
                      PAGE {i + 1} {editedByKid.has(i) && '⭐'}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => fixMyStory(i)}
                        disabled={fixingPage === i || !editedByKid.has(i)}
                        className="px-2.5 py-1 bg-blue-500 hover:bg-blue-400 text-white text-xs rounded-lg disabled:opacity-30 transition-all shadow-sm"
                        title="AI polishes your writing while keeping your ideas"
                      >
                        {fixingPage === i ? '...' : '🪄 Make It Shine'}
                      </button>
                      <button
                        onClick={() => surpriseMe(i)}
                        disabled={fixingPage === i}
                        className="px-2.5 py-1 bg-pink-500 hover:bg-pink-400 text-white text-xs rounded-lg disabled:opacity-30 transition-all shadow-sm"
                        title="AI writes a brand new version"
                      >
                        {fixingPage === i ? '...' : '✨ Surprise Me!'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={page.text}
                    onChange={e => {
                      const updated = [...pages];
                      updated[i] = { ...updated[i], text: e.target.value };
                      setPages(updated);
                      // Track if kid has modified from original
                      if (e.target.value !== originalTexts[i]) {
                        setEditedByKid(prev => new Set(prev).add(i));
                      } else {
                        setEditedByKid(prev => { const next = new Set(prev); next.delete(i); return next; });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm h-24 resize-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all shadow-sm"
                    placeholder="Write your own version of this page..."
                  />
                  <p className="text-gray-500 text-xs mt-2 italic">🎨 {page.imageDescription}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="px-6 py-3 bg-white text-gray-600 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50"
              >
                ← Back
              </button>
              <button
                onClick={() => { setStep(2); generateAllImages(); }}
                disabled={mode === 'write' && pages.some(p => !p.text.trim())}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                🎨 Generate Illustrations
              </button>
            </div>
            {mode === 'write' && pages.some(p => !p.text.trim()) && (
              <p className="text-center text-amber-600 text-xs mt-2">✏️ Write something on every page before generating art!</p>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Generating Images */}
      {step === 2 && (
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white/80 backdrop-blur-sm border-4 border-yellow-300 rounded-3xl p-5 sm:p-8 text-center shadow-xl">
            <div className="text-5xl sm:text-6xl mb-4 animate-pulse">🎨</div>
            <h2 className="text-gray-800 text-xl sm:text-2xl font-extrabold mb-2">Creating Illustrations...</h2>
            <p className="text-gray-500 mb-6">
              DALL·E is painting your story! This takes about 30 seconds per page.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4 shadow-inner">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${(imageProgress / pages.length) * 100}%` }}
              />
            </div>
            <p className="text-gray-500 text-sm">
              {imageProgress} / {pages.length} pages illustrated
              {!generatingImages && imageProgress > 0 && ' + cover image'}
            </p>

            {/* Show generated images as horizontal carousel */}
            <div className="mt-6 -mx-2">
              <div className="flex gap-3 overflow-x-auto pb-3 px-2 snap-x snap-mandatory scrollbar-thin">
                {pages.map((page, i) => (
                  <div key={i} className="flex-none w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm snap-start">
                    {page.image_path ? (
                      <img src={page.image_path} alt={`Page ${i+1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                        {i < imageProgress ? '⏳' : `P${i+1}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mini-game while waiting */}
            {generatingImages && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <StarCatcher />
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Review & Publish */}
      {step === 3 && (
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white/80 backdrop-blur-sm border-4 border-yellow-300 rounded-3xl p-5 sm:p-8 shadow-xl">
            <h2 className="text-gray-800 text-xl sm:text-2xl font-extrabold mb-2">📖 Review Your Story</h2>
            <p className="text-gray-500 mb-6">Here&apos;s how it&apos;ll look! Make sure you&apos;re happy before publishing.</p>

            {/* Title edit */}
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 text-xl font-bold mb-4 shadow-sm focus:ring-2 focus:ring-purple-300"
            />

            {/* Author Certificate */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 rounded-3xl blur-sm opacity-40" />
              <div className="relative bg-gradient-to-b from-amber-50 via-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-3xl p-1 shadow-lg">
                <div className="border border-yellow-400/50 border-dashed rounded-2xl p-6 sm:p-8 text-center">
                  <div className="text-yellow-500 text-2xl tracking-[0.5em] mb-2">✦ ✦ ✦</div>
                  <h3 className="text-yellow-700 text-xs uppercase tracking-[0.3em] font-semibold mb-1">Certificate of Authorship</h3>
                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto mb-4" />

                  <p className="text-amber-600 text-sm italic mb-3">This story was brought to life by</p>

                  <input
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    className="w-full max-w-sm mx-auto block px-4 py-3 bg-transparent border-b-2 border-yellow-400 text-gray-800 text-2xl text-center font-serif placeholder:text-gray-300 focus:border-yellow-500 focus:outline-none transition-colors"
                    placeholder="Your name here..."
                  />

                  {authorName ? (
                    <div className="mt-4">
                      <div className={`inline-block px-6 py-2 rounded-full text-sm font-bold tracking-wide ${
                        authorCredit === 'authored' ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-400' :
                        authorCredit === 'coauthored' ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-400' :
                        'bg-purple-100 text-purple-700 ring-1 ring-purple-400'
                      }`}>
                        {authorCredit === 'authored' ? '⭐ Full Author' : authorCredit === 'coauthored' ? '🤝 Co-Author' : '💡 Story Creator'}
                      </div>
                      <p className="text-amber-600 text-xs mt-2 italic">{creditLine}</p>
                      <p className="text-yellow-600 text-xs mt-1">
                        {editedByKid.size}/{pages.length} pages written by you {'⭐'.repeat(editedByKid.size)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-pink-500 text-sm mt-4 animate-pulse">✨ Every great story deserves a name on it!</p>
                  )}

                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto mt-4 mb-2" />
                  <div className="text-yellow-500 text-2xl tracking-[0.5em]">✦ ✦ ✦</div>
                </div>
              </div>
            </div>

            {/* Cover */}
            {coverImage && (
              <div className="aspect-video max-w-md mx-auto rounded-2xl overflow-hidden mb-8 shadow-2xl">
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Pages preview */}
            <div className="space-y-6 mb-8">
              {pages.map((page, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  {page.image_path && (
                    <img src={page.image_path} alt={`Page ${i+1}`} className="w-full sm:w-32 h-48 sm:h-32 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-purple-400 text-xs font-bold">
                      PAGE {i + 1} {editedByKid.has(i) && '⭐'}
                    </span>
                    <p className="text-gray-700 mt-1">{page.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-white text-gray-600 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50"
              >
                ← Edit Outline
              </button>
              <button
                onClick={publishStory}
                disabled={publishing || !authorName.trim()}
                className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-extrabold rounded-xl text-lg disabled:opacity-50 shadow-lg"
              >
                {publishing ? '📤 Publishing...' : '🚀 Publish to Library!'}
              </button>
            </div>
            {!authorName.trim() && (
              <p className="text-center text-pink-500 text-sm mt-2 animate-pulse">⬆️ Please add your name above before publishing!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
