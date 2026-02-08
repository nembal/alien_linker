"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TerminalButton } from "@/components/ui/terminal-button";
import { GlowText } from "@/components/ui/glow-text";
import { PageTransition } from "@/components/layout/page-transition";

export default function ClaimSuccessPage() {
  return (
    <PageTransition className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 text-center">
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-terminal-green/40 bg-terminal-green/10"
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-terminal-green glow-green text-4xl"
        >
          ✓
        </motion.span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <GlowText as="h1" color="green" className="text-xl font-bold">
          Agent Linked!
        </GlowText>
        <p className="text-sm text-terminal-text">
          Ownership attestation has been sent to your agent.
        </p>
        <p className="text-xs text-terminal-dim">
          It can now cryptographically prove it belongs to you.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full space-y-3"
      >
        <Link href="/" className="block">
          <TerminalButton variant="primary" className="w-full">
            View Dashboard
          </TerminalButton>
        </Link>
        <Link href="" className="block">
          <TerminalButton variant="ghost" className="w-full" disabled>
            Register On-Chain (coming soon)
          </TerminalButton>
        </Link>
      </motion.div>
    </PageTransition>
  );
}
