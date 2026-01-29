"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AutoRefreshProps {
  /** Refresh interval in milliseconds (default: 5000ms = 5 seconds) */
  interval?: number;
  /** Only refresh when the tab is visible (default: true) */
  onlyWhenVisible?: boolean;
}

/**
 * Client component that automatically refreshes server data at a set interval.
 * Uses Next.js router.refresh() to re-fetch server components without a full page reload.
 */
export function AutoRefresh({ 
  interval = 5000, 
  onlyWhenVisible = true 
}: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (onlyWhenVisible && document.hidden) {
        return; // Skip refresh if tab is not visible
      }
      router.refresh();
    };

    const intervalId = setInterval(refresh, interval);

    return () => clearInterval(intervalId);
  }, [router, interval, onlyWhenVisible]);

  return null; // This component doesn't render anything
}
