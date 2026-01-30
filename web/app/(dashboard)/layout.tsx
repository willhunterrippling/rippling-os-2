import { DashboardShell } from "@/components/layout/DashboardShell";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Extract H1 title from markdown content, or format the slug as fallback
function extractTitleFromMarkdown(content: string, fallbackName: string): string {
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }
  return formatSlugAsTitle(fallbackName);
}

// Format a slug into a readable title
function formatSlugAsTitle(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Extract title from dashboard config
function extractDashboardTitle(config: unknown, fallbackName: string): string {
  if (config && typeof config === 'object' && 'title' in config && typeof (config as { title?: string }).title === 'string') {
    return (config as { title: string }).title;
  }
  return formatSlugAsTitle(fallbackName);
}

async function getProjectsAndUsers() {
  // Get all projects with their contents
  const projects = await prisma.project.findMany({
    include: {
      owner: {
        select: {
          email: true,
          name: true,
        },
      },
      dashboards: {
        select: {
          name: true,
          config: true,
        },
      },
      queries: {
        select: {
          name: true,
        },
      },
      reports: {
        select: {
          name: true,
          content: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get unique users who have projects
  const userProjectCounts = new Map<string, { name: string | null; count: number }>();
  for (const project of projects) {
    const existing = userProjectCounts.get(project.owner.email);
    if (existing) {
      existing.count++;
    } else {
      userProjectCounts.set(project.owner.email, {
        name: project.owner.name,
        count: 1,
      });
    }
  }

  const users = Array.from(userProjectCounts.entries()).map(([email, data]) => ({
    email,
    name: data.name,
    projectCount: data.count,
  }));

  const formattedProjects = projects.map((project: typeof projects[number]) => ({
    slug: project.slug,
    name: project.name,
    description: project.description,
    owner: project.owner.email,
    dashboards: project.dashboards.map((d: { name: string; config: unknown }) => ({
      name: d.name,
      title: extractDashboardTitle(d.config, d.name),
    })),
    queries: project.queries.map((q: { name: string }) => ({
      name: q.name,
      title: formatSlugAsTitle(q.name),
    })),
    reports: project.reports.map((r: { name: string; content: string }) => ({
      name: r.name,
      title: extractTitleFromMarkdown(r.content, r.name),
    })),
  }));

  return { projects: formattedProjects, users };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const { projects, users } = await getProjectsAndUsers();

  // When BYPASS_AUTH is enabled in dev, create a mock user
  const bypassAuth =
    process.env.NODE_ENV === "development" &&
    process.env.BYPASS_AUTH === "true";

  const currentUser = session?.user || (bypassAuth
    ? {
        email: process.env.RIPPLING_ACCOUNT_EMAIL || "dev@rippling.com",
        name: "Dev User",
      }
    : null);

  return (
    <DashboardShell
      projects={projects}
      users={users}
      currentUser={currentUser}
    >
      {children}
    </DashboardShell>
  );
}
