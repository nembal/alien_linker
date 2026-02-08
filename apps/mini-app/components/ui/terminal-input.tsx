"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

interface TerminalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const TerminalInput = forwardRef<HTMLInputElement, TerminalInputProps>(
  function TerminalInput({ label, className = "", ...props }, ref) {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs uppercase tracking-wider text-terminal-dim">
            {label}
          </label>
        )}
        <div className="flex items-center rounded-md border border-terminal-border bg-terminal-bg px-3 py-2.5 focus-within:border-terminal-green/40 focus-within:shadow-[0_0_8px_rgba(0,255,65,0.1)]">
          <span className="mr-2 text-terminal-green">&gt;</span>
          <input
            ref={ref}
            className={`w-full bg-transparent font-mono text-sm text-terminal-text caret-terminal-green outline-none placeholder:text-terminal-dim/50 ${className}`}
            {...props}
          />
        </div>
      </div>
    );
  }
);
