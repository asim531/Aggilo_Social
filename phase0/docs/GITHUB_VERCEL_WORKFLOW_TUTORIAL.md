# Git, Vercel & GitHub Actions — A Short Tutorial

> For beginners. Covers the commands and concepts you actually use in this project.

---

## 1. Git — Saving Your Code

Git tracks every change you make so you can undo mistakes and collaborate.

| Command | What it does | Why you use it |
|---------|--------------|----------------|
| `git branch` | Shows what branch you are on | Make sure you are on `chore/phase0-folder-reshape` before committing |
| `git add <file>` | Stages a file for commit | Tells Git which changes to include in the next save |
| `git commit -m "feat: description"` | Saves your staged changes locally | Creates a snapshot with a message so you know what changed |
| `git push origin chore/phase0-folder-reshape` | Sends your local commits to GitHub | So GitHub (and Vercel) can see them |
| `git log --oneline -5` | Shows last 5 commits | Check what you (or others) recently changed |
| `git status` | Shows uncommitted changes | Quick health check before committing |

**The flow you will use every day:**
```bash
git add .
git commit -m "feat: what you changed"
git push origin chore/phase0-folder-reshape
```

---

## 2. Vercel CLI — Deploying Your App

Vercel is the hosting platform. The CLI lets you deploy from your computer without opening a browser.

| Command | What it does | Why you use it |
|---------|--------------|----------------|
| `vercel` | Deploys current folder as a **preview** | Quick test without affecting the live site |
| `vercel --prod` | Deploys current folder to **production** | Makes your changes live |
| `vercel ls` | Lists recent deployments | Check if your push created a new deployment |
| `vercel inspect <url>` | Shows details of one deployment | Debug why a deployment failed |
| `vercel project inspect <name>` | Shows project settings | Check root directory, framework, etc. |

**Important:** After we set up GitHub Actions, you will rarely need these commands. The workflow will run them automatically.

---

## 3. GitHub Actions — Automation

A **workflow** is a script that runs automatically when something happens in GitHub (like a push).

### Why we use it

Instead of:
1. Push code to GitHub
2. Open Vercel dashboard
3. Check if deployment happened
4. If not, disconnect/reconnect GitHub
5. Run `vercel --prod` manually

You now do:
1. Push code to GitHub
2. Done. The workflow deploys automatically.

### How it works

A workflow file lives in `.github/workflows/` and looks like this:

```yaml
name: Deploy Research Circle MJ          # Human-readable name

on:                                       # When does this run?
  push:
    branches: [chore/phase0-folder-reshape]  # Only on this branch
    paths: ['phase0/Research_Circle_MJ/**']   # Only when these files change

jobs:                                     # What to do
  deploy:                                 # Job name
    runs-on: ubuntu-latest                # Virtual machine type
    steps:                                # Steps to execute
      - uses: actions/checkout@v4         # Download your code
      - uses: actions/setup-node@v4       # Install Node.js
      - name: Install Vercel CLI
        run: npm install -g vercel@latest
      - name: Deploy to Vercel
        env:                              # Environment variables
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: vercel deploy --prod --yes --cwd phase0/Research_Circle_MJ --token $VERCEL_TOKEN
```

### Key YAML concepts

| Concept | What it means | Example |
|---------|---------------|---------|
| **Indentation** | Spaces matter. Use 2 spaces. | `steps:` is at same level as `runs-on` |
| **Key: value** | Left side is the name, right side is the value | `name: Deploy Research Circle MJ` |
| **Lists** | Items with `-` are a list | `steps:` has multiple `- name:` entries |
| **$\{\{ \}\}** | GitHub syntax to read secrets or context | `${{ secrets.VERCEL_TOKEN }}` |
| **`on:`** | Event trigger section | Defines when the workflow runs |
| **`env:`** | Environment variables | Secrets passed to commands |

---

## 4. Secrets — Safe Password Storage

You never put passwords in code. GitHub **Secrets** store them safely.

**Where to add them:**
GitHub → `asim531/Aggilo_Social` → Settings → Secrets → Actions → New repository secret

| Secret | Value | How to get it |
|--------|-------|---------------|
| `VERCEL_TOKEN` | Your personal Vercel token | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `team_tgbVy4xnZxKW9hOkn0hY0qEW` | From root `.vercel/repo.json` or run `vercel team list` |

**Note:** `VERCEL_PROJECT_ID` is hardcoded in each workflow file (no secret needed).

---

## 5. What Happens After Push (Visual Flow)

```
You push to chore/phase0-folder-reshape
        |
        v
GitHub detects push to branch + files in phase0/Research_Circle_MJ/**
        |
        v
GitHub Actions starts the "Deploy Research Circle MJ" workflow
        |
        v
Workflow runs: checkout code → install Node → install Vercel CLI → deploy
        |
        v
Your site is live at https://research-circle-mj.vercel.app
```

If you push files in `phase0/lc/**` instead, the **Long Conversation** workflow runs. If you push root files or `phase0/mvp/**`, no cluster workflow runs (MVP deploys separately from `main`).

---

## 6. Quick Troubleshooting

| Problem | Check |
|---------|-------|
| Workflow didn't run | Did you push to `chore/phase0-folder-reshape`? Did you change files in the right folder? |
| Workflow failed | GitHub → Actions tab → click the failed run → read the red error message |
| "Token invalid" | Your `VERCEL_TOKEN` expired. Create a new one at vercel.com/account/tokens |
| Site not updated | Check `vercel ls` or GitHub Actions tab to confirm the deploy succeeded |

---

## 7. Future Clusters (Copy-Paste Pattern)

For a new cluster app (e.g., `phase0/hyderabad_gate/`):

1. Create a new Vercel project (e.g., `hyderabad-gate`)
2. Copy `.github/workflows/deploy-research-circle-mj.yml`
3. Rename to `deploy-hyderabad-gate.yml`
4. Change 3 lines:
   - `name: Deploy Hyderabad Gate`
   - `paths: ['phase0/hyderabad_gate/**']`
   - `VERCEL_PROJECT_ID: <new-project-id>`
5. Push. No new secrets needed.
