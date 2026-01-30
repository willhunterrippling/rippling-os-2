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

export interface SidebarItem {
  name: string;
  title: string;
}

export interface ProjectWithContents {
  slug: string;
  name: string;
  description?: string | null;
  owner?: string;
  dashboards: SidebarItem[];
  queries: SidebarItem[];
  reports: SidebarItem[];
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

// Extract H1 title from markdown content, or format the slug as fallback
function extractTitleFromMarkdown(content: string, fallbackName: string): string {
  // Look for first H1 heading (# Title)
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }
  // Fallback: format slug as title (e.g., "findings" -> "Findings", "status-update" -> "Status Update")
  return formatSlugAsTitle(fallbackName);
}

// Format a slug into a readable title
function formatSlugAsTitle(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Format query names - strip common prefixes like "report_01_" and format nicely
function formatQueryTitle(name: string): string {
  // Strip common prefixes: report_01_, query_01_, etc.
  const stripped = name.replace(/^(report|query|q|r)_?\d+_?/i, '');
  // If nothing left after stripping, use original name
  const toFormat = stripped || name;
  return formatSlugAsTitle(toFormat);
}

// Inferred widget configuration from query data
interface InferredWidgetConfig {
  type: "metric" | "chart" | "table";
  valueKey?: string;
  chartType?: "line" | "bar" | "area" | "pie";
  xKey?: string;
  yKey?: string;
}

// Auto-detect the best widget type based on query result data shape
// Conservative approach: default to tables unless data is clearly a single metric
function inferWidgetType(data: Record<string, unknown>[]): InferredWidgetConfig {
  if (!data || data.length === 0) {
    return { type: "table" };
  }

  const columns = Object.keys(data[0]);
  const firstRow = data[0];

  // Single row with single numeric value → Metric card
  if (data.length === 1 && columns.length === 1) {
    const value = firstRow[columns[0]];
    if (typeof value === "number" || (typeof value === "string" && !isNaN(Number(value)))) {
      return { type: "metric", valueKey: columns[0] };
    }
  }

  // Single row with two columns (label + value) → Metric card
  if (data.length === 1 && columns.length === 2) {
    const numericCol = columns.find(c => {
      const val = firstRow[c];
      return typeof val === "number" || (typeof val === "string" && !isNaN(Number(val)));
    });
    if (numericCol) {
      return { type: "metric", valueKey: numericCol };
    }
  }

  // Default: Table (charts should be explicitly requested by the user)
  // Tables work for any data shape and show exact values
  return { type: "table" };
}

// Extract title from dashboard config
function extractDashboardTitle(config: unknown, fallbackName: string): string {
  if (config && typeof config === 'object' && 'title' in config && typeof (config as { title?: string }).title === 'string') {
    return (config as { title: string }).title;
  }
  return formatSlugAsTitle(fallbackName);
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

  return projects.map((project: typeof projects[number]) => ({
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
      title: formatQueryTitle(q.name),
    })),
    reports: project.reports.map((r: { name: string; content: string }) => ({
      name: r.name,
      title: extractTitleFromMarkdown(r.content, r.name),
    })),
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

// Widget with data attached for rendering
export interface WidgetWithData {
  type: "metric" | "chart" | "table";
  title: string;
  queryName: string;
  data: Record<string, unknown>[];
  valueKey?: string;
  chartType?: "line" | "bar" | "area" | "pie";
  xKey?: string;
  yKey?: string;
}

// Get all queries for a project with auto-generated widget configurations
export async function getProjectQueriesWithData(projectSlug: string): Promise<{
  project: ProjectWithOwner;
  widgets: WidgetWithData[];
  dashboards: ProjectItem[];
  reports: ProjectItem[];
} | null> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: {
      owner: {
        select: {
          email: true,
          name: true,
        },
      },
      queries: {
        include: { result: true },
        orderBy: { createdAt: "desc" },
      },
      dashboards: {
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

  // Auto-generate widgets with smart type detection
  const widgets: WidgetWithData[] = project.queries.map((query) => {
    // Extract data from result
    let data: Record<string, unknown>[] = [];
    if (query.result?.data) {
      const rawData = query.result.data;
      if (Array.isArray(rawData)) {
        data = rawData as Record<string, unknown>[];
      } else if (typeof rawData === "object" && rawData !== null && "data" in rawData) {
        data = (rawData as { data: unknown[] }).data as Record<string, unknown>[];
      } else {
        data = [rawData as Record<string, unknown>];
      }
    }

    // Infer widget type from data shape
    const widgetConfig = inferWidgetType(data);

    return {
      ...widgetConfig,
      title: formatQueryTitle(query.name),
      queryName: query.name,
      data,
    };
  });

  return {
    project,
    widgets,
    dashboards: project.dashboards,
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
    include: {
      queries: {
        include: {
          query: {
            select: {
              id: true,
              name: true,
              sql: true,
            },
          },
        },
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

  // Get linked queries with their widget types
  const linkedQueries = dashboard.queries.map((dq) => {
    // Find which widget uses this query
    const widget = config.widgets.find((w) => w.queryName === dq.query.name);
    return {
      name: dq.query.name,
      widgetType: widget?.type || null,
      widgetTitle: widget?.title || null,
    };
  });

  return {
    id: dashboard.id,
    title: config.title,
    description: config.description,
    layout: config.layout,
    widgets: widgetsWithData,
    linkedQueries,
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
): Promise<{
  id: string;
  content: string;
  linkedQueries: { name: string }[];
} | null> {
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
    include: {
      queries: {
        include: {
          query: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          query: {
            name: 'asc',
          },
        },
      },
    },
  });

  if (!report) {
    return null;
  }

  return {
    id: report.id,
    content: report.content,
    linkedQueries: report.queries.map((rq) => ({ name: rq.query.name })),
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
