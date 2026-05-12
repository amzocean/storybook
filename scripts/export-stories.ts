/**
 * Export all stories to an HTML report, grouped by category and age range.
 * Usage: npx tsx scripts/export-stories.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

config({ path: resolve(__dirname, '..', '.env.local') });

import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Story {
  id: string;
  title: string;
  description: string;
  category: string;
  age_range: string;
  detail_level: number;
  author_name: string;
  status: string;
  created_at: string;
  tags: string[];
  cover_image: string | null;
}

async function main() {
  console.log('Fetching stories from Supabase...');
  
  const { data, error, count } = await sb
    .from('stories')
    .select('id, title, description, category, age_range, detail_level, author_name, status, created_at, tags, cover_image', { count: 'exact' })
    .order('category')
    .order('age_range');

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  const stories = (data || []) as Story[];
  console.log(`Found ${stories.length} stories total.`);

  // Group by category
  const byCategory: Record<string, Story[]> = {};
  for (const s of stories) {
    const cat = s.category || 'Uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(s);
  }

  // Group by age range
  const byAge: Record<string, Story[]> = {};
  for (const s of stories) {
    const age = s.age_range || 'Unknown';
    if (!byAge[age]) byAge[age] = [];
    byAge[age].push(s);
  }

  // Status counts
  const statusCounts: Record<string, number> = {};
  for (const s of stories) {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  }

  // Build HTML
  const categoryNames = Object.keys(byCategory).sort();
  const ageRanges = Object.keys(byAge).sort();

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>StoryNook - Story Inventory Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f0eb; color: #333; padding: 20px; }
  h1 { text-align: center; color: #6b4ce6; margin: 20px 0; font-size: 2em; }
  h2 { color: #6b4ce6; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #e0d6f2; }
  h3 { color: #444; margin: 20px 0 10px; }
  .summary { background: white; border-radius: 12px; padding: 20px 30px; margin: 20px auto; max-width: 900px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 15px 0; }
  .stat-card { background: #f8f4ff; border-radius: 10px; padding: 15px; text-align: center; }
  .stat-card .number { font-size: 2em; font-weight: bold; color: #6b4ce6; }
  .stat-card .label { font-size: 0.85em; color: #666; margin-top: 5px; }
  .category-section { background: white; border-radius: 12px; padding: 20px 30px; margin: 15px auto; max-width: 1200px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 0.9em; }
  th { background: #6b4ce6; color: white; padding: 10px 12px; text-align: left; font-weight: 600; }
  td { padding: 8px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
  tr:hover { background: #f8f4ff; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; font-weight: 600; }
  .badge-published { background: #d4edda; color: #155724; }
  .badge-draft { background: #fff3cd; color: #856404; }
  .tag { display: inline-block; background: #e8e0f7; color: #6b4ce6; padding: 1px 6px; border-radius: 6px; font-size: 0.75em; margin: 1px 2px; }
  .age-badge { display: inline-block; background: #ffe0b2; color: #e65100; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; font-weight: 600; }
  .toc { background: white; border-radius: 12px; padding: 20px 30px; margin: 15px auto; max-width: 900px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .toc ul { list-style: none; padding-left: 0; }
  .toc li { padding: 4px 0; }
  .toc a { color: #6b4ce6; text-decoration: none; }
  .toc a:hover { text-decoration: underline; }
  .toc .count { color: #999; font-size: 0.9em; }
  .generated { text-align: center; color: #999; font-size: 0.8em; margin-top: 30px; }
</style>
</head>
<body>
<h1>📚 StoryNook — Story Inventory Report</h1>

<div class="summary">
  <h2 style="border:none;margin-top:0">📊 Summary</h2>
  <div class="summary-grid">
    <div class="stat-card"><div class="number">${stories.length}</div><div class="label">Total Stories</div></div>
    <div class="stat-card"><div class="number">${categoryNames.length}</div><div class="label">Categories</div></div>
    <div class="stat-card"><div class="number">${ageRanges.length}</div><div class="label">Age Groups</div></div>
    <div class="stat-card"><div class="number">${statusCounts['published'] || 0}</div><div class="label">Published</div></div>
    <div class="stat-card"><div class="number">${statusCounts['draft'] || 0}</div><div class="label">Drafts</div></div>
  </div>
</div>

<div class="toc">
  <h2 style="border:none;margin-top:0">📑 Table of Contents</h2>
  <h3>By Category</h3>
  <ul>
    ${categoryNames.map(cat => `<li><a href="#cat-${cat.replace(/\W/g, '-')}">${cat}</a> <span class="count">(${byCategory[cat].length})</span></li>`).join('\n    ')}
  </ul>
  <h3>By Age Group</h3>
  <ul>
    ${ageRanges.map(age => `<li><a href="#age-${age.replace(/\W/g, '-')}">${age}</a> <span class="count">(${byAge[age].length})</span></li>`).join('\n    ')}
  </ul>
</div>

<h2>📂 Stories by Category</h2>
`;

  for (const cat of categoryNames) {
    const catStories = byCategory[cat].sort((a, b) => a.title.localeCompare(b.title));
    html += `
<div class="category-section" id="cat-${cat.replace(/\W/g, '-')}">
  <h3>${cat} (${catStories.length} stories)</h3>
  <table>
    <tr><th>#</th><th>Title</th><th>Age</th><th>Author</th><th>Tags</th><th>Status</th><th>Created</th></tr>
    ${catStories.map((s, i) => `<tr>
      <td>${i + 1}</td>
      <td><strong>${escapeHtml(s.title)}</strong><br><small style="color:#888">${escapeHtml(s.description || '')}</small></td>
      <td><span class="age-badge">${s.age_range || '?'}</span></td>
      <td>${escapeHtml(s.author_name || '')}</td>
      <td>${(s.tags || []).map((t: string) => `<span class="tag">${escapeHtml(t)}</span>`).join(' ')}</td>
      <td><span class="badge badge-${s.status}">${s.status}</span></td>
      <td><small>${new Date(s.created_at).toLocaleDateString()}</small></td>
    </tr>`).join('\n    ')}
  </table>
</div>`;
  }

  html += `\n<h2>👶 Stories by Age Group</h2>`;

  for (const age of ageRanges) {
    const ageStories = byAge[age].sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
    html += `
<div class="category-section" id="age-${age.replace(/\W/g, '-')}">
  <h3>Ages ${age} (${ageStories.length} stories)</h3>
  <table>
    <tr><th>#</th><th>Title</th><th>Category</th><th>Author</th><th>Tags</th><th>Status</th></tr>
    ${ageStories.map((s, i) => `<tr>
      <td>${i + 1}</td>
      <td><strong>${escapeHtml(s.title)}</strong></td>
      <td>${escapeHtml(s.category)}</td>
      <td>${escapeHtml(s.author_name || '')}</td>
      <td>${(s.tags || []).map((t: string) => `<span class="tag">${escapeHtml(t)}</span>`).join(' ')}</td>
      <td><span class="badge badge-${s.status}">${s.status}</span></td>
    </tr>`).join('\n    ')}
  </table>
</div>`;
  }

  html += `
<p class="generated">Generated on ${new Date().toLocaleString()} — StoryNook Inventory</p>
</body></html>`;

  const outPath = resolve(__dirname, '..', 'story-inventory.html');
  writeFileSync(outPath, html, 'utf-8');
  console.log(`\n✅ Report saved to: ${outPath}`);
  console.log(`   Open in browser to view.`);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
