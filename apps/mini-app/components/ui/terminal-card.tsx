"use client";

import { type ReactNode } from "react";

interface TerminalCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  glow?: "green" | "cyan" | "amber";
}

export function TerminalCard({
  title,
  children,
  className = "",
  glow = "green",
}: TerminalCardProps) {
  const glowClass = {
    green: "border-glow-green border-terminal-green/20",
    cyan: "border-glow-cyan border-terminal-cyan/20",
    amber: "border-terminal-amber/20",
  }[glow];

  return (
    <div
      className={`rounded-lg border bg-terminal-surface/80 backdrop-blur-sm ${glowClass} ${className}`}
    >
      {title && (
        <div className="border-b border-terminal-border px-4 py-2">
          <span className="text-xs text-terminal-dim">{title}</span>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
