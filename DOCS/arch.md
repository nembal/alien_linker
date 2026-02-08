# OpenClaw Linker — Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ALIEN APP (WebView)                         │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                     AlienProvider                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │ │
│  │  │  useAlien()   │  │ useLaunch   │  │   AuthProvider       │ │ │
│  │  │  authToken    │  │ Params()    │  │   (dev-auth.ts)      │ │ │
│  │  │  bridgeAvail. │  │ startParam  │  │   getAuthToken()     │ │ │
│  │  └──────┬───────┘  └──────┬──────┘  └──────────┬───────────┘ │ │
│  │         │                 │                     │             │ │
│  │  ┌──────▼─────────────────▼─────────────────────▼───────────┐ │ │
│  │  │                   PAGES (7 screens)                       │ │ │
│  │  │  /              Dashboard (bot list, actions)             │ │ │
│  │  │  /claim         6-digit code input                        │ │ │
│  │  │  /claim/success Animated confirmation                     │ │ │
│  │  │  /deploy        Deploy form (stub)                        │ │ │
│  │  │  /deploy/[id]   Progress stepper (stub)                   │ │ │
│  │  │  /bot/[id]      Bot detail + attestation viewer           │ │ │
│  │  │  /bot/[id]/reg  ERC-8004 preview (coming soon)            │ │ │
│  │  └──────┬───────────────────────────────────────────────────┘ │ │
│  │         │                                                     │ │
│  │  ┌──────▼───────────────────────────────────────────────────┐ │ │
│  │  │              HOOKS (business logic)                       │ │ │
│  │  │  useClawbots()  useClawbot()  useClaimBot()  useDeploy() │ │ │
│  │  └──────┬───────────────────────────────────────────────────┘ │ │
│  │         │                                                     │ │
│  │  ┌──────▼───────────────────────────────────────────────────┐ │ │
│  │  │         api-client.ts (fetch + JWT attachment)            │ │ │
│  │  └──────┬───────────────────────────────────────────────────┘ │ │
│  └─────────┼────────────────────────────────────────────────────┘ │
└────────────┼────────────────────────────────────────────────────────┘
             │ HTTP (Authorization: Bearer <JWT>)
             ▼
┌────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                               │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────────────────────────────────┐ │
│  │  lib/auth.ts     │  │  API Routes                              │ │
│  │  authenticateReq │  │                                          │ │
│  │  (JWT verify via │  │  POST /api/clawbots/register  (no auth)  │ │
│  │  @alien_org/     │  │  POST /api/clawbots/claim     (JWT)      │ │
│  │   auth-client)   │  │  GET  /api/clawbots           (JWT)      │ │
│  │                  │  │  GET  /api/clawbots/[id]      (JWT)      │ │
│  │  Dev mode: mock  │  │  POST /api/clawbots/[id]/     (JWT)      │ │
│  │  JWT with .dev   │  │       refresh-code                       │ │
│  │  suffix accepted │  │  POST /api/deploy             (JWT)      │ │
│  └─────────────────┘  │  GET  /api/deploy/[id]        (JWT)      │ │
│                        │  GET  /api/health             (none)     │ │
│  ┌─────────────────┐  │  GET  /.well-known/            (none)     │ │
│  │ lib/attestation  │  │       openclaw-keys.json                 │ │
│  │ .ts              │  └──────────────────────────────────────────┘ │
│  │ createAttestat() │                                               │
│  │ verifyAttestat() │                                               │
│  │ getPublicKeyJwk()│                                               │
│  │ (@noble/ed25519) │                                               │
│  └─────────────────┘                                                │
│            │                                                        │
│  ┌─────────▼───────┐                                                │
│  │ lib/supabase.ts  │                                                │
│  │ createServer     │                                                │
│  │ Supabase()       │                                                │
│  └─────────┬───────┘                                                │
└────────────┼────────────────────────────────────────────────────────┘
             │ Service Role Key
             ▼
┌────────────────────────────────────────────────────────────────────┐
│                         SUPABASE (Postgres)                         │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐       │
│  │   clawbots   │  │  deploy_jobs │  │  attestation_keys  │       │
│  │              │  │              │  │                    │       │
│  │  clawbot_id  │  │  alien_id    │  │  public_key       │       │
│  │  name        │  │  clawbot_id  │  │  private_key_ref  │       │
│  │  public_key  │  │  config      │  │  active           │       │
│  │  claim_code  │  │  provider    │  └────────────────────┘       │
│  │  alien_id    │  │  status      │                                │
│  │  attestation │  └──────────────┘                                │
│  │  status      │                                                  │
│  └──────────────┘                                                  │
│                                                                     │
│  RLS enabled on all tables. updated_at auto-triggers.              │
└────────────────────────────────────────────────────────────────────┘
             │
             │ Attestation delivery: POST {endpoint}/attestation
             ▼
┌────────────────────────────────────────────────────────────────────┐
│                    CLAWBOT (user infrastructure)                    │
│                                                                     │
│  ┌──────────────────────────────────────┐                          │
│  │  @openclaw/identity SDK              │                          │
│  │                                      │                          │
│  │  keypair.ts    ed25519 key mgmt      │  ~/.openclaw/            │
│  │  register.ts   POST /register        │    identity.key (priv)   │
│  │  attestation   save/load JSON        │    identity.pub          │
│  │  server.ts     Hono identity routes  │    attestation.json      │
│  │  index.ts      initIdentity()        │                          │
│  └──────────────────────────────────────┘                          │
│                                                                     │
│  Identity Server (Hono on port 3001):                              │
│    GET  /identity    -> attestation JSON                            │
│    POST /challenge   -> sign nonce with private key                 │
│    POST /attestation -> receive from backend after claim            │
└────────────────────────────────────────────────────────────────────┘

