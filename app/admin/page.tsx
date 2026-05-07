'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_PIN = '1234';

interface Story {
  id: string;
  title: string;
  description: string;
  category: string; // comma-separated for multi-category
  cover_image: string;
  status: string;
  created_at: string;
  updated_at: string;
  page_count: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (authenticated) loadStories();
  }, [authenticated]);

  async function loadStories() {
    setLoading(true);
    try {
      const res = await fetch('/api/stories?all=true');
      const data = await res.json();
      setStories(data);
    } catch {
      setError('Failed to load stories');
    }
    setLoading(false);
  }

  async function deleteStory(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/stories/${id}`, { method: 'DELETE' });
      setStories(prev => prev.filter(s => s.id !== id));
    } catch {
      setError('Failed to delete story');
    }
    setDeleting(null);
  }

  async function togglePublish(id: string, currentStatus: string) {
    try {
      if (currentStatus === 'published') {
        await fetch(`/api/stories/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'draft' }),
        });
      } else {
        // Direct publish from admin (bypasses moderation queue)
        await fetch(`/api/stories/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'published' }),
        });
      }
      loadStories();
    } catch {
      setError('Failed to update story');
    }
  }

  async function rejectStory(id: string) {
    try {
      await fetch(`/api/stories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });
      loadStories();
    } catch {
      setError('Failed to reject story');
    }
  }

  // PIN Check
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-white text-xl font-bold mb-2">Admin Access</h2>
          <p className="text-gray-400 text-sm mb-6">Enter PIN to manage stories</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white transition">
              ← Home
            </button>
            <h1 className="text-2xl font-bold">📚 Story Manager</h1>
          </div>
          <button
            onClick={() => router.push('/admin/create')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold transition flex items-center gap-2"
          >
            ✨ Create New Story
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{stories.length}</div>
            <div className="text-gray-400 text-sm">Total Stories</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-400">{stories.filter(s => s.status === 'pending_review').length}</div>
            <div className="text-gray-400 text-sm">Pending Review</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-emerald-400">{stories.filter(s => s.status === 'published').length}</div>
            <div className="text-gray-400 text-sm">Published</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-amber-400">{stories.filter(s => s.status === 'draft').length}</div>
            <div className="text-gray-400 text-sm">Drafts</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4 animate-bounce">📖</div>
            <p className="text-gray-400">Loading stories...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-bold mb-2">No stories yet</h2>
            <p className="text-gray-400 mb-6">Create your first story to get started!</p>
            <button
              onClick={() => router.push('/admin/create')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold transition"
            >
              ✨ Create Story
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map(story => (
              <div
                key={story.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition group"
              >
                <div className="flex items-center gap-4">
                  {/* Cover thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                    {story.cover_image ? (
                      <img src={story.cover_image} alt={story.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold truncate">{story.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        story.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : story.status === 'pending_review'
                          ? 'bg-orange-500/20 text-orange-300'
                          : story.status === 'rejected'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {story.status === 'pending_review' ? '⏳ pending review' : story.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm truncate">{story.description || 'No description'}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>📂 {(story.category || '').split(',').join(', ')}</span>
                      <span>📄 {story.page_count} pages</span>
                      <span>🕐 {new Date(story.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition">
                    <button
                      onClick={() => router.push(`/read/${story.id}`)}
                      className="px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/30 rounded-lg text-sm transition"
                      title="Preview"
                    >
                      👁️ View
                    </button>
                    <button
                      onClick={() => router.push(`/admin/manage/${story.id}`)}
                      className="px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 rounded-lg text-sm transition"
                      title="Edit"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => togglePublish(story.id, story.status)}
                      className={`px-3 py-2 rounded-lg text-sm transition border ${
                        story.status === 'published'
                          ? 'bg-amber-600/30 hover:bg-amber-600/50 border-amber-500/30'
                          : 'bg-emerald-600/30 hover:bg-emerald-600/50 border-emerald-500/30'
                      }`}
                    >
                      {story.status === 'published' ? '📥 Unpublish' : '✅ Approve'}
                    </button>
                    {story.status === 'pending_review' && (
                      <button
                        onClick={() => rejectStory(story.id)}
                        className="px-3 py-2 bg-red-600/30 hover:bg-red-600/50 border border-red-500/30 rounded-lg text-sm transition"
                      >
                        ❌ Reject
                      </button>
                    )}
                    <button
                      onClick={() => deleteStory(story.id, story.title)}
                      disabled={deleting === story.id}
                      className="px-3 py-2 bg-red-600/30 hover:bg-red-600/50 border border-red-500/30 rounded-lg text-sm transition disabled:opacity-50"
                    >
                      {deleting === story.id ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
