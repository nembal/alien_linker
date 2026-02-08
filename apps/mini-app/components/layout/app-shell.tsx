"use client";

import { type ReactNode } from "react";
import { AlienProvider } from "@alien_org/react";
import { AuthProvider } from "@/hooks/use-auth";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <AlienProvider>
      <AuthProvider>
        <div className="scanlines relative min-h-screen bg-terminal-bg">
          <div className="mx-auto max-w-lg px-4 pb-8 pt-4">{children}</div>
        </div>
      </AuthProvider>
    </AlienProvider>
  );
}
