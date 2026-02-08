"use client";

import { type ButtonHTMLAttributes } from "react";

interface TerminalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}

export function TerminalButton({
  variant = "primary",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: TerminalButtonProps) {
  const base =
    "relative px-6 py-3 rounded-md font-mono text-sm font-semibold uppercase tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-terminal-green/10 text-terminal-green border border-terminal-green/30 hover:bg-terminal-green/20 hover:shadow-[0_0_15px_rgba(0,255,65,0.2)] active:bg-terminal-green/30",
    secondary:
      "bg-terminal-cyan/10 text-terminal-cyan border border-terminal-cyan/30 hover:bg-terminal-cyan/20 hover:shadow-[0_0_15px_rgba(0,212,255,0.2)] active:bg-terminal-cyan/30",
    ghost:
      "text-terminal-dim border border-transparent hover:text-terminal-text hover:border-terminal-border",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
