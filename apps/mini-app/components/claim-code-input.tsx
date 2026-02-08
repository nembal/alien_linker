"use client";

import { useState, useRef, useCallback, type KeyboardEvent, type ClipboardEvent } from "react";

interface ClaimCodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
}

export function ClaimCodeInput({
  length = 6,
  onComplete,
  disabled = false,
}: ClaimCodeInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focusIndex = useCallback(
    (i: number) => {
      if (i >= 0 && i < length) refs.current[i]?.focus();
    },
    [length]
  );

  const updateDigit = useCallback(
    (index: number, value: string) => {
      const next = [...digits];
      next[index] = value;
      setDigits(next);

      if (value && index < length - 1) {
        focusIndex(index + 1);
      }

      if (next.every((d) => d !== "")) {
        onComplete(next.join(""));
      }
    },
    [digits, length, focusIndex, onComplete]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (digits[index]) {
          updateDigit(index, "");
        } else if (index > 0) {
          focusIndex(index - 1);
          updateDigit(index - 1, "");
        }
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        focusIndex(index - 1);
      } else if (e.key === "ArrowRight") {
        focusIndex(index + 1);
      }
    },
    [digits, focusIndex, updateDigit]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, length);
      if (pasted.length === 0) return;

      const next = [...digits];
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i];
      }
      setDigits(next);

      if (pasted.length === length) {
        onComplete(next.join(""));
      } else {
        focusIndex(pasted.length);
      }
    },
    [digits, length, focusIndex, onComplete]
  );

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            if (val) updateDigit(i, val);
          }}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="h-14 w-11 rounded-lg border border-terminal-green/30 bg-terminal-bg text-center font-mono text-2xl font-bold text-terminal-green caret-transparent outline-none transition-all focus:border-terminal-green focus:shadow-[0_0_12px_rgba(0,255,65,0.3)] disabled:opacity-50 sm:h-16 sm:w-13"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
