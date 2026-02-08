"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "./use-auth";
import type { Clawbot } from "@/lib/types";

export function useClawbot(id: string) {
  const { token } = useAuth();
  const [clawbot, setClawbot] = useState<Clawbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiFetch<Clawbot>(`/api/clawbots/${id}`, token)
      .then(setClawbot)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load clawbot")
      )
      .finally(() => setLoading(false));
  }, [token, id]);

  return { clawbot, loading, error };
}
