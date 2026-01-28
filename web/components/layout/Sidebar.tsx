"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Project {
  slug: string;
  name: string;
  description?: string;
}

interface SidebarProps {
  projects: Project[];
}

export function Sidebar({ projects }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-sidebar min-h-screen p-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">R</span>
          </div>
          <span className="font-semibold text-lg">Rippling OS</span>
        </Link>
      </div>

      <nav className="space-y-6">
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Navigation
          </h3>
          <ul className="space-y-1">
            <li>
              <Link
                href="/"
                className={cn(
                  "block px-3 py-2 rounded-md text-sm transition-colors",
                  pathname === "/"
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                Home
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Projects
          </h3>
          <ul className="space-y-1">
            {projects.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground italic">
                No projects yet
              </li>
            ) : (
              projects.map((project) => (
                <li key={project.slug}>
                  <Link
                    href={`/projects/${project.slug}`}
                    className={cn(
                      "block px-3 py-2 rounded-md text-sm transition-colors",
                      pathname === `/projects/${project.slug}`
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    {project.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
