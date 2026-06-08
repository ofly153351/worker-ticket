# 🐞 Hermes Bug Tracker

A self-hosted bug-ticket tracker with an **AI agent** that reads outstanding
tickets and posts a daily summary to **Discord / Telegram** — powered by the
[Hermes CLI](https://github.com/NousResearch/Hermes) running locally.

Report bugs (with screenshots), browse them on a calendar or table, assign each
project its own AI agent + schedule, and let the agent triage your backlog every
morning.

---

## ✨ Features

- **Projects & Tickets** — full CRUD, severity (`low → critical`), status
  (`open / in_progress / resolved / rejected`), reporter, page URL, browser info.
- **Image uploads** — drag & drop, click, or **paste a screenshot (Ctrl+V / ⌘V)**.
  Files stream to **MinIO** (S3) and are served from a public URL.
- **Two ticket views** — a month **calendar** (default) and a filterable **table**
  (search, project, severity, status, pagination).
- **AI daily summaries** — per-project cron runs the Hermes agent over all
  **outstanding** tickets (open + in-progress) and saves a structured digest
  (executive summary, severity breakdown, top risks, action items with fixes).
- **Per-project agents** — each project picks its own Hermes CLI profile, cron
  schedule, and Discord webhook. A global fallback covers unassigned projects.
- **Live countdown** — see exactly how long until the next Discord delivery
  (computed client-side, zero server polling).
- **Agent management** — browse Hermes CLI profiles from `~/.hermes`, configure
  model / provider / `SOUL.md`, and create new profiles — all from the UI.
- **Dark mode**, polished transitions, skeleton loading.

---

## 🧱 Tech stack

| Layer        | Tech                                                                 |
| ------------ | -------------------------------------------------------------------- |
| Frontend     | Vue 3 · Vite · Pinia · Vue Router · Tailwind CSS — port **1818**     |
| Backend      | Express 5 · TypeScript · Prisma 7 (`@prisma/adapter-pg`) — port **4000** |
| Database     | PostgreSQL (`bug_ticket_db`)                                         |
| Object store | MinIO (S3-compatible) — bucket `obx-ticket`, public read             |
| AI agent     | Hermes CLI (`hermes`) — invoked per project                          |
| Notify       | Discord webhook · Telegram (via `hermes send`)                       |
| Deploy       | PM2 · Cloudflare Tunnel                                              |

---

## 📁 Project structure

```
obx-ticket/
├── src/                      # Vue 3 frontend (Vite root)
│   ├── pages/                # Dashboard, Projects, Tickets, Summaries, Settings
│   ├── components/           # ui/ tickets/ projects/ agents/ summaries/ layout/
│   ├── services/             # axios API clients (envelope unwrap + camelCase)
│   ├── stores/               # Pinia stores
│   └── composables/          # useToast, useTheme, useCountdown
├── backend/
│   ├── src/
│   │   ├── modules/          # projects · tickets · summaries · config · agent
│   │   ├── middleware/       # error, validate, upload (multer)
│   │   ├── lib/              # prisma, minio
│   │   └── config/env.ts     # NODE_ENV-aware env loader
│   ├── prisma/               # schema.prisma + migrations
│   └── hermes-config.json    # agent + schedule config (gitignored)
├── ecosystem.config.cjs      # PM2 apps (ticket-backend, ticket-frontend)
└── golive.sh                 # one-shot deploy (pull → build → tunnel → PM2)
```

### Data model (Prisma)

`Project` → `Ticket` → `TicketImage`, plus `DailyBugSummary`.
Enums: `Severity`, `TicketStatus`, `ProjectStatus`.

---

## 🚀 Local development

### Prerequisites
- Node.js 20+ (developed on 25)
- A running **PostgreSQL** and **MinIO** (this repo reuses the `pos-backend`
  Docker stack: containers `pos-backend-postgres-1` / `pos-backend-minio-1`).
- `hermes` CLI (optional — without it the agent falls back to mock summaries).

### 1. Database + storage
```bash
# create the app database (once)
docker exec pos-backend-postgres-1 psql -U postgres -c "CREATE DATABASE bug_ticket_db;"
# bucket is created automatically; ensure it is public-read
docker exec pos-backend-minio-client-1 mc anonymous set public local/obx-ticket
```

### 2. Backend
```bash
cd backend
cp .env.development.example .env.development   # fill DB password etc.
npm install
npx prisma migrate dev        # create tables
npm run dev                   # → http://localhost:4000  (NODE_ENV=development)
```

### 3. Frontend
```bash
npm install
npm run dev                   # → http://localhost:1818
```

Open **http://localhost:1818**.

---

## ⚙️ Environment

Config is split by environment. **Frontend `VITE_*` values are public** (baked
into the client bundle) and committed; **backend values are secrets** and ignored.

| File                               | Scope          | Committed |
| ---------------------------------- | -------------- | --------- |
| `.env.development`                 | frontend dev   | ✅        |
| `.env.production`                  | frontend prod  | ✅        |
| `.env.production.local`            | machine domain override | 🚫 |
| `backend/.env.development.example` | template       | ✅        |
| `backend/.env.production.example`  | template       | ✅        |
| `backend/.env*`                    | real secrets   | 🚫        |

- Frontend: Vite auto-selects `.env.development` (dev) / `.env.production` (build).
- Backend: `config/env.ts` loads `.env.${NODE_ENV}` first, then `.env` as fallback.

---

## 🔌 API

All responses use a consistent envelope:
```json
{ "success": true, "message": "Success", "data": {} }
```

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET/POST` | `/api/projects` | list / create |
| `GET/PUT/DELETE` | `/api/projects/:id` | read / update / delete |
| `POST` | `/api/projects/:id/run-summary` | run the agent now |
| `GET`  | `/api/projects/:id/preview-summary` | preview the prompt + payload |
| `GET`  | `/api/tickets?project_id=&severity=&status=&search=&page=&limit=` | filtered list |
| `POST` | `/api/tickets` | create (`multipart/form-data` with `images`) |
| `PATCH`| `/api/tickets/:id/status` | change status |
| `GET`  | `/api/summaries` · `/api/summaries/:id` | AI digests |
| `GET`  | `/api/config/hermes-cli` | Hermes CLI profiles (`~/.hermes`) |
| `GET/PUT` | `/api/config/schedule` | global cron / notify config |
| `GET`  | `/api/config/next-runs` | next scheduled run per project |

Images are uploaded to MinIO and served at
`{MINIO_PUBLIC_URL}/obx-ticket/tickets/{ticketId}/{file}`.

---

## 🤖 How the daily summary works

```
cron (per project)  →  fetch tickets where status ∈ {open, in_progress}
                    →  build structured payload (counts, risks, tickets)
                    →  hermes --profile <project's agent> -z "<prompt>"
                    →  parse JSON  →  save DailyBugSummary
                    →  Discord webhook (rich embed) / Telegram
```

Configure per project in **Projects → Edit → Hermes Agent**: agent profile,
schedule (cron), and Discord webhook. The **Settings → Schedule** tab shows a
live countdown to each project's next delivery and a master enable toggle.

> Want the agent to reply in Thai? Add a line to that profile's `SOUL.md`
> (Settings → Agents → Configure), e.g. *"ตอบกลับเป็นภาษาไทยเสมอ"*.

---

## 🌐 Deploy (production)

`golive.sh` automates the whole go-live on a Linux server (run inside WSL on
Windows):

```bash
echo 'ghp_xxx' > ~/.github_token && chmod 600 ~/.github_token   # for git pull
./golive.sh                 # git pull main → build → tunnel → PM2
./golive.sh --no-tunnel     # local only
./golive.sh --no-pull       # build current tree
```

It:
1. Force-syncs to `origin/main` (token-based, no creds persisted).
2. Verifies PostgreSQL + MinIO, creates the DB/bucket if missing.
3. Adds `ticket.* ` ingress rules to the **shared Cloudflare tunnel** and routes DNS.
4. Builds backend (`prisma migrate deploy` + `tsc`) and frontend (`vite build`).
5. Starts `ticket-backend` + `ticket-frontend` via PM2 and reloads the tunnel.

Public URLs (same Cloudflare zone, distinct subdomains):
`ticket.<domain>` · `ticket-api.<domain>` · `ticket-media.<domain>`.

### PM2
```bash
pm2 status
pm2 logs ticket-backend
pm2 restart ticket-backend
```

---

## 🌿 Branches

- **`main`** — production. `golive.sh` deploys from here.
- **`dev`** — development. Work here, then merge to `main` to release.

```bash
git checkout dev            # develop
git checkout main && git merge dev && git push   # release
```

---

## 📄 License

Private project.
