# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Development Commands

### Local Development (requires two terminals)

**Terminal 1 — Next.js app:**
```bash
npm run dev        # http://localhost:3000
```

**Terminal 2 — Inngest dev server (required for all background jobs):**
```bash
npm run inngest    # or: npx inngest-cli@latest dev
```

Background research and embedding jobs will silently fail if Inngest is not running.

### Other commands
```bash
npm run build      # Production build (TypeScript errors are intentionally ignored via next.config.mjs)
npm run lint       # ESLint
npm run start      # Production server
```

### Docker
```bash
npm run docker:up   # docker-compose up -d  → http://localhost:3002
npm run docker:dev  # with hot reload       → http://localhost:3001
npm run docker:down
npm run docker:logs
```

---

## Required Environment Variables

Copy `.env.example` to `.env.local`:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `AUTH_SECRET` | NextAuth secret (`npx auth secret`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | PostHog analytics |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking |

**Note:** AI provider keys (Groq, Tavily, Mixedbread, Pinecone) are entered by users at runtime in the dashboard UI — they are **not** server environment variables. This is the core BYOK (Bring Your Own Key) design.

---

## Architecture Overview

### Request Lifecycle for Research

```
POST /api/research
  → rate limit check (lib/rate-limit.ts)
  → auth check (auth.ts / NextAuth)
  → in-memory cache lookup (lib/cache.ts)
  → create job in jobs_db.json + MongoDB (lib/store.ts)
  → emit Inngest event "research/start"
  → client polls /api/research/status?id=[jobId]

Inngest "research-flow" function (lib/inngest/functions.ts):
  → createPromptEnhancer (lib/agents/prompt-enhancer.ts) — Groq LLM
  → createResearcher (lib/agents/researcher.ts)       — Tavily search
  → createReviewer (lib/agents/reviewer.ts)           — Groq LLM
  → update job state in jobs_db.json + MongoDB
```

### Dual Job Store (critical design decision)

All background jobs are persisted in **two places simultaneously** via `lib/store.ts`:

1. **`jobs_db.json`** (filesystem) — fast synchronous read for status polling. This file can grow large.
2. **MongoDB `AgentJob` model** (`lib/models/AgentJob.ts`) — durable storage linked to `userId` for history and search.

When debugging job state issues, check both sources. The filesystem copy is always written first.

### Inngest Functions (`lib/inngest/functions.ts`)

Two background functions:
- **`research-flow`** (event: `research/start`) — the main city research pipeline. Supports `research/cancel` to cancel a running job.
- **`process-embeddings`** (event: `vector/start-embedding`) — chunks text, embeds with Mixedbread, upserts to Pinecone in batches of 10.

The agent plan executor (`lib/inngest/agent-runner.ts`, event: `agent/execute-plan`) orchestrates multi-step plans by invoking `researchFlow` as sub-jobs.

### In-Memory Cache (`lib/cache.ts`)

A singleton `Cache` class backed by a `Map`. TTLs are defined in `cacheTTL`. Cache keys are in `cacheKeys`. Auto-cleans expired entries every 5 minutes. **This cache is process-scoped** — it does not survive restarts and is not shared across serverless instances.

### Authentication (`auth.ts`)

NextAuth v5 with two providers:
- **Google OAuth** — auto-creates a user document in MongoDB on first sign-in.
- **Credentials** (email + bcrypt password) — user must exist in MongoDB.

JWT strategy. The `role` field (`"user"` | `"admin"`) is embedded in the JWT and exposed on `session.user.role`. Admin role unlocks the `/cache` dashboard route.

### Dashboard Structure (`app/dashboard/page.tsx`)

Single-page app with a fixed sidebar (API key inputs, model selection) and tabbed main content. API keys entered in the sidebar are passed as props down to each panel component — they are **never persisted server-side**.

Tabs: Research → Criteria → History → Vector Store → Agent → Settings → Docs

Each tab content is wrapped in `<ErrorBoundary level="section">`.

### Error Handling

Three-level React Error Boundary hierarchy (see `ERROR_HANDLING_ARCHITECTURE.md`):
- **App level** (`app/layout.tsx`) — full-page fallback
- **Section level** (dashboard tabs) — section reload fallback
- **Component level** — inline error message

Server-side errors are captured to Sentry via `lib/logger.ts` (`logServerError`) and `@sentry/nextjs`.

### Key Lib Files

| File | Purpose |
|---|---|
| `lib/mongodb.ts` | Singleton Mongoose connection with Sentry-instrumented error reporting |
| `lib/store.ts` | Dual-write job store (filesystem + MongoDB) |
| `lib/cache.ts` | In-memory TTL cache with `getOrSet`, `deletePattern`, stats |
| `lib/rate-limit.ts` | Custom in-memory rate limiter for Next.js API routes |
| `lib/analytics.ts` | PostHog server-side event tracking |
| `lib/logger.ts` | Structured server-side logging |
| `lib/toast.ts` | Thin wrapper around Sonner for client-side toasts |
| `lib/inngest/client.ts` | Inngest client singleton |

### Path Aliases

`@/` maps to the project root (configured in `tsconfig.json`). Use `@/lib/...`, `@/components/...`, `@/app/...`.

---

## Common Gotchas

- **TypeScript errors are ignored at build time** (`ignoreBuildErrors: true` in `next.config.mjs`). The build will succeed even with type errors — run `tsc --noEmit` manually if you need type checking.
- **`jobs_db.json`** is a runtime file (not gitignored by default). It can grow very large. Treat it as ephemeral.
- **MongoDB connection** is skipped at build time when `MONGODB_URI` contains `build-dummy` — this is intentional for CI/Docker builds.
- The Inngest route (`app/api/inngest/route.ts`) must register all functions exported from `lib/inngest/functions.ts` and `lib/inngest/agent-runner.ts`.
