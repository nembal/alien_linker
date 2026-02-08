"use client";

interface StatusIndicatorProps {
  status: "online" | "pending" | "offline";
  label?: string;
  className?: string;
}

export function StatusIndicator({
  status,
  label,
  className = "",
}: StatusIndicatorProps) {
  const config = {
    online: {
      color: "bg-terminal-green",
      glow: "shadow-[0_0_6px_rgba(0,255,65,0.6)]",
      text: "text-terminal-green",
      defaultLabel: "Online",
    },
    pending: {
      color: "bg-terminal-amber",
      glow: "shadow-[0_0_6px_rgba(255,176,0,0.6)]",
      text: "text-terminal-amber",
      defaultLabel: "Pending",
    },
    offline: {
      color: "bg-terminal-red",
      glow: "shadow-[0_0_6px_rgba(255,0,64,0.6)]",
      text: "text-terminal-red",
      defaultLabel: "Offline",
    },
  }[status];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`inline-block h-2 w-2 rounded-full ${config.color} ${config.glow} animate-pulse`}
      />
      {label !== undefined ? (
        <span className={`text-xs ${config.text}`}>{label}</span>
      ) : (
        <span className={`text-xs ${config.text}`}>{config.defaultLabel}</span>
      )}
    </span>
  );
}
