"use client";

const ASCII_ART = `
 █████  ██      ██ ███████ ███    ██  ██████ ██       █████  ██     ██
██   ██ ██      ██ ██      ████   ██ ██      ██      ██   ██ ██     ██
███████ ██      ██ █████   ██ ██  ██ ██      ██      ███████ ██  █  ██
██   ██ ██      ██ ██      ██  ██ ██ ██      ██      ██   ██ ██ ███ ██
██   ██ ███████ ██ ███████ ██   ████  ██████ ███████ ██   ██  ███ ███
`.trimStart();

export function AsciiHeader({ className = "" }: { className?: string }) {
  return (
    <pre
      className={`text-terminal-green glow-green select-none overflow-hidden text-center text-[0.35rem] leading-tight sm:text-[0.5rem] ${className}`}
      aria-label="AlienClaw"
    >
      {ASCII_ART}
    </pre>
  );
}
