# Legacy — Aggilo MVP (Root Tree)

> **Status:** Dormant / archived. Kept for reference, not for
> development. Do not run, do not deploy, do not import from.
>
> **Origin:** The very first Aggilo MVP, committed at `06f772d
> "Initial commit of Aggilo MVP"`. This was the original Sisters in
> Dua Next.js app that lived at the workspace root before the pilot
> apps were carved into their own folders.
>
> **Superseded by:** `phase0/mvp/` — the active Sisters in Dua
> pilot app (an embedded git repo). When you want to look at "the
> MVP," look there, not here.
>
> **Archived:** 2026-05-26.

---

## Why this is preserved

When the pilot workspace was reorganised into `phase0/`, this tree
held three things worth keeping:

1. **Half-completed refactor in progress.** The working tree at the
   moment of archival had ~22 staged deletions removing
   admin/clusters routes, demand-signals plumbing, atlas-tick,
   OG-image generation, sitemap, robots, public-cluster sharing,
   and related pieces. That intent had not been committed anywhere
   else. Preserving the tree captures that signal.

2. **Implementation references** that the active pilot
   (`phase0/mvp/`) and the production platform (in `architecture/`)
   may still want to look at:
   - `src/app/api/agents/introspect/route.ts` — closed-loop
     self-critique cycle implementation
   - `src/lib/llm-fetch.ts` — LLM client with budget cap +
     fallback + observability hooks
   - `src/components/AgentChatbox.tsx` — the agent collaboration
     surface referenced from `docs/AGENT_COLLABORATION_CHATBOX.md`
   - `src/lib/clio-prompt.ts`, `src/lib/sage-prompt.ts` — earlier
     prompt assembly patterns
   - `supabase/APPLY_NOW.sql`, `supabase/schema*.sql` — early
     schema migrations including realtime publication setup
   - `src/lib/share-prompts.ts` — cluster card / invite prompt
     scaffolding (deleted in the in-progress refactor; preserved
     here for the agent-voices doc)

3. **The Sisters In Dua spec corpus** at
   `Sisters In Dua/sisters_in_dua_cluster_spec_v3.1.md` and the
   vault HTML prototypes. The canonical cluster spec for this
   pilot now lives at `phase0/clusters/the_single_source/`, but
   the v3.1 spec document itself isn't duplicated there — this is
   its only home.

---

## What this is NOT

- Not the production platform. That's described in `architecture/`.
- Not the active pilot. That's `phase0/mvp/`.
- Not a working app. The deps are gone, the dev server isn't
  expected to start, and the in-progress deletions leave several
  imports dangling.

If you find yourself needing to revive parts of this tree, copy
them into the active home (`phase0/mvp/`, the production app, or a
new pilot cluster) and update the imports to match the new
context. Don't try to make the legacy tree run.

---

## Folder contents

```
phase0/_legacy/aggilo-mvp-root/
├── .env.example          ← env shape for the original root MVP
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── package.json          ← name = "aggilo-mvp"
├── package-lock.json
├── next-env.d.ts
├── public/               ← character art (clio.png, sage.png)
├── src/                  ← the original Next.js app (App Router)
├── supabase/             ← original schema + APPLY_NOW migration
└── Sisters In Dua/       ← v3.1 cluster spec + vault HTML prototypes
```

---

*Legacy archive · root MVP · 2026-05-26.*
