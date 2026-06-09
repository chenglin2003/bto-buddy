# BTO Buddy

A planning tool for Singapore couples choosing a BTO flat. Ranks every upcoming
HDB launch against what *both* partners actually care about — commute, MRT
access, amenities, price, estate maturity — then surfaces disagreements rather
than averaging them away.

Built on official data: HDB launch schedules + data.gov.sg + OneMap routing.
Anthropic's Claude writes a grounded explanation for each top pick.

---

## Stack

- **Next.js 15** (App Router, React 19, Server Components)
- **TypeScript** throughout
- **Tailwind CSS** with a custom editorial design system (Fraunces + Geist)
- **Supabase** — Postgres + RLS + magic-link auth
- **OneMap API** — Singapore Land Authority's geocoding + routing
- **Anthropic Claude** — grounded LLM rationale for top rankings

## Getting started

### 1. Install

```bash
pnpm install      # or npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. In the SQL editor, run:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_seed_bto_projects.sql`
3. In Authentication settings, enable Email provider and set the site URL to
   `http://localhost:3000` for local dev.

### 3. Set up OneMap

Register at [onemap.gov.sg/apidocs/register](https://www.onemap.gov.sg/apidocs/register).
You'll need an account to use the routing and nearby-services APIs.

### 4. Set up Anthropic

Get an API key from [console.anthropic.com](https://console.anthropic.com).

### 5. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
ONEMAP_EMAIL=...
ONEMAP_PASSWORD=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 6. Enrich project data (one-off)

This pulls nearest-MRT for every seeded BTO project from OneMap:

```bash
pnpm enrich
```

### 7. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Next.js App Router                                      │
│                                                          │
│  /            landing page (editorial)                   │
│  /login       magic-link auth                            │
│  /onboarding  create or join a couple                    │
│  /app         rankings (Server Component)                │
│  /app/preferences   sliders per partner                  │
│  /app/locations     geocoded places + weights            │
│  /app/explain       triggers Claude rationale            │
│  /api/geocode       proxy to OneMap                      │
│                                                          │
└──────────┬─────────────────┬─────────────────┬───────────┘
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │ Supabase │      │ OneMap   │      │ Anthropic│
    │ (PG+RLS) │      │ (SLA)    │      │ Claude   │
    └──────────┘      └──────────┘      └──────────┘
```

### Ranking engine

`src/lib/ranking.ts` implements a per-partner sub-scoring system. Each project
gets five sub-scores in 0–100 (commute, MRT, amenities, price, maturity),
weighted by that partner's preference dials, then reconciled across partners
using one of three strategies:

- **average** — egalitarian mean
- **max_pain** — minimum of both partners (no flat picked if one hates it)
- **weighted** — tilts toward whoever feels more strongly

### Score curves

Each sub-score uses a piecewise linear curve (`curveScore`) with three
inflection points: *ideal* (100), *tolerable* (50), and *bad* (0). These are
tuned for Singapore — e.g. MRT distance tolerates up to 800m walk before
penalizing.

### LLM rationale

`src/lib/llm.ts` sends the top 5 ranked projects + both partners' full
preference and location context to Claude Sonnet 4. The model returns JSON
mapping project name → one-sentence rationale that *references actual
preferences and locations by name*. Results are cached in the `scores` table.

---

## Roadmap

- [ ] Real public-transport routing (not just Haversine) — wire up OneMap PT API
- [ ] Disagreement view — surface projects where partners diverge most
- [ ] Map view with all candidates plotted
- [ ] Watch a launch — email alerts when HDB announces details
- [ ] Resale comparators using data.gov.sg HDB Resale Price Index

---

## License

MIT. Built independently; not affiliated with HDB, SLA, or any government body.
