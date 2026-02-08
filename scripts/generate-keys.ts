/**
 * One-time key generation script.
 * Run: npx tsx scripts/generate-keys.ts
 *
 * Generates an ed25519 keypair for attestation signing.
 * Copy the output into your .env file.
 */
import * as ed from "@noble/ed25519";

// Configure sha512 for ed25519
const sha512 = async (message: Uint8Array): Promise<Uint8Array> => {
  const { webcrypto } = await import("node:crypto");
  return new Uint8Array(
    await webcrypto.subtle.digest("SHA-512", message)
  );
};
ed.etc.sha512Async = sha512;

async function main() {
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);

  const privBase64 = Buffer.from(privateKey).toString("base64");
  const pubBase64 = Buffer.from(publicKey).toString("base64");

  console.log("# Add these to your .env file:\n");
  console.log(`ATTESTATION_PRIVATE_KEY=${privBase64}`);
  console.log(`ATTESTATION_PUBLIC_KEY=${pubBase64}`);
  console.log(`\n# Public key (hex): ${Buffer.from(publicKey).toString("hex")}`);
}

main().catch(console.error);
