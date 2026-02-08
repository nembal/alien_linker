"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "./use-auth";
import type { Clawbot } from "@/lib/types";

export function useClawbots() {
  const { token } = useAuth();
  const [clawbots, setClawbots] = useState<Clawbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Clawbot[]>("/api/clawbots", token);
      setClawbots(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load clawbots");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { clawbots, loading, error, refetch };
}
