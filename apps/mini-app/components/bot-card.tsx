"use client";

import Link from "next/link";
import { TerminalCard } from "@/components/ui/terminal-card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { GlowText } from "@/components/ui/glow-text";
import type { Clawbot } from "@/lib/types";

interface BotCardProps {
  bot: Clawbot;
}

export function BotCard({ bot }: BotCardProps) {
  const statusMap = {
    claimed: "online" as const,
    registered: "pending" as const,
    offline: "offline" as const,
  };

  return (
    <Link href={`/bot/${bot.clawbotId}`}>
      <TerminalCard className="transition-all hover:border-terminal-green/40 hover:shadow-[0_0_20px_rgba(0,255,65,0.1)]">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <GlowText color="green" className="text-sm font-semibold">
              {bot.name}
            </GlowText>
            {bot.endpoint && (
              <p className="text-xs text-terminal-dim">{bot.endpoint}</p>
            )}
            <p className="text-xs text-terminal-dim">
              {bot.clawbotId}
            </p>
          </div>
          <StatusIndicator status={statusMap[bot.status]} />
        </div>
        {bot.description && (
          <p className="mt-2 text-xs text-terminal-text/70">
            {bot.description}
          </p>
        )}
      </TerminalCard>
    </Link>
  );
}
