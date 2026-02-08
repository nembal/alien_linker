"use client";

import { TerminalCard } from "@/components/ui/terminal-card";
import { GlowText } from "@/components/ui/glow-text";

interface Erc8004PreviewProps {
  clawbotName: string;
  clawbotId: string;
}

export function Erc8004Preview({ clawbotName, clawbotId }: Erc8004PreviewProps) {
  return (
    <TerminalCard title="ERC-8004 Identity Registry" glow="amber">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <GlowText color="amber" className="text-sm font-semibold">
            On-Chain Registration
          </GlowText>
          <span className="rounded border border-terminal-amber/30 bg-terminal-amber/10 px-2 py-0.5 text-xs text-terminal-amber">
            Coming Soon
          </span>
        </div>

        <pre className="overflow-x-auto text-xs leading-relaxed text-terminal-dim">
{`{
  "type": "eip-8004#registration-v1",
  "name": "${clawbotName}",
  "services": [
    { "name": "alienclaw", "endpoint": "${clawbotId}" },
    { "name": "alien", "endpoint": "<your-alien-id>" }
  ]
}`}
        </pre>

        <div className="space-y-1 text-xs text-terminal-dim">
          <p>Contract: IdentityRegistry on Base</p>
          <p className="break-all text-terminal-dim/60">
            0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
          </p>
        </div>
      </div>
    </TerminalCard>
  );
}
