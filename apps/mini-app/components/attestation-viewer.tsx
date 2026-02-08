"use client";

import { useState } from "react";
import { TerminalCard } from "@/components/ui/terminal-card";
import type { OwnershipAttestation } from "@/lib/types";

interface AttestationViewerProps {
  attestation: OwnershipAttestation;
}

export function AttestationViewer({ attestation }: AttestationViewerProps) {
  const [expanded, setExpanded] = useState(false);

  const truncatedSig = attestation.signature.slice(0, 24) + "...";

  return (
    <TerminalCard title="attestation.json" glow="cyan">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <pre className="overflow-x-auto text-xs leading-relaxed">
          <span className="text-terminal-dim">{"{"}</span>
          {"\n"}
          <span className="text-terminal-cyan">{`  "type"`}</span>
          <span className="text-terminal-dim">: </span>
          <span className="text-terminal-amber">
            {`"${attestation.type}"`}
          </span>
          {"\n"}
          <span className="text-terminal-cyan">{`  "alienId"`}</span>
          <span className="text-terminal-dim">: </span>
          <span className="text-terminal-green">
            {`"${attestation.alienId}"`}
          </span>
          {"\n"}
          <span className="text-terminal-cyan">{`  "clawbotId"`}</span>
          <span className="text-terminal-dim">: </span>
          <span className="text-terminal-green">
            {`"${attestation.clawbotId}"`}
          </span>
          {"\n"}
          {expanded && (
            <>
              <span className="text-terminal-cyan">{`  "publicKey"`}</span>
              <span className="text-terminal-dim">: </span>
              <span className="text-terminal-text">
                {`"${attestation.publicKey}"`}
              </span>
              {"\n"}
              <span className="text-terminal-cyan">{`  "issuedBy"`}</span>
              <span className="text-terminal-dim">: </span>
              <span className="text-terminal-text">
                {`"${attestation.issuedBy}"`}
              </span>
              {"\n"}
              <span className="text-terminal-cyan">{`  "issuedAt"`}</span>
              <span className="text-terminal-dim">: </span>
              <span className="text-terminal-text">
                {`"${attestation.issuedAt}"`}
              </span>
              {"\n"}
              <span className="text-terminal-cyan">{`  "expiresAt"`}</span>
              <span className="text-terminal-dim">: </span>
              <span className="text-terminal-text">
                {`"${attestation.expiresAt}"`}
              </span>
              {"\n"}
            </>
          )}
          <span className="text-terminal-cyan">{`  "signature"`}</span>
          <span className="text-terminal-dim">: </span>
          <span className="text-terminal-dim/70">
            {`"${expanded ? attestation.signature : truncatedSig}"`}
          </span>
          {"\n"}
          <span className="text-terminal-dim">{"}"}</span>
        </pre>
      </button>
      <p className="mt-2 text-right text-xs text-terminal-dim">
        {expanded ? "click to collapse" : "click to expand"}
      </p>
    </TerminalCard>
  );
}
