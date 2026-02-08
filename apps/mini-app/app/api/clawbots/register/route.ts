import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createServerSupabase } from "@/lib/supabase";
import type { RegisterRequest, RegisterResponse, ApiError } from "@/lib/types";

/**
 * POST /api/clawbots/register
 * No auth — called by the clawbot itself on first boot.
 * Generates a clawbot ID and 6-digit claim code.
 */
export async function POST(request: Request) {
  let body: RegisterRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.publicKey || !body.name) {
    return NextResponse.json<ApiError>(
      { error: "publicKey and name are required" },
      { status: 400 }
    );
  }

  if (!/^ed25519:/.test(body.publicKey)) {
    return NextResponse.json<ApiError>(
      { error: "publicKey must be prefixed with 'ed25519:'" },
      { status: 400 }
    );
  }

  const clawbotId = `cbot_${nanoid(12)}`;
  const claimCode = generateClaimCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  const db = createServerSupabase();
  const { error } = await db.from("clawbots").insert({
    clawbot_id: clawbotId,
    name: body.name,
    public_key: body.publicKey,
    endpoint: body.endpoint ?? null,
    claim_code: claimCode,
    claim_code_expires_at: expiresAt.toISOString(),
    status: "registered",
  });

  if (error) {
    console.error("Failed to register clawbot:", error);
    return NextResponse.json<ApiError>(
      { error: "Failed to register clawbot" },
      { status: 500 }
    );
  }

  return NextResponse.json<RegisterResponse>({
    clawbotId,
    claimCode,
    expiresAt: expiresAt.toISOString(),
  });
}

function generateClaimCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
