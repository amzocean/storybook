'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
const ADMIN_PIN = '1234'; // Change this!

export default function CreateStoryPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Premise
  const [premise, setPremise] = useState('');
  const [category, setCategory] = useState('adventure');
  const [pageCount, setPageCount] = useState(6);
  const [title, setTitle] = useState('');

  // Step 2: Outline
  const [pages, setPages] = useState<PageDraft[]>([]);
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [editInstruction, setEditInstruction] = useState('');

  // Step 3: Images
  const [generatingImages, setGeneratingImages] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);

  // Step 4: Publish
  const [coverImage, setCoverImage] = useState('');
  const [publishing, setPublishing] = useState(false);

  const storyId = useState(() => crypto.randomUUID())[0];

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories);
  }, []);

  // PIN Check
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-white text-xl font-bold mb-2">Enter PIN</h2>
          <p className="text-gray-400 text-sm mb-6">Adults only! Enter the PIN to create stories.</p>
          <input
            type="password"
            value={pinInput}
            onChange={e => setPinInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (pinInput === ADMIN_PIN) setAuthenticated(true);
                else { setPinInput(''); setError('Wrong PIN!'); }
              }
            }}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl tracking-widest mb-3"
            placeholder="••••"
            maxLength={6}
          />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button
            onClick={() => {
              if (pinInput === ADMIN_PIN) setAuthenticated(true);
              else { setPinInput(''); setError('Wrong PIN!'); }
            }}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl"
          >
            Enter Workshop
          </button>
        </div>
      </div>
    );
  }

  // Generate outline from AI
  const generateOutline = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'outline', premise, category, pageCount }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPages(data.outline);
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

  // Generate all images
  const generateAllImages = async () => {
    setGeneratingImages(true);
    setImageProgress(0);
    const updated = [...pages];

    for (let i = 0; i < updated.length; i++) {
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate-image',
            prompt: updated[i].imageDescription,
            storyId,
            pageNumber: i + 1,
          }),
        });
        const data = await res.json();
        if (data.imageUrl) {
          updated[i] = { ...updated[i], image_path: data.imageUrl };
        }
      } catch (e) {
        console.error(`Failed to generate image for page ${i + 1}`);
      }
      setImageProgress(i + 1);
      setPages([...updated]);
    }

    // Generate cover
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-cover', title, description: premise, category, storyId }),
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
          id: storyId, title, description: premise, category,
          tags: [category], cover_image: coverImage, status: 'published',
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
      // Mark published
      await fetch(`/api/stories/${storyId}/publish`, { method: 'POST' });
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
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-white text-2xl font-bold mb-2">💡 What's your story about?</h2>
            <p className="text-gray-400 mb-6">Describe your idea in a sentence or two. The AI will build a full story from it!</p>

            <label className="text-white text-sm font-medium mb-2 block">Story Title (optional)</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white mb-4"
              placeholder="e.g., Rex's Space Adventure"
            />

            <label className="text-white text-sm font-medium mb-2 block">Your Story Idea</label>
            <textarea
              value={premise}
              onChange={e => setPremise(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white mb-4 h-28 resize-none"
              placeholder="e.g., A friendly dinosaur who travels to outer space and makes friends with an alien..."
            />

            <label className="text-white text-sm font-medium mb-2 block">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    category === cat.id
                      ? 'ring-2 ring-purple-400 bg-white/15 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
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

            <button
              onClick={generateOutline}
              disabled={!premise || loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? '🪄 Generating...' : '🪄 Generate Story Outline'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: Outline */}
      {step === 1 && (
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-white text-2xl font-bold mb-2">📋 Story Outline</h2>
            <p className="text-gray-400 mb-6">Review and edit each page. Click a page to modify it.</p>

            <div className="space-y-3 mb-8">
              {pages.map((page, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-purple-400 text-xs font-bold">PAGE {i + 1}</span>
                      {editingPage === i ? (
                        <div className="mt-2">
                          <textarea
                            value={page.text}
                            onChange={e => {
                              const updated = [...pages];
                              updated[i] = { ...updated[i], text: e.target.value };
                              setPages(updated);
                            }}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm mb-2 h-20 resize-none"
                          />
                          <div className="flex gap-2">
                            <input
                              value={editInstruction}
                              onChange={e => setEditInstruction(e.target.value)}
                              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                              placeholder="Or ask AI to change it (e.g., 'make it funnier')"
                            />
                            <button
                              onClick={() => regeneratePage(i)}
                              disabled={!editInstruction || loading}
                              className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg disabled:opacity-50"
                            >
                              {loading ? '...' : '🤖 AI'}
                            </button>
                            <button
                              onClick={() => { setEditingPage(null); setEditInstruction(''); }}
                              className="px-3 py-2 bg-white/10 text-white text-sm rounded-lg"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-white text-sm mt-1">{page.text}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-2 italic">🎨 {page.imageDescription}</p>
                    </div>
                    {editingPage !== i && (
                      <button
                        onClick={() => setEditingPage(i)}
                        className="text-white/40 hover:text-white text-sm"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
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
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl text-lg"
              >
                🎨 Generate Illustrations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Generating Images */}
      {step === 2 && (
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
            <div className="text-6xl mb-4 animate-pulse">🎨</div>
            <h2 className="text-white text-2xl font-bold mb-2">Creating Illustrations...</h2>
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

            {/* Show generated images as they come in */}
            <div className="grid grid-cols-3 gap-3 mt-8">
              {pages.map((page, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-white/5">
                  {page.image_path ? (
                    <img src={page.image_path} alt={`Page ${i+1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      {i < imageProgress ? '⏳' : `P${i+1}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Review & Publish */}
      {step === 3 && (
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-white text-2xl font-bold mb-2">📖 Review Your Story</h2>
            <p className="text-gray-400 mb-6">Here's how it'll look! Make sure you're happy before publishing.</p>

            {/* Title edit */}
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-xl font-bold mb-6"
            />

            {/* Cover */}
            {coverImage && (
              <div className="aspect-video max-w-md mx-auto rounded-2xl overflow-hidden mb-8 shadow-2xl">
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Pages preview */}
            <div className="space-y-6 mb-8">
              {pages.map((page, i) => (
                <div key={i} className="flex gap-4 items-start bg-white/5 rounded-xl p-4">
                  {page.image_path && (
                    <img src={page.image_path} alt={`Page ${i+1}`} className="w-32 h-32 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-purple-400 text-xs font-bold">PAGE {i + 1}</span>
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
                disabled={publishing}
                className="flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl text-lg disabled:opacity-50"
              >
                {publishing ? '📤 Publishing...' : '🚀 Publish to Library!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
