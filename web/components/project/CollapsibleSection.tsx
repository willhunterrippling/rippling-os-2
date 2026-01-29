"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
  emptyMessage?: string;
  autoExpandThreshold?: number;
}

export function CollapsibleSection({
  title,
  description,
  icon,
  count,
  children,
  emptyMessage = "No items yet",
  autoExpandThreshold = 10,
}: CollapsibleSectionProps) {
  // Auto-expand if count is within threshold, collapse if over
  const [isOpen, setIsOpen] = useState(count > 0 && count <= autoExpandThreshold);

  const isEmpty = count === 0;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <button
        onClick={() => !isEmpty && setIsOpen(!isOpen)}
        className={cn(
          "w-full px-6 py-4 flex items-center justify-between text-left transition-colors",
          !isEmpty && "hover:bg-muted/50 cursor-pointer",
          isEmpty && "cursor-default"
        )}
        disabled={isEmpty}
      >
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">{icon}</div>
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {title}
              {count > 0 && (
                <span className="text-xs font-normal px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                  {count}
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {!isEmpty && (
          <svg
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </button>
      
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-6 pb-4 pt-0">
          {isEmpty ? (
            <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
          ) : (
            children
          )}
        </div>
      </div>
      
      {isEmpty && (
        <div className="px-6 pb-4 pt-0">
          <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
