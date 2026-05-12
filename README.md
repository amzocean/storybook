# Story Sparks ✨📖

A kid-friendly AI-powered storybook website where children create, illustrate, and share their own stories.

**Live site**: [storysparks.fun](https://storysparks.fun)

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend**: Next.js API routes (serverless on Vercel)
- **Database**: Supabase (PostgreSQL + Storage)
- **AI**: OpenAI GPT-4o (story text) + DALL·E 3 (illustrations)
- **Hosting**: Vercel (Hobby tier)
- **Domain**: storysparks.fun (GoDaddy DNS)

## Getting Started

```bash
npm install
cp .env.example .env.local  # Add your API keys
npm run dev                  # http://localhost:3000
```

Required environment variables: `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PIN`.

## Documentation

See **[DOCUMENTATION.md](./DOCUMENTATION.md)** for full architecture, API reference, database schema, and deployment details.
