# Buksy

Buksy is a local personal operating system for everyday work and life. It combines task management, behavior-aware recommendations, multi-project scheduling, project memory, doc and to-do builders, research, file analysis, strategy tools, optional Ollama chat, and third-party integrations into one app you run yourself.

**Logo:** Place your official mark at `img/logo.png`. It is served at `/img/logo.png` and used in the sidebar and browser tab icon.

## Requirements

- **Node.js** 20 or newer (`package.json` `engines`)
- A modern browser

## Quick start

```bash
npm install
npm start
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) (or your configured host/port).

Without extra configuration, data is stored in `data/buksy-data.json` and no login is required.

## Core features

- **Next-step suggestions** from urgency, energy, duration, goal and project pressure, feedback, and optional local ML scoring.
- **Daily plan** and **multi-project schedule** with due dates, project deadlines, carry-forward (`deferUntil`), and capacity-aware day buckets.
- **Check-ins** (energy, focus, mood) that can auto-defer work on low days and ease soft deferrals when you are doing well.
- **Predictive day** simulation, cognitive load and focus guard signals, drift and weakness reports, opportunity and future-you pressure hints.
- **Digital twin** modeling that estimates follow-through, procrastination triggers, decision style, and "what will I likely do?" outcomes.
- **Future timeline engine** with aggressive, balanced, and lazy paths based on your current workload and completion velocity.
- **Habit DNA**, **emotional intelligence**, and **subconscious pattern detection** that surface burnout cycles, frustration loops, hidden triggers, and real adjustments.
- **Context engine** for sleep, commute, weather, work mode, and outside-world signals. This is currently driven by user-supplied context snapshots, keeping Buksy local-first.
- **Team brain** for shared planning, blockers, dependencies, and people-aware task reasoning.
- **Personal strategy engine** that ranks ROI focus areas and exposes reusable playbooks from your own behavior.
- **Gamified life system** with XP, streaks, unlocks, and a self-improvement loop that continuously retunes Buksy's guidance.
- **Privacy mode** with local-first and offline-preferred controls so intelligence stays on-device by default.
- **Autonomous action center** that plans actions like follow-up emails, meeting scheduling, developer sync, document builds, and to-do builds with an approval queue before execution.
- **Life Autopilot** that can preview or run day rebalancing, trim overload, queue suggested actions, and ask for approval only when needed.
- **Life analytics dashboard** with performance windows, avoidance patterns, burnout radar, goal success probabilities, local usage/credit scaffolding, and delay diagnosis.
- **Automation rules** for overdue tasks, low-energy recovery mode, and developer PR pressure.
- **Voice journal** that turns spoken or pasted notes into summaries, decisions, tasks, and memory items.
- **Goals** with autonomous decomposition, reverse planning, risk mitigation, roadmaps, linked tasks, and daily-hours estimates.
- **Time simulation** to project finish dates, slips, and what must happen this week.
- **Constraint solver** for fitting work into a time window.
- **Chat** with direct commands, action planning (`send`, `schedule`, `sync`, `run`), and optional **Ollama** for natural language routing, twin simulations, autopilot previews, and richer replies.
- **Thinking studio**: multi-agent analysis, role switching, debates, comparisons, simulations, ideas, learning plans, presentations, and workflow blueprints.
- **Workbench**: research briefs, file analysis, meetings, knowledge vault and queries.
- **Seeded knowledge** (software engineering, planning, and related topics) to improve generated docs and to-do lists when prompts match.
- **Integrations**: Jira boards, GitHub repos (commits/PRs), Notion databases, and **Google Calendar** free/busy hints that slightly reduce suggested capacity on busy days.
- **Plugin hub** for local extension controls like Gmail mode, Google Calendar write mode, Slack/Stripe toggles, and webhook hooks.
- **Developer mode** that turns GitHub PR pressure into Buksy tasks.
- **OAuth** (optional) for GitHub, Notion, and Google Calendar instead of pasting tokens; see below.

## UI overview

| Page | Purpose |
|------|---------|
| **Today** | Suggestion, chat, check-in, quick tasks, daily plan, multi-project outlook, open/completed tasks. |
| **Schedule** | Full timeline, carry-forward, rebalance, warnings and at-risk projects. |
| **Operate** | Life Autopilot, autonomous actions, approvals, automations, voice journal, world context, team brain, and AI goal planning. |
| **Insights** | Weekly report, digital twin, future timelines, habit DNA, emotional intelligence, strategy, privacy mode, and meta learning. |
| **Create** | Docs, to-dos, research, Ollama settings, and other builders. |
| **Projects** | Project snapshots, goals, constraints, artifacts. |
| **Integrations** | Plugin hub, Jira, GitHub (PAT or OAuth), Notion (token or OAuth), Google Calendar (OAuth), callback URL hints, developer import tools. |
| **Memory** | Knowledge, file and meeting intelligence, learning signals, artifacts, connected memory graph. |

## Configuration (`.env`)

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Purpose |
|----------|---------|
| `MYSQL_*` | Optional MySQL for per-user storage and login. |
| `BUKSY_PUBLIC_URL` | Public base URL of this app (**no trailing slash**). Required for correct OAuth redirects (e.g. `http://127.0.0.1:3000` locally). |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional GitHub OAuth; default scopes via `GITHUB_OAUTH_SCOPE` (`read:user repo`). |
| `NOTION_CLIENT_ID` / `NOTION_CLIENT_SECRET` | Optional Notion OAuth (public integration). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google Calendar OAuth (`calendar.readonly`); enables free/busy hints. |
| `PORT` | HTTP port (default `3000`). |

