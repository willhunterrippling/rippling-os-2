import { Suspense } from "react";
import { LoginForm, VerifyEmailMessage, ErrorMessage } from "@/components/auth/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{
    verify?: string;
    error?: string;
    callbackUrl?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const showVerify = params.verify === "1";
  const showError = params.error === "1";
  const callbackUrl = params.callbackUrl || "/";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Rippling OS
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Pipeline analytics dashboard
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-8">
          <div className="flex flex-col items-center">
            {showError ? (
              <ErrorMessage />
            ) : showVerify ? (
              <VerifyEmailMessage />
            ) : (
              <Suspense fallback={<div>Loading...</div>}>
                <div className="space-y-6 w-full">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      Sign in
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      Enter your Rippling email to receive a magic link
                    </p>
                  </div>
                  <LoginForm callbackUrl={callbackUrl} />
                </div>
              </Suspense>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-500">
          Access restricted to Rippling employees
        </p>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Sign In - Rippling OS",
  description: "Sign in to Rippling OS",
};
