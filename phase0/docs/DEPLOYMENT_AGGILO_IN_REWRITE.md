# Deployment — aggilo.in + Cluster Rewrites

> **Status:** Operational guide. Describes how the marketing site at
> `aggilo.in` and the cluster apps (currently `lc/` for Long
> Conversation) are deployed to Vercel and stitched together with
> rewrites so every cluster lives under a clean
> `aggilo.in/c/<slug>` URL.
>
> **Created:** 2026-05-26 alongside the LC `basePath` migration.

---

## The pattern in one paragraph

The marketing site (`launch/landing/`, static HTML+JS) is the canonical
Vercel project bound to `aggilo.in`. Each cluster lives in its own
Vercel project (`lc/` is the first; `mvp/` is the second) and ships
independently.

**CRITICAL:** The rewrite rules live in **ROOT `vercel.json` on `main`
branch** (the `aggilo-social` Vercel project that serves
`mvp.aggilo.in`). NOT in `phase0/mvp/vercel.json`, NOT in
`launch/landing/vercel.json`. Those files are stale references —
only the root `vercel.json` on `main` is deployed. Each rewrite entry
proxies `/c/<slug>/*` requests to the relevant cluster deployment.
The browser's URL bar always shows `mvp.aggilo.in/c/<slug>/...` —
never the underlying `*.vercel.app` hostname. Each cluster app sets
`basePath` in `next.config.mjs` so its own internal links and API
routes line up with the public rewritten path.

---

## The two Vercel projects

### 1. Marketing site — `aggilo-landing` (or whatever you name it)

| | |
|---|---|
| **Root Directory** | `launch/landing` |
| **Framework Preset** | Other (static) |
| **Build Command** | (none) |
| **Output Directory** | `.` |
| **Production Domain** | `aggilo.in`, `www.aggilo.in` |

The static HTML, the `submit.php` form handler, and the rewrite rules
all live here. No Next.js, no build step.

The rewrite rules live in **ROOT `vercel.json` on `main` branch**.
The current file rewrites:

- `mvp.aggilo.in/c/long-conversation` → LC project
- `mvp.aggilo.in/c/research-circle-mj` → RC_MJ project

When a new cluster ships, add two more entries to the `rewrites`
array (the bare-prefix and the `:path*` form), commit to `main`,
and push. Vercel auto-rebuilds the `aggilo-social` project.

### 2. Long Conversation — `aggilo-long-conversation`

| | |
|---|---|
| **Root Directory** | `lc` |
| **Framework Preset** | Next.js (auto-detected) |
| **Build Command** | `npm run build` (default) |
| **Production Domain** | `aggilo-long-conversation.vercel.app` (Vercel-assigned) |

The LC project does **not** carry a custom domain of its own. It is
reached only via the marketing site's rewrite. The
`*.vercel.app` URL is the rewrite destination, never a user-facing
URL.

If you want a private subdomain (e.g. `lc.aggilo.in`) for testing,
alias it on this project — the rewrite still works.

---

## basePath wiring inside the LC app

The LC app needs to render every link, asset URL, and API route under
`/c/long-conversation` so they line up with the rewrite. This is done
via Next.js's `basePath` config, controlled by an env var:

```
NEXT_PUBLIC_BASE_PATH=/c/long-conversation   # production
NEXT_PUBLIC_BASE_PATH=                        # development (empty)
```

The dev-empty case keeps `npm run dev` working at
`http://localhost:3001/cluster` like before. Production sets the
prefix and Next handles the rest.

Three cases that Next does **not** auto-prefix and that the LC code
goes through `lib/path.ts` for:

1. **`fetch("/api/...")` from the browser** — `withBasePath()` in
   AuthForm, ClioFab, PostComposer.
2. **`window.location.href = "/cluster"`** — `withBasePath()` in
   AuthForm and Navbar.
3. **`NextResponse.redirect()` from middleware and route handlers**
   — `withBasePath()` in `middleware.ts` and `auth/callback/route.ts`.

Plus one app-specific case that needs `withBasePath()` for the same
reason:

4. **Supabase `emailRedirectTo`** — magic links must bounce back
   through `aggilo.in/c/long-conversation/auth/callback`, not the
   underlying `*.vercel.app/auth/callback`.

---

## Supabase configuration

Two settings on the shared Supabase project that must be updated
before LC magic links work in production:

### Auth → URL Configuration → Site URL

```
https://mvp.aggilo.in
```

This is the platform-wide Site URL. All clusters share the same
Supabase project, so the Site URL is the main domain. Do NOT leave
this as `localhost` — if you do, magic-link emails will send users to
`http://localhost:3000/cluster?code=...` instead of the production URL.

### Auth → URL Configuration → Redirect URLs (allow-list)

Add every callback URL the platform needs to accept, **including BOTH
the clean URL and the raw `.vercel.app` URL**:

