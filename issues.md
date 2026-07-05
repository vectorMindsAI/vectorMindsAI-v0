# Project Issues & Cleanup Report

A deep review of the AI Research Agent codebase, focused on making it presentable as a portfolio/resume project. Issues are grouped by severity. Each item notes the file(s) and a suggested fix.

---

## 🔴 Critical — Credibility / "It doesn't actually do what the README says"

These are the ones that will hurt most if a recruiter or engineer opens the repo, because the marketing does not match the code.

### 1. Core "MongoDB Integration" feature is entirely mocked
The README dedicates a whole section to "MongoDB Schema Detection" and "Connect directly to your MongoDB databases", but the endpoints return hardcoded fake data.
- `app/api/mongodb/connect/route.ts` — ignores the connection string, `setTimeout(1000)`, returns a hardcoded list `["cities", "countries", ...]`.
- `app/api/mongodb/fetch/route.ts` — generates mock documents via `generateMockFields()`. No DB connection at all.
- **Fix:** Either implement a real read-only Mongo connection using the user-supplied string, or clearly label this as a "demo/mock" in the README and UI. Shipping fake data behind a real-looking feature is the single biggest credibility risk.

### 2. The "Enrichment Engine" returns `Math.random()` data
`app/api/enrich/route.ts` fabricates `gdp_billions`, `climate`, `unemployment_rate`, etc. with `Math.random()`. The README bills this as a "Multi-Step Enrichment Pipeline". A reviewer running the app gets random numbers.
- **Fix:** Wire this to the real research pipeline (Groq/Tavily) or remove it.

### 3. README is inconsistent and partly inaccurate
- Two different clone URLs used: `github.com/vectorMindsAI/vectorMindsAI-v0.git` (setup) vs `github.com/priyansh56701.../AI-Research-Agent` (support links). Neither may be correct.
- Tech stack lists **Vercel AI SDK** and **SWR** — neither is in `package.json`. The app actually uses LangChain + Inngest + native fetch.
- Says "Support for 20+ AI models (GPT-4, Claude, Gemini)" but the agents are hardcoded to **Groq only** (`ChatGroq`, default `groq/compound`).
- Instructs `cp .env.template .env.local`, but `.env.template` is gitignored (`.env*`) so a fresh clone won't have it. Only `.env.example` is committed.
- Uses `NEXTAUTH_SECRET` / `NEXTAUTH_URL` in one place and `AUTH_SECRET` in another (NextAuth v5 uses `AUTH_SECRET`).
- Duplicate "Key Features" heading; "Access at localhost:3002 / 3001 / 3000 / 3002" repeated inconsistently.
- **Fix:** Rewrite the README to match reality. Pick the correct repo URL, list the real stack (Groq/Tavily/Mixedbread/Pinecone/Inngest), and describe only features that work.

---

## 🟠 High — Correctness / Config

### 4. `package.json` metadata is placeholder / polluted
- `"name": "my-v0-project"` — leftover from the v0.dev scaffold. Rename to the real project.
- Junk/dangerous dependencies: `"install": "^0.13.0"` and `"npm": "^11.17.0"` are listed as **runtime dependencies**. These should not be there.
- Bleeding-edge/likely-invalid versions: `next: 16.2.9`, `react: 19.2.7`, `typescript: ^6`, `@types/node: ^25`, `eslint: ^10`, `mongoose: ^9`, `lucide-react: ^1.18.0`. Several of these versions don't exist yet publicly — verify the lockfile resolves and the app builds on a clean `npm install`.
- **Fix:** Set a real `name`, remove `install`/`npm` deps, pin to versions that actually exist and install cleanly.

