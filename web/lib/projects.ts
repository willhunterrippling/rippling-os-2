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

export async function getDashboardConfig(
  projectSlug: string
): Promise<DashboardConfig | null> {
  try {
    const dashboardPath = path.join(
      PROJECTS_DIR,
      projectSlug,
      "dashboard.yaml"
    );
    
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

export async function getDashboardWithData(projectSlug: string) {
  const config = await getDashboardConfig(projectSlug);
  
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
