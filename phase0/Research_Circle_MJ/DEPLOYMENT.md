# Deployment Notes — Research Circle MJ (RCJ)

## Vercel Configuration

| Setting               | Value                                        |
|-----------------------|----------------------------------------------|
| **Project Name**      | `aggilo-research-circle-mj`                  |
| **Project ID**        | *(create new Vercel project)*                |
| **Git Branch**        | `chore/phase0-folder-reshape`                |
| **Root Directory**    | `phase0/Research_Circle_MJ`                  |
| **Production URL**    | `mvp.aggilo.in/c/research-circle-mj`         |
| **GitHub Repo**       | `asim531/Aggilo_Social`                      |
| **Framework**         | Next.js                                      |

> [!IMPORTANT]
> The `phase0/Research_Circle_MJ` folder **does not exist on `main`**.
> This project lives on the `chore/phase0-folder-reshape` branch.
> All pushes must go to this branch — pushing to `main` will have
> **no effect** on the RCJ deployment.

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
- [ ] You changed files inside `phase0/Research_Circle_MJ/`

## How Auto-Deploy Works

A GitHub Action workflow (`.github/workflows/deploy-research-circle-mj.yml`) runs automatically on every push to `chore/phase0-folder-reshape` that touches `phase0/Research_Circle_MJ/**` files. It deploys directly to Vercel using the CLI, bypassing the unreliable Vercel Git integration.

## Required Secrets (one-time setup)

Add to GitHub → `asim531/Aggilo_Social` → Settings → Secrets → Actions:

| Secret | Value | How to get |
|--------|-------|------------|
| `VERCEL_TOKEN` | Your personal token | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `team_tgbVy4xnZxKW9hOkn0hY0qEW` | From root `.vercel/repo.json` |

## Troubleshooting

1. **Workflow did not run:**
   - GitHub → Actions tab → check if the workflow triggered
   - Only runs when files in `phase0/Research_Circle_MJ/**` change on `chore/phase0-folder-reshape`

2. **Workflow failed:**
   - GitHub → Actions → click the red run → read the error log
   - Common cause: `VERCEL_TOKEN` expired. Generate a new one.

3. **Manual fallback:**
   ```bash
   cd phase0/Research_Circle_MJ
   vercel deploy --prod --yes
   ```

## See Also
- `phase0/docs/GITHUB_VERCEL_WORKFLOW_TUTORIAL.md` — beginner tutorial on Git, Vercel CLI, and GitHub Actions