Exact redirect paths to register in each provider:

- `{BUKSY_PUBLIC_URL}/api/oauth/github/callback`
- `{BUKSY_PUBLIC_URL}/api/oauth/notion/callback`
- `{BUKSY_PUBLIC_URL}/api/oauth/google/callback`

## MySQL and authentication (optional)

Without MySQL, Buksy uses `data/buksy-data.json` only.

With MySQL:

1. Create an empty database.
2. Set `MYSQL_HOST`, `MYSQL_PORT` (default `3306`), `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` in `.env`.
3. Start the app; tables are created automatically (see `sql/schema.sql`).
4. Use the **Account** panel: **Create account** or **Log in**. Sessions use an HTTP-only cookie (`BuksySession`).

## Ollama (optional)

1. Install [Ollama](https://ollama.com) and pull a model (use a name that appears in `ollama list`, e.g. `qwen2.5` or another tag you prefer).
2. Keep Ollama running (default API `http://127.0.0.1:11434`).
3. In Buksy **Create** page, set base URL and **exact model name** to match your install.

Buksy works without Ollama; routing and templates still operate with built-in logic.

## Integrations (quick reference)

- **Jira Cloud:** base URL, email, API token, board ID -> connect and sync issues into tasks (deduped by issue key).
- **GitHub:** personal access token **or** OAuth; track `owner/repo` list; refresh dashboard for commits/PRs/stats.
- **Notion:** internal integration token **or** OAuth; database ID; optional "create Buksy project on sync".
- **Google Calendar:** OAuth only in the UI; uses primary calendar free/busy for today to tune capacity in the engine and scheduler.

## ML runtime (local)

- Event log: `data/ml-events.jsonl`
- Model state: `data/ml-models.json`
- Python helpers in `ml/` with JS fallback if Python is unavailable
- Useful endpoints: `GET /api/ml/metrics`, `POST /api/ml/retrain`, `POST /api/ml/shadow`

## Tests

```bash
npm test
```

## Useful chat commands

- `add renew passport tomorrow`
- `build launch plan doc`
- `build to do list for app launch`
- `send a follow-up email to the client about timeline`
- `schedule a product review next week`
- `sync my github work`
- `what should i do next?`
- `done renew passport`
- `goal launch my app in 20 days`
- `rebalance my day with autopilot`
- `will i actually complete this plan?`
- `where should i invest time right now?`
- `reply to client about timeline`
- `compare stay in job vs freelance`

## Project layout

| Path | Role |
|------|------|
| `server.js` | HTTP server, static files, `/img/*` from `img/`, JSON API, OAuth callbacks. |
| `public/` | Dashboard UI (`index.html`, `app.js`, `styles.css`). |
| `img/` | Brand assets; `logo.png` is the official logo. |
| `sql/schema.sql` | MySQL schema reference. |
| `src/store.js` | Persistence (JSON file or per-user MySQL JSON). |
| `src/engine.js` | Task scoring, daily plan, deferral hints, adaptive capacity. |
| `src/scheduler.js` | Multi-project schedule, carry-forward semantics. |
| `src/assistant.js` | Chat, `buildRuntimeContext`, Ollama wiring. |
| `src/meta.js` | Digital twin, future timelines, team brain, autopilot, strategy, and meta-learning layer. |
| `src/analytics.js` | Life analytics, burnout, delay analysis, and time simulation. |
| `src/autonomy.js` | Plugin catalog, execution planning, automation rules, and action execution. |
| `src/intelligence.js` | Predictive day, behavior model, memory graph, alerts. |
| `src/strategy.js` | Goals, constraints, negotiation, decisions. |
| `src/workbench.js` | Research, files, meetings, docs, to-dos, knowledge. |
| `src/ml.js`, `src/mlRuntime.js` | Local ML metrics and runtime. |
| `src/oauthService.js` | OAuth state and token exchange. |
| `src/googleCalendar.js` | Calendar free/busy and token refresh. |
| `src/jira.js`, `src/github.js`, `src/notion.js` | Integrations. |
| `src/knowledge-seed.js` | Bootstrapped domain knowledge. |
| `src/auth.js`, `src/db.js`, `src/context.js` | MySQL auth and request user context. |
| `ml/` | Optional Python training/inference scripts. |
| `test/` | Automated tests. |
| `docs/` | Additional design notes (e.g. MySQL auth plan). |

## Binary files

For PDFs or images, paste extracted text into the file analyzer for the strongest local results.
