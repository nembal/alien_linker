# OpenClaw Linker — Product Requirements Document

**Version:** 1.0
**Date:** 2026-02-08
**Status:** Hackathon MVP

---

## 1. Problem Statement

OpenClaw agents (clawbots) run on user infrastructure (VPS, Mac Mini, home servers) but have no portable identity. There is no way to say "this agent is mine" in a verifiable, interoperable way. Users in the Alien ecosystem have a strong identity (Alien ID) but no way to bind it to their agents.

**We solve this**: a mini app inside Alien that lets users claim, manage, and deploy their clawbots — with cryptographic proof of ownership.

---

## 2. Goals

### Hackathon (Layer 1)
- Pair a running clawbot to an Alien identity using a claim code
- Give the clawbot a cryptographic keypair and a signed ownership attestation
- Let users deploy a new clawbot with one click from within the Alien app
- Clean, functional mini app UI inside Alien

### Stretch (Layer 2)
- Issue W3C Verifiable Credentials as the ownership proof format
- Clawbot identity as `did:key:...`

### Future (Layer 3)
- Register clawbots on-chain via ERC-8004 Identity Registry
- On-chain attestation of Alien ID ownership via `setMetadata`
- Reputation signals via ERC-8004 Reputation Registry

---

## 3. Users

| User | Description |
|------|-------------|
| **Clawbot Owner** | Has an Alien account. Runs (or wants to run) an OpenClaw agent on their own infrastructure. Interacts via the Alien mini app. |
| **Third Party** | Any service or agent that wants to verify "does this clawbot belong to this Alien user?" Uses the attestation + challenge-response. |

---

## 4. Architecture Overview

```
┌──────────────────────┐
│     Alien App        │
│  ┌────────────────┐  │
│  │   Mini App     │  │    ┌─────────────────────┐
│  │  (Next.js)     │──────▶│   Backend API       │
│  │  - claim flow  │  │    │   (Next.js routes)  │
│  │  - deploy flow │  │    │                     │
│  │  - dashboard   │  │    │  - verify Alien JWT │
│  └────────────────┘  │    │  - match claim codes│
│                      │    │  - issue attestation│
│  Alien ID via JWT    │    │  - trigger deploys  │
└──────────────────────┘    └────────┬────────────┘
                                     │
                            ┌────────▼────────────┐
                            │     Supabase        │
                            │  - clawbots table   │
                            │  - claims table     │
                            │  - deploy_jobs table│
                            └─────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
     ┌─────────────┐      ┌─────────────┐        ┌─────────────┐
     │  Clawbot A  │      │  Clawbot B  │        │  Clawbot C  │
     │  (VPS)      │      │  (Mac Mini) │        │  (new deploy│
     │  has keypair│      │  has keypair│        │   via app)  │
     │  has attest.│      │  has attest.│        │             │
     └─────────────┘      └─────────────┘        └─────────────┘
```

---

## 5. Core Flows

### 5.1 Clawbot Registration (clawbot → backend)

**Trigger:** Clawbot starts on user's infrastructure.

1. On first boot, clawbot generates an **ed25519 keypair**
2. Stores private key at `~/.openclaw/identity.key`
3. Stores public key at `~/.openclaw/identity.pub`
4. Calls `POST /api/clawbots/register` with:
   ```json
   {
     "publicKey": "ed25519:base64...",
     "name": "my-clawbot",
     "endpoint": "https://my-vps:3000"
   }
   ```
5. Backend generates a **6-digit claim code** (expires in 15 minutes)
6. Backend stores: `clawbot_id`, `public_key`, `claim_code`, `claim_code_expires_at`, `name`, `endpoint`
7. Returns to clawbot:
   ```json
   {
     "clawbotId": "cbot_abc123",
     "claimCode": "847293",
     "expiresAt": "2026-02-08T12:15:00Z"
   }
   ```
8. Clawbot displays claim code in terminal:
   ```
   ╔══════════════════════════════════════╗
   ║  Your claim code:  847293           ║
   ║  Enter this in the Alien mini app   ║
   ║  Expires in 15 minutes              ║
   ╚══════════════════════════════════════╝
   ```

