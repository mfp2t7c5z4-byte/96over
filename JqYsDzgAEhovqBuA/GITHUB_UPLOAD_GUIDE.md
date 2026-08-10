# GitHub Upload Guide for 96 Over Golf Tracker

## Essential Files for GitHub Upload

This guide shows all the files you need to upload to GitHub to make your golf tracker web app available as an open-source project.

---

## Project Structure

```
golf-tracker/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI/CD pipeline
├── client/                         # Frontend React application
│   ├── public/
│   │   ├── favicon.ico
│   │   └── __manus__/
│   │       └── debug-collector.js
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── AppShell.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── CourseStatsSheet.tsx
│   │   │   ├── LogPastRoundDialog.tsx
│   │   │   ├── StartRoundDialog.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── ui/               # shadcn/ui components
│   │   ├── pages/                # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── CoursesPage.tsx
│   │   │   ├── ActiveRoundPage.tsx
│   │   │   ├── HandicapPage.tsx
│   │   │   ├── RoundHistoryPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── NotFound.tsx
│   │   ├── lib/                  # Utilities
│   │   │   ├── storage.ts        # localStorage management
│   │   │   ├── handicap.ts       # WHS calculation engine
│   │   │   └── utils.ts
│   │   ├── contexts/             # React contexts
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/                # Custom hooks
│   │   ├── App.tsx               # Main app router
│   │   ├── main.tsx              # React entry point
│   │   └── index.css             # Global styles
│   ├── index.html                # HTML template
│   └── tsconfig.json
├── server/                        # Express server (for production)
│   └── index.ts
├── shared/                        # Shared types
│   └── const.ts
├── .gitignore                     # Git ignore rules
├── .prettierrc                    # Code formatting config
├── components.json               # shadcn/ui config
├── LICENSE                       # MIT License
├── package.json                  # Dependencies and scripts
├── pnpm-lock.yaml               # Lock file (commit this!)
├── README.md                     # Project documentation
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite build config
└── ideas.md                      # Design philosophy notes
```

---

## Files to Upload to GitHub

### ✅ MUST INCLUDE (Core Files)

1. **Source Code**
   - `client/src/` — All React components and pages
   - `server/index.ts` — Production server
   - `shared/const.ts` — Shared constants

2. **Configuration**
   - `package.json` — Dependencies and scripts
   - `pnpm-lock.yaml` — Exact dependency versions (IMPORTANT!)
   - `tsconfig.json` — TypeScript configuration
   - `vite.config.ts` — Build configuration
   - `components.json` — shadcn/ui configuration
   - `.prettierrc` — Code formatting rules

3. **Documentation**
   - `README.md` — Project overview and setup instructions
   - `LICENSE` — MIT license

4. **CI/CD**
   - `.github/workflows/ci.yml` — Automated testing and builds

5. **Client Assets**
   - `client/index.html` — HTML template
   - `client/public/` — Static assets (favicon, etc.)

### ⚠️ SHOULD INCLUDE (Recommended)

- `.gitignore` — Prevents committing node_modules, build files, etc.
- `ideas.md` — Design philosophy and decisions
- `patches/` — Any npm package patches

### ❌ DO NOT INCLUDE (Excluded by .gitignore)

- `node_modules/` — Installed dependencies (users run `pnpm install`)
- `dist/` — Build output (generated during build)
- `.manus/` — Manus-specific files
- `.manus-logs/` — Development logs
- `.env` — Environment variables (if any)
- `.project-config.json` — Manus metadata

---

## Steps to Upload to GitHub

### 1. Create a New Repository on GitHub
- Go to [github.com/new](https://github.com/new)
- Repository name: `golf-tracker` (or `96-over`)
- Description: "A personal golf web app with WHS Handicap Index calculator, course management, and live round tracking — fully offline, no server required."
- Choose: **Public** (to share with others)
- License: **MIT License**
- **Do NOT** initialize with README (you already have one)

### 2. Push Your Local Repository

```bash
cd /home/ubuntu/golf-tracker

# Add the remote repository
git remote set-url origin https://github.com/YOUR_USERNAME/golf-tracker.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Add Repository Details on GitHub

**Settings → General:**
- Add description: "A personal golf web app with WHS Handicap Index calculator"
- Add website URL (if you deploy it)

**Settings → Topics:**
Add these tags:
- `golf`
- `golf-tracker`
- `handicap`
- `whs`
- `react`
- `tailwind-css`
- `web-app`
- `offline-first`
- `pwa`

---

## What Users Will See

When someone visits your GitHub repository, they'll see:

1. **README.md** — Full feature list, setup instructions, and tech stack
2. **LICENSE** — MIT license (permissive open-source)
3. **Source code** — All React components and utilities
4. **CI/CD status** — GitHub Actions badge showing build status
5. **Clone/Download options** — Easy setup with `git clone`

---

## After Upload: Deployment Options

Once on GitHub, you can deploy to:

1. **GitHub Pages** (free, static hosting)
   ```bash
   npm run build
   # Deploy dist/ folder to GitHub Pages
   ```

2. **Vercel** (free tier available)
   - Connect GitHub repo
   - Auto-deploys on push

3. **Netlify** (free tier available)
   - Drag-and-drop or connect GitHub

4. **Your own server** (VPS, Docker, etc.)

---

## Verification Checklist

Before pushing to GitHub, verify:

- [ ] `git status` shows clean working tree
- [ ] `package.json` has all dependencies
- [ ] `pnpm-lock.yaml` is committed
- [ ] `README.md` is complete and accurate
- [ ] `LICENSE` file exists
- [ ] `.gitignore` excludes `node_modules/` and `dist/`
- [ ] `.github/workflows/ci.yml` exists for CI/CD
- [ ] No sensitive data in any files (no API keys, passwords, etc.)
- [ ] All source files are in `client/src/` and `server/`

---

## Questions?

If you need help with:
- **Deployment** — See deployment options above
- **Contributing guidelines** — Add a `CONTRIBUTING.md` file
- **Issue templates** — GitHub can auto-generate these
- **Releases** — Tag versions with `git tag v1.0.0` and push

Good luck with your GitHub launch! 🚀
