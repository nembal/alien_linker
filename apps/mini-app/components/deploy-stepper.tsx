"use client";

import { motion } from "framer-motion";

interface DeployStepperProps {
  currentStep: number;
}

const STEPS = [
  "Provisioning infrastructure",
  "Starting agent",
  "Registering identity",
  "Issuing attestation",
];

export function DeployStepper({ currentStep }: DeployStepperProps) {
  return (
    <div className="space-y-4">
      {STEPS.map((label, i) => {
        const isActive = i === currentStep;
        const isDone = i < currentStep;
        const isPending = i > currentStep;

        return (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-6 w-6 items-center justify-center">
              {isDone ? (
                <span className="text-terminal-green glow-green text-sm">
                  ✓
                </span>
              ) : isActive ? (
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-terminal-cyan border-t-transparent" />
              ) : (
                <span className="inline-block h-2 w-2 rounded-full bg-terminal-dim" />
              )}
            </div>
            <span
              className={`text-sm ${
                isDone
                  ? "text-terminal-green"
                  : isActive
                    ? "text-terminal-cyan glow-cyan"
                    : isPending
                      ? "text-terminal-dim"
                      : ""
              }`}
            >
              {label}
              {isActive && "..."}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
