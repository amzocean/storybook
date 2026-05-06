# Burhanuddin's Story World — Developer Documentation

## Overview

A kid-friendly, Netflix-style storybook website built for a 7-year-old. The app lets a child browse and read illustrated stories, while a parent can create new stories using AI (OpenAI GPT-4o for text + DALL·E 3 for illustrations) through a wizard-style admin interface.

**GitHub Repo**: https://github.com/amzocean/storybook  
**Local Path**: `C:\Users\huseinm\storynook`  
**Status**: Working locally, ready for Vercel deployment

---

## Tech Stack

| Layer          | Technology                                      |
|----------------|--------------------------------------------------|
| Framework      | Next.js 16.2.4 (App Router, Turbopack)           |
| Language       | TypeScript 5.x                                   |
| UI             | React 19.2.4, Tailwind CSS 4.x                   |
| Database       | SQLite via `better-sqlite3` (file: `data/storynook.db`) |
| AI             | OpenAI API (`openai` npm) — GPT-4o + DALL·E 3    |
| Image Storage  | Local filesystem (`public/story-images/{storyId}/`) |
| Font           | Baloo 2 (Google Fonts) — round, kid-friendly      |
| Auth           | Simple PIN code (`1234`) on admin pages            |

---

## Project Structure

```
storynook/
├── app/
│   ├── globals.css              # Tailwind + kid theme (animations, Baloo 2 font)
│   ├── layout.tsx               # Root layout, metadata, font imports
│   ├── page.tsx                 # Homepage — kid-facing story library
│   ├── read/
│   │   └── [id]/page.tsx        # Full-screen story reader
│   ├── admin/
│   │   ├── page.tsx             # Admin dashboard (list/manage stories)
│   │   ├── create/page.tsx      # 4-step wizard: Premise → Outline → Art → Publish
│   │   └── manage/[id]/page.tsx # Story editor (text, images, metadata)
│   └── api/
│       ├── stories/
│       │   ├── route.ts         # GET (list stories), POST (create story)
│       │   └── [id]/
│       │       ├── route.ts     # GET/PUT/DELETE single story
│       │       ├── pages/route.ts    # POST pages to a story
│       │       └── publish/route.ts  # POST to publish a draft
│       ├── categories/route.ts  # GET all categories
│       └── generate/route.ts    # POST — AI generation (outline, image, cover, re-edit)
├── lib/
│   ├── db.ts                    # SQLite init, schema, Proxy lazy-init pattern
│   ├── openai.ts                # GPT-4o + DALL·E 3 wrapper functions
│   └── storage.ts               # Download DALL·E images to disk, delete helpers
├── public/
│   ├── favicon.svg              # Custom book icon (blue-purple gradient)
│   └── story-images/            # Generated illustrations (gitignored)
├── data/
│   └── storynook.db             # SQLite database (gitignored)
├── .env.local                   # OPENAI_API_KEY (gitignored)
├── next.config.ts               # serverExternalPackages, unoptimized images
└── package.json
```

---

## Database Schema

SQLite with WAL mode + `busy_timeout = 5000`. File lives at `data/storynook.db`.

### `stories`
| Column       | Type | Notes                              |
|-------------|------|------------------------------------|
| id          | TEXT | PK, UUID                           |
| title       | TEXT | NOT NULL                           |
| description | TEXT |                                    |
| category    | TEXT | FK to categories.id, default 'adventure' |
| tags        | TEXT | JSON array string                  |
| cover_image | TEXT | Relative path to cover PNG         |
| age_range   | TEXT | Default '5-8'                      |
| status      | TEXT | 'draft' or 'published'             |
| created_at  | TEXT | ISO datetime                       |
| updated_at  | TEXT | ISO datetime                       |

### `pages`
| Column       | Type    | Notes                           |
|-------------|---------|----------------------------------|
| id          | TEXT    | PK, UUID                         |
| story_id   | TEXT    | FK to stories.id (CASCADE DELETE) |
| page_number | INTEGER |                                  |
| text        | TEXT    | Story text for this page         |
| image_path  | TEXT    | Relative path to illustration    |
| image_prompt| TEXT    | DALL·E prompt used               |
| created_at  | TEXT    | ISO datetime                     |

