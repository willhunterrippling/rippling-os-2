import { prisma } from "./db";

// ==================== TYPES ====================

export interface Project {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWithOwner extends Project {
  owner: {
    email: string;
    name: string | null;
  };
}

export interface DashboardWidget {
  type: "metric" | "chart" | "table";
  title?: string;
  queryName: string; // References a query by name
  valueKey?: string;
  chartType?: "line" | "bar" | "area" | "pie";
  xKey?: string;
  yKey?: string;
  columns?: string[];
  hidden?: boolean;
}

export interface DashboardConfig {
  title?: string;
  description?: string;
  layout?: "grid" | "stack";
  widgets: DashboardWidget[];
}

export interface ProjectItem {
  id: string;
  name: string;
}

export interface ProjectOverview {
  project: ProjectWithOwner;
  dashboards: ProjectItem[];
  queries: ProjectItem[];
  reports: ProjectItem[];
}

export interface ProjectWithContents {
  slug: string;
  name: string;
  description?: string | null;
  owner?: string;
  dashboards: string[];
  queries: string[];
  reports: string[];
}

// ==================== PROJECT FUNCTIONS ====================

export async function getProjects(): Promise<ProjectWithOwner[]> {
  const projects = await prisma.project.findMany({
    include: {
      owner: {
        select: {
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return projects;
}

export async function getProject(slug: string): Promise<ProjectWithOwner | null> {
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  return project;
}

export async function getProjectById(id: string): Promise<ProjectWithOwner | null> {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  return project;
}

export async function getProjectsWithContents(): Promise<ProjectWithContents[]> {
  const projects = await prisma.project.findMany({
    include: {
      owner: {
        select: {
          email: true,
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

  return projects.map((project: typeof projects[number]) => ({
    slug: project.slug,
    name: project.name,
    description: project.description,
    owner: project.owner.email,
    dashboards: project.dashboards.map((d: { name: string }) => d.name),
    queries: project.queries.map((q: { name: string }) => q.name),
    reports: project.reports.map((r: { name: string }) => r.name),
  }));
}

export async function getProjectOverview(
  projectSlug: string
): Promise<ProjectOverview | null> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: {
      owner: {
        select: {
          email: true,
          name: true,
        },
      },
      dashboards: {
        select: {
          id: true,
          name: true,
        },
      },
      queries: {
        select: {
          id: true,
          name: true,
        },
      },
      reports: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!project) {
    return null;
  }

  return {
    project,
    dashboards: project.dashboards,
    queries: project.queries,
    reports: project.reports,
  };
}

// ==================== DASHBOARD FUNCTIONS ====================

export async function getDashboardConfig(
  projectSlug: string,
  dashboardName: string = "main"
): Promise<{ id: string; config: DashboardConfig } | null> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });

  if (!project) {
    return null;
  }

  const dashboard = await prisma.dashboard.findUnique({
    where: {
      projectId_name: {
        projectId: project.id,
        name: dashboardName,
      },
    },
  });

  if (!dashboard) {
    return null;
  }

  return {
    id: dashboard.id,
    config: dashboard.config as unknown as DashboardConfig,
  };
}

export async function getDashboardWithData(
  projectSlug: string,
  dashboardName: string = "main"
) {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });

  if (!project) {
    return null;
  }

  const dashboard = await prisma.dashboard.findUnique({
    where: {
      projectId_name: {
        projectId: project.id,
        name: dashboardName,
      },
    },
  });

  if (!dashboard) {
    return null;
  }

  const config = dashboard.config as unknown as DashboardConfig;

  // Get all queries for this project with their results
  const queries = await prisma.query.findMany({
    where: { projectId: project.id },
    include: {
      result: true,
    },
  });

  // Build a map of query name to result data
  const queryDataMap = new Map<string, unknown[]>();
  for (const query of queries) {
    if (query.result?.data) {
      const data = query.result.data;
      // Handle both array and object with data property
      if (Array.isArray(data)) {
        queryDataMap.set(query.name, data);
      } else if (typeof data === "object" && data !== null && "data" in data) {
        queryDataMap.set(query.name, (data as { data: unknown[] }).data);
      } else {
        queryDataMap.set(query.name, [data]);
      }
    }
  }

  // Attach data to each widget
  const widgetsWithData = config.widgets
    .filter((widget) => !widget.hidden)
    .map((widget) => ({
      ...widget,
      data: queryDataMap.get(widget.queryName) || [],
    }));

  return {
    id: dashboard.id,
    title: config.title,
    description: config.description,
    layout: config.layout,
    widgets: widgetsWithData,
  };
}

// ==================== QUERY FUNCTIONS ====================

export async function getQueryContent(
  projectSlug: string,
  queryName: string
): Promise<{ id: string; sql: string; result?: unknown[] } | null> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });

  if (!project) {
    return null;
  }

  const query = await prisma.query.findUnique({
    where: {
      projectId_name: {
        projectId: project.id,
        name: queryName,
      },
    },
    include: {
      result: true,
    },
  });

  if (!query) {
    return null;
  }

  return {
    id: query.id,
    sql: query.sql,
    result: query.result?.data as unknown[] | undefined,
  };
}

// ==================== REPORT FUNCTIONS ====================

export async function getReportContent(
  projectSlug: string,
  reportName: string
): Promise<{ id: string; content: string } | null> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });

  if (!project) {
    return null;
  }

  const report = await prisma.report.findUnique({
    where: {
      projectId_name: {
        projectId: project.id,
        name: reportName,
      },
    },
  });

  if (!report) {
    return null;
  }

  return {
    id: report.id,
    content: report.content,
  };
}

// ==================== PERMISSION HELPERS ====================

export async function canUserEditProject(
  userEmail: string,
  projectId: string
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: true,
      shares: {
        where: {
          user: { email: userEmail },
          permission: { in: ["EDIT", "ADMIN"] },
        },
      },
    },
  });

  if (!project) {
    return false;
  }

  return project.owner.email === userEmail || project.shares.length > 0;
}

export async function canUserAdminProject(
  userEmail: string,
  projectId: string
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: true,
      shares: {
        where: {
          user: { email: userEmail },
          permission: "ADMIN",
        },
      },
    },
  });

  if (!project) {
    return false;
  }

  return project.owner.email === userEmail || project.shares.length > 0;
}
