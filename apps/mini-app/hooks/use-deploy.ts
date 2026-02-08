"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "./use-auth";
import type { DeployResponse, DeployJob } from "@/lib/types";

export function useDeploy() {
  const { token } = useAuth();
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<DeployJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const deploy = useCallback(
    async (params: { name: string; description?: string; template?: string }) => {
      if (!token) {
        setError("Not authenticated");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await apiFetch<DeployResponse>("/api/deploy", token, {
          method: "POST",
          body: JSON.stringify(params),
        });
        setJobId(data.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Deploy failed");
        setLoading(false);
      }
    },
    [token]
  );

  // Poll job status
  useEffect(() => {
    if (!jobId || !token) return;

    const poll = async () => {
      try {
        const data = await apiFetch<DeployJob>(
          `/api/deploy/${jobId}`,
          token
        );
        setJob(data);
        if (data.status === "running" || data.status === "failed") {
          setLoading(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Keep polling on transient errors
      }
    };

    poll();
    pollRef.current = setInterval(poll, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobId, token]);

  return { deploy, job, loading, error };
}
