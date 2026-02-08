import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlienClaw Linker",
  description: "Pair your clawbots to your Alien identity",
  openGraph: {
    title: "AlienClaw Linker",
    description: "Pair your clawbots to your Alien identity with cryptographic proof",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body className="min-h-screen bg-terminal-bg font-mono antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
