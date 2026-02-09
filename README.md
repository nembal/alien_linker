# AlienClaw Linker

Pair your AI agents to your Alien identity with cryptographic proof of ownership.

A mini app inside the Alien ecosystem that lets users claim, manage, and deploy their agents — with ed25519 keypairs and signed attestations.

## Link Your Agent

### Claude Code plugin (recommended)

Install the plugin once:

```
/plugin marketplace add nembal/alien_linker
/plugin install alienclaw@nembal-alien-linker
```

Then run in any agent project:

```
/alienclaw:setup https://your-app.vercel.app
```

The skill installs the identity SDK from GitHub, wires up `initIdentity()`, runs it, and shows you a 6-digit claim code. Enter the code in the mini app to link the agent.

### Any AI agent

Copy this prompt and paste it into your agent's chat:

```
Set up AlienClaw identity linking. Install the SDK:
git clone --depth 1 https://github.com/nembal/alien_linker.git /tmp/alienclaw-tmp
cp -r /tmp/alienclaw-tmp/packages/identity ./alienclaw-identity
rm -rf /tmp/alienclaw-tmp
npm install ./alienclaw-identity

Then add to startup:
import { initIdentity } from "@alienclaw/identity"
await initIdentity({ name: "my-agent", linkerUrl: "https://your-app.vercel.app" })

Run it and show me the 6-digit claim code.
```

### Manual install

```bash
git clone --depth 1 https://github.com/nembal/alien_linker.git /tmp/alienclaw-tmp
cp -r /tmp/alienclaw-tmp/packages/identity ./alienclaw-identity
rm -rf /tmp/alienclaw-tmp
npm install ./alienclaw-identity
```

```typescript
import { initIdentity } from "@alienclaw/identity";

const identity = await initIdentity({
  name: "my-agent",
  linkerUrl: "https://your-app.vercel.app",
});
// Shows 6-digit claim code in terminal
// Starts identity server on :3001
```

---

## Deploy the Linker

### Vercel

1. Import `nembal/alien_linker` on [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** to `apps/mini-app`
3. Add environment variables (see below)
4. Deploy

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `ATTESTATION_PRIVATE_KEY` | Yes | ed25519 private key (base64) — run `npm run generate-keys` |
| `ATTESTATION_PUBLIC_KEY` | Yes | ed25519 public key (base64) |
| `NEXT_PUBLIC_APP_URL` | No | App URL (defaults to Vercel URL, used in attestation `issuedBy`) |

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Open the SQL editor, paste `supabase/migrations/001_initial.sql`, run it
3. Copy the project URL + service role key into Vercel env vars

### Generate Attestation Keys

```bash
npm run generate-keys
# Outputs ATTESTATION_PRIVATE_KEY and ATTESTATION_PUBLIC_KEY
# Add both to Vercel environment variables
```

---

## Local Development

```bash
npm install

# Generate keys (first time only)
npm run generate-keys
# Copy output into apps/mini-app/.env.local

cp .env.example apps/mini-app/.env.local
# Fill in Supabase credentials + keys

npm run dev
# http://localhost:3000
```

**What works without Supabase:**
- All 7 pages render (dashboard, claim, deploy, bot detail, etc.)
- Health check: `curl http://localhost:3000/api/health`
- Public key: `curl http://localhost:3000/.well-known/alienclaw-keys.json`

**What needs Supabase:**
- Bot registration, claiming, listing
- Full claim flow end-to-end
- Deploy jobs

---

## Project Structure

```
alien_linker/
├── apps/mini-app/            # Next.js 15 — frontend + API routes
│   ├── app/                  # Pages + API handlers
│   ├── components/           # Terminal-style UI (8 primitives)
│   ├── hooks/                # React hooks (auth, clawbots, claim, deploy)
│   └── lib/                  # Auth, attestation crypto, Supabase client
├── packages/identity/        # @alienclaw/identity — agent SDK
│   └── src/                  # Keypair, register, attestation, Hono server
├── plugins/alienclaw/        # Claude Code plugin (distributable)
│   ├── .claude-plugin/       # Plugin manifest
│   └── skills/setup/         # /alienclaw:setup skill
├── marketplace.json          # Makes this repo a Claude Code marketplace
├── supabase/migrations/      # Database schema
├── scripts/                  # Key generation
└── DOCS/                     # PRD, architecture
```

## Claude Code Plugin

This repo doubles as a **Claude Code plugin marketplace**. The `alienclaw` plugin gives any Claude Code user the `/alienclaw:setup` skill — a one-command way to add identity linking to their agent.

**How it works:**
1. User runs `/plugin marketplace add nembal/alien_linker`
2. User runs `/plugin install alienclaw@nembal-alien-linker`
3. Plugin is cached locally — available in any project
4. `/alienclaw:setup <linker-url>` clones the identity SDK from GitHub, installs it, wires up `initIdentity()`, and displays the claim code

**Plugin structure:**
```
plugins/alienclaw/
├── .claude-plugin/plugin.json   # name, version, description
└── skills/setup/SKILL.md        # The skill definition
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/clawbots/register` | None | Agent self-registers, gets claim code |
| `POST` | `/api/clawbots/claim` | JWT | Claim agent with 6-digit code |
| `GET` | `/api/clawbots` | JWT | List user's claimed agents |
| `GET` | `/api/clawbots/[id]` | JWT | Agent details |
| `POST` | `/api/clawbots/[id]/refresh-code` | JWT | New claim code |
| `POST` | `/api/deploy` | JWT | Create deploy job (stub) |
| `GET` | `/api/deploy/[id]` | JWT | Poll deploy status |
| `GET` | `/api/health` | None | Health check |
| `GET` | `/.well-known/alienclaw-keys.json` | None | Public signing key (JWK) |

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4, framer-motion
- **Alien SDK**: `@alien_org/react`, `@alien_org/auth-client`, `@alien_org/bridge`
- **Backend**: Next.js API routes, Supabase (Postgres)
- **Crypto**: `@noble/ed25519` for attestation signing
- **Agent SDK**: TypeScript, Hono, `@noble/ed25519`
- **Design**: Terminal UI (JetBrains Mono, CRT scanlines, green/cyan glow)

## What's Not Done Yet

- **Deploy flow**: Creates a DB record but doesn't provision anything (stub)
- **Rate limiting**: No rate limiting on register/claim endpoints
- **Alien Developer Portal**: Mini app not registered yet
- **On-chain registration**: UI preview only ("Coming Soon"), ERC-8004 is Layer 3

## Roadmap

- [x] **Layer 1** — Claim flow with ed25519 attestations
- [ ] **Layer 2** — W3C Verifiable Credentials, `did:key` identities
- [ ] **Layer 3** — ERC-8004 on-chain registration on Base
