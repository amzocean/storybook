# Story Sparks — Developer Documentation

## Overview

A kid-friendly, Netflix-style storybook website that lets children browse, read, and co-author illustrated stories. AI-powered story generation (OpenAI GPT-4o for text + DALL·E 3 for illustrations) with a 3-layer content safety system, moderation queue, and co-author mode so kids can write and edit their own stories.

**GitHub Repo**: https://github.com/amzocean/storybook  
**Live Site**: Deployed on Vercel (auto-deploys from `main`)  
**Domain**: `storysparks.fun` (pending DNS setup)

---

## Tech Stack

| Layer          | Technology                                      |
|----------------|--------------------------------------------------|
| Framework      | Next.js 16.2.4 (App Router, Turbopack)           |
| Language       | TypeScript 5.x                                   |
| UI             | React 19.2.4, Tailwind CSS 4.x                   |
| Database       | Supabase (Postgres) via `@supabase/supabase-js`  |
| AI             | OpenAI API (`openai` npm) — GPT-4o + DALL·E 3    |
| Image Storage  | Supabase Storage (public bucket `story-images`)   |
| Font           | Baloo 2 (Google Fonts) — round, kid-friendly      |
| Auth           | Simple PIN code (`1234`) on admin dashboard only   |

---

## Project Structure

```
storynook/
├── app/
│   ├── globals.css              # Tailwind + kid theme (animations, Baloo 2 font)
│   ├── layout.tsx               # Root layout, metadata, font imports
│   ├── page.tsx                 # Homepage — kid-facing story library
│   ├── components/
│   │   └── StarCatcher.tsx      # Canvas minigame (shown during image generation)
│   ├── read/
│   │   └── [id]/page.tsx        # Full-screen story reader
│   ├── admin/
│   │   ├── page.tsx             # Admin dashboard (PIN-protected, moderation queue)
│   │   ├── create/page.tsx      # 4-step wizard with co-author + write mode (no PIN)
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
│   ├── supabase.ts              # Supabase client (service role) + storage URL helper
│   ├── openai.ts                # GPT-4o + DALL·E 3 + content safety functions
│   ├── storage.ts               # Download DALL·E images → upload to Supabase Storage
│   └── rate-limit.ts            # In-memory per-IP + global daily rate limiter
├── public/
│   └── favicon.svg              # Custom book icon (blue-purple gradient)
├── supabase-setup.sql           # Full DB schema + seed data (run in Supabase SQL Editor)
├── AGENTS.md                    # Copilot agent instructions
├── CLAUDE.md                    # Claude project context
├── README.md                    # GitHub readme
├── .env.local                   # API keys (gitignored)
├── next.config.ts               # Image config
└── package.json
```

---

## Database Schema

Supabase Postgres. Schema defined in `supabase-setup.sql`.

### `stories`
| Column        | Type        | Notes                                     |
|--------------|-------------|-------------------------------------------|
| id           | TEXT        | PK, UUID                                  |
| title        | TEXT        | NOT NULL                                  |
| description  | TEXT        |                                           |
| category     | TEXT        | FK to categories.id, default `'adventure'`|
| tags         | JSONB       | Array, default `[]`                       |
| cover_image  | TEXT        | Supabase Storage public URL               |
| age_range    | TEXT        | Default `'5-7'`, computed from detail_level|
| detail_level | INTEGER     | 1–5, default `3`                          |
| author_name  | TEXT        | Kid's display name (optional)             |
| author_credit| TEXT        | `'imagined'`, `'coauthored'`, or `'authored'` |
| status       | TEXT        | `'draft'`, `'pending_review'`, `'published'`, `'rejected'` |
| created_at   | TIMESTAMPTZ | Default `now()`                           |
| updated_at   | TIMESTAMPTZ | Default `now()`                           |

### `pages`
| Column       | Type        | Notes                            |
|-------------|-------------|----------------------------------|
| id          | TEXT        | PK, UUID                         |
| story_id    | TEXT        | FK to stories.id (CASCADE DELETE)|
| page_number | INTEGER     |                                  |
| text        | TEXT        | Story text for this page         |
| image_path  | TEXT        | Supabase Storage public URL      |
| image_prompt| TEXT        | DALL·E prompt used               |
| created_at  | TIMESTAMPTZ | Default `now()`                  |

### `categories`
| Column | Type | Notes                    |
|--------|------|--------------------------|
| id     | TEXT | PK (slug: `'dinosaurs'`) |
| name   | TEXT | Display name             |
| emoji  | TEXT | Category emoji           |
| color  | TEXT | Hex color for UI pills   |

