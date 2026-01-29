import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject, getQueryContent } from "@/lib/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QueryPageProps {
  params: Promise<{
    slug: string;
    name: string;
  }>;
}

export default async function QueryPage({ params }: QueryPageProps) {
  const { slug, name } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  const content = await getQueryContent(slug, name);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/projects/${slug}`} className="hover:text-foreground">
          {project.name}
        </Link>
        <span>/</span>
        <span>queries</span>
        <span>/</span>
        <span className="text-foreground font-medium">{name}.sql</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{name}.sql</h1>
        <p className="text-muted-foreground mt-2">SQL Query</p>
      </div>

      {content ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              {name}.sql
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
              <code className="language-sql">{content.sql}</code>
            </pre>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-muted/50">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Query not found: {name}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Make sure{" "}
              <code className="bg-background px-1 py-0.5 rounded">
                queries/{name}.sql
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

export async function generateMetadata({ params }: QueryPageProps) {
  const { slug, name } = await params;
  const project = await getProject(slug);

  if (!project) {
    return {
      title: "Query Not Found",
    };
  }

  return {
    title: `${name}.sql | ${project.name} | Rippling OS`,
    description: `SQL query from ${project.name}`,
  };
}
