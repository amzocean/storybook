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
        if (data.imageUrl) {
          updated[i] = { ...updated[i], image_path: data.imageUrl };
        }
      } catch (e) {
        console.error(`Failed to generate image for page ${i + 1}`);
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
        body: JSON.stringify({ action: 'generate-cover', title, description: premise, category: selectedCategories.join(','), storyId }),
      });
      const data = await res.json();
      if (data.imageUrl) setCoverImage(data.imageUrl);
    } catch (e) {
      console.error('Failed to generate cover');
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
          id: storyId, title, description: premise, category: selectedCategories.join(','),
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
      alert('🎉 Your story has been submitted! It will appear in the library once reviewed.');
      router.push('/');
    } catch (e: any) {
      setError(e.message || 'Failed to publish');
    }
    setPublishing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 pb-20">
      {/* Header */}
      <header className="bg-black/30 border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-white/70 hover:text-white text-sm">
            ← Back to Library
          </button>
          <h1 className="text-white font-bold">✨ Story Workshop</h1>
          <div className="text-white/50 text-sm">Step {step + 1}/4</div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                i <= step ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/40'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i <= step ? 'text-white' : 'text-white/40'}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-purple-500' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="max-w-4xl mx-auto px-6 mb-4">
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* STEP 0: Premise */}
      {step === 0 && (
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
            <h2 className="text-white text-xl sm:text-2xl font-bold mb-2">💡 What's your story about?</h2>
            <p className="text-gray-400 mb-6">Describe your idea in a sentence or two. The AI will build a full story from it!</p>

            <label className="text-white text-sm font-medium mb-2 block">Story Title (optional)</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white mb-4"
              placeholder="e.g., Rex's Space Adventure"
            />

            <label className="text-white text-sm font-medium mb-1 block">Your Story Idea</label>
            <p className="text-gray-400 text-xs mb-2">
              💡 Just a short idea — 1 or 2 sentences is perfect! The AI will turn it into a full story for you.
            </p>
            <textarea
              value={premise}
              onChange={e => {
                if (e.target.value.length <= 200) setPremise(e.target.value);
              }}
              maxLength={200}
              className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white h-24 resize-none ${
                premise.length > 180 ? 'border-amber-400/60' : 'border-white/20'
              }`}
              placeholder="e.g., A friendly dinosaur who travels to outer space and makes friends with an alien..."
            />
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-500 text-xs">
                {premise.length === 0
                  ? '✨ Try: "A bunny who finds a magic key in the garden"'
                  : premise.length > 150
                  ? '👍 That\'s plenty! Keep it short — you can edit the full story next.'
                  : ''}
              </p>
              <span className={`text-xs ${premise.length > 180 ? 'text-amber-400' : 'text-gray-500'}`}>
                {premise.length}/200
              </span>
            </div>

            <label className="text-white text-sm font-medium mb-2 block">Categories <span className="text-white/50">(pick one or more)</span></label>
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
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? 'ring-2 ring-purple-400 bg-white/15 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                );
              })}
            </div>

            <label className="text-white text-sm font-medium mb-2 block">Number of Pages</label>
            <input
              type="range"
              min={4}
              max={12}
              value={pageCount}
              onChange={e => setPageCount(Number(e.target.value))}
              className="w-full mb-2"
            />
            <p className="text-gray-400 text-sm mb-6">{pageCount} pages</p>

            <label className="text-white text-sm font-medium mb-2 block">Detail Level</label>
            <input
              type="range"
              min={1}
              max={5}
              value={detailLevel}
              onChange={e => setDetailLevel(Number(e.target.value))}
              className="w-full mb-2"
            />
            <p className="text-gray-400 text-sm mb-6">
              {detailLevel === 1 && '🍼 Toddler — 1 simple sentence per page'}
              {detailLevel === 2 && '🧒 Early Reader — 2 short sentences per page'}
              {detailLevel === 3 && '📖 Story Time — 3-4 sentences per page'}
              {detailLevel === 4 && '📚 Chapter Feel — 4-5 rich sentences per page'}
              {detailLevel === 5 && '🎓 Advanced — 5-6 detailed sentences per page'}
            </p>

            <button
              onClick={() => { setMode('ai'); generateOutline(); }}
              disabled={!premise || loading || selectedCategories.length === 0}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Writing your story...
                </span>
              ) : '🪄 Generate Story Outline'}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center"><span className="bg-white/5 px-3 text-gray-500 text-xs">or</span></div>
            </div>

            <button
              onClick={startBlankPages}
              disabled={loading || selectedCategories.length === 0}
              className="w-full py-3 bg-white/5 border border-white/20 hover:bg-white/10 text-white/70 hover:text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✏️ I want to write it myself — start with blank pages
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: Outline — Co-Author Mode */}
      {step === 1 && (
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
            <h2 className="text-white text-xl sm:text-2xl font-bold mb-2">
              {mode === 'write' ? '✏️ Write Your Story' : '✏️ Co-Author Mode'}
            </h2>
            <p className="text-gray-400 mb-2">
              {mode === 'write'
                ? 'Write what happens on each page — AI will illustrate your words!'
                : 'Write your own version of each page, or keep the AI\'s suggestion!'}
            </p>
            
            {/* Co-author score — only in AI mode */}
            {mode === 'ai' && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2 mb-6 flex items-center gap-2">
              <span className="text-yellow-400 text-lg">{'⭐'.repeat(editedByKid.size)}{editedByKid.size === 0 ? '📝' : ''}</span>
              <span className="text-yellow-200 text-sm font-medium">
                {editedByKid.size === 0
                  ? 'Try writing your own pages to earn stars!'
                  : `You wrote ${editedByKid.size}/${pages.length} pages!`}
              </span>
            </div>
            )}

            {characterSheet && (
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4 mb-6">
                <h3 className="text-purple-300 text-sm font-bold mb-2">🎭 Character Sheet (used for consistent illustrations)</h3>
                <p className="text-white text-sm"><strong>Name:</strong> {characterSheet.name}</p>
                <p className="text-white text-sm"><strong>Look:</strong> {characterSheet.appearance}</p>
                <p className="text-white text-sm"><strong>Art Style:</strong> {characterSheet.style}</p>
              </div>
            )}

            <div className="space-y-4 mb-8">
              {pages.map((page, i) => (
                <div key={i} className={`bg-white/5 border rounded-xl p-4 transition-all ${
                  editedByKid.has(i) ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-white/10'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-400 text-xs font-bold">
                      PAGE {i + 1} {editedByKid.has(i) && '⭐'}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => fixMyStory(i)}
                        disabled={fixingPage === i || !editedByKid.has(i)}
                        className="px-2.5 py-1 bg-blue-600/80 hover:bg-blue-500 text-white text-xs rounded-lg disabled:opacity-30 transition-all"
                        title="AI polishes your writing while keeping your ideas"
                      >
                        {fixingPage === i ? '...' : '🪄 Make It Shine'}
                      </button>
                      <button
                        onClick={() => surpriseMe(i)}
                        disabled={fixingPage === i}
                        className="px-2.5 py-1 bg-pink-600/80 hover:bg-pink-500 text-white text-xs rounded-lg disabled:opacity-30 transition-all"
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
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm h-24 resize-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    placeholder="Write your own version of this page..."
                  />
                  <p className="text-gray-500 text-xs mt-2 italic">🎨 {page.imageDescription}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="px-6 py-3 bg-white/10 text-white rounded-xl"
              >
                ← Back
              </button>
              <button
                onClick={() => { setStep(2); generateAllImages(); }}
                disabled={mode === 'write' && pages.some(p => !p.text.trim())}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🎨 Generate Illustrations
              </button>
            </div>
            {mode === 'write' && pages.some(p => !p.text.trim()) && (
              <p className="text-center text-amber-400 text-xs mt-2">✏️ Write something on every page before generating art!</p>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Generating Images */}
      {step === 2 && (
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8 text-center">
            <div className="text-5xl sm:text-6xl mb-4 animate-pulse">🎨</div>
            <h2 className="text-white text-xl sm:text-2xl font-bold mb-2">Creating Illustrations...</h2>
            <p className="text-gray-400 mb-6">
              DALL·E is painting your story! This takes about 30 seconds per page.
            </p>
            <div className="w-full bg-white/10 rounded-full h-4 mb-4">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${(imageProgress / pages.length) * 100}%` }}
              />
            </div>
            <p className="text-white/60 text-sm">
              {imageProgress} / {pages.length} pages illustrated
              {!generatingImages && imageProgress > 0 && ' + cover image'}
            </p>

            {/* Show generated images as horizontal carousel */}
            <div className="mt-6 -mx-2">
              <div className="flex gap-3 overflow-x-auto pb-3 px-2 snap-x snap-mandatory scrollbar-thin">
                {pages.map((page, i) => (
                  <div key={i} className="flex-none w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-white/5 snap-start">
                    {page.image_path ? (
                      <img src={page.image_path} alt={`Page ${i+1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
                        {i < imageProgress ? '⏳' : `P${i+1}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mini-game while waiting */}
            {generatingImages && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <StarCatcher />
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Review & Publish */}
      {step === 3 && (
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8">
            <h2 className="text-white text-xl sm:text-2xl font-bold mb-2">📖 Review Your Story</h2>
            <p className="text-gray-400 mb-6">Here&apos;s how it&apos;ll look! Make sure you&apos;re happy before publishing.</p>

            {/* Title edit */}
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-xl font-bold mb-4"
            />

            {/* Author Certificate */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 rounded-3xl blur-sm opacity-30" />
              <div className="relative bg-gradient-to-b from-amber-950/80 via-yellow-950/60 to-amber-950/80 border-2 border-yellow-500/50 rounded-3xl p-1">
                <div className="border border-yellow-600/40 border-dashed rounded-2xl p-6 sm:p-8 text-center">
                  <div className="text-yellow-400/60 text-2xl tracking-[0.5em] mb-2">✦ ✦ ✦</div>
                  <h3 className="text-yellow-300 text-xs uppercase tracking-[0.3em] font-semibold mb-1">Certificate of Authorship</h3>
                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent mx-auto mb-4" />

                  <p className="text-amber-200/70 text-sm italic mb-3">This story was brought to life by</p>

                  <input
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    className="w-full max-w-sm mx-auto block px-4 py-3 bg-transparent border-b-2 border-yellow-500/40 text-white text-2xl text-center font-serif placeholder:text-white/25 focus:border-yellow-400 focus:outline-none transition-colors"
                    placeholder="Your name here..."
                  />

                  {authorName ? (
                    <div className="mt-4">
                      <div className={`inline-block px-6 py-2 rounded-full text-sm font-bold tracking-wide ${
                        authorCredit === 'authored' ? 'bg-yellow-500/25 text-yellow-300 ring-1 ring-yellow-500/40' :
                        authorCredit === 'coauthored' ? 'bg-blue-500/25 text-blue-300 ring-1 ring-blue-500/40' :
                        'bg-purple-500/25 text-purple-300 ring-1 ring-purple-500/40'
                      }`}>
                        {authorCredit === 'authored' ? '⭐ Full Author' : authorCredit === 'coauthored' ? '🤝 Co-Author' : '💡 Story Creator'}
                      </div>
                      <p className="text-amber-200/50 text-xs mt-2 italic">{creditLine}</p>
                      <p className="text-yellow-500/40 text-xs mt-1">
                        {editedByKid.size}/{pages.length} pages written by you {'⭐'.repeat(editedByKid.size)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-pink-400 text-sm mt-4 animate-pulse">✨ Every great story deserves a name on it!</p>
                  )}

                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent mx-auto mt-4 mb-2" />
                  <div className="text-yellow-400/60 text-2xl tracking-[0.5em]">✦ ✦ ✦</div>
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
                <div key={i} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start bg-white/5 rounded-xl p-4">
                  {page.image_path && (
                    <img src={page.image_path} alt={`Page ${i+1}`} className="w-full sm:w-32 h-48 sm:h-32 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-purple-400 text-xs font-bold">
                      PAGE {i + 1} {editedByKid.has(i) && '⭐'}
                    </span>
                    <p className="text-white mt-1">{page.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-white/10 text-white rounded-xl"
              >
                ← Edit Outline
              </button>
              <button
                onClick={publishStory}
                disabled={publishing || !authorName.trim()}
                className="flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl text-lg disabled:opacity-50"
              >
                {publishing ? '📤 Publishing...' : '🚀 Publish to Library!'}
              </button>
            </div>
            {!authorName.trim() && (
              <p className="text-center text-pink-400 text-sm mt-2 animate-pulse">⬆️ Please add your name above before publishing!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