### `stories_with_page_count` (VIEW)
Joins `stories` with a page count subquery. Used by the `GET /api/stories` route.

**Default categories**: dinosaurs 🦕, space 🚀, pirates 🏴‍☠️, animals 🐾, fairy-tales 🧚, adventure ⚔️, underwater 🐠, robots 🤖

---

## API Routes

### Stories CRUD

| Method | Endpoint                     | Description                                     |
|--------|------------------------------|-------------------------------------------------|
| GET    | `/api/stories`               | List published stories. `?all=true` for all statuses |
| POST   | `/api/stories`               | Create story (id, title, description, category, tags, cover_image, detail_level, author_name, author_credit, status) |
| GET    | `/api/stories/[id]`          | Get story with all pages                        |
| PUT    | `/api/stories/[id]`          | Partial update — send only changed fields. Used for approve/reject (status) |
| DELETE | `/api/stories/[id]`          | Delete story + pages + Supabase Storage images  |
| POST   | `/api/stories/[id]/pages`    | Add pages to a story                            |
| POST   | `/api/stories/[id]/publish`  | Set status to `'published'`                     |

### Categories

| Method | Endpoint          | Description       |
|--------|-------------------|-------------------|
| GET    | `/api/categories` | List all categories |

### AI Generation

| Method | Endpoint        | Body `action`      | Parameters                                           | Returns |
|--------|-----------------|--------------------|------------------------------------------------------|---------|
| POST   | `/api/generate` | `outline`          | premise, category, pageCount, title, detailLevel     | `{ outline: [...], characterSheet }` |
| POST   | `/api/generate` | `regenerate-page`  | currentText, instruction, storyContext               | `{ text, imageDescription }` |
| POST   | `/api/generate` | `generate-image`   | prompt, storyId, pageNumber, characterSheet (optional) | `{ imageUrl }` — Supabase Storage URL |
| POST   | `/api/generate` | `generate-cover`   | title, description, category, storyId                | `{ imageUrl }` — Supabase Storage URL |

The `outline` action runs the full 3-layer content safety pipeline before generation (see Content Safety below).

---

## Key Implementation Details

### Content Safety (3-Layer Pipeline)

All story creation goes through three safety checks in `api/generate/route.ts`:

1. **OpenAI Moderation API** (`moderateContent` in `lib/openai.ts`) — free, catches overtly harmful content
2. **Premise Validator** (`validatePremise`) — GPT-4o-mini gatekeeper that rejects non-story inputs (news, homework, code, adult topics)
3. **Post-Generation Check** (`verifyKidFriendly`) — scans completed story text for anything that slipped through

All three fail-open on API errors (allows generation to continue rather than blocking kids).

### Rate Limiting

In-memory rate limiter in `lib/rate-limit.ts`:
- **Per-IP**: 3 stories/hour
- **Global daily**: 20 stories/day across all users
- Resets on Vercel cold starts (ephemeral)
- Returns kid-friendly messages ("Story Sparks is resting for today! 🌙")

### Co-Author Mode & Write Mode

**Co-Author Mode (AI-generated stories)**:
Kids can edit any page text in the outline step. The system tracks which pages were edited:

- `editedByKid: Set<number>` — tracks page indices the kid modified
- **0% edited** → `author_credit = 'imagined'` (AI wrote everything)
- **1–49% edited** → `author_credit = 'coauthored'`
- **50%+ edited** → `author_credit = 'authored'`
- Edited pages show a ⭐ star badge in the outline
- Author credit displayed on the final "The End" page in the reader

**Write Mode (blank pages)**:
Kid writes all page text from scratch. AI only generates illustrations.

- `mode: 'ai' | 'write'` state controls which flow is active
- Write mode creates empty `PageDraft` objects and marks all pages as `editedByKid`
- `author_credit` is always `'authored'` in write mode
- Co-author score banner is hidden (no AI text to compare against)
- "Make It Shine" and "Surprise Me" buttons still work (kid can ask AI for help)
- All pages must have text before "Generate Illustrations" is enabled
- The premise/story idea field provides context for DALL·E image generation

### Detail Level System

5 reading levels mapped in `lib/openai.ts`:

| Level | Sentences/Page | Vocabulary  | Age Label |
|-------|---------------|-------------|-----------|
| 1     | 1             | very simple (toddler) | 2–3       |
| 2     | 2             | simple (early readers)| 4–5       |
| 3     | 3–4           | age-appropriate       | 5–7       |
| 4     | 4–5           | rich, descriptive     | 7–9       |
| 5     | 5–6           | vivid, expressive     | 8–10      |

