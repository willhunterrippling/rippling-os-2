"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface SidebarItem {
  name: string;
  title: string;
}

interface ProjectWithContents {
  slug: string;
  name: string;
  description?: string | null;
  owner?: string;
  dashboards: SidebarItem[];
  queries: SidebarItem[];
  reports: SidebarItem[];
}

interface SidebarProps {
  projects: ProjectWithContents[];
  currentUserEmail?: string | null;
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={cn(
        "w-3 h-3 transition-transform flex-shrink-0",
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

// Natural sort for SidebarItems by name (e.g., report_01 before report_17)
function naturalSort(a: SidebarItem, b: SidebarItem): number {
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
}

export function Sidebar({ projects, currentUserEmail }: SidebarProps) {
  const pathname = usePathname();
  
  // Track user-toggled state (manual overrides)
  const [userToggledProjects, setUserToggledProjects] = useState<Set<string>>(new Set());
  const [userToggledSections, setUserToggledSections] = useState<Set<string>>(new Set());

  // Extract current project/section from path
  const currentProject = useMemo(() => {
    const match = pathname.match(/^\/projects\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const currentSection = useMemo(() => {
    const match = pathname.match(/^\/projects\/([^/]+)\/(dashboards|reports)/);
    return match ? { project: match[1], section: match[2] } : null;
  }, [pathname]);

  // Compute auto-expanded projects (current project is auto-expanded)
  const autoExpandedProjects = useMemo(() => {
    const auto = new Set<string>();
    if (currentProject) {
      auto.add(currentProject);
    }
    return auto;
  }, [currentProject]);

  // Compute auto-expanded sections (current section + small sections)
  const autoExpandedSections = useMemo(() => {
    const auto = new Set<string>();
    
    // Auto-expand current section
    if (currentSection) {
      auto.add(`${currentSection.project}-${currentSection.section}`);
    }
    
    // Auto-expand small sections (≤10 items) for the current project
    if (currentProject) {
      const project = projects.find(p => p.slug === currentProject);
      if (project) {
        if (project.dashboards.length <= 10 && project.dashboards.length > 0) {
          auto.add(`${project.slug}-dashboards`);
        }
        if (project.reports.length <= 10 && project.reports.length > 0) {
          auto.add(`${project.slug}-reports`);
        }
      }
    }
    
    return auto;
  }, [currentProject, currentSection, projects]);

  // Effective expanded state: auto-expanded XOR user-toggled
  const isProjectExpanded = (slug: string) => {
    const autoExpanded = autoExpandedProjects.has(slug);
    const userToggled = userToggledProjects.has(slug);
    // If auto-expanded, user toggle collapses it; if not auto-expanded, user toggle expands it
    return autoExpanded ? !userToggled : userToggled;
  };

  const isSectionExpanded = (key: string) => {
    const autoExpanded = autoExpandedSections.has(key);
    const userToggled = userToggledSections.has(key);
    return autoExpanded ? !userToggled : userToggled;
  };

  const toggleProject = (slug: string) => {
    setUserToggledProjects((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const toggleSection = (key: string) => {
    setUserToggledSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-sidebar min-h-screen p-4 overflow-x-hidden">
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
                const isExpanded = isProjectExpanded(project.slug);
                const hasContents =
                  project.dashboards.length > 0 ||
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
                      <div className="ml-5 mt-1 space-y-0.5 overflow-hidden">
                        {project.dashboards.length > 0 && (
                          <div>
                            <button
                              onClick={() => toggleSection(`${project.slug}-dashboards`)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground font-medium hover:text-foreground w-full text-left"
                            >
                              <ChevronIcon expanded={isSectionExpanded(`${project.slug}-dashboards`)} />
                              <span>Dashboards</span>
                              <span className="text-[10px] opacity-60">({project.dashboards.length})</span>
                            </button>
                            {isSectionExpanded(`${project.slug}-dashboards`) && (
                              <ul className="space-y-0.5 ml-4">
                                {[...project.dashboards].sort(naturalSort).map((item) => (
                                  <li key={item.name} className="overflow-hidden">
                                    <Link
                                      href={`/projects/${project.slug}/dashboards/${item.name}`}
                                      className={cn(
                                        "block px-2 py-1 rounded-md text-xs transition-colors truncate",
                                        pathname ===
                                          `/projects/${project.slug}/dashboards/${item.name}`
                                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                                      )}
                                      title={item.title}
                                    >
                                      {item.title}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        {project.reports.length > 0 && (
                          <div>
                            <button
                              onClick={() => toggleSection(`${project.slug}-reports`)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground font-medium hover:text-foreground w-full text-left"
                            >
                              <ChevronIcon expanded={isSectionExpanded(`${project.slug}-reports`)} />
                              <span>Reports</span>
                              <span className="text-[10px] opacity-60">({project.reports.length})</span>
                            </button>
                            {isSectionExpanded(`${project.slug}-reports`) && (
                              <ul className="space-y-0.5 ml-4">
                                {[...project.reports].sort(naturalSort).map((item) => (
                                  <li key={item.name} className="overflow-hidden">
                                    <Link
                                      href={`/projects/${project.slug}/reports/${item.name}`}
                                      className={cn(
                                        "block px-2 py-1 rounded-md text-xs transition-colors truncate",
                                        pathname ===
                                          `/projects/${project.slug}/reports/${item.name}`
                                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                                      )}
                                      title={item.title}
                                    >
                                      {item.title}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
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