### `categories`
| Column | Type | Notes                    |
|--------|------|--------------------------|
| id     | TEXT | PK (slug: 'dinosaurs')   |
| name   | TEXT | Display name             |
| emoji  | TEXT | Category emoji           |
| color  | TEXT | Hex color for UI pills   |

**Default categories**: dinosaurs 🦕, space 🚀, pirates 🏴‍☠️, animals 🐾, fairy-tales 🧚, adventure ⚔️, underwater 🐠, robots 🤖

---

## API Routes

### Stories CRUD

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/api/stories`        | List published stories. Add `?all=true` for drafts too |
| POST   | `/api/stories`        | Create story (id, title, description, category, tags, cover_image, status) |
| GET    | `/api/stories/[id]`   | Get story with all pages             |
| PUT    | `/api/stories/[id]`   | Partial update (only send changed fields) |
| DELETE | `/api/stories/[id]`   | Delete story + its pages (images left on disk) |
| POST   | `/api/stories/[id]/pages`    | Add pages to a story          |
| POST   | `/api/stories/[id]/publish`  | Set status to 'published'     |

### Categories

| Method | Endpoint          | Description       |
|--------|-------------------|-------------------|
| GET    | `/api/categories` | List all categories |

### AI Generation

| Method | Endpoint        | Body `action` | Parameters                                    | Returns |
|--------|-----------------|---------------|-----------------------------------------------|---------|
| POST   | `/api/generate` | `outline`     | premise, category, pageCount                  | `{ outline: [...] }` — array of page objects |
| POST   | `/api/generate` | `regenerate-page` | currentText, instruction, storyContext    | `{ text, imageDescription }` |
| POST   | `/api/generate` | `generate-image`  | prompt, storyId, pageNumber              | `{ imageUrl }` — saved local path |
| POST   | `/api/generate` | `generate-cover`  | title, description, category, storyId    | `{ imageUrl }` — saved local path |

---

## Key Implementation Details

### SQLite Lazy-Init Proxy (Critical)

Next.js opens multiple routes simultaneously during `next build`, which causes `SQLITE_BUSY` errors. The fix in `lib/db.ts` uses a **Proxy-based lazy initialization pattern**:

```typescript
const db = new Proxy({} as Database.Database, {
  get(_, prop) {
    const instance = getDb(); // only opens DB on first actual use
    const val = (instance as any)[prop];
    if (typeof val === 'function') return val.bind(instance);
    return val;
  }
});
```

This ensures only one connection is ever created, and only when a route actually queries the database (not at import time during static analysis).

### OpenAI Integration

- **Text generation**: GPT-4o with temperature 0.8 (creative but coherent)
- **Image generation**: DALL·E 3, 1024x1024, standard quality, vivid style
- **Prompt prefix**: All DALL·E prompts are prefixed with "Children's storybook illustration, colorful, friendly, cartoon style, suitable for ages 5-8:"
- **Image response safety**: `response.data?.[0]?.url` — the `data` field can be undefined
- **Cost**: ~$0.04-0.08 per DALL·E image, ~$0.50 per complete 6-page story

### Image Storage

DALL·E returns temporary URLs. Images are downloaded via `lib/storage.ts` to:
```
public/story-images/{storyId}/cover.png
public/story-images/{storyId}/page-1.png
public/story-images/{storyId}/page-2.png
...
```

These are served statically by Next.js from `/story-images/...`.

### Admin PIN Auth

PIN `1234` is checked client-side in three files:
- `app/admin/create/page.tsx`
- `app/admin/page.tsx`
- `app/admin/manage/[id]/page.tsx`

This is intentionally simple — not a security measure, just a kid-proof gate.

---

## User-Facing Pages

### Homepage (`/`)
- Bright sky-blue gradient with floating emoji decorations (stars, rainbow, dino, rocket)
- Rainbow gradient header with 🚀 logo
- Featured story hero card
- Category filter pills (scrollable)
- Story grid with cover images, hover animations (tilt + scale)
- Responsive: 2 cols on mobile, up to 5 on desktop

### Story Reader (`/read/[id]`)
- Warm cream/amber background — designed for comfortable reading
- Full-screen image with white-bordered frame
- Story text in a soft white card below the image
- Navigation: keyboard (← → Space Esc), touch swipe (50px threshold), emoji arrow buttons
- Green progress bar, page dots, "🎉 The End!" on last page
- Mobile: visible Back/Next buttons below content

### Admin Dashboard (`/admin`)
- Dark theme (parent-facing)
- Lists all stories (drafts + published) with stats
- Actions: publish/unpublish, delete, edit
- PIN protected

### Story Creator (`/admin/create`)
- 4-step wizard: Premise → Outline → Story & Art → Publish
- Step 1: Enter title, premise, category, page count
- Step 2: AI generates outline, user can edit/regenerate individual pages
- Step 3: AI generates DALL·E illustrations for each page (sequential)
- Step 4: Review and publish
- PIN protected

### Story Editor (`/admin/manage/[id]`)
- Edit metadata (title, description, category)
- Edit page text inline
- AI re-edit: give instructions to regenerate a page's text
- Regenerate individual page images or cover image
- PIN protected

---

## Configuration

### Environment Variables

Create `.env.local` in project root:
```
OPENAI_API_KEY=sk-proj-...your-key-here...
```

Get your key from https://platform.openai.com/api-keys

### next.config.ts

```typescript
const nextConfig: NextConfig = {
  images: { unoptimized: true },           // static image serving
  serverExternalPackages: ['better-sqlite3'], // native module exclusion
};
```

`better-sqlite3` must be in `serverExternalPackages` to prevent Next.js from bundling the native C++ module.

---

## Running Locally

```bash
cd C:\Users\huseinm\storynook
npm install
# Create .env.local with OPENAI_API_KEY
npm run dev
# Open http://localhost:3000
```

---

## Deployment (Vercel)

1. Push to GitHub: `git push origin main`
2. Go to vercel.com → import `amzocean/storybook`
3. Add env var: `OPENAI_API_KEY`
4. Deploy

**Important**: SQLite won't persist on Vercel's serverless functions (ephemeral filesystem). For production persistence, you'd need to migrate to:
- **Vercel Postgres** or **Turso** (SQLite-compatible, edge-ready)
- **Supabase** (Postgres)
- Or use Vercel's `@vercel/blob` for image storage

For now, the local SQLite setup works perfectly for personal/family use on a single machine.

### Custom Domain (GoDaddy)

1. In Vercel dashboard → Settings → Domains → add your domain
2. In GoDaddy DNS, set the records Vercel provides (usually CNAME or A records)
3. Vercel auto-provisions SSL

---

## Known Limitations & Future Ideas

### Current Limitations
- **SQLite is local-only** — won't persist on serverless deployments
- **Images stored on disk** — need blob storage for cloud deployment
- **No real auth** — just a client-side PIN
- **No image optimization** — using `unoptimized: true` for simplicity
- **Single language** — English only

### Potential Enhancements
- Migrate to Turso/Postgres for cloud persistence
- Add text-to-speech (read-aloud mode)
- Multiple user profiles (siblings)
- Reading progress tracking / bookmarks
- Story rating / favorites
- Offline support (PWA)
- Print-to-PDF for physical storybooks
- Multi-language story generation
- Parent controls (time limits, content filtering)

---

## Troubleshooting

### SQLITE_BUSY during build
The Proxy lazy-init pattern in `lib/db.ts` fixes this. If it recurs, ensure only `getDb()` is used (never direct `new Database()` calls).

### DALL·E image URLs expire
DALL·E URLs are temporary (~1 hour). Images are immediately downloaded to `public/story-images/` via `lib/storage.ts`. If an image shows broken, regenerate it from the admin editor.

### Next.js dev logo in bottom-left
This is the Next.js dev overlay — only shows in `npm run dev`, not in production builds.

### CSS @import order error
In `globals.css`, the Google Fonts `@import url(...)` must come BEFORE `@import "tailwindcss"`. CSS spec requires `@import` rules to precede all other rules.
