import { notFound } from "next/navigation";
import { getProject, getDashboardWithData } from "@/lib/projects";
import { DashboardRenderer } from "@/components/dashboard/DashboardRenderer";
import { Card, CardContent } from "@/components/ui/card";

interface ProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  const dashboard = await getDashboardWithData(slug);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="text-muted-foreground mt-2">{project.description}</p>
        )}
      </div>

      {dashboard ? (
        <DashboardRenderer config={dashboard} />
      ) : (
        <Card className="bg-muted/50">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No dashboard configured for this project.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Create a <code className="bg-background px-1 py-0.5 rounded">dashboard.yaml</code> file in your project folder to add visualizations.
            </p>
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
