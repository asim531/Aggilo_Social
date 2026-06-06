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

## Git Workflow

```bash
# Always confirm you're on the right branch before committing
git branch   # should show * chore/phase0-folder-reshape

# Stage, commit, push
git add <files>
git commit -m "feat: description"
git push origin chore/phase0-folder-reshape
```

> After pushing, GitHub Actions automatically deploys to Vercel. No manual Vercel steps needed.

## Quick Checklist Before Pushing
- [ ] You are on `chore/phase0-folder-reshape` (run `git branch`)
- [ ] You changed files inside `phase0/lc/`

## How Auto-Deploy Works

A GitHub Action workflow (`.github/workflows/deploy-long-conversation.yml`) runs automatically on every push to `chore/phase0-folder-reshape` that touches `phase0/lc/**` files. It deploys directly to Vercel using the CLI, bypassing the unreliable Vercel Git integration.

## Required Secrets (one-time setup)

Add to GitHub → `asim531/Aggilo_Social` → Settings → Secrets → Actions:

| Secret | Value | How to get |
|--------|-------|------------|
| `VERCEL_TOKEN` | Your personal token | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `team_tgbVy4xnZxKW9hOkn0hY0qEW` | From root `.vercel/repo.json` |

## Troubleshooting

1. **Workflow did not run:**
   - GitHub → Actions tab → check if the workflow triggered
   - Only runs when files in `phase0/lc/**` change on `chore/phase0-folder-reshape`

2. **Workflow failed:**
   - GitHub → Actions → click the red run → read the error log
   - Common cause: `VERCEL_TOKEN` expired. Generate a new one.

3. **Manual fallback:**
   ```bash
   cd phase0/lc
   vercel deploy --prod --yes
   ```

## See Also
- `phase0/docs/GITHUB_VERCEL_WORKFLOW_TUTORIAL.md` — beginner tutorial on Git, Vercel CLI, and GitHub Actions
