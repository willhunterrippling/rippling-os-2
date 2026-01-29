import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export interface Project {
  slug: string;
  name: string;
  description?: string;
  createdAt?: string;
  author?: string;
}

export interface ProjectsManifest {
  projects: Project[];
}

export interface DashboardWidget {
  type: "metric" | "chart" | "table";
  title: string;
  data: string; // Path to JSON file relative to project
  valueKey?: string;
  chartType?: "line" | "bar" | "area" | "pie";
  xKey?: string;
  yKey?: string;
  columns?: string[];
}

export interface DashboardConfig {
  title: string;
  description?: string;
  layout?: "grid" | "stack";
  widgets: DashboardWidget[];
}

export interface ProjectItem {
  name: string; // filename without extension
  path: string; // relative path from project root
}

export interface ProjectOverview {
  project: Project;
  dashboards: ProjectItem[];
  queries: ProjectItem[];
  reports: ProjectItem[];
  readme?: string; // README content if exists
}

const PROJECTS_JSON_PATH = path.join(process.cwd(), "..", "projects.json");
const PROJECTS_DIR = path.join(process.cwd(), "..", "projects");

export async function getProjects(): Promise<Project[]> {
  try {
    const content = fs.readFileSync(PROJECTS_JSON_PATH, "utf-8");
    const manifest: ProjectsManifest = JSON.parse(content);
    return manifest.projects || [];
  } catch (error) {
    console.error("Error reading projects.json:", error);
    return [];
  }
}

export async function getProject(slug: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find((p) => p.slug === slug) || null;
}

/**
 * Simplified project with contents for sidebar display
 */
export interface ProjectWithContents {
  slug: string;
  name: string;
  dashboards: string[]; // Just names for sidebar
  queries: string[];
  reports: string[];
}

/**
 * Get all projects with their contents for sidebar navigation
 */
export async function getProjectsWithContents(): Promise<ProjectWithContents[]> {
  const projects = await getProjects();

  return Promise.all(
    projects.map(async (project) => {
      const [dashboards, queries, reports] = await Promise.all([
        getProjectDashboards(project.slug),
        getProjectQueries(project.slug),
        getProjectReports(project.slug),
      ]);

      return {
        slug: project.slug,
        name: project.name,
        dashboards: dashboards.map((d) => d.name),
        queries: queries.map((q) => q.name),
        reports: reports.map((r) => r.name),
      };
    })
  );
}

/**
 * List all dashboards in a project's dashboards/ folder
 */
export async function getProjectDashboards(
  projectSlug: string
): Promise<ProjectItem[]> {
  try {
    const dashboardsDir = path.join(PROJECTS_DIR, projectSlug, "dashboards");

    if (!fs.existsSync(dashboardsDir)) {
      // Backward compatibility: check for root dashboard.yaml
      const legacyPath = path.join(PROJECTS_DIR, projectSlug, "dashboard.yaml");
      if (fs.existsSync(legacyPath)) {
        return [{ name: "main", path: "dashboard.yaml" }];
      }
      return [];
    }

    const files = fs.readdirSync(dashboardsDir);
    return files
      .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
      .map((f) => ({
        name: f.replace(/\.(yaml|yml)$/, ""),
        path: `dashboards/${f}`,
      }));
  } catch (error) {
    console.error(`Error reading dashboards for ${projectSlug}:`, error);
    return [];
  }
}

/**
 * List all SQL queries in a project's queries/ folder
 */
export async function getProjectQueries(
  projectSlug: string
): Promise<ProjectItem[]> {
  try {
    const queriesDir = path.join(PROJECTS_DIR, projectSlug, "queries");

    if (!fs.existsSync(queriesDir)) {
      return [];
    }

    const files = fs.readdirSync(queriesDir);
    return files
      .filter((f) => f.endsWith(".sql"))
      .map((f) => ({
        name: f.replace(/\.sql$/, ""),
        path: `queries/${f}`,
      }));
  } catch (error) {
    console.error(`Error reading queries for ${projectSlug}:`, error);
    return [];
  }
}

/**
 * List all reports (markdown files) in a project's reports/ folder
 */
export async function getProjectReports(
  projectSlug: string
): Promise<ProjectItem[]> {
  try {
    const reportsDir = path.join(PROJECTS_DIR, projectSlug, "reports");

    if (!fs.existsSync(reportsDir)) {
      return [];
    }

    const files = fs.readdirSync(reportsDir);
    return files
      .filter((f) => f.endsWith(".md"))
      .map((f) => ({
        name: f.replace(/\.md$/, ""),
        path: `reports/${f}`,
      }));
  } catch (error) {
    console.error(`Error reading reports for ${projectSlug}:`, error);
    return [];
  }
}

/**
 * Get a full overview of a project including all its contents
 */
