"use client";

import { useState } from "react";
import { ChevronDown, Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserWithProjects {
  email: string;
  name: string | null;
  projectCount: number;
}

interface UserSwitcherProps {
  users: UserWithProjects[];
  currentUserEmail: string;
  selectedUserEmail: string | null;
  onSelectUser: (email: string | null) => void;
}

export function UserSwitcher({
  users,
  currentUserEmail,
  selectedUserEmail,
  onSelectUser,
}: UserSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedUser = selectedUserEmail
    ? users.find((u) => u.email === selectedUserEmail)
    : null;

  const displayName = selectedUser
    ? selectedUser.name || selectedUser.email.split("@")[0]
    : "All Users";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors text-sm"
      >
        <Users className="h-4 w-4 text-muted-foreground" />
        <span>{displayName}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg z-50">
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                View projects by
              </div>

              {/* All Users option */}
              <button
                onClick={() => {
                  onSelectUser(null);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-2 py-2 rounded-md text-sm transition-colors",
                  selectedUserEmail === null
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
              >
                <span>All Users</span>
                {selectedUserEmail === null && (
                  <Check className="h-4 w-4" />
                )}
              </button>

              <div className="my-1 border-t border-border" />

              {/* User list */}
              <div className="max-h-64 overflow-y-auto">
                {users.map((user) => {
                  const isCurrentUser = user.email === currentUserEmail;
                  const isSelected = user.email === selectedUserEmail;
                  const userName = user.name || user.email.split("@")[0];

                  return (
                    <button
                      key={user.email}
                      onClick={() => {
                        onSelectUser(user.email);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2 py-2 rounded-md text-sm transition-colors",
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span>{userName}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {user.projectCount} project
                          {user.projectCount !== 1 ? "s" : ""}
                        </span>
                        {isSelected && <Check className="h-4 w-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
