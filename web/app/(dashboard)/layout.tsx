import { DashboardShell } from "@/components/layout/DashboardShell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  const formattedProjects = projects.map((project) => ({
    slug: project.slug,
    name: project.name,
    description: project.description,
    owner: project.owner.email,
    dashboards: project.dashboards.map((d) => d.name),
    queries: project.queries.map((q) => q.name),
    reports: project.reports.map((r) => r.name),
  }));

  return { projects: formattedProjects, users };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
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
