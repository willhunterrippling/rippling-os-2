"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

interface LoginFormProps {
  callbackUrl?: string;
}

type Step = "email" | "otp";

export function LoginForm({ callbackUrl = "/" }: LoginFormProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first OTP input when switching to OTP step
  useEffect(() => {
    if (step === "otp" && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.endsWith("@rippling.com")) {
      setError("Please use your @rippling.com email address");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("resend", {
        email,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Failed to send code. Please try again.");
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setStep("otp");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      setOtp(pastedData.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setIsLoading(true);

    try {
      // Construct the callback URL that NextAuth expects
      const params = new URLSearchParams({
        callbackUrl,
        token: code,
        email,
      });
      
      // Use the NextAuth callback endpoint directly
      const response = await fetch(`/api/auth/callback/resend?${params.toString()}`);
      
      if (response.ok && response.redirected) {
        // Success - redirect to the final destination
        window.location.href = response.url;
      } else if (response.url.includes("error")) {
        setError("Invalid or expired code. Please try again.");
        setIsLoading(false);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        // Fallback redirect
        window.location.href = callbackUrl;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep("email");
    setOtp(["", "", "", "", "", ""]);
    setError(null);
  };

  if (step === "otp") {
    return (
      <div className="space-y-6 w-full max-w-sm">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Check your email
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            We sent a code to <span className="font-medium text-zinc-900 dark:text-zinc-100">{email}</span>
          </p>
        </div>

        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={handleOtpPaste}
                disabled={isLoading}
                className="w-11 h-14 text-center text-xl font-semibold border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || otp.join("").length !== 6}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify code"
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
          Didn&apos;t receive a code?{" "}
          <button
            onClick={handleBack}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleEmailSubmit} className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@rippling.com"
            required
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading || !email}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending code...
          </>
        ) : (
          "Continue"
        )}
      </Button>

      <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
        Only @rippling.com email addresses are allowed
      </p>
    </form>
  );
}

export function VerifyEmailMessage() {
  return (
    <div className="text-center space-y-4 max-w-sm">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Check your email
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          We sent a verification code to your email address.
        </p>
      </div>
    </div>
  );
}

export function ErrorMessage({ message }: { message?: string }) {
  return (
    <div className="text-center space-y-4 max-w-sm">
      <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Something went wrong
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {message || "Unable to sign in. Please try again."}
        </p>
      </div>
    </div>
  );
}
