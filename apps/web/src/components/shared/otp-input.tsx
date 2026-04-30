"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export function OtpInput({ length = 6, onComplete, error, disabled }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (error) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(timer);
    }
  }, [error]);

  function handleChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;

    const digit = val.slice(-1);
    const newValues = [...values];
    newValues[index] = digit;
    setValues(newValues);

    // Move to next
    if (index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    // Check complete
    const otp = newValues.join("");
    if (otp.length === length) {
      onComplete(otp);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newValues = [...values];
      if (values[index]) {
        newValues[index] = "";
        setValues(newValues);
      } else if (index > 0) {
        newValues[index - 1] = "";
        setValues(newValues);
        inputs.current[index - 1]?.focus();
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;

    const newValues = [...values];
    for (let i = 0; i < pasted.length; i++) {
      newValues[i] = pasted[i];
    }
    setValues(newValues);

    // Focus the next empty or last
    const nextEmpty = newValues.findIndex((v) => !v);
    const focusIdx = nextEmpty === -1 ? length - 1 : nextEmpty;
    inputs.current[focusIdx]?.focus();

    if (pasted.length === length) {
      onComplete(pasted);
    }
  }

  function reset() {
    setValues(Array(length).fill(""));
    inputs.current[0]?.focus();
  }

  // Expose reset
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__otpReset = reset;
    return () => { delete (window as unknown as Record<string, unknown>).__otpReset; };
  });

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2",
        shake && "animate-shake"
      )}
      onPaste={handlePaste}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={values[i]}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          autoFocus={i === 0}
          className={cn(
            "h-12 w-12 rounded-lg border-2 bg-background text-center text-lg font-semibold outline-none transition-all",
            "focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            !error && !values[i] && "border-border",
            !error && values[i] && "border-teal-700/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      ))}
    </div>
  );
}
