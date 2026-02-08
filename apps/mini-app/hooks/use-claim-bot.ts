"use client";

import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "./use-auth";
import type { ClaimResponse } from "@/lib/types";

type ClaimState = "idle" | "submitting" | "success" | "error";

export function useClaimBot() {
  const { token } = useAuth();
  const [state, setState] = useState<ClaimState>("idle");
  const [result, setResult] = useState<ClaimResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const claim = useCallback(
    async (claimCode: string) => {
      if (!token) {
        setError("Not authenticated");
        setState("error");
        return;
      }

      setState("submitting");
      setError(null);

      try {
        const data = await apiFetch<ClaimResponse>(
          "/api/clawbots/claim",
          token,
          {
            method: "POST",
            body: JSON.stringify({ claimCode }),
          }
        );
        setResult(data);
        setState("success");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Claim failed");
        setState("error");
      }
    },
    [token]
  );

  const reset = useCallback(() => {
    setState("idle");
    setResult(null);
    setError(null);
  }, []);

  return { state, result, error, claim, reset };
}
