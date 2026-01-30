"use client";

import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // No session provider needed - we use server-side session management
  return <>{children}</>;
}
