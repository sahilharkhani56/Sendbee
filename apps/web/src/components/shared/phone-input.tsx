"use client";

import { useState, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, error, disabled }, ref) => {
    const [focused, setFocused] = useState(false);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
      onChange(raw);
    }

    // Format display: "98765 43210"
    function formatDisplay(digits: string): string {
      if (digits.length <= 5) return digits;
      return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    }

    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Phone number
        </label>
        <div
          className={cn(
            "flex items-center rounded-md border bg-background transition-colors",
            focused && !error && "ring-2 ring-teal-700/20 border-teal-700",
            error && "border-red-500 ring-2 ring-red-500/20",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className="flex items-center pl-3 pr-2 text-sm font-medium text-muted-foreground select-none border-r mr-2 h-10 leading-10">
            +91
          </span>
          <input
            ref={ref}
            type="tel"
            inputMode="numeric"
            placeholder="98765 43210"
            value={formatDisplay(value)}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            className="flex-1 h-10 bg-transparent text-sm outline-none placeholder:text-muted-foreground pr-3 font-mono"
            autoComplete="tel"
          />
        </div>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

/** Normalize 10-digit Indian phone to E.164 format */
export function normalizePhone(digits: string): string | null {
  const clean = digits.replace(/\D/g, "");
  if (clean.length === 10 && /^[6-9]/.test(clean)) {
    return `+91${clean}`;
  }
  return null;
}
