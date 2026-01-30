"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Key } from "lucide-react";

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl = "/" }: LoginFormProps) {
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Format passcode with dashes as user types
  const formatPasscode = (value: string): string => {
    // Remove all non-alphanumeric characters and uppercase
    const clean = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    // Add dashes every 4 characters
    const parts = clean.match(/.{1,4}/g) || [];
    return parts.slice(0, 4).join("-");
  };

  const handlePasscodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPasscode(e.target.value);
    setPasscode(formatted);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Remove dashes for validation
    const cleanPasscode = passcode.replace(/-/g, "");
    if (cleanPasscode.length !== 16) {
      setError("Please enter a valid 16-character passcode");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid passcode");
        setIsLoading(false);
        return;
      }

      // Redirect on success
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Sign in with passcode
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Enter your access passcode to continue
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="passcode"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Passcode
        </label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            id="passcode"
            type="text"
            value={passcode}
            onChange={handlePasscodeChange}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            required
            disabled={isLoading}
            autoComplete="off"
            spellCheck={false}
            className="w-full pl-10 pr-4 py-3 text-center font-mono text-lg tracking-wider border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed uppercase"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading || passcode.replace(/-/g, "").length !== 16}
        className="w-full h-11"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
          Don&apos;t have a passcode?{" "}
          <span className="text-zinc-700 dark:text-zinc-300">
            Generate one via CLI:
          </span>
        </p>
        <code className="block mt-2 text-xs text-center font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 p-2 rounded">
          npm run passcode generate
        </code>
      </div>
    </form>
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
