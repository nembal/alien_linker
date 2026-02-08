"use client";

import { use } from "react";
import Link from "next/link";
import { GlowText } from "@/components/ui/glow-text";
import { TerminalButton } from "@/components/ui/terminal-button";
import { Erc8004Preview } from "@/components/erc8004-preview";
import { PageTransition } from "@/components/layout/page-transition";
import { useClawbot } from "@/hooks/use-clawbot";

export default function RegisterOnChainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { clawbot, loading } = useClawbot(id);

  if (loading || !clawbot) {
    return (
      <PageTransition className="flex min-h-[40vh] items-center justify-center">
        <div className="animate-pulse text-terminal-dim">Loading...</div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <Link
        href={`/bot/${id}`}
        className="inline-flex items-center gap-1 text-xs text-terminal-dim hover:text-terminal-text"
      >
        ← Back to bot
      </Link>

      <div className="text-center space-y-2">
        <GlowText as="h1" color="amber" className="text-lg font-bold">
          On-Chain Registration
        </GlowText>
        <p className="text-sm text-terminal-dim">
          Register {clawbot.name} on the ERC-8004 Identity Registry
        </p>
      </div>

      <Erc8004Preview
        clawbotName={clawbot.name}
        clawbotId={clawbot.clawbotId}
      />

      <TerminalButton variant="ghost" className="w-full" disabled>
        Coming Soon
      </TerminalButton>

      <p className="text-center text-xs text-terminal-dim">
        ERC-8004 on-chain registration will be available in a future update.
        This will enable fully decentralized identity verification on Base.
      </p>
    </PageTransition>
  );
}
