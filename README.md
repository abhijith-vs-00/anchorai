# Anchor

> Stay through the urge. Learn from the moment. Prepare for the next.

Privacy-first AI recovery companion for substance-use recovery support. Anchor helps people get through difficult moments with minimal cognitive effort, learn what works for them, prepare for future triggers, and helps caregivers support without surveillance.

**Anchor is recovery support — not medical diagnosis, detox guidance, or crisis care.**

---

## Problem Statement

People in recovery often face high-cognitive-load moments where typing, reading, and navigating complex apps is too much. Caregivers want guidance without invading privacy. Existing tools often shame setbacks or fake AI responses.

## Our Approach

- **Don't make me think when I'm struggling** — full-screen Help Me Now / Anchor Mode
- **You don't need to tell us who you are** — motivational aliases, no real name required
- **A setback does not erase progress** — no FAILED / streak-lost messaging
- **Learn what works for me** — Recovery Memory from real outcomes
- **Support without surveillance** — Companion Mode never sees private recovery data
- **Real Gemini + real MongoDB** — no canned AI, no fake dashboards

## Key Features (P0)

| Feature | Description |
|--------|-------------|
| Auth | Demo / Login / Signup as recoverer or companion (email or username + password) |
| Recoverer home | Blueprint · Help Me Now · After |
| Help Me Now | 3-min urge timer, strategies, Gemini chat (text + voice), ask a human |
| Blueprint | Visual dashboard, memory, analysis, share username with companions |
| After | Calm-down + reflection + emergency resources |
| Companion | Link by username, support board post/reply, AI coaching tips |
| Safety layer | Deterministic escalation + curated emergency resources |

Peer Mode and voice input are **P1** and intentionally not included until P0 is solid.

## Architecture

```text
Browser
   │
   ↓
Next.js (App Router)
   │
   ├─ UI
   ├─ Route Handlers (/api/*)
   ├─ Services
   ├─ Safety Engine
   ├─ Gemini Adapter
   └─ Repository Layer
          │
     ┌────┴────┐
     ↓         ↓
  MongoDB    Gemini
```

Modular monolith — one repo, one Vercel deployment.

## Technology Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS 4**
- **MongoDB Atlas**
- **Google Gemini** via `@google/genai`
- **Zod** validation
- **Vitest** unit tests
- **Vercel** hosting

## AI Usage

All Gemini calls go through `src/lib/ai/gemini.client.ts`.

- Model name from `GEMINI_MODEL` env (never hardcoded across the app)
- Structured JSON outputs validated with Zod
- One retry on schema failure, then deterministic fallbacks
- Gemini personalises interventions, prevention plans, companion guidance, and optional memory narrative
- Gemini must **not** invent emergency numbers, diagnose, prescribe, or predict relapse

## Safety Approach

```text
User input → Deterministic safety checks → Gemini → Zod → App policy → UI
```

Urgent paths surface curated options (local emergency services guidance, SAMHSA, 988) — never AI-hallucinated contacts.

## Privacy Approach

- No mandatory real name
- Minimal data: alias, blueprint, check-ins, interventions, setbacks, plans
- Companion Mode is independent (no auto-linking to recovery accounts)
- Secrets only in server env vars (never `NEXT_PUBLIC_`)

## Local Setup

**Requires Node.js 20+** (see `.nvmrc`).

```bash
nvm use
cp .env.example .env.local
# fill MONGODB_URI, SESSION_SECRET, and optionally GEMINI_API_KEY
npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without `GEMINI_API_KEY`, AI features use safe deterministic fallbacks so the app still works for local UI testing. Add a real key for evaluator demos.

## Environment Variables

```text
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
MONGODB_URI=
MONGODB_DB_NAME=anchor_dev
APP_ENV=development
SESSION_SECRET=use-a-long-random-string
```

Never commit `.env.local` or `Credentials/`.

### Suggested DB names

| Environment | `MONGODB_DB_NAME` |
|-------------|-------------------|
| Local | `anchor_dev` |
| Vercel Preview | `anchor_preview` |
| Vercel Production | `anchor_prod` |

Use separate Google Cloud projects for development vs production Gemini keys (quota is per project).

## MongoDB Setup

1. Create an Atlas free cluster
2. Allow network access for your IP / Vercel
3. Put the connection string in `MONGODB_URI`
4. Run `npm run seed` to upsert verified resources + indexes

If Node fails with `querySrv ECONNREFUSED` on Windows, use Atlas **standard connection string** (non-`mongodb+srv`) with explicit hosts, `replicaSet`, `ssl=true`, and `authSource=admin`.

## Gemini Setup

1. Create an API key in Google AI Studio
2. Set `GEMINI_API_KEY` and a free-tier-stable `GEMINI_MODEL`
3. Server-side only — never expose the key to the browser

## Running Tests

```bash
npm test
npm run test:coverage
npm run build
```

Automated suite covers:
- Safety classifier & emergency options
- Auth password/username helpers
- Zod AI schemas (intervention, prevention, companion, chat)
- Gemini adapter error mapping (mocked SDK — no live quota)
- Intervention & chat services with mocked Gemini/repos
- Journey / Recovery Memory calculations
- API response envelope helpers
- Landing + Home UI smoke tests (Testing Library)

Do **not** run live Gemini in CI; use Preview smoke tests sparingly before submission.

## Deployment

1. Push to GitHub (public repo)
2. Import project in Vercel
3. Set Preview env vars (dev Gemini + `anchor_preview`)
4. Set Production env vars (prod Gemini + `anchor_prod`)
5. Deploy `main`
6. Run `npm run seed` against production DB (or a one-off seed script with prod URI)
7. Verify `/api/health`

## Evaluator Instructions

1. Open the deployed URL
2. Prefer **pitch test accounts** (persistent seeded data):
   - Recoverer: `phoenix_demo` / `AnchorDemo1!`
   - Companion: `care_demo` / `AnchorDemo1!`
3. Or use **See how it works** (fresh demo; data may not persist)
4. Recoverer home → Blueprint / Help Me Now / After, plus Talk to AI, Talk to human, Urge timer
5. Companion → support board replies + linked recoverer overview

```bash
npm run seed
npm run seed:demo
```

No MongoDB or Gemini account required for evaluators.

Test path note: sessions use an httpOnly cookie; use a normal browser (not blocking cookies).

## Demo Flow

**Meet Phoenix** → blueprint (work stress, loneliness, walking, family) → Help Me Now → urge → guided steps → outcome → memory learns → setback without shame → Prepare Me for a stressful workday → Companion Mode for a sibling, without seeing Phoenix's private data.

## Health Check

`GET /api/health` returns database connectivity and whether AI is configured — without calling Gemini.

## Limitations

- Peer Mode / live human chat not in P0
- Voice input not in P0
- Emergency numbers are region-aware via directories, not a single global hardcode as the only option
- Recovery Memory uses simple aggregates, not ML prediction
- Gemini free-tier rate limits may trigger graceful fallbacks

## Future Work

- Peer Mode with consented summaries
- Voice input for zero-typing multimodal support
- Optional explicit caregiver linking with granular consent
- Richer prevention scheduling

## License

Built for the PromptWars / Build with AI hackathon.
