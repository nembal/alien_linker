"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "./use-auth";
import { getFakeAgents } from "@/lib/fake-agents";
import type { Clawbot } from "@/lib/types";

export function useClawbots() {
  const { token } = useAuth();
  const [clawbots, setClawbots] = useState<Clawbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    let remote: Clawbot[] = [];
    if (token) {
      try {
        remote = await apiFetch<Clawbot[]>("/api/clawbots", token);
      } catch {
        // Silently fail — local agents still show up
      }
    }

    // Merge in locally-deployed agents
    const local = getFakeAgents();
    const remoteIds = new Set(remote.map((b) => b.clawbotId));
    const merged = [...remote, ...local.filter((a) => !remoteIds.has(a.clawbotId))];

    setClawbots(merged);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { clawbots, loading, error, refetch };
}
