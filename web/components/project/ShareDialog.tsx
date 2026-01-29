"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, Share2, Copy, Check, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Permission = "VIEW" | "EDIT" | "ADMIN";

interface ShareUser {
  email: string;
  name: string | null;
}

interface Share {
  id: string;
  user: ShareUser;
  permission: Permission;
}

interface ShareDialogProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  canManageShares: boolean;
}

export function ShareDialog({
  projectId,
  projectName,
  isOpen,
  onClose,
  canManageShares,
}: ShareDialogProps) {
  const [owner, setOwner] = useState<ShareUser | null>(null);
  const [shares, setShares] = useState<Share[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  // New share form
  const [newEmail, setNewEmail] = useState("");
  const [newPermission, setNewPermission] = useState<Permission>("VIEW");
  const [isAdding, setIsAdding] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy link");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchShares();
      setShareUrl(window.location.href);
    }
  }, [isOpen, projectId]);

  const fetchShares = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/share`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch shares");
      const data = await res.json();
      setOwner(data.owner);
      setShares(data.shares);
    } catch {
      setError("Failed to load sharing settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setIsAdding(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim(), permission: newPermission }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add share");
      }

      const newShare = await res.json();
      setShares((prev) => [...prev, newShare]);
      setNewEmail("");
      setNewPermission("VIEW");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add share");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/share?shareId=${shareId}`,
        { method: "DELETE", credentials: "include" }
      );

      if (!res.ok) throw new Error("Failed to remove share");

      setShares((prev) => prev.filter((s) => s.id !== shareId));
    } catch {
      setError("Failed to remove share");
    }
  };

  const handleUpdatePermission = async (
    shareId: string,
    email: string,
    permission: Permission
  ) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, permission }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update permission");

      setShares((prev) =>
        prev.map((s) => (s.id === shareId ? { ...s, permission } : s))
      );
    } catch {
      setError("Failed to update permission");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-background rounded-lg shadow-xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Share &quot;{projectName}&quot;</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Copy Link - always shown */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Share link
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 py-2 px-3 bg-muted/50 rounded-md overflow-hidden">
                  <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate text-muted-foreground">
                    {shareUrl}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="flex-shrink-0 gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Owner */}
                {owner && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Owner
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md">
                      <span className="text-sm">
                        {owner.name || owner.email.split("@")[0]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {owner.email}
                      </span>
                    </div>
                  </div>
                )}

                {/* Current shares */}
                {shares.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Shared with
                    </div>
                    <div className="space-y-2">
                      {shares.map((share) => (
                        <div
                          key={share.id}
                          className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md"
                        >
                          <div>
                            <div className="text-sm">
                              {share.user.name ||
                                share.user.email.split("@")[0]}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {share.user.email}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {canManageShares ? (
                              <>
                                <select
                                  value={share.permission}
                                  onChange={(e) =>
                                    handleUpdatePermission(
                                      share.id,
                                      share.user.email,
                                      e.target.value as Permission
                                    )
                                  }
                                  className="text-xs px-2 py-1 border rounded bg-background"
                                >
                                  <option value="VIEW">View</option>
                                  <option value="EDIT">Edit</option>
                                  <option value="ADMIN">Admin</option>
                                </select>
                                <button
                                  onClick={() => handleRemoveShare(share.id)}
                                  className="p-1 text-muted-foreground hover:text-destructive rounded"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground capitalize">
                                {share.permission.toLowerCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add new share */}
                {canManageShares && (
                  <form onSubmit={handleAddShare} className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      Add person
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="email@rippling.com"
                        className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                        disabled={isAdding}
                      />
                      <select
                        value={newPermission}
                        onChange={(e) =>
                          setNewPermission(e.target.value as Permission)
                        }
                        className="px-3 py-2 text-sm border rounded-md bg-background"
                        disabled={isAdding}
                      >
                        <option value="VIEW">View</option>
                        <option value="EDIT">Edit</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isAdding || !newEmail.trim()}
                      >
                        {isAdding ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Error message */}
                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// Button to open the share dialog
export function ShareButton({
  projectId,
  projectName,
  canManageShares,
}: {
  projectId: string;
  projectName: string;
  canManageShares: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
      <ShareDialog
        projectId={projectId}
        projectName={projectName}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        canManageShares={canManageShares}
      />
    </>
  );
}
