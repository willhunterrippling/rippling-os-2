import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject, getProjectOverview, canUserAdminProject } from "@/lib/projects";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ShareButton } from "@/components/project/ShareDialog";
import { AutoRefresh } from "@/components/AutoRefresh";
import { CollapsibleSection } from "@/components/project/CollapsibleSection";

interface ProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const overview = await getProjectOverview(slug);

  if (!overview) {
    notFound();
  }

  const { project, dashboards, queries, reports } = overview;
  
  // Check if current user can manage shares
  const session = await auth();
  const canManageShares = session?.user?.email
    ? await canUserAdminProject(session.user.email, project.id)
    : false;

  return (
    <div className="space-y-6">
      <AutoRefresh interval={5000} />
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
          <p className="text-xs text-muted-foreground/70 mt-3 flex items-center gap-1.5">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Prompt Cursor to create queries, dashboards, or reports
          </p>
        </div>
        <ShareButton
          projectId={project.id}
          projectName={project.name}
          canManageShares={canManageShares}
        />
      </div>

      <div className="space-y-3">
        {/* Dashboards Section */}
        <CollapsibleSection
          title="Dashboards"
          description="Interactive visualizations"
          count={dashboards.length}
          emptyMessage="No dashboards yet"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
        >
          <ul className="space-y-1">
            {dashboards.map((dashboard) => (
              <li key={dashboard.name}>
                <Link
                  href={`/projects/${slug}/dashboards/${dashboard.name}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <svg
                    className="w-4 h-4"
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
                  {dashboard.name}
                </Link>
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        {/* Queries Section */}
        <CollapsibleSection
          title="Queries"
          description="SQL query files"
          count={queries.length}
          emptyMessage="No queries yet"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
              />
            </svg>
          }
        >
          <ul className="space-y-1">
            {queries.map((query) => (
              <li key={query.name}>
                <Link
                  href={`/projects/${slug}/queries/${query.name}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <svg
                    className="w-4 h-4"
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
                  {query.name}.sql
                </Link>
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        {/* Reports Section */}
        <CollapsibleSection
          title="Reports"
          description="Written documentation"
          count={reports.length}
          emptyMessage="No reports yet"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
        >
          <ul className="space-y-1">
            {reports.map((report) => (
              <li key={report.name}>
                <Link
                  href={`/projects/${slug}/reports/${report.name}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <svg
                    className="w-4 h-4"
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
                  {report.name}
                </Link>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      </div>

      {/* Quick access to first dashboard if available */}
      {dashboards.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Quick Access</p>
                <p className="text-sm text-muted-foreground">
                  View the main dashboard for this project
                </p>
              </div>
              <Link
                href={`/projects/${slug}/dashboards/${dashboards[0].name}`}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Open Dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
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
