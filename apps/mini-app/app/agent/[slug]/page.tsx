"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlowText } from "@/components/ui/glow-text";
import { TerminalCard } from "@/components/ui/terminal-card";
import { TerminalButton } from "@/components/ui/terminal-button";
import { TerminalInput } from "@/components/ui/terminal-input";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { CopyBlock } from "@/components/ui/copy-block";
import { PageTransition } from "@/components/layout/page-transition";
import {
  findAgentBySlug,
  getAgentSetup,
  saveAgentSetup,
  type AgentSetup,
} from "@/lib/fake-agents";
import type { Clawbot } from "@/lib/types";

export default function AgentSetupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [agent, setAgent] = useState<Clawbot | null>(null);
  const [setup, setSetup] = useState<AgentSetup>({});
  const [telegramToken, setTelegramToken] = useState("");
  const [aiProvider, setAiProvider] = useState<"openai" | "anthropic">("openai");
  const [aiKey, setAiKey] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    const found = findAgentBySlug(slug);
    if (found) {
      setAgent(found);
      const existing = getAgentSetup(found.clawbotId);
      setSetup(existing);
      if (existing.telegramToken) setTelegramToken(existing.telegramToken);
      if (existing.aiProvider) setAiProvider(existing.aiProvider);
      if (existing.aiApiKey) setAiKey(existing.aiApiKey);
    }
  }, [slug]);

  const handleSaveTelegram = () => {
    if (!agent || !telegramToken.trim()) return;
    const updated: AgentSetup = {
      ...setup,
      telegramToken: telegramToken.trim(),
      telegramBotUsername: telegramToken.trim().split(":")[0] ? `bot_${agent.name}` : undefined,
    };
    saveAgentSetup(agent.clawbotId, updated);
    setSetup(updated);
    flash("Telegram token saved");
  };

  const handleSaveAI = () => {
    if (!agent || !aiKey.trim()) return;
    const updated: AgentSetup = {
      ...setup,
      aiProvider,
      aiApiKey: aiKey.trim(),
    };
    saveAgentSetup(agent.clawbotId, updated);
    setSetup(updated);
    flash("AI key saved");
  };

  const handleFinish = () => {
    if (!agent) return;
    saveAgentSetup(agent.clawbotId, { ...setup, setupComplete: true });
    setSetup((s) => ({ ...s, setupComplete: true }));
    flash("Setup complete");
  };

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(null), 2000);
  };

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const agentUrl = `${appUrl}/agent/${slug}`;
  const allDone = !!setup.telegramToken && !!setup.aiApiKey;

  if (!agent) {
    return (
      <PageTransition className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-terminal-dim hover:text-terminal-text"
        >
          &larr; Back
        </Link>
        <TerminalCard glow="green">
          <p className="text-sm text-terminal-red glow-red">
            Agent not found
          </p>
        </TerminalCard>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-terminal-dim hover:text-terminal-text"
      >
        &larr; Back
      </Link>

      {/* Agent header */}
      <div className="flex items-start justify-between">
        <div>
          <GlowText color="green" as="h1" className="text-lg font-bold">
            {agent.name}
          </GlowText>
          <p className="text-[11px] text-terminal-dim mt-0.5">{agent.clawbotId}</p>
        </div>
        <StatusIndicator status={setup.setupComplete ? "online" : "pending"} />
      </div>

      {/* Agent link */}
      <TerminalCard glow="cyan">
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wider text-terminal-dim">
            Agent URL
          </p>
          <CopyBlock text={agentUrl} />
        </div>
      </TerminalCard>

      {/* Saved toast */}
      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-md bg-terminal-green/10 border border-terminal-green/30 px-3 py-2 text-center text-xs text-terminal-green"
        >
          {saved}
        </motion.div>
      )}

      {/* Step 1: Telegram */}
      <TerminalCard
        title={`1. telegram ${setup.telegramToken ? "✓" : ""}`}
        glow={setup.telegramToken ? "green" : "amber"}
      >
        <div className="space-y-3 text-xs">
          <div className="space-y-1.5 text-terminal-dim">
            <p>
              Create a bot with{" "}
              <span className="text-terminal-cyan">@BotFather</span> on Telegram:
            </p>
            <ol className="list-inside list-decimal space-y-1 ml-1">
              <li>
                Open{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terminal-cyan underline"
                >
                  t.me/BotFather
                </a>
              </li>
              <li>
                Send <span className="text-terminal-text">/newbot</span>
              </li>
              <li>Choose a name and username</li>
              <li>Copy the API token below</li>
            </ol>
          </div>

          <TerminalInput
            label="Bot Token"
            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v..."
            value={telegramToken}
            onChange={(e) => setTelegramToken(e.target.value)}
            type="password"
          />

          <TerminalButton
            variant="primary"
            className="w-full"
            onClick={handleSaveTelegram}
            disabled={!telegramToken.trim()}
          >
            {setup.telegramToken ? "Update Token" : "Save Token"}
          </TerminalButton>
        </div>
      </TerminalCard>

      {/* Step 2: AI Key */}
      <TerminalCard
        title={`2. ai model ${setup.aiApiKey ? "✓" : ""}`}
        glow={setup.aiApiKey ? "green" : "amber"}
      >
        <div className="space-y-3 text-xs">
          <p className="text-terminal-dim">
            Add an API key to power your agent&apos;s intelligence.
          </p>

          {/* Provider toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setAiProvider("openai")}
              className={`flex-1 rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                aiProvider === "openai"
                  ? "border-terminal-green/40 bg-terminal-green/10 text-terminal-green"
                  : "border-terminal-border bg-transparent text-terminal-dim"
              }`}
            >
              OpenAI
            </button>
            <button
              onClick={() => setAiProvider("anthropic")}
              className={`flex-1 rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                aiProvider === "anthropic"
                  ? "border-terminal-cyan/40 bg-terminal-cyan/10 text-terminal-cyan"
                  : "border-terminal-border bg-transparent text-terminal-dim"
              }`}
            >
              Claude
            </button>
          </div>

          <TerminalInput
            label={aiProvider === "openai" ? "OpenAI API Key" : "Anthropic API Key"}
            placeholder={
              aiProvider === "openai" ? "sk-..." : "sk-ant-..."
            }
            value={aiKey}
            onChange={(e) => setAiKey(e.target.value)}
            type="password"
          />

          <TerminalButton
            variant={aiProvider === "anthropic" ? "secondary" : "primary"}
            className="w-full"
            onClick={handleSaveAI}
            disabled={!aiKey.trim()}
          >
            {setup.aiApiKey ? "Update Key" : "Save Key"}
          </TerminalButton>
        </div>
      </TerminalCard>

      {/* Finish */}
      {allDone && !setup.setupComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TerminalButton
            variant="primary"
            className="w-full"
            onClick={handleFinish}
          >
            Finish Setup
          </TerminalButton>
        </motion.div>
      )}

      {setup.setupComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TerminalCard glow="green">
            <div className="text-center space-y-1">
              <p className="text-sm text-terminal-green glow-green font-semibold">
                Agent is ready
              </p>
              <p className="text-[11px] text-terminal-dim">
                {agent.name} is configured and linked to your identity.
              </p>
            </div>
          </TerminalCard>
        </motion.div>
      )}
    </PageTransition>
  );
}
