"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLaunchParams } from "@alien_org/react";
import { TerminalButton } from "@/components/ui/terminal-button";
import { TerminalCard } from "@/components/ui/terminal-card";
import { GlowText } from "@/components/ui/glow-text";
import { CopyBlock } from "@/components/ui/copy-block";
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
  const [showSetup, setShowSetup] = useState(false);

  const prefill =
    launchParams?.startParam || searchParams.get("code") || "";

  useEffect(() => {
    if (prefill && /^\d{6}$/.test(prefill)) {
      setCode(prefill);
    }
  }, [prefill]);

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
          Link Your Agent
        </GlowText>
        <p className="text-sm text-terminal-text">
          Enter the 6-digit code from your agent&apos;s terminal
        </p>
      </div>

      <TerminalCard glow="green">
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
        Link Agent
      </TerminalButton>

      {/* How to get a code */}
      <div className="space-y-2">
        <button
          onClick={() => setShowSetup(!showSetup)}
          className="w-full text-left text-xs text-terminal-cyan"
        >
          {showSetup ? "▾" : "▸"} How do I get a claim code?
        </button>

        {showSetup && (
          <TerminalCard glow="cyan">
            <div className="space-y-4 text-xs">
              <p className="text-terminal-text">
                Run the identity SDK on your agent&apos;s machine.
                It generates a keypair, registers with the linker,
                and prints a 6-digit code.
              </p>

              <div className="space-y-1.5">
                <p className="text-terminal-dim uppercase tracking-wider">
                  1. Install the SDK
                </p>
                <CopyBlock text="bun add @alienclaw/identity" />
              </div>

              <div className="space-y-1.5">
                <p className="text-terminal-dim uppercase tracking-wider">
                  2. Add to your agent
                </p>
                <CopyBlock
                  text={`import { initIdentity } from "@alienclaw/identity"

await initIdentity({
  name: "my-agent",
  linkerUrl: "https://your-linker.vercel.app",
})`}
                />
              </div>

              <p className="text-terminal-dim">
                The 6-digit code appears in the terminal output.
                Enter it above to link the agent to your Alien identity.
              </p>
            </div>
          </TerminalCard>
        )}
      </div>

      <div className="text-center">
        <p className="text-xs text-terminal-dim">
          Don&apos;t have an agent yet?{" "}
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
