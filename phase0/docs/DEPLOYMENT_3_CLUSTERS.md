# Deployment Guide — 3 Pilot Clusters

> **Status:** Operational guide for Research Circle MJ, Long Conversation, and Sisters in Dua clusters.
> **Updated:** 2026-06-04 after deployment issues resolved.

---

## Quick Overview

| Cluster | Folder | Branch | Vercel Project | Production URL |
|---------|--------|--------|----------------|----------------|
| **Research Circle MJ** | `phase0/Research_Circle_MJ/` | `chore/phase0-folder-reshape` | `research-circle-mj` | `mvp.aggilo.in/c/research-circle-mj` |
| **Long Conversation** | `phase0/lc/` | `chore/phase0-folder-reshape` | `aggilo-long-conversation` | `mvp.aggilo.in/c/long-conversation` |
| **Sisters in Dua** | `phase0/mvp/` | `main` (submodule) | `aggilo-social` | `mvp.aggilo.in` |

---

## Critical Configuration

### 1. Research Circle MJ

**Vercel Dashboard Settings:**
- **Project:** `research-circle-mj`
- **Root Directory:** `phase0/Research_Circle_MJ`
- **Production Branch:** MUST be set to `chore/phase0-folder-reshape`
- **Framework:** Next.js

**To set Production Branch via CLI:**
```bash
cd phase0/Research_Circle_MJ
vercel link  # If not already linked
vercel git connect  # Reconnect git if needed
```

**If production branch setting is missing from UI:**
1. Go to Vercel Dashboard → Project Settings → Git
2. If "Production Branch" field is empty, enter: `chore/phase0-folder-reshape`
3. Save changes

### 2. Long Conversation

**Vercel Dashboard Settings:**
- **Project:** `aggilo-long-conversation`
- **Root Directory:** `phase0/lc`
- **Production Branch:** `chore/phase0-folder-reshape`
- **Framework:** Next.js

### 3. Sisters in Dua (MVP)

**⚠️ IMPORTANT:** MVP is a **Git Submodule**

**Vercel Dashboard Settings:**
- **Project:** `aggilo-social`
- **Root Directory:** `phase0/mvp`
- **Production Branch:** `main`
- **Framework:** Next.js

**Submodule workflow:**
```bash
# To update MVP
cd phase0/mvp
git checkout main
git pull origin main
# Make changes, commit, push from INSIDE phase0/mvp
git push origin main

# Then update parent repo pointer
cd ../..
git add phase0/mvp
git commit -m "Update MVP submodule"
git push origin chore/phase0-folder-reshape
```

---

## Common Issues & Solutions

### Issue: Deployments going to wrong project

**Cause:** Multiple Vercel projects pointing to same repo without proper root directory separation.

**Solution:**
1. Verify each project has unique Root Directory:
   - RC_MJ: `phase0/Research_Circle_MJ`
   - LC: `phase0/lc`
   - MVP: `phase0/mvp`

2. Check that Production Branch is set correctly for each

3. Ensure no conflicting `vercel.json` files in subdirectories

### Issue: "Still Joining" / 404 errors

**Cause:** Git integration not properly configured or production branch mismatch.

**Solution:**
1. Vercel Dashboard → Project Settings → Git
2. Verify "Connected Git Repository" shows: `asim531/Aggilo_Social`
3. Verify "Production Branch" matches the table above
4. If missing, click "Connect Git Repository" and re-link

### Issue: Submodule changes not deploying

**Cause:** MVP is a submodule. Pushing to parent repo doesn't automatically update submodule.

**Solution:**
Must commit AND push from inside `phase0/mvp/` directory, then update the parent repo's submodule pointer.

---

## Rewrite Configuration (Root vercel.json)

The root `vercel.json` at `D:\Aggilo_Social\vercel.json` handles routing:

```json
{
  "rewrites": [
    {
      "source": "/c/long-conversation",
      "destination": "https://aggilo-long-conversation.vercel.app/c/long-conversation"
    },
    {
      "source": "/c/long-conversation/:path*",
      "destination": "https://aggilo-long-conversation.vercel.app/c/long-conversation/:path*"
    },
    {
      "source": "/c/research-circle-mj",
      "destination": "https://research-circle-mj.vercel.app/c/research-circle-mj"
    },
    {
      "source": "/c/research-circle-mj/:path*",
      "destination": "https://research-circle-mj.vercel.app/c/research-circle-mj/:path*"
    }
  ]
}
```

**⚠️ NEVER put `vercel.json` in subdirectories:**
- ❌ `phase0/Research_Circle_MJ/vercel.json` 
- ❌ `phase0/lc/vercel.json`
- ❌ `phase0/mvp/vercel.json`

Only the root `vercel.json` should exist.

---

## Deployment Checklist

Before pushing changes:

- [ ] On correct branch (`chore/phase0-folder-reshape` for RC_MJ/LC, `main` for MVP)
- [ ] Commits are on the branch that matches Vercel Production Branch setting
- [ ] For MVP: pushed from inside `phase0/mvp/` submodule
- [ ] No local `vercel.json` in subdirectories
- [ ] Root `vercel.json` has correct rewrites

---

## Emergency Recovery

If deployments break:

1. **Check Vercel Dashboard** → Deployments → Latest deployment errors
2. **Verify Git connection:** Project Settings → Git → "Connected Git Repository"
3. **Check Production Branch** matches this guide
4. **Verify Root Directory** is set correctly
5. **Redeploy:** Vercel Dashboard → Deployments → Latest → "Redeploy"

---

*Deployment Guide — 3 Pilot Clusters · 2026-06-04*