### 5.2 Claim Flow (user → mini app → backend)

**Trigger:** User opens the mini app inside Alien.

1. Mini app loads inside Alien WebView
2. `AlienProvider` initializes, `useAlien()` provides `authToken`
3. Backend verifies JWT via `@alien_org/auth-client`, extracts `sub` (Alien ID)
4. User sees their dashboard:
   - List of already-claimed clawbots (if any)
   - "Claim a clawbot" button
   - "Deploy new clawbot" button
5. User taps "Claim a clawbot"
6. User enters the 6-digit claim code from their terminal
7. Frontend calls `POST /api/clawbots/claim` with:
   ```json
   {
     "claimCode": "847293"
   }
   ```
   (Authorization header carries the Alien JWT)
8. Backend:
   - Verifies JWT → gets `alienId`
   - Looks up claim code → finds matching clawbot
   - Checks code not expired
   - Checks clawbot not already claimed
   - Links: `alienId` ↔ `clawbotId`
   - Generates **signed ownership attestation**:
     ```json
     {
       "type": "openclaw-ownership-v1",
       "alienId": "alien-user-abc123",
       "clawbotId": "cbot_abc123",
       "publicKey": "ed25519:base64...",
       "issuedBy": "https://openclaw-linker.vercel.app",
       "issuedAt": "2026-02-08T12:03:00Z",
       "expiresAt": "2027-02-08T12:03:00Z",
       "signature": "base64..."
     }
     ```
   - Stores attestation in DB
   - Sends attestation to clawbot via its registered endpoint: `POST {endpoint}/attestation`
9. Clawbot receives and stores attestation at `~/.openclaw/attestation.json`
10. Mini app shows success: "Clawbot claimed! ✓"

### 5.3 One-Click Deploy (user → mini app → backend → cloud)

**Trigger:** User taps "Deploy new clawbot" in the mini app.

1. User fills in:
   - **Name** for the clawbot
   - **Description** (optional)
   - **Template/config** (preset or custom — future: pick model, tools, etc.)
2. Frontend calls `POST /api/clawbots/deploy` with config + Alien JWT
3. Backend:
   - Verifies JWT → gets `alienId`
   - Creates a `deploy_job` record (status: `pending`)
   - Triggers deployment to a hosting provider (options below)
   - The deployed clawbot auto-runs the registration flow (5.1)
   - Backend auto-claims it for the requesting `alienId` (skip the 6-digit code since we initiated the deploy)
   - Issues attestation immediately
4. Mini app polls `GET /api/deploy-jobs/{id}` until status = `running`
5. Shows: "Your clawbot is live! 🟢"

**Hosting options (hackathon):**
- **Railway / Fly.io** via API — spin up a container with the clawbot image
- **SSH to a pre-configured VPS** — run a Docker container
- **Stub it** — for the demo, pre-deploy a clawbot and simulate the flow

### 5.4 Ownership Verification (third party → clawbot)

**Trigger:** Any external service wants to verify a clawbot's ownership.

1. Third party calls `GET {clawbot_endpoint}/identity`
2. Clawbot returns its attestation (public, non-secret)
3. Third party:
   - Checks `signature` against the backend's published public key
   - Confirms `alienId` and `publicKey` match
4. Third party sends a **challenge**: random nonce
5. Clawbot signs the nonce with its private key
6. Third party verifies the signature against the `publicKey` in the attestation
7. **Verified**: this clawbot belongs to this Alien user

```
Third Party              Clawbot
───────────              ───────
GET /identity ──────────▶
◀── { attestation } ────
                         (third party checks signature)
POST /challenge ────────▶
  { nonce: "abc123" }
◀── { signature } ──────
                         (third party verifies sig against publicKey)
✓ Verified
```

---

## 6. Database Schema (Supabase)

