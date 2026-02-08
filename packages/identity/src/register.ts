export interface RegisterParams {
  publicKey: string;
  name: string;
  endpoint?: string;
  linkerUrl: string;
}

export interface RegisterResult {
  clawbotId: string;
  claimCode: string;
  expiresAt: string;
}

/**
 * Registers this clawbot with the AlienClaw Linker backend.
 * Returns a clawbot ID and a 6-digit claim code.
 */
export async function registerClawbot(
  params: RegisterParams
): Promise<RegisterResult> {
  const url = `${params.linkerUrl}/api/clawbots/register`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicKey: params.publicKey,
      name: params.name,
      endpoint: params.endpoint,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(`Registration failed: ${body.error}`);
  }

  return res.json();
}
