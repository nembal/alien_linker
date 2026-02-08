"use client";

import { use } from "react";
import Link from "next/link";
import { GlowText } from "@/components/ui/glow-text";
import { TerminalCard } from "@/components/ui/terminal-card";
import { TerminalButton } from "@/components/ui/terminal-button";
import { DeployStepper } from "@/components/deploy-stepper";
import { PageTransition } from "@/components/layout/page-transition";

export default function DeployProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Stub: always stays on step 0 since no real deploy happens
  const currentStep = 0;

  return (
    <PageTransition className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-terminal-dim hover:text-terminal-text"
      >
        ← Back
      </Link>

      <div className="text-center space-y-2">
        <GlowText as="h1" color="cyan" className="text-lg font-bold">
          Deploying...
        </GlowText>
        <p className="text-xs text-terminal-dim">Job ID: {id}</p>
      </div>

      <TerminalCard title="deploy.log" glow="cyan">
        <DeployStepper currentStep={currentStep} />
      </TerminalCard>

      <p className="text-center text-xs text-terminal-dim animate-pulse">
        This takes ~30 seconds
      </p>

      <Link href="/" className="block">
        <TerminalButton variant="ghost" className="w-full">
          Back to Dashboard
        </TerminalButton>
      </Link>
    </PageTransition>
  );
}
