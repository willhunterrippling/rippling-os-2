import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject, getProjectQueriesWithData, canUserAdminProject } from "@/lib/projects";
import { getSession } from "@/lib/auth";
import { ShareButton } from "@/components/project/ShareDialog";
import { AutoRefresh } from "@/components/AutoRefresh";
import { DashboardRenderer } from "@/components/dashboard/DashboardRenderer";

interface ProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const data = await getProjectQueriesWithData(slug);

  if (!data) {
    notFound();
  }

  const { project, widgets, dashboards, reports } = data;

  // Check if current user can manage shares
  const session = await getSession();
  const canManageShares = session?.user?.email
    ? await canUserAdminProject(session.user.email, project.id)
    : false;

  // Build dashboard config for renderer (no title/description since we show header separately)
  const dashboardConfig = {
    layout: "stack" as const,
    widgets: widgets,
  };

  return (
    <div className="space-y-6">
      <AutoRefresh interval={5000} />
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-2">{project.description}</p>
          )}
          {project.owner && (
            <p className="text-sm text-muted-foreground mt-1">
              By {project.owner.name || project.owner.email.split("@")[0]}
            </p>
          )}
        </div>
        <ShareButton
          projectId={project.id}
          projectName={project.name}
          canManageShares={canManageShares}
        />
      </div>

      {/* Quick links to dashboards and reports if they exist */}
      {(dashboards.length > 0 || reports.length > 0) && (
        <div className="flex flex-wrap gap-2 text-sm">
          {dashboards.map((dashboard) => (
            <Link
              key={dashboard.id}
              href={`/projects/${slug}/dashboards/${dashboard.name}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {dashboard.name}
            </Link>
          ))}
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/projects/${slug}/reports/${report.name}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {report.name}
            </Link>
          ))}
        </div>
      )}

      {/* Auto-generated dashboard with all query results */}
      {widgets.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            <span>{widgets.length} {widgets.length === 1 ? 'query' : 'queries'}</span>
          </div>
          <DashboardRenderer config={dashboardConfig} />
        </div>
      ) : (
        /* Empty state when no queries exist */
        <div className="text-center py-16 border border-dashed rounded-lg">
          <svg
            className="w-12 h-12 mx-auto text-muted-foreground/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium">No queries yet</h3>
          <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
            Run queries against Snowflake to see results here automatically.
          </p>
          <p className="mt-4 text-sm text-muted-foreground/70 flex items-center justify-center gap-1.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Use <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">/query</code> in Cursor to run SQL
          </p>
        </div>
      )}
    </div>
  );
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: `${project.name} | Rippling OS`,
    description: project.description,
  };
}
