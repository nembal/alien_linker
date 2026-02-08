import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const OPENCLAW_DIR = join(homedir(), ".alienclaw");
const ATTESTATION_PATH = join(OPENCLAW_DIR, "attestation.json");

export interface OwnershipAttestation {
  type: string;
  alienId: string;
  clawbotId: string;
  publicKey: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt: string;
  signature: string;
}

/**
 * Save an attestation to ~/.alienclaw/attestation.json.
 */
export async function saveAttestation(
  attestation: OwnershipAttestation
): Promise<void> {
  if (!existsSync(OPENCLAW_DIR)) {
    await mkdir(OPENCLAW_DIR, { recursive: true });
  }
  await writeFile(
    ATTESTATION_PATH,
    JSON.stringify(attestation, null, 2),
    "utf-8"
  );
}

/**
 * Load the attestation from disk, or return null if not yet claimed.
 */
export async function loadAttestation(): Promise<OwnershipAttestation | null> {
  if (!existsSync(ATTESTATION_PATH)) return null;
  const raw = await readFile(ATTESTATION_PATH, "utf-8");
  return JSON.parse(raw);
}
