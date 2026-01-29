"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl = "/" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email domain
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
        setError("Failed to send magic link. Please try again.");
        setIsLoading(false);
      }
      // If successful, the page will show the "check your email" state via URL params
      // NextAuth redirects to /login?verify=1
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
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
            Sending magic link...
          </>
        ) : (
          "Send magic link"
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
      <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Check your email
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          We sent a magic link to your email address. Click the link to sign in.
        </p>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Didn&apos;t receive an email? Check your spam folder or try again.
      </p>
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
