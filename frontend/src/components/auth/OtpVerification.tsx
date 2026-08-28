/** Email OTP verification card shared by register and login flows. */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface OtpVerificationProps {
  email: string;
  verifying: boolean;
  error?: string | null;
  /** Shown only when the backend runs in DEBUG mode (console-OTP demo flow). */
  devCode?: string | null;
  onVerify: (code: string) => void;
  onResend: () => void;
  resendMessage?: string | null;
}

const RESEND_COOLDOWN = 60;

export function OtpVerification({
  email,
  verifying,
  error,
  devCode,
  onVerify,
  onResend,
  resendMessage,
}: OtpVerificationProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const code = digits.join("");
  const ready = code.length === 6;

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 5) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array(6).fill("");
    text.split("").forEach((d, i) => (next[i] = d));
    setDigits(next);
    inputsRef.current[Math.min(text.length, 5)]?.focus();
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
          <span className="text-xl">✉️</span>
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900">Verify your email</h2>
        <p className="mt-1.5 text-sm text-slate-600">
          We sent a 6-digit verification code to{" "}
          <span className="font-semibold text-slate-800">{email}</span>
        </p>
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          {error}
        </div>
      )}
      {resendMessage && (
        <div role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
          {resendMessage}
        </div>
      )}
      {devCode && (
        <div role="note" className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs font-medium text-blue-800">
          Demo mode — your verification code is{" "}
          <button
            type="button"
            onClick={() => {
              const next = [...digits];
              devCode.split("").slice(0, 6).forEach((d, i) => (next[i] = d));
              setDigits(next);
            }}
            className="font-extrabold tracking-widest underline decoration-dotted underline-offset-2"
          >
            {devCode}
          </button>{" "}
          (tap to fill)
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ready && !verifying) onVerify(code);
        }}
        className="mt-6"
      >
        <div
          className="flex justify-between gap-2"
          onPaste={handlePaste}
          role="group"
          aria-label="Verification code"
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label={`Digit ${index + 1}`}
              className={cn(
                "h-14 w-full rounded-lg border border-slate-300 bg-white text-center text-xl font-bold text-slate-900",
                "focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20",
              )}
            />
          ))}
        </div>

        <Button type="submit" disabled={!ready} loading={verifying} className="mt-6 w-full">
          Verify Email
        </Button>
      </form>

      <div className="mt-5 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (cooldown > 0 || verifying) return;
            setCooldown(RESEND_COOLDOWN);
            onResend();
          }}
          disabled={cooldown > 0 || verifying}
          className="text-xs font-medium text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {cooldown > 0 ? `Resend code in 00:${String(cooldown).padStart(2, "0")}` : "Resend code"}
        </button>
        <Link to="/login" className="text-xs text-slate-500 hover:text-slate-700">
          Use a different account
        </Link>
      </div>
    </div>
  );
}