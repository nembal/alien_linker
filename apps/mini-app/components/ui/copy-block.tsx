"use client";

import { useState, useCallback } from "react";

interface CopyBlockProps {
  text: string;
  className?: string;
}

export function CopyBlock({ text, className = "" }: CopyBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for WebView environments
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`group relative w-full rounded bg-terminal-bg px-3 py-2.5 text-left active:bg-terminal-border/50 ${className}`}
    >
      <pre className="overflow-x-auto text-xs text-terminal-green whitespace-pre-wrap break-all">
        {text}
      </pre>
      <span className="absolute right-2 top-2 text-[10px] text-terminal-dim group-active:text-terminal-green">
        {copied ? "copied!" : "tap to copy"}
      </span>
    </button>
  );
}
