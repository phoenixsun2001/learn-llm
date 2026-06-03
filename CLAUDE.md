# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend (Vite dev server on port 3000)
cd frontend && npm install && npm run dev
npm run build          # Production build into dist/
npm run preview        # Preview production build

# Pipeline (Python 3.12)
cd pipeline && pip install -r requirements.txt
python run_pipeline.py --full               # Full 5-step pipeline
python run_pipeline.py --source <name>      # Single RSS source only
python run_pipeline.py --list-sources       # List available RSS feeds
python run_pipeline.py --update-index       # Rebuild search index only

# Pipeline tests (set PYTHONPATH first)
cd pipeline && PYTHONPATH="." python tests/test_rss_fetcher.py
PYTHONPATH="." python tests/test_dedup.py

# Admin backend (FastAPI on port 8400)
cd pipeline && python -m admin_dashboard.main

# Docker deployment
./deploy.sh              # Start/restart both containers
./deploy.sh --build      # Force rebuild images then deploy
./deploy.sh --down       # Stop and remove containers
./deploy.sh --logs       # Tail all container logs
./deploy.sh --status     # Show container status and health
./deploy.sh --pipeline --full    # Run pipeline inside backend container
```

## Architecture

**Learn-LLM** is an open-source AI learning platform with three entry points: tutorial library, scenario search, and tool wizard. Content is curated from RSS feeds through an AI pipeline and served as static Markdown.

### Frontend (`frontend/`)

React 18 SPA built with **Vite** (not CRA). Uses `react-router-dom` v6 for routing.

**Routing** (defined in `src/App.jsx`):
- `/admin/*` — Admin routes with standalone layout (no public Navbar/Footer), guarded by `AdminGuard`
- `/*` — Public routes wrapped in Navbar + Footer + AIAssistant

**Data layer** — Content is served as static JSON indexes (`src/data/*-index.json`) plus Markdown files fetched at runtime from `/content/tutorials/`. `contentLoader.js` is the central data access module; it merges static index data with localStorage-stored imported tutorials, edited content, custom pathways, and per-tutorial status overrides. Key localStorage keys: `learn-llm-imported-tutorials`, `learn-llm-tutorial-statuses`, `learn-llm-edited-content`, `learn-llm-custom-pathways`.

**Auth** — `supabase.js` creates a Supabase client only if real credentials are configured; otherwise gracefully degrades to `null`. The `useAuth` hook handles GitHub OAuth sign-in and role-based admin detection. Auth is optional — the app functions fully without Supabase.

**Design tokens** — All tokens are CSS custom properties in `src/index.css` (`:root`). Use `var(--token-name)` references throughout; never hardcode colors or spacing.

**Component pattern** — Each component is a folder with `ComponentName.jsx` + `ComponentName.css`. CSS class names use kebab-case. React components use PascalCase. Ant Design (`antd`) + `@ant-design/icons` provide the UI component library.

**Key dependencies**: React 18, Vite 5, react-router-dom v6, Ant Design 5, react-markdown + react-syntax-highlighter, @supabase/supabase-js.

### Backend / Pipeline (`pipeline/`)

Python 3.12 FastAPI app serving an admin dashboard on port 8400.

**Admin dashboard** (`admin_dashboard/main.py`):
- Cookie-token auth middleware (`admin_token` cookie vs `ADMIN_TOKEN` env var)
- Jinja2 server-rendered templates for the dashboard UI
- REST API routes: `routes/review.py`, `routes/materials.py`, `routes/sources.py`
- SQLite database (`data/admin.db`) for pipeline state — initialized on startup via `models.py`
- Static files served from `admin_dashboard/static/`

**Content pipeline** (`run_pipeline.py` — CLI orchestrator):
```
Step 1: Fetch    (fetchers/) — RSS, GitHub, web scrapers
Step 2: Dedup    (processors/dedup.py) — sentence-transformers embeddings + cosine similarity
Step 3: Summarize (processors/summarizer.py) — Claude API or Ollama
Step 4: Classify (processors/classifier.py) — AI classification + difficulty rating
Step 5: Output   (output/writer.py) — Write .md + .json to content/materials/, update search index
```

**Config** (`config.py`): Dataclass-based, reads from environment variables. Default RSS feeds: Anthropic, OpenAI, LangChain, Dify blogs. AI steps are skipped if no `ANTHROPIC_API_KEY` is set.

### Database (Supabase)

Single migration file: `supabase/migrations/001_init.sql`. Defines:
- `user_progress` — per-user tutorial completion tracking (RLS: user-scoped)
- `admin_tutorials` — tutorial metadata with JSONB chapters/prerequisites
- `admin_pathways` — learning paths with ordered tutorial steps
- `admin_scenarios` — goal-driven scenarios linking tools and tutorials

All tables use RLS. Published content is publicly readable; modifications require admin role (checked via JWT `app_metadata.role`).

### Content (`content/`)

Tutorials are stored as plain Markdown files with YAML frontmatter (`title`, `source`, `category`, `difficulty`, `tags`). Pipeline-processed materials go to `content/materials/` as paired `.md` + `.json` files. Categories: `principle`, `model`, `harness`, `workflow`, `development`, `practice`. Difficulty levels: `beginner`, `intermediate`, `advanced`.

### Docker Compose

Two services on a shared `learn-llm` bridge network:
- **frontend** — Multi-stage build: Node 20 Alpine → Vite build → Nginx 1.27 Alpine serving `/usr/share/nginx/html`
- **backend** — Python 3.12 Slim running uvicorn, with `content/` and `pipeline/data/` mounted as volumes

Environment variables are passed at build time for the frontend and at runtime for the backend. The `.env` file is gitignored; `.env.example` is the template.

### Graceful Degradation

The app is designed to work without any backend services:
- No Supabase → auth is hidden, progress is localStorage-only
- No backend container → admin pages won't work, but all public pages function
- No AI API keys → pipeline skips summarization/classification steps
