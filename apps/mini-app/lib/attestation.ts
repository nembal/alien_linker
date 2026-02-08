import * as ed from "@noble/ed25519";
import type { OwnershipAttestation } from "./types";

// ed25519 requires sha512 — configure it using the Web Crypto API
ed.etc.sha512Async = async (message: Uint8Array): Promise<Uint8Array> => {
  // Copy to a fresh ArrayBuffer to satisfy the strict BufferSource type
  const copy = new Uint8Array(message);
  return new Uint8Array(await crypto.subtle.digest("SHA-512", copy));
};

interface CreateAttestationParams {
  alienId: string;
  clawbotId: string;
  publicKey: string;
  issuedBy: string;
}

/**
 * Creates a signed ownership attestation linking an Alien ID to a clawbot.
 * Signs the attestation payload with the backend's ed25519 private key.
 */
export async function createAttestation(
  params: CreateAttestationParams
): Promise<OwnershipAttestation> {
  const privateKeyBase64 = process.env.ATTESTATION_PRIVATE_KEY;
  if (!privateKeyBase64) {
    throw new Error("ATTESTATION_PRIVATE_KEY not configured");
  }

  const privateKey = base64ToBytes(privateKeyBase64);
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year validity

  const attestation: Omit<OwnershipAttestation, "signature"> = {
    type: "alienclaw-ownership-v1",
    alienId: params.alienId,
    clawbotId: params.clawbotId,
    publicKey: params.publicKey,
    issuedBy: params.issuedBy,
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const message = new TextEncoder().encode(
    JSON.stringify(attestation)
  );
  const signature = await ed.signAsync(message, privateKey);

  return {
    ...attestation,
    signature: bytesToBase64(signature),
  };
}

/**
 * Verifies a signed ownership attestation against the backend's public key.
 */
export async function verifyAttestation(
  attestation: OwnershipAttestation
): Promise<boolean> {
  const publicKeyBase64 = process.env.ATTESTATION_PUBLIC_KEY;
  if (!publicKeyBase64) {
    throw new Error("ATTESTATION_PUBLIC_KEY not configured");
  }

  const publicKey = base64ToBytes(publicKeyBase64);
  const { signature, ...payload } = attestation;

  const message = new TextEncoder().encode(JSON.stringify(payload));
  const sig = base64ToBytes(signature);

  return ed.verifyAsync(sig, message, publicKey);
}

// ── Encoding helpers ──

export function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

export function base64ToBytes(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, "base64"));
}

/**
 * Returns the backend's public signing key in JWK format for
 * `/.well-known/openclaw-keys.json`.
 */
export function getPublicKeyJwk(): { kty: string; crv: string; x: string; use: string } | null {
  const publicKeyBase64 = process.env.ATTESTATION_PUBLIC_KEY;
  if (!publicKeyBase64) return null;

  // Ed25519 JWK uses base64url encoding of the raw 32-byte public key
  const raw = Buffer.from(publicKeyBase64, "base64");
  const x = raw.toString("base64url");

  return { kty: "OKP", crv: "Ed25519", x, use: "sig" };
}
