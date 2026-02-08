# OpenClaw Linker

Pair your OpenClaw agents (clawbots) to your Alien identity with cryptographic proof of ownership.

An Alien mini app that lets users claim, manage, and deploy clawbots using ed25519 keypairs and signed attestations.

## Quick Start

```bash
# Install dependencies
bun install

# Generate attestation signing keys
bun run scripts/generate-keys.ts
# Copy the output into .env.local

# Create .env.local from the example
cp .env.example apps/mini-app/.env.local
# Fill in your Supabase credentials + generated keys

# Run the dev server
bun dev
# App runs at http://localhost:3000
```

## Testing Guide

### What Works Right Now

**UI (no Supabase needed):**
- `bun dev` starts the app at localhost:3000
- Dashboard page renders with terminal UI, ASCII header, empty state
- `/claim` page renders with the 6-digit code input (try typing, pasting, arrow keys)
- `/claim/success` page renders with animated checkmark
- `/deploy` page renders with the deploy form
- All pages have framer-motion transitions, glow effects, scanlines

**API routes (no Supabase needed):**
```bash
# Health check — always works
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"..."}

# Public signing key — works if ATTESTATION_PUBLIC_KEY is set in .env.local
curl http://localhost:3000/.well-known/openclaw-keys.json
```

**API routes (requires Supabase):**
```bash
# Register a clawbot (no auth needed)
curl -X POST http://localhost:3000/api/clawbots/register \
  -H "Content-Type: application/json" \
  -d '{"publicKey":"ed25519:dGVzdA==","name":"test-bot"}'

# Claim with dev auth (auto-generates mock JWT in dev mode)
curl -X POST http://localhost:3000/api/clawbots/claim \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpc3MiOiJkZXYtbW9kZSIsInN1YiI6ImRldi1hbGllbi11c2VyLTAwMDAwIiwiYXVkIjoib3BlbmNsYXctbGlua2VyIiwiaWF0IjoxNzM4OTcwMDAwLCJleHAiOjk5OTk5OTk5OTl9.dev" \
  -d '{"claimCode":"<code-from-register>"}'

# List bots (same dev JWT)
curl http://localhost:3000/api/clawbots \
  -H "Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpc3MiOiJkZXYtbW9kZSIsInN1YiI6ImRldi1hbGllbi11c2VyLTAwMDAwIiwiYXVkIjoib3BlbmNsYXctbGlua2VyIiwiaWF0IjoxNzM4OTcwMDAwLCJleHAiOjk5OTk5OTk5OTl9.dev"
```

**Identity SDK:**
```bash
# Requires the dev server + Supabase running
BOT_NAME=test-bot LINKER_URL=http://localhost:3000 bun run packages/identity/src/index.ts
```

### What Requires Setup

| Feature | Requires |
|---------|----------|
| UI rendering, page navigation | Nothing (works out of the box) |
| Health check + public keys | `ATTESTATION_PUBLIC_KEY` in .env.local |
| Bot registration, claiming, listing | Supabase project + tables created |
| Attestation signing | `ATTESTATION_PRIVATE_KEY` + `ATTESTATION_PUBLIC_KEY` |
| Full claim flow (UI -> API -> attestation) | Supabase + attestation keys |
| Identity SDK demo | Supabase + dev server running |
| Deploy (actual provisioning) | Not implemented (stub only) |
| Alien app integration | Register in Alien Developer Portal + deploy to public URL |

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migration SQL in the SQL editor: `supabase/migrations/001_initial.sql`
3. Copy the project URL and service role key into `.env.local`

### What's Stubbed / Not Yet Done

- **Deploy flow**: API creates a `deploy_jobs` record but doesn't provision anything. The progress stepper stays on step 1.
- **Rate limiting**: No rate limiting on the claim endpoint yet.
- **Alien app testing**: Requires registering the mini app in the [Alien Developer Portal](https://dev.alien.org/) and deploying to a public URL.
- **On-chain registration**: UI preview only ("Coming Soon" badge). ERC-8004 integration is Layer 3.

## Project Structure

```
alien_linker/
├── apps/mini-app/          # Next.js 15 (frontend + API routes)
│   ├── app/                # Pages + API route handlers
│   ├── components/         # Terminal-style UI components
│   ├── hooks/              # React hooks (auth, clawbots, claim, deploy)
│   └── lib/                # Server utils (auth, attestation, supabase)
├── packages/identity/      # @openclaw/identity — clawbot SDK
│   └── src/                # Keypair, register, attestation, Hono server
├── supabase/migrations/    # Database schema SQL
├── scripts/                # Key generation
└── DOCS/                   # PRD, architecture docs
```

## Clawbot SDK

Install `@openclaw/identity` on your agent to integrate with the linker:

```typescript
import { initIdentity } from "@openclaw/identity";

const identity = await initIdentity({
  name: "my-research-bot",
  endpoint: "https://my-vps:3001",
  linkerUrl: "https://openclaw-linker.vercel.app",
});

// Shows claim code in terminal
// Starts identity server on :3001 with:
//   GET  /identity    — returns attestation
//   POST /challenge   — signs nonce with private key
//   POST /attestation — receives attestation from backend
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/clawbots/register` | None | Clawbot self-registers, gets claim code |
| `POST` | `/api/clawbots/claim` | JWT | Claim a clawbot with 6-digit code |
| `GET` | `/api/clawbots` | JWT | List user's claimed clawbots |
| `GET` | `/api/clawbots/[id]` | JWT | Get clawbot details |
| `POST` | `/api/clawbots/[id]/refresh-code` | JWT | Generate new claim code |
| `POST` | `/api/deploy` | JWT | Create deploy job (stub) |
| `GET` | `/api/deploy/[id]` | JWT | Poll deploy job status |
| `GET` | `/api/health` | None | Health check |
| `GET` | `/.well-known/openclaw-keys.json` | None | Backend's public signing key (JWK) |

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key
ATTESTATION_PRIVATE_KEY=          # ed25519 private key (base64)
ATTESTATION_PUBLIC_KEY=           # ed25519 public key (base64)
NEXT_PUBLIC_APP_URL=              # App URL (used in attestation issuedBy)
```

## Tech Stack

- **Runtime**: Bun
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4, framer-motion
- **Alien SDK**: `@alien_org/react`, `@alien_org/auth-client`, `@alien_org/bridge`
- **Backend**: Next.js API routes, Supabase (Postgres)
- **Crypto**: `@noble/ed25519` for attestation signing
- **Clawbot SDK**: TypeScript, Hono, `@noble/ed25519`
- **Design**: Terminal-style UI (JetBrains Mono, CRT scanlines, green/cyan glow)

## Roadmap

- [x] **Layer 1** — Claim flow with ed25519 attestations
- [ ] **Layer 2** — W3C Verifiable Credentials, `did:key` identities
- [ ] **Layer 3** — ERC-8004 on-chain registration on Base
