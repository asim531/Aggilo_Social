# Aggilo MVP — Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                               │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ AuthForm │  │ ClusterFeed  │  │    PostComposer       │  │
│  │ email    │  │  ┌─────────┐ │  │  [text input]         │  │
│  │ nickname │  │  │PostCard │ │  │  [Send] → optimistic  │  │
│  │ gender   │  │  │DuaRef   │ │  │  fire-and-forget sage │  │
│  │ country  │  │  │PostCard │ │  │                       │  │
│  └──────────┘  │  └─────────┘ │  └───────┬───────────────┘  │
│                └──────┬───────┘          │                   │
│  ┌──────────┐         │ realtime         │ POST              │
│  │ ClioFab  │         │                  │                   │
│  │ ClioEph  │         │                  │                   │
│  │ (lock)   │         │                  │                   │
│  └──────────┘         │                  │                   │
└───────────────────────┼──────────────────┼───────────────────┘
                        │                  │
┌───────────────────────┼──────────────────┼───────────────────┐
│                   SUPABASE               │                   │
│  ┌────────────────────┴─────────┐        │                   │
│  │  profiles (+ country)        │        │                   │
│  │  posts (+ post_subtype)      │        │                   │
│  │  dua_vault                   │        │                   │
│  │  welfare_notifications       │        │                   │
│  │  clio_ephemeral_sessions     │        │                   │
│  │  RLS policies                │        │                   │
│  └──────────────────────────────┘        │                   │
└──────────────────────────────────────────┼───────────────────┘
                                           │
┌──────────────────────────────────────────┼───────────────────┐
│                   NEXT.JS SERVER         │                   │
│  ┌───────────────────────────────────────┴─────────────┐     │
│  │  /api/sage/review  — async Sage message evaluation   │     │
│  │  /api/clio/chat    — Clio FAB chat                  │     │
│  │  /api/clio/ephemeral — private ephemeral chat       │     │
│  │  /api/notifications — welfare alerts for founder    │     │
│  └─────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────┐
│                   LLM API (OpenAI-compatible)                │
│  NVIDIA NIM / DeepSeek / OpenRouter / etc.                   │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Authentication
```
User enters email → nickname → gender → country
→ Beta disclosure (if non-South/SE Asia)
→ Supabase sends magic link → User clicks
→ /auth/callback saves profile (nickname, gender, country)
→ Redirect to /cluster
```

### 2. Posting (Optimistic + Async Sage)
```
User types message → PostComposer saves to Supabase immediately
→ Post appears in feed via Realtime
→ Fire-and-forget fetch to /api/sage/review
→ Sage evaluates silently (message_review decision tree)
→ If Sage decides to respond → new post saved → appears via Realtime
→ If Sage decides silence → nothing happens (correct behavior)
→ If welfare signal → welfare_notifications row created → founder alerted
```

### 3. Clio FAB Chat
```
User taps Clio FAB → chat panel opens
→ Messages sent to /api/clio/chat
→ LLM response returned → displayed in panel
→ Typing indicator during response generation
```

### 4. Clio Private Ephemeral Chat
```
User taps lock icon → ephemeral chat opens
→ Messages stored in browser sessionStorage (not server)
→ Session metadata in Supabase (clio_ephemeral_sessions)
→ API: /api/clio/ephemeral (with welfare detection)
→ 12h TTL — auto-clears from browser
→ If welfare detected → notification created for founder
```

## Database Schema

### `profiles`
- `id`, `nickname`, `gender`, `country`, `role`, `onboarded`, `created_at`

### `posts`
- `id`, `author_id`, `parent_id`, `content`, `is_sage`, `is_sage_question`
- `thread_state` (unattended | attended | welfare_flagged)
- `post_subtype` (null | host_content | arc_milestone | first_post_ack | etc.)

### `dua_vault`
- Verified Islamic references with Arabic, transliteration, translation, source, grade

### `welfare_notifications`
- `post_id` (nullable for ephemeral), `user_id`, `trigger_content`, `sage_response`
- `resolved`, `resolved_by`, `resolved_at`

### `clio_ephemeral_sessions`
- `session_id`, `user_id`, `started_at`, `expires_at`
- `message_count`, `welfare_flagged`, `welfare_escalated_at`

## Key Design Decisions

1. **Sage is async** — user never waits for Sage. Post saves immediately. Sage evaluates in background. No "thinking" indicator.

2. **Welfare is non-negotiable** — pattern detection runs in both Sage review and ephemeral chat. Notifications cannot be disabled.

3. **Ephemeral privacy** — conversation content lives only in browser sessionStorage. Server stores only session metadata. Content is never persisted server-side.

4. **Progressive disclosure** — DuaReference component renders Arabic (always visible), transliteration (visible), translation (collapsed, tap to reveal), source (always visible).

5. **OpenAI-compatible API** — all three LLM endpoints (Sage, Clio chat, Clio ephemeral) use the same provider configuration.
