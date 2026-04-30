"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneInput, normalizePhone } from "@/components/shared/phone-input";
import { OtpInput } from "@/components/shared/otp-input";
import { useAuthStore } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

type Phase = "phone" | "otp";

interface OtpSendResponse {
  message: string;
  expiresIn: number;
}

interface OtpVerifyResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; phone: string; role: string };
  tenant: { id: string; name: string; vertical: string; verticalConfig: unknown; plan: string; onboarded: boolean };
}

export default function LoginPage() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();

  const [phase, setPhase] = useState<Phase>("phone");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpErrorShake, setOtpErrorShake] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const maskedPhone = phone
    ? `+91 ${phone.slice(0, 5)} ${"•".repeat(Math.max(0, phone.length - 5))}`
    : "";

  async function handleSendOtp() {
    setPhoneError("");

    // Validate
    if (phone.length !== 10) {
      setPhoneError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    if (!/^[6-9]/.test(phone)) {
      setPhoneError("Number must start with 6, 7, 8, or 9");
      return;
    }

    const e164 = normalizePhone(phone);
    if (!e164) {
      setPhoneError("Invalid phone number");
      return;
    }

    setLoading(true);
    try {
      await apiFetch<OtpSendResponse>("/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ phone: e164 }),
      });
      setPhase("otp");
      setCountdown(30);
      toast.success("OTP sent to your WhatsApp");
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === "AUTH_OTP_MAX_ATTEMPTS") {
        setPhoneError("Too many attempts. Try again in 1 hour.");
      } else {
        setPhoneError(error.message || "Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleVerifyOtp = useCallback(async (otp: string) => {
    setOtpError("");
    setOtpErrorShake(false);

    const e164 = normalizePhone(phone);
    if (!e164) return;

    setLoading(true);
    try {
      const data = await apiFetch<OtpVerifyResponse>("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone: e164, otp }),
      });

      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user as never, data.tenant as never);

      toast.success("Welcome back!");

      if (!data.tenant.onboarded) {
        router.push("/setup");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === "AUTH_OTP_EXPIRED") {
        setOtpError("OTP expired. Please resend.");
      } else {
        setOtpError("Incorrect OTP. Try again.");
        setOtpErrorShake(true);
        setTimeout(() => setOtpErrorShake(false), 600);
      }
    } finally {
      setLoading(false);
    }
  }, [phone, setTokens, setUser, router]);

  async function handleResend() {
    if (countdown > 0) return;
    const e164 = normalizePhone(phone);
    if (!e164) return;

    try {
      await apiFetch<OtpSendResponse>("/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ phone: e164 }),
      });
      setCountdown(30);
      setOtpError("");
      toast.success("OTP resent");
    } catch {
      toast.error("Failed to resend OTP");
    }
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Logo */}
      <div className="flex flex-col items-center space-y-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-700">
          <MessageSquare className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {phase === "phone" ? "Welcome back" : "Verify OTP"}
        </h1>
        <p className="text-sm text-muted-foreground text-center">
          {phase === "phone"
            ? "Enter your WhatsApp number to sign in"
            : `OTP sent to ${maskedPhone}`}
        </p>
      </div>

      {/* Phase 1: Phone */}
      {phase === "phone" && (
        <div className="space-y-4">
          <PhoneInput
            value={phone}
            onChange={(v) => { setPhone(v); setPhoneError(""); }}
            error={phoneError}
            disabled={loading}
          />
          <Button
            onClick={handleSendOtp}
            disabled={loading || phone.length < 10}
            className="w-full h-11"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              "Send OTP"
            )}
          </Button>
        </div>
      )}

      {/* Phase 2: OTP */}
      {phase === "otp" && (
        <div className="space-y-6">
          <OtpInput
            onComplete={handleVerifyOtp}
            error={otpErrorShake}
            disabled={loading}
          />

          {otpError && (
            <p className="text-center text-sm text-red-500">{otpError}</p>
          )}

          <Button
            onClick={() => handleVerifyOtp("")}
            disabled={loading}
            className="w-full h-11"
            style={{ display: "none" }}
          >
            Verify
          </Button>

          {/* Resend section */}
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend in <span className="font-mono font-medium text-foreground">0:{countdown.toString().padStart(2, "0")}</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-sm font-medium text-teal-700 hover:text-teal-600 hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>

          {/* Back to phone */}
          <button
            onClick={() => { setPhase("phone"); setOtpError(""); }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mx-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Change number
          </button>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground">
        By continuing, you agree to our{" "}
        <span className="underline cursor-pointer">Terms of Service</span>
      </p>
    </div>
  );
}
