import Link from "next/link";
import { getProjects } from "@/lib/projects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function Home() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome to Rippling OS</h1>
        <p className="text-muted-foreground mt-2">
          AI-assisted Snowflake querying and interactive dashboards
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Getting Started</CardTitle>
            <CardDescription>New to Rippling OS?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Run <code className="bg-muted px-1 py-0.5 rounded">/setup</code> to create your branch</p>
            <p>2. Run <code className="bg-muted px-1 py-0.5 rounded">/create-project</code> to start a new analysis</p>
            <p>3. Run <code className="bg-muted px-1 py-0.5 rounded">/query</code> to execute SQL and cache results</p>
            <p>4. Run <code className="bg-muted px-1 py-0.5 rounded">/save</code> to commit your work</p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Quick Commands</CardTitle>
            <CardDescription>Cursor skills available</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">/setup</Badge>
              <Badge variant="secondary">/save</Badge>
              <Badge variant="secondary">/update-os</Badge>
              <Badge variant="secondary">/query</Badge>
              <Badge variant="secondary">/create-project</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Projects</h2>
        {projects.length === 0 ? (
          <Card className="bg-muted/50">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No projects yet. Run <code className="bg-background px-1 py-0.5 rounded">/create-project</code> in Cursor to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link key={project.slug} href={`/projects/${project.slug}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription>{project.description}</CardDescription>
                    )}
                  </CardHeader>
                  {project.author && (
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        By {project.author}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
