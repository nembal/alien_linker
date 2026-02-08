"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TerminalButton } from "@/components/ui/terminal-button";
import { TerminalInput } from "@/components/ui/terminal-input";
import { TerminalCard } from "@/components/ui/terminal-card";
import { GlowText } from "@/components/ui/glow-text";
import { PageTransition } from "@/components/layout/page-transition";
import { useDeploy } from "@/hooks/use-deploy";

export default function DeployPage() {
  const router = useRouter();
  const { deploy, job, loading, error } = useDeploy();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // If job created, redirect to progress page
  if (job) {
    router.push(`/deploy/${job.id}`);
  }

  const handleDeploy = () => {
    if (!name.trim()) return;
    deploy({ name: name.trim(), description: description.trim() || undefined });
  };

  return (
    <PageTransition className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-terminal-dim hover:text-terminal-text"
      >
        ← Back
      </Link>

      <div className="space-y-2">
        <GlowText as="h1" color="cyan" className="text-lg font-bold">
          Deploy New Clawbot
        </GlowText>
        <p className="text-sm text-terminal-dim">
          Launch a clawbot agent, auto-claimed to your Alien identity.
        </p>
      </div>

      <TerminalCard title="deploy.config" glow="cyan">
        <div className="space-y-4">
          <TerminalInput
            label="Name"
            placeholder="my-research-bot"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TerminalInput
            label="Description (optional)"
            placeholder="Helps with papers"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider text-terminal-dim">
              Template
            </label>
            <div className="rounded-md border border-terminal-border bg-terminal-bg px-3 py-2.5">
              <span className="text-sm text-terminal-text">Default Agent</span>
            </div>
          </div>
        </div>
      </TerminalCard>

      {error && (
        <p className="text-sm text-terminal-red glow-red">{error}</p>
      )}

      <TerminalButton
        variant="secondary"
        className="w-full"
        onClick={handleDeploy}
        loading={loading}
        disabled={!name.trim()}
      >
        Deploy
      </TerminalButton>

      <p className="text-center text-xs text-terminal-dim">
        Deploys to Railway. Auto-claimed to your Alien identity.
      </p>
    </PageTransition>
  );
}