### `clawbots`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid, PK | Internal ID |
| `clawbot_id` | text, unique | Public identifier (`cbot_xxx`) |
| `name` | text | Display name |
| `description` | text, nullable | Optional description |
| `endpoint` | text, nullable | Clawbot's API endpoint URL |
| `public_key` | text | ed25519 public key |
| `claim_code` | text, nullable | 6-digit code (nulled after claim) |
| `claim_code_expires_at` | timestamptz, nullable | Code expiration |
| `alien_id` | text, nullable | Linked Alien user ID (null = unclaimed) |
| `attestation` | jsonb, nullable | Signed ownership attestation |
| `status` | text | `registered`, `claimed`, `offline` |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update |

### `deploy_jobs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid, PK | Internal ID |
| `alien_id` | text | Requesting user's Alien ID |
| `clawbot_id` | text, nullable | Linked clawbot (once deployed) |
| `config` | jsonb | Deployment configuration |
| `provider` | text | `railway`, `fly`, `manual` |
| `status` | text | `pending`, `deploying`, `running`, `failed` |
| `provider_metadata` | jsonb, nullable | Provider-specific data (URLs, IDs) |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update |

### `attestation_keys`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid, PK | Internal ID |
| `public_key` | text | Backend's signing public key |
| `private_key_ref` | text | Reference to secret (env var name) |
| `active` | boolean | Currently in use |
| `created_at` | timestamptz | Creation timestamp |

---

## 7. API Routes

### Authentication
All routes except `/api/clawbots/register` require a valid Alien JWT in the `Authorization: Bearer <token>` header. JWT is verified via `@alien_org/auth-client`.

The `/api/clawbots/register` route is called by the clawbot itself (no Alien JWT needed).

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/clawbots/register` | None (clawbot calls this) | Register a new clawbot, get claim code |
| `POST` | `/api/clawbots/claim` | Alien JWT | Claim a clawbot by code |
| `GET` | `/api/clawbots` | Alien JWT | List user's claimed clawbots |
| `GET` | `/api/clawbots/:id` | Alien JWT | Get clawbot details |
| `POST` | `/api/clawbots/:id/refresh-code` | Alien JWT | Generate new claim code (for re-claim) |
| `POST` | `/api/deploy` | Alien JWT | Trigger one-click deploy |
| `GET` | `/api/deploy/:id` | Alien JWT | Poll deploy job status |
| `GET` | `/api/health` | None | Health check |

---

## 8. Mini App Screens

### Screen 1: Home / Dashboard

```
┌─────────────────────────────┐
│  🤖 OpenClaw Linker         │
│                             │
│  Welcome, {alienDisplayName}│
│                             │
│  ┌───────────────────────┐  │
│  │  MY CLAWBOTS          │  │
│  │                       │  │
│  │  🟢 research-bot      │  │
│  │     vps-1.example.com │  │
│  │     claimed 2h ago    │  │
│  │                       │  │
│  │  🟢 code-helper       │  │
│  │     macmini.local     │  │
│  │     claimed 1d ago    │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  + Claim a Clawbot    │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │  ⚡ Deploy New Clawbot │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Screen 2: Claim Flow

```
┌─────────────────────────────┐
│  ← Claim Your Clawbot       │
│                             │
│  Enter the 6-digit code     │
│  shown in your terminal     │
│                             │
│  ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐  │
│  │8│ │4│ │7│ │2│ │9│ │3│  │
│  └─┘ └─┘ └─┘ └─┘ └─┘ └─┘  │
│                             │
│  ┌───────────────────────┐  │
│  │      Claim Bot        │  │
│  └───────────────────────┘  │
│                             │
│  Don't have a clawbot yet?  │
│  Deploy one now →           │
└─────────────────────────────┘
```

### Screen 3: Claim Success

