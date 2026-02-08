import { NextResponse } from "next/server";
import { authenticateRequest, AuthError } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase";
import type { DeployRequest, DeployResponse, ApiError } from "@/lib/types";

/**
 * POST /api/deploy
 * STUB: Creates a deploy job record. No actual deployment.
 */
export async function POST(request: Request) {
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

  let body: DeployRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.name) {
    return NextResponse.json<ApiError>(
      { error: "name is required" },
      { status: 400 }
    );
  }

  const db = createServerSupabase();
  const { data, error } = await db
    .from("deploy_jobs")
    .insert({
      alien_id: alienId,
      config: {
        name: body.name,
        description: body.description ?? null,
        template: body.template ?? "default",
      },
      provider: "manual",
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to create deploy job:", error);
    return NextResponse.json<ApiError>(
      { error: "Failed to create deploy job" },
      { status: 500 }
    );
  }

  return NextResponse.json<DeployResponse>({
    id: data.id,
    status: "pending",
  });
}