Default is level 3. The slider is on the create page (Step 1).

### Moderation Queue

- Kids publish stories → status set to `'pending_review'`
- Homepage `GET /api/stories` filters to `status = 'published'` only
- Admin dashboard shows pending stories with approve/reject buttons
- Approve: `PUT /api/stories/[id]` with `{ status: 'published' }`
- Reject: `PUT /api/stories/[id]` with `{ status: 'rejected' }`

### Parallel DALL·E Image Generation

Uses a 3-worker pool pattern in the create page:
- Shared queue of pages needing images
- Workers pull from queue via `shift()` (atomic in single-threaded JS)
- StarCatcher minigame plays while images generate
- Progress bar shows completion percentage

### OpenAI Integration

- **Text generation**: GPT-4o with temperature 0.8 (creative but coherent)
- **Image generation**: DALL·E 3, 1024x1024, standard quality, vivid style
- **Character consistency**: `generateStoryOutline` returns a `characterSheet` (name, appearance, style) that's used in all DALL·E prompts for that story
- **Prompt prefix**: All DALL·E prompts include character appearance details for consistency
- **Cost**: ~$0.04–0.08 per DALL·E image, ~$0.50 per complete 6-page story

### Image Storage

DALL·E returns temporary URLs (~1 hour). Images are immediately downloaded and uploaded to Supabase Storage via `lib/storage.ts`:
```
Bucket: story-images (public)
Path:   {storyId}/cover.png
        {storyId}/page-1.png
        {storyId}/page-2.png
        ...
URL:    {SUPABASE_URL}/storage/v1/object/public/story-images/{storyId}/{filename}
```

`downloadAndSaveImage()` downloads from DALL·E URL → uploads to Supabase with `upsert: true`.
`deleteStoryImages()` lists and removes all files in a story's folder on delete.

### Admin PIN Auth

PIN `5678` is checked client-side in two files:
- `app/admin/page.tsx` — admin dashboard (moderation queue, story management)
- `app/admin/manage/[id]/page.tsx` — story editor

**Note**: The create page (`/admin/create`) has NO PIN — kids can access it directly to create stories.

---

## User-Facing Pages

### Homepage (`/`)
- Bright sky-blue gradient with floating emoji decorations (stars, rainbow, dino, rocket, clouds)
- Rainbow gradient header with ✨ logo and "Story Sparks" branding + always-visible "✏️ Create!" button
- **Hero banner** (always visible): rotating mascot emoji (🦖🦄🐉🧙‍♂️🧜‍♀️🦊🐻🚀🧚🌈), randomized encouraging message, big Create CTA
- Category filter pills (scrollable) + reader level filter
- Story grid with cover images, hover animations (tilt + scale)
- Responsive: 2 cols on mobile, up to 5 on desktop
- Only shows `status = 'published'` stories
- Footer: "Made with 💖 for Burhanuddin — Sparking stories for kids everywhere ✨"
- Footer links: 📬 Contact Us + 🐛 Report an Issue (mailto: storysparks.fun@gmail.com)

### Story Reader (`/read/[id]`)
- Warm cream/amber background — designed for comfortable reading
- Full-screen image with white-bordered frame
- Story text in a soft white card below the image
- Navigation: keyboard (← → Space Esc), touch swipe (50px threshold), emoji arrow buttons
- Green progress bar, page dots, "🎉 The End!" celebration on last page
- Author credit displayed on final page (with co-author badge if applicable)
- Mobile: visible Back/Next buttons below content
- **Share button**: "Share" text button in top bar — uses Web Share API (native share sheet) on mobile, clipboard copy on desktop with "✅ Copied!" feedback. Share message includes author credit (e.g., "Read 'My Story', written by Alex on Story Sparks! ✨")
- Each story has a unique shareable URL (`/read/[id]`)

### Admin Dashboard (`/admin`)
- Dark theme (parent-facing), PIN protected
- 4-column stats: total / pending review / published / drafts
- Moderation queue: approve or reject pending stories
- Story management: publish/unpublish, delete, edit
- Links to create wizard and individual story editors

### Story Creator (`/admin/create`)
- **No PIN** — kids can access directly
- Bright sky-blue theme matching the homepage (floating decorations, white cards, rainbow header)
- 4-step wizard: Premise → Outline → Story & Art → Publish
- **Step 1**: Title, premise (200-char max with counter/hints), category, page count, detail level slider (1–5)
- **Two creation modes** (chosen via buttons at bottom of Step 1):
  - **"🪄 Generate Story Outline"** — AI generates text from the premise (existing flow, unchanged)
  - **"✏️ I want to write it myself"** — creates blank pages for the kid to write on; AI only generates illustrations
