# Aggilo MVP — Sisters in Dua

The first **premium cluster** on Aggilo. One cluster, two AI agents (Sage + Clio), a real Admin and Managers, and a closed-loop AI substrate that gets sharper with every interaction.

> **What changed in the latest 7-principles audit:**
>
> - Every LLM call now flows through `lib/llm-fetch.ts:llmCall()`, which records to `llm_response_logs` with cost, tokens, latency, decision summary, and fallback flag.
> - Sage emits a structured decision tag at the end of every response; the platform parses it, logs to `sage_decision_logs`, and strips it before showing the post.
> - Monotheism / good-character guardrail (Sage Step 0.5) detects rejection of God, mockery of practice, and coercion against members. Logs to `character_concerns`. Admin sees in dashboard.
> - Behavioural events ingestion at `/api/events` + `lib/track.ts` helper. Foundation for AGGIL segment intelligence.
> - Member feedback on Sage/Clio output via `agent_feedback` and the SageFeedback component.
> - Admin dashboard at `/admin` — Welfare, Character, Agent Thoughts, Vault, LLM, Features, Events.
> - Auto-elevation: emails in `ADMIN_EMAILS` env var are promoted to `founder` role on first sign-in.
> - Fallback LLM provider (`LLM_FALLBACK_*`) for resilience. Daily budget cap (`LLM_DAILY_BUDGET_USD`) prevents runaway loops.
> - Premium-cluster terminology: "Founder" → "Admin" everywhere user-facing. DB enum unchanged.
> - "Agent Chatbox" → "Agent Thoughts" in all UI strings.
> - Branded magic-link email template at `supabase/email_templates/magic_link.html`.

---

## Quick Start

### 1. Install
```bash
cd mvp
npm install
```

### 2. Supabase
1. Create a project at supabase.com.
2. Settings → API → copy `URL`, `anon key`, `service_role key`.
3. Authentication → Providers → enable Email; for dev, disable "Confirm email".
4. SQL Editor → paste the entire `supabase/APPLY_NOW.sql` and run it. The script is idempotent — safe to re-run after schema updates.
5. Authentication → Email Templates → "Magic Link" → paste `supabase/email_templates/magic_link.html` (set Subject: "Sign in to Sisters in Dua", From name: "Sisters in Dua").

### 3. LLM provider
Get an OpenAI-compatible API key. **Recommended for MVP:**
- Primary: NVIDIA NIM (40 RPM free) — `https://integrate.api.nvidia.com/v1` + `moonshotai/kimi-k2-5`
- Fallback: DeepSeek (cheap) — `https://api.deepseek.com/v1` + `deepseek-chat`

### 4. Configure env
```bash
cp .env.example .env.local
```
Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`
- (Recommended) `LLM_FALLBACK_BASE_URL`, `LLM_FALLBACK_API_KEY`, `LLM_FALLBACK_MODEL`
- `LLM_DAILY_BUDGET_USD` (default 5)
- **`ADMIN_EMAILS`** — comma-separated list of admin emails. The first time any of them signs in, their profile is promoted to `founder` and they can access `/admin`.

### 5. Run
```bash
npm run dev
# http://localhost:3000
```

---

## Architecture at a glance

```
┌────────────────── Browser ──────────────────┐
│ AuthForm → ClusterShell → ClusterFeed       │
│ ClioFab (dual-tab) · AgentChatbox (live)    │
│ SageFeedback · DuaProgressiveReveal         │
│ Admin: /admin/welfare /character /thoughts  │
│        /vault /llm /features /events        │
└──────────────┬───────────────┬──────────────┘
               │               │
               ▼               ▼
┌─────── Supabase ──────┐  ┌── Next API ─────────────┐
│ profiles · posts      │  │ /api/sage/evaluate      │
│ dua_vault             │  │ /api/sage/suggest-dua   │
│ welfare_notifications │  │ /api/clio/chat          │
│ character_concerns    │  │ /api/clio/ephemeral     │
│ llm_response_logs     │  │ /api/agents/cadence-... │
│ sage_decision_logs    │  │ /api/events             │
│ behavioural_events    │  │ /api/feedback           │
│ agent_feedback        │  │ /api/notifications      │
│ agent_chatbox_excha.. │  │ /api/links/unfurl       │
│ clio_handoff_greet..  │  └─────────┬───────────────┘
│ link_previews         │            │
│ cluster_features      │            ▼
│ vault_gap_requests    │  ┌── lib/llm-fetch.ts ─────┐
│ vault_sources         │  │ Primary → Fallback      │
│ agent_prompt_propos.. │  │ Token / cost / latency  │
│ platform_settings     │  │ → llm_response_logs     │
└───────────────────────┘  └─────────────────────────┘
```

---

## What runs through which agent

| Agent | LLM operation_key | When it fires |
|-------|------------------|---------------|
| `sage` | `sage_evaluate` | After every member post (fire-and-forget) |
| `sage_dua_select` | `sage_dua_select` | Every 6h on cluster load (cadence-gated) |
| `clio_dua_review` | `clio_dua_review` | Editorial gate after Sage selects a dua |
| `cadence` | `cadence_exchange` | 15-min floor for cold cluster, 1h for active |
| `clio` | `clio_chat` | Cluster-aware Clio FAB ("Just Clio · remembers" tab) |
| `clio` | `clio_ephemeral` | Private "Just Clio · forgets" tab |
| `link_alignment` | `link_alignment_check` | When a member posts a URL |

Every call: cost recorded, latency recorded, fallback recorded, decision recorded. Visit `/admin/llm` for the live dashboard.

---

## Where to make changes

| Want to change... | Edit... |
|-------------------|---------|
| Sage's persona | `src/lib/sage-prompt.ts:SAGE_SYSTEM_PROMPT` |
| Clio's persona | `src/lib/clio-prompt.ts` |
| Cadence-exchange persona | `src/app/api/agents/cadence-exchange/route.ts:PROMPT` |
| Vault entries | `supabase/APPLY_NOW.sql` (v1.4 vault seed) or Supabase SQL Editor directly |
| Welfare patterns | `src/lib/clio-prompt.ts:WELFARE_PATTERNS` |
| Character-concern patterns | `src/lib/sage-prompt.ts:CHARACTER_CONCERN_PATTERNS` |
| Cost rates | `src/lib/llm-fetch.ts:COST_PER_1M_TOKENS` |
| LLM daily budget | `LLM_DAILY_BUDGET_USD` env var |
| Admin allowlist | `ADMIN_EMAILS` env var |

---

## Deploy

Vercel:
```bash
npm install -g vercel
vercel
```
Set every env var from `.env.example` in Vercel dashboard. Set `NEXT_PUBLIC_APP_URL` to your Vercel domain. In Supabase Authentication → URL Configuration, add the Vercel domain to "Site URL" and "Additional redirect URLs".

---

## Future docs

- Premium cluster requirements: [`../architecture/premium_cluster_requirements.md`](../architecture/premium_cluster_requirements.md)
- Soul: [`../AGGILO_SOUL.md`](../AGGILO_SOUL.md)
- Platform rules: [`../AGGILO_PLATFORM_RULES.md`](../AGGILO_PLATFORM_RULES.md)
- Sisters in Dua spec: [`Sisters In Dua/sisters_in_dua_cluster_spec_v3.1.md`](Sisters%20In%20Dua/sisters_in_dua_cluster_spec_v3.1.md)
