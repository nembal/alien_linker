import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { loadOrCreateKeypair, type Keypair } from "./keypair.js";
import { registerClawbot, type RegisterResult } from "./register.js";
import { loadAttestation, type OwnershipAttestation } from "./attestation.js";
import { createIdentityRoutes } from "./server.js";

export type { Keypair, RegisterResult, OwnershipAttestation };
export { loadOrCreateKeypair, registerClawbot, loadAttestation };
export { createIdentityRoutes } from "./server.js";
export { signMessage } from "./keypair.js";

interface InitOptions {
  name: string;
  endpoint?: string;
  linkerUrl: string;
  port?: number;
}

interface Identity {
  clawbotId: string;
  claimCode: string;
  publicKey: string;
  keypair: Keypair;
  attestation: OwnershipAttestation | null;
}

/**
 * Initialize a clawbot identity:
 * 1. Load or generate ed25519 keypair
 * 2. Register with the linker backend
 * 3. Start verification server (GET /identity, POST /challenge, POST /attestation)
 * 4. Display claim code in terminal
 */
export async function initIdentity(options: InitOptions): Promise<Identity> {
  const { name, endpoint, linkerUrl, port = 3001 } = options;

  // 1. Keypair
  console.log("Loading identity keypair...");
  const keypair = await loadOrCreateKeypair();
  console.log(`Public key: ${keypair.publicKeyEncoded}`);

  // 2. Determine endpoint
  const actualEndpoint = endpoint || `http://localhost:${port}`;

  // 3. Register
  console.log(`\nRegistering with ${linkerUrl}...`);
  const registration = await registerClawbot({
    publicKey: keypair.publicKeyEncoded,
    name,
    endpoint: actualEndpoint,
    linkerUrl,
  });

  // 4. Start server
  const app = new Hono();
  const identityRoutes = createIdentityRoutes(keypair);
  app.route("/", identityRoutes);

  serve({ fetch: app.fetch, port }, () => {
    console.log(`\nIdentity server listening on :${port}`);
  });

  // 5. Display claim code
  printClaimCode(registration.claimCode, registration.clawbotId, linkerUrl);

  // 6. Check for existing attestation
  const attestation = await loadAttestation();

  return {
    clawbotId: registration.clawbotId,
    claimCode: registration.claimCode,
    publicKey: keypair.publicKeyEncoded,
    keypair,
    attestation,
  };
}

function printClaimCode(code: string, clawbotId: string, linkerUrl: string) {
  const box = `
╔══════════════════════════════════════════╗
║                                          ║
║   Your claim code:  ${code}               ║
║                                          ║
║   Enter this in the Alien mini app       ║
║   Expires in 15 minutes                  ║
║                                          ║
║   Bot ID: ${clawbotId.padEnd(28)}  ║
║                                          ║
╚══════════════════════════════════════════╝
`;
  console.log(box);
}

// CLI entrypoint — run directly with `npx tsx packages/identity/src/index.ts`
if (process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js")) {
  const LINKER_URL = process.env.LINKER_URL || "http://localhost:3000";
  const BOT_NAME = process.env.BOT_NAME || "my-clawbot";
  const PORT = parseInt(process.env.PORT || "3001", 10);

  initIdentity({
    name: BOT_NAME,
    linkerUrl: LINKER_URL,
    port: PORT,
  }).catch(console.error);
}
