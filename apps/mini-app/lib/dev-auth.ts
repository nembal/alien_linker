/**
 * Dev-mode auth helper.
 *
 * When running outside the Alien app (isBridgeAvailable === false), the real
 * SDK hooks still work — they just return undefined authToken and log warnings.
 *
 * This module provides a mock JWT for local API testing so developers don't
 * need the Alien app open during development.
 */

const DEV_ALIEN_ID = "dev-alien-user-00000";

/**
 * Creates a base64url-encoded mock JWT for local development.
 * The token is NOT cryptographically signed — it's only used when the backend
 * also runs in dev mode and accepts unsigned tokens.
 */
export function createDevToken(): string {
  const header = { alg: "none", typ: "JWT" };
  const payload = {
    iss: "dev-mode",
    sub: DEV_ALIEN_ID,
    aud: "alienclaw-linker",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  };

  const encode = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");

  return `${encode(header)}.${encode(payload)}.dev`;
}

/**
 * Returns the auth token to use for API calls.
 * In production (inside Alien app), pass the real authToken from useAlien().
 * In dev mode, falls back to a mock token.
 */
export function getAuthToken(alienAuthToken: string | undefined): string {
  if (alienAuthToken) return alienAuthToken;

  if (process.env.NODE_ENV === "development") {
    return createDevToken();
  }

  throw new Error("No auth token available — are you running inside the Alien app?");
}

export { DEV_ALIEN_ID };
