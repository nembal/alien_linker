"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AsciiHeader } from "@/components/ui/ascii-header";
import { TerminalButton } from "@/components/ui/terminal-button";
import { TerminalCard } from "@/components/ui/terminal-card";
import { GlowText } from "@/components/ui/glow-text";
import { TypingText } from "@/components/ui/typing-text";
import { BotCard } from "@/components/bot-card";
import { PageTransition } from "@/components/layout/page-transition";
import { CopyBlock } from "@/components/ui/copy-block";
import { useClawbots } from "@/hooks/use-clawbots";

const ASCII_ROBOT = `
    ╭─────╮
    │ ◉ ◉ │
    │  ▽  │
    ╰──┬──╯
   ╭───┴───╮
   │ ALIEN │
   ╰───────╯
`;

export default function Dashboard() {
  const { clawbots, loading, error } = useClawbots();

  return (
    <PageTransition className="space-y-6">
      <AsciiHeader className="mt-2" />

      <div className="text-center">
        <GlowText color="cyan" className="text-xs uppercase tracking-widest">
          Agent Identity Linker
        </GlowText>
      </div>

      {/* Bot List */}
      <div className="space-y-3">
        {loading ? (
          <TerminalCard>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-4 w-1/2 rounded bg-terminal-border" />
                  <div className="h-3 w-3/4 rounded bg-terminal-border" />
                </div>
              ))}
            </div>
          </TerminalCard>
        ) : error ? (
          <TerminalCard glow="green">
            <p className="text-sm text-terminal-red glow-red">
              Error: {error}
            </p>
          </TerminalCard>
        ) : clawbots.length > 0 ? (
          <>
            <div className="flex items-center justify-between px-1">
              <GlowText color="green" className="text-xs uppercase tracking-wider">
                My Agents
              </GlowText>
              <span className="text-xs text-terminal-dim">
                {clawbots.length} linked
              </span>
            </div>
            {clawbots.map((bot, i) => (
              <motion.div
                key={bot.clawbotId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <BotCard bot={bot} />
              </motion.div>
            ))}
          </>
        ) : (
          <TerminalCard title="system.log" glow="cyan">
            <pre className="select-none text-center text-xs leading-relaxed text-terminal-dim">
              {ASCII_ROBOT}
            </pre>
            <div className="mt-2 text-center text-sm text-terminal-text">
              <TypingText text="No agents linked yet. Run the identity SDK on your agent, then claim it here." />
            </div>
          </TerminalCard>
        )}
      </div>

      {/* Quick Setup Hint */}
      {clawbots.length === 0 && !loading && (
        <TerminalCard glow="cyan">
          <div className="space-y-3 text-xs">
            <p className="text-terminal-text">
              To link an agent, install the identity SDK on it:
            </p>
            <CopyBlock text="bun add @alienclaw/identity" />
            <p className="text-terminal-dim">
              Then call{" "}
              <span className="text-terminal-cyan">initIdentity()</span>{" "}
              in your agent. A 6-digit code will appear in the terminal.
            </p>
          </div>
        </TerminalCard>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Link href="/claim" className="block">
          <TerminalButton variant="primary" className="w-full">
            Link an Agent
          </TerminalButton>
        </Link>
        <Link href="/deploy" className="block">
          <TerminalButton variant="secondary" className="w-full">
            Deploy New Agent
          </TerminalButton>
        </Link>
      </div>
    </PageTransition>
  );
}