```
┌─────────────────────────────┐
│                             │
│           ✓                 │
│                             │
│   research-bot is yours!    │
│                             │
│   Ownership attestation     │
│   sent to your clawbot.     │
│                             │
│   It can now prove it       │
│   belongs to you.           │
│                             │
│  ┌───────────────────────┐  │
│  │   View Dashboard      │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │   Register On-Chain   │  │
│  │   (coming soon)       │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Screen 4: One-Click Deploy

```
┌─────────────────────────────┐
│  ← Deploy New Clawbot       │
│                             │
│  Name                       │
│  ┌───────────────────────┐  │
│  │ my-research-bot       │  │
│  └───────────────────────┘  │
│                             │
│  Description (optional)     │
│  ┌───────────────────────┐  │
│  │ Helps with papers     │  │
│  └───────────────────────┘  │
│                             │
│  Template                   │
│  ┌───────────────────────┐  │
│  │ Default Agent      ▾  │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │   ⚡ Deploy            │  │
│  └───────────────────────┘  │
│                             │
│  Deploys to Railway.        │
│  Auto-claimed to your       │
│  Alien identity.            │
└─────────────────────────────┘
```

### Screen 5: Deploy Progress

```
┌─────────────────────────────┐
│                             │
│   Deploying my-research-bot │
│                             │
│   ● Provisioning...        │
│   ○ Starting agent          │
│   ○ Registering identity    │
│   ○ Issuing attestation     │
│                             │
│   This takes ~30 seconds    │
│                             │
└─────────────────────────────┘
```

---

## 9. Clawbot SDK (Thin Client)

A minimal package (`@openclaw/identity`) that clawbot authors install. Handles keypair generation, registration, attestation storage, and the verification endpoint.

### Usage

```typescript
import { initIdentity } from "@openclaw/identity";

const identity = await initIdentity({
  name: "my-research-bot",
  endpoint: "https://my-vps:3000",
  linkerUrl: "https://openclaw-linker.vercel.app",
});

// identity.clawbotId  — assigned ID
// identity.claimCode  — show to user
// identity.publicKey  — ed25519 public key
// identity.attestation — null until claimed, then populated

// Exposes GET /identity and POST /challenge on the clawbot's server
identity.mountVerificationRoutes(app); // Express/Hono/whatever
```

### What it does internally

1. **First boot**: generates ed25519 keypair, stores in `~/.openclaw/`
2. **Registration**: `POST /api/clawbots/register` to the linker backend
3. **Polls for attestation**: checks if claimed, downloads attestation when available
4. **Exposes verification endpoints**:
   - `GET /identity` → returns attestation JSON
   - `POST /challenge` → signs nonce with private key, returns signature

---

## 10. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Claim code brute-force | 6 digits = 1M combinations. Rate limit to 5 attempts per minute per IP. Codes expire in 15 minutes. |
| Stolen claim code | Short expiry window. Code is single-use. User must also have valid Alien JWT. |
| Attestation forgery | Signed with backend's ed25519 key. Public key is published at `/.well-known/openclaw-keys.json`. |
| Clawbot impersonation | Challenge-response with the private key. Only the real clawbot has it. |
| JWT replay | Alien JWTs have `exp` claim. Backend checks expiration via `@alien_org/auth-client`. |
| Backend compromise | Layer 2/3 mitigates: VC issuance distributes trust; on-chain registration removes backend as single point. |

---

## 11. Tech Stack

| Component | Technology |
|-----------|------------|
| Mini app frontend | Next.js 15 (App Router), React, Tailwind, shadcn/ui |
| Alien integration | `@alien_org/react`, `@alien_org/auth-client` |
| Backend API | Next.js API routes (same app) |
| Database | Supabase (Postgres) |
| Crypto (attestation signing) | `@noble/ed25519` or Node.js `crypto` |
| Clawbot SDK | TypeScript, `@noble/ed25519`, minimal deps |
| Deployment (mini app) | Vercel |
| Deployment (clawbots) | Railway API (hackathon), Fly.io (alternative) |

---

## 12. Layer 2 — Verifiable Credentials (Stretch)

**Changes from Layer 1:**
- Clawbot keypair generates a `did:key:z6Mk...` (ed25519 → multicodec → multibase)
- Backend becomes a VC issuer with its own DID
- Attestation format changes from custom JSON to W3C VC:
  ```json
  {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential", "OpenClawOwnership"],
    "issuer": "did:web:openclaw-linker.vercel.app",
    "credentialSubject": {
      "id": "did:key:z6Mk...",
      "alienId": "alien-user-abc123",
      "clawbotId": "cbot_abc123"
    },
    "proof": { ... }
  }
  ```
- Interoperable with any VC verifier
- Clawbot identity becomes portable across ecosystems

---

## 13. Layer 3 — ERC-8004 On-Chain (Future)

**Changes from Layer 2:**
- "Register On-Chain" button in the mini app
- Calls ERC-8004 `IdentityRegistry.register()` on Base
- Agent registration file includes Alien ID in services:
  ```json
  {
    "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    "name": "my-research-bot",
    "services": [
      { "name": "alien", "endpoint": "alien-user-abc123" },
      { "name": "openclaw", "endpoint": "https://my-vps:3000" }
    ]
  }
  ```
- `setMetadata(agentId, "alienIdentity", abi.encode(alienId))` links on-chain
- Reputation signals via `ReputationRegistry.giveFeedback()`
- Fully decentralized — no backend needed for verification

**Contract addresses (Base):**
- IdentityRegistry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- ReputationRegistry: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`

