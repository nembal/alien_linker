import { createAuthClient } from "@alien_org/auth-client";
import { DEV_ALIEN_ID } from "./dev-auth";

const authClient = createAuthClient();

/**
 * Extracts and verifies the Alien JWT from the Authorization header.
 * Returns the alienId (sub claim).
 *
 * In development mode, accepts unsigned dev tokens.
 */
export async function authenticateRequest(
  request: Request
): Promise<string> {
  const token = request.headers
    .get("Authorization")
    ?.replace("Bearer ", "");

  if (!token) {
    throw new AuthError("Missing authorization token", 401);
  }

  // Dev mode: accept unsigned mock tokens
  if (process.env.NODE_ENV === "development" && token.endsWith(".dev")) {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64url").toString()
      );
      return payload.sub || DEV_ALIEN_ID;
    } catch {
      throw new AuthError("Invalid dev token", 401);
    }
  }

  try {
    const { sub } = await authClient.verifyToken(token);
    return sub;
  } catch {
    throw new AuthError("Invalid or expired token", 401);
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}