export async function getProjectOverview(
  projectSlug: string
): Promise<ProjectOverview | null> {
  const project = await getProject(projectSlug);
  if (!project) {
    return null;
  }

  const [dashboards, queries, reports] = await Promise.all([
    getProjectDashboards(projectSlug),
    getProjectQueries(projectSlug),
    getProjectReports(projectSlug),
  ]);

  // Try to read README
  let readme: string | undefined;
  try {
    const readmePath = path.join(PROJECTS_DIR, projectSlug, "README.md");
    if (fs.existsSync(readmePath)) {
      readme = fs.readFileSync(readmePath, "utf-8");
    }
  } catch {
    // README is optional
  }

  return {
    project,
    dashboards,
    queries,
    reports,
    readme,
  };
}

/**
 * Get dashboard config - supports both new dashboards/ folder and legacy root dashboard.yaml
 */
export async function getDashboardConfig(
  projectSlug: string,
  dashboardName?: string
): Promise<DashboardConfig | null> {
  try {
    let dashboardPath: string;

    if (dashboardName) {
      // Look in dashboards/ folder
      dashboardPath = path.join(
        PROJECTS_DIR,
        projectSlug,
        "dashboards",
        `${dashboardName}.yaml`
      );
      // Try .yml extension if .yaml doesn't exist
      if (!fs.existsSync(dashboardPath)) {
        dashboardPath = path.join(
          PROJECTS_DIR,
          projectSlug,
          "dashboards",
          `${dashboardName}.yml`
        );
      }
    } else {
      // Default: try dashboards/main.yaml first, then fall back to root dashboard.yaml
      dashboardPath = path.join(
        PROJECTS_DIR,
        projectSlug,
        "dashboards",
        "main.yaml"
      );
      if (!fs.existsSync(dashboardPath)) {
        dashboardPath = path.join(
          PROJECTS_DIR,
          projectSlug,
          "dashboards",
          "main.yml"
        );
      }
      if (!fs.existsSync(dashboardPath)) {
        // Backward compatibility: root dashboard.yaml
        dashboardPath = path.join(PROJECTS_DIR, projectSlug, "dashboard.yaml");
      }
    }

    if (!fs.existsSync(dashboardPath)) {
      return null;
    }

    const content = fs.readFileSync(dashboardPath, "utf-8");
    const config = yaml.load(content) as DashboardConfig;
    return config;
  } catch (error) {
    console.error(`Error reading dashboard config for ${projectSlug}:`, error);
    return null;
  }
}

/**
 * Read the content of a SQL query file
 */
export async function getQueryContent(
  projectSlug: string,
  queryName: string
): Promise<string | null> {
  try {
    const queryPath = path.join(
      PROJECTS_DIR,
      projectSlug,
      "queries",
      `${queryName}.sql`
    );

    if (!fs.existsSync(queryPath)) {
      return null;
    }

    return fs.readFileSync(queryPath, "utf-8");
  } catch (error) {
    console.error(`Error reading query ${queryName} for ${projectSlug}:`, error);
    return null;
  }
}

/**
 * Read the content of a report markdown file
 */
export async function getReportContent(
  projectSlug: string,
  reportName: string
): Promise<string | null> {
  try {
    const reportPath = path.join(
      PROJECTS_DIR,
      projectSlug,
      "reports",
      `${reportName}.md`
    );

    if (!fs.existsSync(reportPath)) {
      return null;
    }

    return fs.readFileSync(reportPath, "utf-8");
  } catch (error) {
    console.error(`Error reading report ${reportName} for ${projectSlug}:`, error);
    return null;
  }
}

export async function loadWidgetData(
  projectSlug: string,
  dataPath: string
): Promise<Record<string, unknown>[]> {
  try {
    const fullPath = path.join(PROJECTS_DIR, projectSlug, dataPath);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`Data file not found: ${fullPath}`);
      return [];
    }

    const content = fs.readFileSync(fullPath, "utf-8");
    const data = JSON.parse(content);
    
    // Handle both array and object with data property
    if (Array.isArray(data)) {
      return data;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else {
      // Single object - wrap in array
      return [data];
    }
  } catch (error) {
    console.error(`Error loading widget data from ${dataPath}:`, error);
    return [];
  }
}

export async function getDashboardWithData(
  projectSlug: string,
  dashboardName?: string
) {
  const config = await getDashboardConfig(projectSlug, dashboardName);

  if (!config) {
    return null;
  }

  // Load data for each widget
  const widgetsWithData = await Promise.all(
    config.widgets.map(async (widget) => {
      const data = await loadWidgetData(projectSlug, widget.data);
      return {
        ...widget,
        data,
      };
    })
  );

  return {
    ...config,
    widgets: widgetsWithData,
  };
}