### 5. TypeScript errors silently ignored at build
`next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `images.unoptimized: true`. This hides real type bugs (the codebase uses `any` and `@ts-ignore` in several places, e.g. `lib/inngest/functions.ts:171`). For a showcase project, a green `tsc --noEmit` is worth more than a build that ignores errors.
- **Fix:** Fix the type errors and flip `ignoreBuildErrors` to `false`, or at least run and pass `tsc --noEmit` in CI.

### 6. `@langchain/textsplitters` used but not a direct dependency
`lib/inngest/functions.ts:132` imports `@langchain/textsplitters`, but it's only present transitively in `package-lock.json`, not in `package.json` dependencies. This breaks if the transitive dep is deduped/removed.
- **Fix:** Add it to `dependencies` explicitly.

### 7. Inngest step IDs contain stray spaces
`lib/inngest/functions.ts:37,39` — `` `rate - limit - ${i} ` `` and `` `process - criterion - ${i} ` ``. The spaces around `-` and the trailing space look like accidental formatting and make step IDs ugly/fragile. Same sloppy spacing in log messages (`${criterionName} ` with trailing space).
- **Fix:** Use clean IDs like `` `process-criterion-${i}` ``.

### 8. LLM calls don't set `max_tokens`
`reviewer.ts`, `prompt-enhancer.ts` set `temperature` but not `max_tokens`. Your own convention (and good practice) is to set both explicitly to avoid silent provider defaults and runaway cost.

---

## 🟡 Medium — Security / Robustness

### 9. `/api/research` has no auth requirement
`app/api/research/route.ts` calls `auth()` but treats the session as optional (`session?.user?.id`). Anonymous callers can start jobs (rate-limited only by IP). If this is meant to be a logged-in feature, enforce it; if intentionally public, document it.

### 10. Rate limiting is in-memory and per-instance
`lib/rate-limit.ts` uses a module-level `store` object and `setInterval`. This resets on every cold start and is not shared across serverless instances (the app targets Vercel). Effectively no real limit in production.
- Note: `express-rate-limit` is a dependency but unused — this file is a hand-rolled reimplementation. CLAUDE.md incorrectly describes it as "express-rate-limit adapted for Next.js".
- **Fix:** Use a shared store (Upstash/Redis) for real deployments, or document the limitation.

### 11. Filesystem job store won't work on serverless
`lib/store.ts` writes `jobs_db.json` to `process.cwd()` on every create/update/log. On Vercel/serverless the filesystem is read-only or ephemeral per-invocation, so the "fast synchronous read" copy is unreliable and the file (currently ~170 KB locally) grows unbounded. Every update does a full read-modify-write of the whole file (race conditions under concurrency).
- **Fix:** Make MongoDB the source of truth for status polling; drop or gate the filesystem copy behind local-only.

### 12. Test/debug routes shipped in the repo
`app/api/test-sentry/route.ts`, `app/test-analytics/page.tsx`, `test-posthog.py`, `lib/analytics-test.ts` are throwaway test surfaces. `test-sentry` can be hit in production to trigger errors.
- **Fix:** Remove them or guard behind `NODE_ENV !== 'production'`.

---

## 🟢 Low — Cleanliness / Presentation

### 13. Documentation sprawl (17 markdown files at root)
`ADMIN.md, API_DOCS.md, CACHING.md, DOCKER.md, ERROR_HANDLING_ARCHITECTURE.md, ERROR_HANDLING_QUICK_REFERENCE.md, GUIDE.md, INNGEST.md, PIPELINES.md, SEARCH_HISTORY_FLOW.md, SENTRY_COMPLETE.md, TASK.md, TODO.md`, etc. Many read like internal scratch notes and clutter the repo root.
- **Fix:** Move detailed docs into a `/docs` folder, keep only `README`, `LICENSE`, `CONTRIBUTING`, `SECURITY`, `CODE_OF_CONDUCT` at root. Delete `TASK.md`/`TODO.md` scratch files.

### 14. Duplicate global CSS
`app/globals.css` (164 lines) and `styles/globals.css` (125 lines) both exist. Only one is imported. Dead file confuses readers.
- **Fix:** Delete the unused one.

### 15. Broken/placeholder doc links in README
Links to `QUICKSTART.md` (doesn't exist as a tracked file) and repeated "See DOCKER.md" blocks. GitHub Issues/Discussions links point at a possibly-wrong org.

### 16. CLAUDE.md drift vs actual code
- Says status is polled at `/api/research/status/[jobId]`, but the actual route is `/api/research/status?id=` (query param, `app/api/research/status/route.ts`).
- Describes rate-limit as express-rate-limit (it's custom).
- **Fix:** Update CLAUDE.md so it matches the code.

### 17. Three Dockerfiles + multiple compose files
`Dockerfile`, `Dockerfile.dev`, `Dockerfile.simple`, `docker-compose.yml`, `docker-compose.prod.yml`. Consolidate and document which is canonical.

### 18. `console.log`/`console.error` sprinkled through server code
`lib/store.ts`, `lib/mongodb.ts`, `auth.ts` use raw `console.*` including emoji. You have a `lib/logger.ts` — route server logs through it consistently.

### 19. Pervasive `any` types
`Job.result: any`, `plan?: any`, `safeInvoke(runnable: any, input: any)`, mock route helpers return `Record<string, any>`. Contradicts the "TypeScript strict, no any" goal and undercuts the "type-safe" claim.

---

## Suggested priority order for a resume-ready repo
1. Fix the README so nothing is claimed that the code doesn't do (#3, #1, #2).
2. Clean `package.json` — real name, remove `install`/`npm`, sane versions (#4).
3. Decide the mock features' fate: implement or clearly label (#1, #2).
4. Make the build type-clean and remove test routes (#5, #12).
5. Tidy repo surface: docs into `/docs`, delete dupes/scratch files (#13, #14, #17).
6. Address serverless correctness (job store + rate limit) or document the local-only assumption (#10, #11).
