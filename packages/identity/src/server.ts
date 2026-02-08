import { Hono } from "hono";
import { loadAttestation, saveAttestation, type OwnershipAttestation } from "./attestation.js";
import { signMessage, type Keypair } from "./keypair.js";

/**
 * Creates Hono routes for clawbot identity verification.
 *
 * - GET /identity — returns the attestation (public)
 * - POST /challenge — signs a nonce with the private key
 * - POST /attestation — receives attestation from backend after claim
 */
export function createIdentityRoutes(keypair: Keypair) {
  const app = new Hono();

  // Public: return attestation
  app.get("/identity", async (c) => {
    const attestation = await loadAttestation();
    if (!attestation) {
      return c.json({ error: "Not yet claimed" }, 404);
    }
    return c.json(attestation);
  });

  // Prove ownership: sign a challenge nonce
  app.post("/challenge", async (c) => {
    const body = await c.req.json<{ nonce: string }>();
    if (!body.nonce) {
      return c.json({ error: "nonce is required" }, 400);
    }

    const message = new TextEncoder().encode(body.nonce);
    const signature = await signMessage(message, keypair.privateKey);

    return c.json({
      nonce: body.nonce,
      signature: Buffer.from(signature).toString("base64"),
      publicKey: keypair.publicKeyEncoded,
    });
  });

  // Receive attestation from backend after claim
  app.post("/attestation", async (c) => {
    const attestation = await c.req.json<OwnershipAttestation>();
    await saveAttestation(attestation);
    console.log(`\n✓ Attestation received! Claimed by ${attestation.alienId}`);
    return c.json({ ok: true });
  });

  return app;
}
