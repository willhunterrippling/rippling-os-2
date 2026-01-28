import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title?: string;
  branch?: string;
}

export function Header({ title = "Rippling OS", branch }: HeaderProps) {
  // Get branch from environment variable if not provided
  const currentBranch = branch || process.env.VERCEL_GIT_COMMIT_REF || "local";

  return (
    <header className="h-14 border-b border-border bg-background px-6 flex items-center justify-between">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="text-xs">
          {currentBranch}
        </Badge>
      </div>
    </header>
  );
}
