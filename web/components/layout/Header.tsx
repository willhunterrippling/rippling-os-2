"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

interface HeaderProps {
  user?: {
    email?: string | null;
    name?: string | null;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const displayName = user?.name || user?.email?.split("@")[0] || "User";

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <User className="h-4 w-4" />
        <span>{displayName}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-4 w-4 mr-1" />
        Sign out
      </Button>
    </div>
  );
}
