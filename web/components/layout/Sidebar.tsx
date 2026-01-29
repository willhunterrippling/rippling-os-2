"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProjectWithContents {
  slug: string;
  name: string;
  description?: string | null;
  owner?: string;
  dashboards: string[];
  queries: string[];
  reports: string[];
}

interface SidebarProps {
  projects: ProjectWithContents[];
  currentUserEmail?: string | null;
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={cn(
        "w-4 h-4 transition-transform",
        expanded ? "rotate-90" : ""
      )}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

export function Sidebar({ projects, currentUserEmail }: SidebarProps) {
  const pathname = usePathname();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set()
  );

  const toggleProject = (slug: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  // Auto-expand project if we're on one of its pages
  const getProjectFromPath = () => {
    const match = pathname.match(/^\/projects\/([^/]+)/);
    return match ? match[1] : null;
  };

  const currentProject = getProjectFromPath();

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
              projects.map((project) => {
                const isExpanded =
                  expandedProjects.has(project.slug) ||
                  currentProject === project.slug;
                const hasContents =
                  project.dashboards.length > 0 ||
                  project.queries.length > 0 ||
                  project.reports.length > 0;

                return (
                  <li key={project.slug}>
                    <div className="flex items-center">
                      {hasContents && (
                        <button
                          onClick={() => toggleProject(project.slug)}
                          className="p-1 hover:bg-sidebar-accent/50 rounded"
                        >
                          <ChevronIcon expanded={isExpanded} />
                        </button>
                      )}
                      <Link
                        href={`/projects/${project.slug}`}
                        className={cn(
                          "flex-1 px-2 py-2 rounded-md text-sm transition-colors",
                          pathname === `/projects/${project.slug}`
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                          !hasContents && "ml-5"
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          {project.name}
                          {project.owner && project.owner === currentUserEmail && (
                            <span className="text-[10px] text-muted-foreground">(you)</span>
                          )}
                        </span>
                      </Link>
                    </div>

                    {isExpanded && hasContents && (
                      <div className="ml-5 mt-1 space-y-1">
                        {project.dashboards.length > 0 && (
                          <div>
                            <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                              Dashboards
                            </div>
                            <ul className="space-y-0.5">
                              {project.dashboards.map((name) => (
                                <li key={name}>
                                  <Link
                                    href={`/projects/${project.slug}/dashboards/${name}`}
                                    className={cn(
                                      "block px-3 py-1.5 rounded-md text-xs transition-colors",
                                      pathname ===
                                        `/projects/${project.slug}/dashboards/${name}`
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                                    )}
                                  >
                                    {name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {project.reports.length > 0 && (
                          <div>
                            <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                              Reports
                            </div>
                            <ul className="space-y-0.5">
                              {project.reports.map((name) => (
                                <li key={name}>
                                  <Link
                                    href={`/projects/${project.slug}/reports/${name}`}
                                    className={cn(
                                      "block px-3 py-1.5 rounded-md text-xs transition-colors",
                                      pathname ===
                                        `/projects/${project.slug}/reports/${name}`
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                                    )}
                                  >
                                    {name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {project.queries.length > 0 && (
                          <div>
                            <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                              Queries
                            </div>
                            <ul className="space-y-0.5">
                              {project.queries.map((name) => (
                                <li key={name}>
                                  <Link
                                    href={`/projects/${project.slug}/queries/${name}`}
                                    className={cn(
                                      "block px-3 py-1.5 rounded-md text-xs transition-colors",
                                      pathname ===
                                        `/projects/${project.slug}/queries/${name}`
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                                    )}
                                  >
                                    {name}.sql
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