- **Step 2 (AI mode)**: AI-generated outline. Co-author mode: editable textareas, "Make It Shine ✨" (AI polish), "Surprise Me 🎲" (AI rewrite), ⭐ badges on edited pages
- **Step 2 (Write mode)**: Blank textareas for each page. Heading says "Write Your Story". Co-author score hidden. All pages marked as kid-written. Cannot proceed to art until every page has text.
- **Step 3**: Parallel DALL·E image generation (3 workers) with StarCatcher minigame
- **Step 4**: Review, add cover image, publish (goes to `pending_review`)

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
# OpenAI (required for story generation)
OPENAI_API_KEY=sk-proj-...your-key-here...

# Supabase (required for database + image storage)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

- OpenAI key: https://platform.openai.com/api-keys
- Supabase keys: Dashboard → Settings → API

### next.config.ts

```typescript
const nextConfig: NextConfig = {
  images: { unoptimized: true },  // Supabase Storage URLs served directly
  serverExternalPackages: [],
};
```

---

## Running Locally

```bash
cd C:\Users\huseinm\storynook
npm install
# Create .env.local with all keys (see above)
npm run dev
# Open http://localhost:3000
```

---

## Deployment (Vercel)

The app is deployed on Vercel with auto-deploy from `main`:

1. Push to GitHub: `git push origin main`
2. Vercel auto-deploys within ~60 seconds
3. Environment variables configured in Vercel dashboard:
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Custom Domain Setup

Domain: **storysparks.fun** (registered on GoDaddy)

DNS records configured at GoDaddy:
| Type | Name | Value |
|------|------|-------|
| A | `@` | `216.198.79.1` |
| CNAME | `www` | `a19d443c46f74f61.vercel-dns-017.com.` |

- Vercel auto-provisions SSL
- `www.storysparks.fun` → 307 redirect to `storysparks.fun`
- Vercel fallback: `storybook-three-lime.vercel.app`

---

## Known Limitations & Future Ideas

### Current Limitations
- **No real auth** — client-side PIN on admin only, create page is open
- **No image optimization** — using `unoptimized: true` for Supabase Storage URLs
- **Single language** — English only
- **Rate limits reset on cold start** — in-memory Maps, not persistent
- **No rejected story notification** — kids don't get feedback on why a story was rejected

### Potential Enhancements
- **Email notifications on story submission** — Send an email to the admin when a story is submitted for review (`pending_review`). Use Resend (free tier: 100 emails/day) with a `lib/email.ts` helper called from `/api/stories/[id]/publish`. Requires `RESEND_API_KEY` and `NOTIFICATION_EMAIL` env vars.
- **Stable Diffusion migration** — Replace DALL·E 3 with Stable Diffusion (SDXL/SD3/Flux) via Replicate or fal.ai API for ~5-10x cost savings ($0.005-0.01 vs $0.04-0.08 per image). Quality is comparable for storybook-style art. Could also fine-tune a LoRA for consistent illustration style across stories.
- Text-to-speech (read-aloud mode)
- Multiple user profiles (siblings)
- Reading progress tracking / bookmarks
- Story rating / favorites
- Offline support (PWA)
- Print-to-PDF for physical storybooks
- Multi-language story generation
- Abuse reporting system
- OpenAI spending caps / billing alerts
- Persistent rate limiting (Redis or Supabase)

---

## Troubleshooting

### DALL·E image URLs expire
DALL·E URLs are temporary (~1 hour). Images are immediately downloaded and uploaded to Supabase Storage via `lib/storage.ts`. If an image shows broken, regenerate it from the admin editor (`/admin/manage/[id]`).

### Next.js dev overlay in bottom-left
This is the Next.js dev overlay — only shows in `npm run dev`, not in production builds.

### CSS @import order error
In `globals.css`, the Google Fonts `@import url(...)` must come BEFORE `@import "tailwindcss"`. CSS spec requires `@import` rules to precede all other rules.

### Supabase Storage 403 errors
Ensure the `story-images` bucket is set to **public** in Supabase Dashboard → Storage. RLS policies should allow all operations (we use the service_role key server-side).

### Rate limit messages appearing unexpectedly
Rate limits use in-memory Maps that reset on Vercel cold starts. If the daily cap of 20 stories is hit, all users are blocked until the next cold start or 24-hour window.
