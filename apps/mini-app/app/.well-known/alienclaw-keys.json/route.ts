import { NextResponse } from "next/server";
import { getPublicKeyJwk } from "@/lib/attestation";

export async function GET() {
  const jwk = getPublicKeyJwk();

  if (!jwk) {
    return NextResponse.json(
      { error: "Public key not configured" },
      { status: 500 }
    );
  }

  return NextResponse.json({ keys: [jwk] });
}
