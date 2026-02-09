"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "./use-auth";
import { getFakeAgents } from "@/lib/fake-agents";
import type { Clawbot } from "@/lib/types";

export function useClawbot(id: string) {
  const { token } = useAuth();
  const [clawbot, setClawbot] = useState<Clawbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Try remote first, fall back to local
    const tryRemote = token
      ? apiFetch<Clawbot>(`/api/clawbots/${id}`, token).catch(() => null)
      : Promise.resolve(null);

    tryRemote.then((remote) => {
      if (remote) {
        setClawbot(remote);
      } else {
        // Look up in local storage
        const local = getFakeAgents().find((a) => a.clawbotId === id);
        if (local) {
          setClawbot(local);
        } else {
          setError("Agent not found");
        }
      }
      setLoading(false);
    });
  }, [token, id]);

  return { clawbot, loading, error };
}
