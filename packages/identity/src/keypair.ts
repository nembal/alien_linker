import * as ed from "@noble/ed25519";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// Configure sha512 for ed25519
import { webcrypto } from "node:crypto";
ed.etc.sha512Async = async (msg: Uint8Array) =>
  new Uint8Array(await webcrypto.subtle.digest("SHA-512", msg));

const ALIENCLAW_DIR = join(homedir(), ".alienclaw");
const PRIVATE_KEY_PATH = join(ALIENCLAW_DIR, "identity.key");
const PUBLIC_KEY_PATH = join(ALIENCLAW_DIR, "identity.pub");

export interface Keypair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  publicKeyEncoded: string; // "ed25519:<base64>"
}

/**
 * Loads an existing keypair from ~/.alienclaw/ or generates a new one.
 */
export async function loadOrCreateKeypair(): Promise<Keypair> {
  if (existsSync(PRIVATE_KEY_PATH) && existsSync(PUBLIC_KEY_PATH)) {
    const privBytes = await readFile(PRIVATE_KEY_PATH);
    const pubBytes = await readFile(PUBLIC_KEY_PATH);
    const privateKey = new Uint8Array(privBytes);
    const publicKey = new Uint8Array(pubBytes);

    return {
      privateKey,
      publicKey,
      publicKeyEncoded: `ed25519:${Buffer.from(publicKey).toString("base64")}`,
    };
  }

  return generateKeypair();
}

/**
 * Generates a new ed25519 keypair and saves to ~/.alienclaw/.
 */
export async function generateKeypair(): Promise<Keypair> {
  if (!existsSync(ALIENCLAW_DIR)) {
    await mkdir(ALIENCLAW_DIR, { recursive: true });
  }

  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);

  await writeFile(PRIVATE_KEY_PATH, Buffer.from(privateKey), { mode: 0o600 });
  await writeFile(PUBLIC_KEY_PATH, Buffer.from(publicKey), { mode: 0o644 });

  return {
    privateKey,
    publicKey,
    publicKeyEncoded: `ed25519:${Buffer.from(publicKey).toString("base64")}`,
  };
}

/**
 * Sign a message with the private key.
 */
export async function signMessage(
  message: Uint8Array,
  privateKey: Uint8Array
): Promise<Uint8Array> {
  return ed.signAsync(message, privateKey);
}
