'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_PIN = '1234';

interface Page {
  id: string;
  page_number: number;
  text: string;
  image_path: string | null;
  image_prompt: string | null;
}

interface Story {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string;
  cover_image: string;
  age_range: string;
  status: string;
  pages: Page[];
}

interface Category {
  id: string;
  name: string;
  emoji: string;
}

export default function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [story, setStory] = useState<Story | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState('5-8');
  const [pages, setPages] = useState<Page[]>([]);
  const [editingPageIdx, setEditingPageIdx] = useState<number | null>(null);
  const [regeneratingPage, setRegeneratingPage] = useState<number | null>(null);
  const [regeneratingImage, setRegeneratingImage] = useState<number | null>(null);
  const [editInstruction, setEditInstruction] = useState('');

  useEffect(() => {
    if (authenticated) {
      Promise.all([
        fetch(`/api/stories/${id}`).then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
      ]).then(([storyData, cats]) => {
        setStory(storyData);
        setTitle(storyData.title);
        setDescription(storyData.description || '');
        setSelectedCategories((storyData.category || '').split(',').filter(Boolean));
        setAgeRange(storyData.age_range || '5-8');
        setPages(storyData.pages || []);
        setCategories(cats);
        setLoading(false);
      }).catch(() => {
        setError('Failed to load story');
        setLoading(false);
      });
    }
  }, [authenticated, id]);

  async function saveMetadata() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/stories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category: selectedCategories.join(','), age_range: ageRange, tags: selectedCategories, cover_image: story?.cover_image }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save');
    }
    setSaving(false);
  }

  async function savePages() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/stories/${id}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: pages.map(p => ({
            id: p.id,
            pageNumber: p.page_number,
            text: p.text,
            image_path: p.image_path,
            image_prompt: p.image_prompt,
          })),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save pages');
    }
    setSaving(false);
  }

  async function regeneratePageText(idx: number) {
    if (!editInstruction.trim()) return;
    setRegeneratingPage(idx);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate-page',
          pageNumber: idx + 1,
          currentText: pages[idx].text,
          instruction: editInstruction,
          storyContext: title,
        }),
      });
      const data = await res.json();
      if (data.text) {
        const updated = [...pages];
        updated[idx] = { ...updated[idx], text: data.text };
        setPages(updated);
        setEditInstruction('');
      }
    } catch {
      setError('Failed to regenerate page');
    }
    setRegeneratingPage(null);
  }

  async function regenerateImage(idx: number) {
    setRegeneratingImage(idx);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-image',
          storyId: id,
          pageNumber: idx + 1,
          imageDescription: pages[idx].image_prompt || pages[idx].text,
          storyTitle: title,
        }),
      });
      const data = await res.json();
      if (data.image_path) {
        const updated = [...pages];
        updated[idx] = { ...updated[idx], image_path: data.image_path + '?t=' + Date.now() };
        setPages(updated);
      }
    } catch {
      setError('Failed to regenerate image');
    }
    setRegeneratingImage(null);
  }

  async function regenerateCover() {
    setSaving(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-cover',
          storyId: id,
          storyTitle: title,
          storyDescription: description,
        }),
      });
      const data = await res.json();
      if (data.cover_path) {
        setStory(prev => prev ? { ...prev, cover_image: data.cover_path + '?t=' + Date.now() } : prev);
        await fetch(`/api/stories/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, category: selectedCategories.join(','), age_range: ageRange, tags: selectedCategories, cover_image: data.cover_path }),
        });
      }
    } catch {
      setError('Failed to regenerate cover');
    }
    setSaving(false);
  }

  function updatePageText(idx: number, text: string) {
    const updated = [...pages];
    updated[idx] = { ...updated[idx], text };
    setPages(updated);
  }

  function updateImagePrompt(idx: number, prompt: string) {
    const updated = [...pages];
    updated[idx] = { ...updated[idx], image_prompt: prompt };
    setPages(updated);
  }

  // PIN Check
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-white text-xl font-bold mb-2">Admin Access</h2>
          <p className="text-gray-400 text-sm mb-6">Enter PIN to edit stories</p>
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
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-4xl animate-bounce">📖</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin')} className="text-gray-400 hover:text-white transition">
              ← Back
            </button>
            <h1 className="text-xl font-bold">✏️ Edit Story</h1>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-emerald-400 text-sm">✓ Saved!</span>}
            <button
              onClick={() => { saveMetadata(); savePages(); }}
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save All'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl px-4 py-3">
            {error}
            <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-200">✕</button>
          </div>
        )}

        {/* Story Metadata */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">📋 Story Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-gray-400 text-sm mb-1">Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-400 text-sm mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white resize-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Categories</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(c => {
                  const isSelected = selectedCategories.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategories(prev =>
                        isSelected ? prev.filter(x => x !== c.id) : [...prev, c.id]
                      )}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'ring-2 ring-purple-400 bg-white/15 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {c.emoji} {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Age Range</label>
              <select
                value={ageRange}
                onChange={e => setAgeRange(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white"
              >
                <option value="3-5">3-5 years</option>
                <option value="5-8">5-8 years</option>
                <option value="8-12">8-12 years</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={saveMetadata} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition disabled:opacity-50">
              Save Details
            </button>
          </div>
        </section>

        {/* Cover Image */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">🎨 Cover Image</h2>
          <div className="flex items-start gap-6">
            <div className="w-40 h-40 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
              {story?.cover_image ? (
                <img src={story.cover_image} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-sm mb-4">Regenerate the cover image using AI based on the story title and description.</p>
              <button
                onClick={regenerateCover}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition disabled:opacity-50"
              >
                {saving ? '🎨 Generating...' : '🎨 Regenerate Cover'}
              </button>
            </div>
          </div>
        </section>

        {/* Pages */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">📄 Pages ({pages.length})</h2>
            <button onClick={savePages} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition disabled:opacity-50">
              Save Pages
            </button>
          </div>

          <div className="space-y-6">
            {pages.map((page, idx) => (
              <div key={page.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-gray-300">Page {page.page_number}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingPageIdx(editingPageIdx === idx ? null : idx)}
                      className="px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 rounded-lg text-xs transition"
                    >
                      {editingPageIdx === idx ? '✕ Close' : '🤖 AI Edit'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-48 flex-shrink-0">
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-white/10 mb-2">
                      {page.image_path ? (
                        <img src={page.image_path} alt={`Page ${page.page_number}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🖼️</div>
                      )}
                    </div>
                    <button
                      onClick={() => regenerateImage(idx)}
                      disabled={regeneratingImage === idx}
                      className="w-full px-2 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/30 rounded-lg text-xs transition disabled:opacity-50"
                    >
                      {regeneratingImage === idx ? '🎨 Generating...' : '🎨 New Image'}
                    </button>
                    <div className="mt-2">
                      <label className="text-gray-500 text-xs">Image prompt:</label>
                      <textarea
                        value={page.image_prompt || ''}
                        onChange={e => updateImagePrompt(idx, e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 resize-none mt-1"
                        placeholder="Describe the image..."
                      />
                    </div>
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <textarea
                      value={page.text}
                      onChange={e => updatePageText(idx, e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white resize-none text-sm leading-relaxed"
                    />

                    {/* AI Edit panel */}
                    {editingPageIdx === idx && (
                      <div className="mt-3 p-3 bg-purple-900/20 border border-purple-500/20 rounded-xl">
                        <p className="text-purple-300 text-xs mb-2">Tell AI how to change this page:</p>
                        <div className="flex gap-2">
                          <input
                            value={editInstruction}
                            onChange={e => setEditInstruction(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') regeneratePageText(idx); }}
                            placeholder="e.g. Make it more exciting, add dialogue..."
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white"
                          />
                          <button
                            onClick={() => regeneratePageText(idx)}
                            disabled={regeneratingPage === idx || !editInstruction.trim()}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                          >
                            {regeneratingPage === idx ? '...' : '✨'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
