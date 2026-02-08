"use client";

import { type ReactNode } from "react";

interface GlowTextProps {
  color?: "green" | "cyan" | "amber" | "red";
  as?: "span" | "p" | "h1" | "h2" | "h3";
  children: ReactNode;
  className?: string;
}

export function GlowText({
  color = "green",
  as: Tag = "span",
  children,
  className = "",
}: GlowTextProps) {
  const colorClass = {
    green: "text-terminal-green glow-green",
    cyan: "text-terminal-cyan glow-cyan",
    amber: "text-terminal-amber glow-amber",
    red: "text-terminal-red glow-red",
  }[color];

  return <Tag className={`${colorClass} ${className}`}>{children}</Tag>;
}