---

## 14. Milestones

### M1: Skeleton (1-2 hours)
- [ ] Next.js app with `@alien_org/react` provider
- [ ] Supabase project + tables
- [ ] Basic UI shell (home, claim, deploy screens)
- [ ] Register mini app in Alien Developer Portal

### M2: Claim Flow (2-3 hours)
- [ ] `/api/clawbots/register` endpoint
- [ ] `/api/clawbots/claim` endpoint with JWT verification
- [ ] Claim code UI (6-digit input)
- [ ] Attestation signing (ed25519)
- [ ] Minimal clawbot SDK (keypair + registration + attestation storage)

### M3: Dashboard + Polish (1-2 hours)
- [ ] Dashboard showing claimed clawbots
- [ ] Status indicators (online/offline)
- [ ] Clawbot detail view with attestation info
- [ ] Verification endpoint on clawbot (`GET /identity`, `POST /challenge`)

### M4: One-Click Deploy (2-3 hours)
- [ ] Deploy form UI
- [ ] Railway API integration (or stub)
- [ ] Deploy job polling
- [ ] Auto-claim after deploy

### M5: Stretch Goals
- [ ] VC format attestation (Layer 2)
- [ ] ERC-8004 registration (Layer 3)
- [ ] QR code claim flow (alternative to 6-digit code)

---

## 15. Open Questions

1. **Alien wallet support** — Does the Alien bridge expose wallet signing? Need to check full Bridge Reference. If yes, we can potentially do on-chain txs from within the mini app for Layer 3.
2. **Deploy provider** — Railway vs Fly.io vs stubbed demo. Decision based on API availability and hackathon time.
3. **Clawbot image** — What Docker image / template does OpenClaw use? Needed for one-click deploy.
4. **Claim code UX** — 6-digit numeric vs short alphanumeric (e.g., `CLAW-7X9K`). Numeric is easier on mobile.
5. **Attestation renewal** — Should attestations expire and require renewal? Layer 1: yes (1 year). Layer 2+: handled by VC expiry.

---

# Implementation Plan

## Repo Structure

```
alien_linker/
├── apps/
│   └── mini-app/              # Next.js 15 App Router (frontend + API routes)
│       ├── app/
│       │   ├── layout.tsx     # AlienProvider wrapper
│       │   ├── page.tsx       # Dashboard (home)
│       │   ├── claim/
│       │   │   └── page.tsx   # Claim flow (6-digit input)
│       │   ├── deploy/
│       │   │   └── page.tsx   # One-click deploy
│       │   ├── bot/[id]/
│       │   │   └── page.tsx   # Bot detail view
│       │   └── api/
│       │       ├── clawbots/
│       │       │   ├── register/route.ts  # POST - clawbot self-registers
│       │       │   ├── claim/route.ts     # POST - user claims with code
│       │       │   └── route.ts           # GET  - list user's bots
│       │       ├── deploy/
│       │       │   └── route.ts           # POST + GET - deploy jobs
│       │       └── health/route.ts
│       ├── components/
│       │   ├── alien-shell.tsx       # AlienProvider + layout chrome
│       │   ├── claim-code-input.tsx  # Premium 6-digit input
│       │   ├── bot-card.tsx          # Clawbot card for dashboard
│       │   ├── deploy-progress.tsx   # Animated deploy stepper
│       │   └── status-badge.tsx      # Online/offline indicator
│       ├── lib/
│       │   ├── supabase.ts           # Supabase client
│       │   ├── auth.ts               # Alien JWT verification
│       │   ├── attestation.ts        # ed25519 signing/verification
│       │   └── deploy-provider.ts    # Railway/Fly API wrapper
│       └── ...
├── packages/
│   └── identity/              # @openclaw/identity — clawbot SDK
│       ├── src/
│       │   ├── index.ts       # Main exports
│       │   ├── keypair.ts     # ed25519 keypair generation + storage
│       │   ├── register.ts    # POST to linker backend
│       │   ├── attestation.ts # Store/load attestation
│       │   └── server.ts      # Verification endpoints (GET /identity, POST /challenge)
│       └── package.json
├── DOCS/
│   ├── PRD.md
│   └── ...
├── package.json               # Workspace root (turborepo or npm workspaces)
└── turbo.json
```

