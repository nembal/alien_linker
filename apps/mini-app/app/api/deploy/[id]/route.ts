import { NextResponse } from "next/server";
import { authenticateRequest, AuthError } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase";
import type { ApiError } from "@/lib/types";

/**
 * GET /api/deploy/[id]
 * STUB: Returns deploy job status. Always stays "pending" since no real deploy happens.
 */
export async function GET(
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
  const { data: job, error } = await db
    .from("deploy_jobs")
    .select("*")
    .eq("id", id)
    .eq("alien_id", alienId)
    .single();

  if (error || !job) {
    return NextResponse.json<ApiError>(
      { error: "Deploy job not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: job.id,
    alienId: job.alien_id,
    clawbotId: job.clawbot_id,
    config: job.config,
    provider: job.provider,
    status: job.status,
    providerMetadata: job.provider_metadata,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  });
}
