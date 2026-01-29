import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject, getDashboardWithData } from "@/lib/projects";
import { DashboardRenderer } from "@/components/dashboard/DashboardRenderer";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardPageProps {
  params: Promise<{
    slug: string;
    name: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { slug, name } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  const dashboard = await getDashboardWithData(slug, name);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/projects/${slug}`} className="hover:text-foreground">
          {project.name}
        </Link>
        <span>/</span>
        <span>dashboards</span>
        <span>/</span>
        <span className="text-foreground font-medium">{name}</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold">
          {dashboard?.title || `${name} Dashboard`}
        </h1>
        {dashboard?.description && (
          <p className="text-muted-foreground mt-2">{dashboard.description}</p>
        )}
      </div>

      {dashboard ? (
        <DashboardRenderer config={dashboard} />
      ) : (
        <Card className="bg-muted/50">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Dashboard not found: {name}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Make sure{" "}
              <code className="bg-background px-1 py-0.5 rounded">
                dashboards/{name}.yaml
              </code>{" "}
              exists in the project folder.
            </p>
            <Link
              href={`/projects/${slug}`}
              className="inline-block mt-4 text-primary hover:underline"
            >
              Back to project
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export async function generateMetadata({ params }: DashboardPageProps) {
  const { slug, name } = await params;
  const project = await getProject(slug);
  const dashboard = await getDashboardWithData(slug, name);

  if (!project) {
    return {
      title: "Dashboard Not Found",
    };
  }

  return {
    title: `${dashboard?.title || name} | ${project.name} | Rippling OS`,
    description: dashboard?.description || `Dashboard for ${project.name}`,
  };
}