---

## Workstream Split (3 people, 2 days)

### Person 1: Mini App UI + Alien Integration

**Day 1:**
- Scaffold Next.js 15 app with Tailwind + shadcn/ui
- Install `@alien_org/react`, wrap app in `AlienProvider`
- Register mini app in Alien Developer Portal (https://dev.alien.org/)
- Build all 5 screens with placeholder data:
  - Dashboard (list claimed bots)
  - Claim flow (6-digit code input)
  - Claim success (with animation)
  - Deploy form
  - Deploy progress (animated stepper)
- The 6-digit claim code input should feel premium — individual digit boxes with auto-focus advance, like a 2FA input
- Use `framer-motion` for page transitions and success animations

**Day 2:**
- Wire up to real API routes (Person 2's work)
- Handle Alien-specific UX: safe area insets via `useLaunchParams`, back button via `useEvent`
- Polish: loading states, error states, empty states
- Test inside actual Alien app via deeplink
- Add `startParam` support so a clawbot can generate a deeplink that pre-fills the claim code

**UI direction:** Dark theme, glassmorphism cards, accent color (neon green or electric blue to match "alien" vibe). Mobile-first since it runs in a phone WebView. Micro-interactions on every action.

### Person 2: Backend API + Supabase + Auth

**Day 1:**
- Set up Supabase project, create tables via migrations:
  - `clawbots` table (id, clawbot_id, name, endpoint, public_key, claim_code, claim_code_expires_at, alien_id, attestation, status, created_at, updated_at)
  - `deploy_jobs` table (id, alien_id, clawbot_id, config, provider, status, provider_metadata, created_at, updated_at)
  - `attestation_keys` table (id, public_key, private_key_ref, active, created_at)
  - RLS policies: clawbots visible only to their owner (by alien_id), deploy_jobs same
- Implement API routes:
  - `POST /api/clawbots/register` — no auth, clawbot calls this, generates 6-digit code
  - `POST /api/clawbots/claim` — Alien JWT auth, matches code, creates link
  - `GET /api/clawbots` — Alien JWT auth, returns user's bots
- Implement Alien JWT verification using `@alien_org/auth-client` in a shared middleware (`lib/auth.ts`)
- Generate backend ed25519 signing keypair, store private key in env var

**Day 2:**
- Implement attestation signing in `lib/attestation.ts`:
  - Sign: `{alienId, clawbotId, publicKey, issuedBy, issuedAt, expiresAt}` with backend key
  - Publish backend public key at `GET /.well-known/openclaw-keys.json`
- Implement deploy API:
  - `POST /api/deploy` — creates job, triggers provider
  - `GET /api/deploy/:id` — poll status
- Wire up attestation delivery to clawbot (POST to clawbot's endpoint after claim)
- Rate limiting on claim endpoint (5 attempts/min/IP)
- Edge cases: expired codes, already-claimed bots, duplicate claims

### Person 3: Clawbot SDK + Agent Template + Deploy

**Day 1:**
- Build `packages/identity` SDK:
  - `keypair.ts`: generate ed25519 keypair, save to `~/.openclaw/identity.key` and `.pub`
  - `register.ts`: call `POST /api/clawbots/register` with publicKey + name + endpoint
  - `attestation.ts`: receive and store attestation at `~/.openclaw/attestation.json`, poll for it if not immediately available
  - `server.ts`: express/hono middleware that exposes `GET /identity` and `POST /challenge`
- Build a minimal clawbot template:
  - A simple agent process (can be as simple as an HTTP server that responds to prompts)
  - On startup: calls `initIdentity()` from the SDK
  - Displays claim code in terminal with a nice ASCII box
  - Dockerize it (Dockerfile)

**Day 2:**
- Implement one-click deploy pipeline:
  - Option A: Railway API (`POST /v1/deployments` with the Docker image)
  - Option B: Fly.io Machines API
  - Option C: SSH to a pre-provisioned VPS and `docker run`
  - For hackathon: pick whichever has the simplest API, or pre-provision a box and use SSH
- The deployed clawbot should auto-register and auto-claim (backend skips code for deploy-initiated bots)
- Test the full end-to-end: start bot -> see code -> claim in app -> attestation delivered -> verification works
- Write a CLI wrapper: `npx @openclaw/identity init` for easy onboarding

---

## Supabase Schema (SQL)

```sql
-- clawbots table
create table clawbots (
  id uuid primary key default gen_random_uuid(),
  clawbot_id text unique not null,
  name text not null,
  description text,
  endpoint text,
  public_key text not null,
  claim_code text,
  claim_code_expires_at timestamptz,
  alien_id text,
  attestation jsonb,
  status text not null default 'registered',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- deploy_jobs table
create table deploy_jobs (
  id uuid primary key default gen_random_uuid(),
  alien_id text not null,
  clawbot_id text references clawbots(clawbot_id),
  config jsonb not null default '{}',
  provider text not null default 'manual',
  status text not null default 'pending',
  provider_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- backend signing keys
create table attestation_keys (
  id uuid primary key default gen_random_uuid(),
  public_key text not null,
  private_key_ref text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
```

---

## Key Integration Points

These are the handshakes between workstreams — agree on these on Day 1 morning:

1. **Person 1 <-> Person 2**: API contract (request/response shapes for each route). Define these in a shared `types.ts` file on Day 1 so both can work independently.
2. **Person 2 <-> Person 3**: The `/api/clawbots/register` endpoint is the handshake. Person 3's SDK calls Person 2's API. Agree on the request/response format early.
3. **Person 1 <-> Person 3**: The `startParam` deeplink flow. Person 3's clawbot can generate an Alien deeplink (`https://alien.app/miniapp/{slug}?startParam={claimCode}`) that Person 1's UI reads to auto-fill the claim code.

---

## Day 1 End Goal

All three workstreams produce independently testable pieces:
- Person 1: Beautiful UI that works with mock data
- Person 2: Working API routes testable via curl/Postman
- Person 3: A clawbot that starts, generates a keypair, registers, shows a claim code

## Day 2 End Goal

Everything wired together, tested inside the Alien app:
- Open mini app in Alien -> see dashboard -> claim a bot -> success
- Deploy a bot from the app -> watch progress -> auto-claimed
- Clawbot can prove ownership to a third party

---

## Dependencies

**Mini app (apps/mini-app):**
- `@alien_org/react`, `@alien_org/auth-client`
- `@noble/ed25519` (attestation crypto)
- `framer-motion` (animations)
- `shadcn/ui` components: button, input, card, badge, dialog, separator
- `@supabase/supabase-js`

**Clawbot SDK (packages/identity):**
- `@noble/ed25519`
- `hono` (lightweight HTTP server for verification endpoints)

---

## Stretch Goals (if time permits)

- Verifiable Credential format for attestations (Layer 2)
- ERC-8004 on-chain registration button (Layer 3, needs wallet in Alien)
- QR code as alternative to 6-digit code (clawbot terminal shows QR, scan in Alien)
- Real-time status updates via Supabase Realtime (bot goes online/offline)
- Multiple bot management (rename, unlink, transfer)
