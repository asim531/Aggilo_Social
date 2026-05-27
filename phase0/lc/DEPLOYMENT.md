# Deployment Notes — Long Conversation (LC)

## Vercel Configuration

| Setting               | Value                                        |
|-----------------------|----------------------------------------------|
| **Project Name**      | `aggilo-long-conversation`                   |
| **Project ID**        | `prj_TxpFRSEtBkNEcfFiWH7qBAa9q7oj`         |
| **Git Branch**        | `chore/phase0-folder-reshape`                |
| **Root Directory**    | `phase0/lc`                                  |
| **Production URL**    | `mvp.aggilo.in/c/long-conversation`          |
| **GitHub Repo**       | `asim531/Aggilo_Social`                      |
| **Framework**         | Next.js                                      |

> [!IMPORTANT]
> The `phase0/lc` folder **does not exist on `main`**. The LC project
> lives exclusively on the `chore/phase0-folder-reshape` branch.
> All pushes must go to this branch — pushing to `main` will have
> **no effect** on the LC deployment.

> [!CAUTION]
> **Vercel auto-deploy only triggers when the Production Branch matches
> the branch you push to.** If deployments are not triggering, verify
> in the Vercel Dashboard:
> `Project Settings → Git → Production Branch = chore/phase0-folder-reshape`

## Git Workflow

```bash
# Always confirm you're on the right branch before committing
git branch   # should show * chore/phase0-folder-reshape

# Stage, commit, push
git add <files>
git commit -m "feat: description"
git push origin chore/phase0-folder-reshape
```

## Quick Checklist Before Pushing
- [ ] You are on `chore/phase0-folder-reshape` (run `git branch`)
- [ ] Vercel project "Production Branch" is set to `chore/phase0-folder-reshape`
- [ ] Root directory in Vercel is `phase0/lc`

## Troubleshooting: Vercel Did Not Pick Up Changes

If a push does NOT trigger a Vercel build:

1. **Confirm push landed on remote:**
   ```bash
   git log --oneline -1 origin/chore/phase0-folder-reshape
   ```
   This must match your latest commit.

2. **Check Vercel Dashboard → Deployments tab:**
   - If no new deployment appears, the webhook likely didn't fire.
   - Go to `Project Settings → Git` and verify:
     - **Connected repo:** `asim531/Aggilo_Social`
     - **Production Branch:** `chore/phase0-folder-reshape`
     - **Root Directory:** `phase0/lc`
   - If the branch name doesn't match exactly, Vercel ignores the push.

3. **Manual redeploy (quick fix):**
   - Vercel Dashboard → Deployments → click latest → "Redeploy"
   - Or use CLI: `vercel --prod` (from `phase0/lc` directory)

4. **GitHub webhook health:**
   - GitHub repo → Settings → Webhooks → look for the Vercel webhook
   - Check "Recent Deliveries" for failures (403/timeout = token issue)

5. **Common gotcha — branch name mismatch:**
   The branch is `chore/phase0-folder-reshape` (with slashes). Some
   Vercel UI fields interpret `/` differently. If re-linking, copy-paste
   the exact branch name.
