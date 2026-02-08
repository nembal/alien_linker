import { NextResponse } from "next/server";
import { authenticateRequest, AuthError } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase";
import type { ApiError } from "@/lib/types";

/**
 * POST /api/clawbots/[id]/refresh-code
 * Requires Alien JWT. Generates a new claim code for an owned bot.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let alienId: string;
  try {
    alienId = await authenticateRequest(request);
  } catch (e) {
    const status = e instanceof AuthError ? e.statusCode : 401;
    return NextResponse.json<ApiError>(
      { error: e instanceof Error ? e.message : "Unauthorized" },
      { status }
    );
  }

  const { id } = await params;
  const db = createServerSupabase();

  const { data: bot, error: findError } = await db
    .from("clawbots")
    .select("id")
    .eq("clawbot_id", id)
    .eq("alien_id", alienId)
    .single();

  if (findError || !bot) {
    return NextResponse.json<ApiError>(
      { error: "Clawbot not found" },
      { status: 404 }
    );
  }

  const claimCode = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const { error: updateError } = await db
    .from("clawbots")
    .update({
      claim_code: claimCode,
      claim_code_expires_at: expiresAt.toISOString(),
    })
    .eq("id", bot.id);

  if (updateError) {
    return NextResponse.json<ApiError>(
      { error: "Failed to refresh code" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    claimCode,
    expiresAt: expiresAt.toISOString(),
  });
}
