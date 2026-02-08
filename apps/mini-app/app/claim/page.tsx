"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLaunchParams } from "@alien_org/react";
import { TerminalButton } from "@/components/ui/terminal-button";
import { TerminalCard } from "@/components/ui/terminal-card";
import { GlowText } from "@/components/ui/glow-text";
import { ClaimCodeInput } from "@/components/claim-code-input";
import { PageTransition } from "@/components/layout/page-transition";
import { useClaimBot } from "@/hooks/use-claim-bot";
import Link from "next/link";

function ClaimContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const launchParams = useLaunchParams();
  const { state, error, claim, reset } = useClaimBot();
  const [code, setCode] = useState("");

  // Pre-fill from startParam (Alien deeplink) or query param
  const prefill =
    launchParams?.startParam || searchParams.get("code") || "";

  useEffect(() => {
    if (prefill && /^\d{6}$/.test(prefill)) {
      setCode(prefill);
    }
  }, [prefill]);

  // Redirect on success
  useEffect(() => {
    if (state === "success") {
      router.push("/claim/success");
    }
  }, [state, router]);

  const handleComplete = useCallback((value: string) => {
    setCode(value);
  }, []);

  const handleClaim = useCallback(() => {
    if (code.length === 6) {
      claim(code);
    }
  }, [code, claim]);

  return (
    <PageTransition className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-terminal-dim hover:text-terminal-text"
      >
        ← Back
      </Link>

      <div className="text-center space-y-2">
        <GlowText as="h1" color="green" className="text-lg font-bold">
          Claim Your Clawbot
        </GlowText>
        <p className="text-sm text-terminal-text">
          Enter the 6-digit code shown in your terminal
        </p>
      </div>

      <TerminalCard title="claim-code" glow="green">
        <div className="py-4">
          <ClaimCodeInput
            onComplete={handleComplete}
            disabled={state === "submitting"}
          />
        </div>
      </TerminalCard>

      {error && (
        <TerminalCard glow="green">
          <p className="text-sm text-terminal-red glow-red">{error}</p>
          <button
            onClick={reset}
            className="mt-2 text-xs text-terminal-dim hover:text-terminal-text"
          >
            Try again
          </button>
        </TerminalCard>
      )}

      <TerminalButton
        variant="primary"
        className="w-full"
        onClick={handleClaim}
        loading={state === "submitting"}
        disabled={code.length !== 6}
      >
        Claim Bot
      </TerminalButton>

      <div className="text-center">
        <p className="text-xs text-terminal-dim">
          Don&apos;t have a clawbot yet?{" "}
          <Link
            href="/deploy"
            className="text-terminal-cyan hover:underline"
          >
            Deploy one now →
          </Link>
        </p>
      </div>
    </PageTransition>
  );
}

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="animate-pulse text-terminal-dim">Loading...</div>
        </div>
      }
    >
      <ClaimContent />
    </Suspense>
  );
}