```
https://mvp.aggilo.in/c/long-conversation/auth/confirm
https://mvp.aggilo.in/c/research-circle-mj/auth/confirm
https://<lc-deployment>.vercel.app/c/long-conversation/auth/confirm
https://<rcmj-deployment>.vercel.app/c/research-circle-mj/auth/confirm
```

The raw `.vercel.app` URL is required because Supabase validates the
`Origin` header against the allow-list. When a user accesses the app
through the rewrite (`mvp.aggilo.in/c/...`), the browser's `Origin`
is the underlying deployment URL, not the rewritten one. If only the
clean URL is in the allow-list, Supabase falls back to the Site URL
and magic links break.

Without the production callback in this list, Supabase rejects the
magic link with "redirect URL not allowed". This is the single most
common deployment error.

---

## Environment variables on the LC Vercel project

Set these in the project settings under **Production**:

| Var | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<id>.supabase.co` | Shared with MVP |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Shared with MVP |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Server-only, never exposed |
| `NEXT_PUBLIC_CLUSTER_ID` | `long_conversation` | Hard-pinned per project |
| `NEXT_PUBLIC_BASE_PATH` | `/c/long-conversation` | Must match the rewrite source |
| `NEXT_PUBLIC_APP_URL` | `https://aggilo.in` | Public origin, not `.vercel.app` |
| `LLM_BASE_URL` | provider URL | OpenAI-compatible |
| `LLM_API_KEY` | secret | server-only |
| `LLM_MODEL` | model id | |
| `LLM_FALLBACK_*` | optional | |
| `LLM_DAILY_BUDGET_USD` | `5` | |
| `ADMIN_EMAILS` | comma list | Auto-promotes to `admin` role on first sign-in |
| `NEXT_PUBLIC_GA_ID` | `G-...` | Optional |
| `NEXT_PUBLIC_CLARITY_ID` | project id | Optional |

Set the same vars under **Preview** if you want preview deployments
to be functional (e.g. for PR previews). The `NEXT_PUBLIC_BASE_PATH`
on previews can stay `/c/long-conversation` because the rewrite from
the marketing-project preview will still proxy correctly — but
preview Supabase callbacks will need to be added to the allow-list
if you want auth to work on previews.

---

## Smoke test the rewrite

After deploying both projects:

```
curl -I https://aggilo.in/c/long-conversation
# → 200, with content-type text/html

curl -I https://aggilo.in/c/long-conversation/_next/static/chunks/main-app.js
# → 200, with content-type application/javascript
# (proves Next assets are served under the rewrite, which is the
#  most common point of failure)
```

In a browser:

1. Visit `https://aggilo.in/c/long-conversation`.
2. The URL bar should show `aggilo.in/c/long-conversation`. The page
   should be the LC landing.
3. Submit an email. Check the magic link in your inbox — the URL
   should start with `https://aggilo.in/c/long-conversation/auth/callback?code=...`,
   not `aggilo-long-conversation.vercel.app/...`.
4. Click the link. You should land at
   `https://aggilo.in/c/long-conversation/cluster` and see the empty
   Timeline.

If step 3 shows the `.vercel.app` host, the Supabase Site URL or
the LC `NEXT_PUBLIC_APP_URL` env var is wrong.

If step 4 lands at `aggilo.in/cluster` (404 from the marketing
project), the LC app is missing the `basePath` config — check
`NEXT_PUBLIC_BASE_PATH` on the LC project.

---

## Adding a future cluster

Concrete steps when, e.g., spinning up a `study-circle` cluster:

1. Build a new app folder (e.g. `study/`) the same way `lc/` is set
   up. Set its `NEXT_PUBLIC_CLUSTER_ID=study_circle`.
2. Deploy as its own Vercel project with **Root Directory** = `study`.
   Note the assigned `*.vercel.app` URL.
3. Set `NEXT_PUBLIC_BASE_PATH=/c/study-circle` on that project.
4. Add to **ROOT `vercel.json` on `main` branch**:

   ```jsonc
   {
     "source": "/c/study-circle",
     "destination": "https://study-aggilo.vercel.app/c/study-circle"
   },
   {
     "source": "/c/study-circle/:path*",
     "destination": "https://study-aggilo.vercel.app/c/study-circle/:path*"
   }
   ```

5. Commit and push to `main`. Vercel rebuilds the `aggilo-social`
   project automatically.
6. Add **BOTH** of these to the Supabase Auth Redirect URL allow-list:
   ```
   https://mvp.aggilo.in/c/study-circle/auth/confirm
   https://study-aggilo.vercel.app/c/study-circle/auth/confirm
   ```
7. Smoke-test per the section above.

---

*Deployment guide · aggilo.in + cluster rewrites · 2026-05-26.*
