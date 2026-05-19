# Aggilo MVP — Setup Guide

## What This Is

The Minimum Launchable Product for Aggilo Social: **one cluster** ("The Single Source"), **one AI agent** (Sage), **auth**, and a **feed** where humans and Sage converse together.

**Stack:** Next.js 14 (App Router) + Supabase (auth, DB, realtime) + Tailwind CSS + any OpenAI-compatible LLM API (NVIDIA NIM free tier recommended).

---

## Quick Start (5 steps)

### 1. Install dependencies

```bash
cd mvp
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your **Project URL** and **anon public key** from Settings → API
3. Go to the **SQL Editor** in the Supabase dashboard
4. Paste the entire contents of `supabase/schema.sql` and run it
5. In Authentication → Providers, make sure **Email** is enabled (disable "Confirm email" for dev)

### 3. Set up LLM API (for Sage)

Get an API key from one of these (all use OpenAI-compatible format):
- **NVIDIA NIM** (recommended, 40 RPM free): [build.nvidia.com](https://build.nvidia.com)
- **DeepSeek** (cheap, fast): [platform.deepseek.com](https://platform.deepseek.com)
- **OpenRouter** (many models): [openrouter.ai](https://openrouter.ai)

### 4. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase and LLM credentials
```

### 5. Run

```bash
npm run dev
# Open http://localhost:3000
```

---

## Project Structure

```
mvp/
├── README.md              ← You are here
├── ARCHITECTURE.md        ← How everything connects (read this first)
├── CONTINUE.md            ← Pickup guide for new Claude sessions
├── package.json           ← Dependencies
├── .env.example           ← All env vars with documentation
├── supabase/
│   └── schema.sql         ← Database schema (run in Supabase SQL editor)
├── src/
│   ├── middleware.ts       ← Auth guard: redirects unauthenticated users
│   ├── app/
│   │   ├── layout.tsx      ← Root HTML layout
│   │   ├── page.tsx        ← Landing page with auth form
│   │   ├── globals.css     ← Tailwind imports + base styles
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts  ← Handles Supabase auth redirect
│   │   ├── cluster/
│   │   │   └── page.tsx    ← The Single Source cluster experience
│   │   └── api/
│   │       └── sage/
│   │           └── route.ts  ← Sage LLM endpoint
│   ├── lib/
│   │   ├── types.ts        ← All TypeScript types
│   │   ├── supabase-browser.ts  ← Supabase client for browser
│   │   ├── supabase-server.ts   ← Supabase client for server
│   │   └── sage-prompt.ts  ← Sage's system prompt and persona
│   ├── components/
│   │   ├── AuthForm.tsx    ← Email login/signup form
│   │   ├── Navbar.tsx      ← Top bar with user + logout
│   │   ├── ClusterHeader.tsx  ← The Single Source title + description
│   │   ├── PostCard.tsx    ← Individual post in the feed
│   │   ├── PostComposer.tsx  ← Write a post or ask Sage
│   │   └── ClusterFeed.tsx ← Full feed with realtime updates
│   └── hooks/
│       └── useRealtimePosts.ts  ← Supabase realtime subscription
└── public/
    └── (static assets go here)
```

---

## Deploying to Vercel

```bash
npm install -g vercel
vercel
# Add your .env.local variables in Vercel dashboard → Settings → Environment Variables
# Change NEXT_PUBLIC_APP_URL to your Vercel URL
```

---

## What's NOT built yet (Phase 2+)

- Clio (personal AI companion) — build after Sage proves engagement
- Scout (web crawler for Clio) — build after Clio exists
- Atlas (Sage's assistant) — build after Sage needs delegation
- Observer (analytics AI) — Azim is the observer for now
- User-created clusters — build after The Single Source validates
- Geo-gating (India vs global) — build when non-India users show up
- Push notifications — build after D1 retention is measured
- Manager roles — build after 10+ users are active