```

## Data Flow: Claim Sequence

```
Clawbot                  Backend                Mini App            Alien App
───────                  ───────                ────────            ─────────
                                                                    Inject JWT
                                                 useAlien() ◄────── via window
                                                 gets authToken     globals
│
├─ generate keypair
├─ POST /register ──────▶
│                        ├─ generate cbot_id
│                        ├─ generate 6-digit code
│                        ├─ store in DB
│  ◄── { clawbotId,  ───┤
│       claimCode,
│       expiresAt }
│
├─ display code
│  in terminal
│                                                User enters code
│                                                POST /claim ──────▶
│                                                                    Verify JWT
│                                                                    Match code
│                                                                    Check expiry
│                                                                    Sign attestation
│                                                                    Update DB
│  POST /attestation ◄──────────────────────────────────────────────┤
│                                                                    (best-effort)
├─ save attestation      ◄── { clawbot,    ─────────────────────────┤
│  to disk                    attestation }
│                                                Redirect to
│                                                /claim/success
```

## Crypto Architecture

### Attestation Signing

```
Backend ed25519 keypair (generated once, stored in env vars):
  ATTESTATION_PRIVATE_KEY (base64)  — signs attestations
  ATTESTATION_PUBLIC_KEY  (base64)  — published at /.well-known/openclaw-keys.json

Attestation payload (JSON-stringified, then signed):
  { type, alienId, clawbotId, publicKey, issuedBy, issuedAt, expiresAt }

Signature: ed25519(SHA-512(payload), privateKey) -> base64
```

### Clawbot Identity

```
Clawbot ed25519 keypair (generated per bot, stored at ~/.openclaw/):
  identity.key  (raw 32 bytes, mode 0600)
  identity.pub  (raw 32 bytes)

Public key format: "ed25519:<base64>"

Challenge-response verification:
  Verifier sends nonce -> Clawbot signs with private key -> Verifier checks against publicKey
```

### Dev Mode Auth

```
In development (NODE_ENV=development):
  Mock JWT: <header>.<payload>.dev
  Payload contains: { sub: "dev-alien-user-00000", exp: now+1h }
  Backend accepts tokens ending in ".dev" and extracts sub claim
```

## Component Architecture

### Terminal Design System

| Component | File | Purpose |
|-----------|------|---------|
| `TerminalCard` | `components/ui/terminal-card.tsx` | Glassmorphism card with title bar (red/yellow/green dots) |
| `TerminalButton` | `components/ui/terminal-button.tsx` | Glow-on-hover, primary/secondary/ghost variants |
| `TerminalInput` | `components/ui/terminal-input.tsx` | `> ` prefix, green caret |
| `GlowText` | `components/ui/glow-text.tsx` | Text with configurable glow color |
| `AsciiHeader` | `components/ui/ascii-header.tsx` | ASCII art "OPENCLAW" banner |
| `TypingText` | `components/ui/typing-text.tsx` | Typewriter animation |
| `StatusIndicator` | `components/ui/status-indicator.tsx` | Pulsing dot (green/amber/red) |
| `AppShell` | `components/layout/app-shell.tsx` | AlienProvider + AuthProvider + scanlines |
| `PageTransition` | `components/layout/page-transition.tsx` | framer-motion fade transition |

### Feature Components

| Component | File | Purpose |
|-----------|------|---------|
| `ClaimCodeInput` | `components/claim-code-input.tsx` | 6-digit input with auto-advance + paste |
| `BotCard` | `components/bot-card.tsx` | Clawbot card for dashboard list |
| `DeployStepper` | `components/deploy-stepper.tsx` | 4-step animated progress |
| `AttestationViewer` | `components/attestation-viewer.tsx` | Expandable attestation JSON |
| `Erc8004Preview` | `components/erc8004-preview.tsx` | ERC-8004 registration preview |

## Color Palette

```
Background:  #0a0a0a (terminal-bg)
Surface:     #111111 (terminal-surface)
Border:      #1a1a2e (terminal-border)
Green:       #00ff41 (terminal-green)   — primary, status:online
Cyan:        #00d4ff (terminal-cyan)    — secondary, links
Amber:       #ffb000 (terminal-amber)   — accent, warnings
Red:         #ff0040 (terminal-red)     — errors, status:offline
Dim:         #4a4a4a (terminal-dim)     — muted text
Text:        #c0c0c0 (terminal-text)    — body text
Bright:      #ffffff (terminal-bright)  — emphasis
```

Font: JetBrains Mono (400/500/600/700)

## Dependencies

### apps/mini-app

| Package | Purpose |
|---------|---------|
| `next` 15 | Framework (App Router) |
| `react` / `react-dom` 19 | UI |
| `tailwindcss` v4 | Styling |
| `framer-motion` | Animations |
| `@alien_org/react` | Alien SDK hooks + provider |
| `@alien_org/auth-client` | JWT verification |
| `@alien_org/bridge` | Bridge communication |
| `@noble/ed25519` | Attestation signing |
| `@supabase/supabase-js` | Database client |
| `nanoid` | ID generation |

### packages/identity

| Package | Purpose |
|---------|---------|
| `@noble/ed25519` | Keypair + signing |
| `hono` | HTTP server |
| `@hono/node-server` | Node.js adapter for Hono |
