import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject, getReportContent } from "@/lib/projects";
import { Card, CardContent } from "@/components/ui/card";

interface ReportPageProps {
  params: Promise<{
    slug: string;
    name: string;
  }>;
}

// Simple markdown to HTML conversion for basic formatting
function renderMarkdown(content: string): string {
  return content
    // Headers
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-8 mb-3">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted rounded-lg p-4 overflow-x-auto text-sm my-4"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
    // Unordered lists
    .replace(/^\- (.*$)/gm, '<li class="ml-4">$1</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-6 border-border" />')
    // Paragraphs (simple version - wrap non-tag lines)
    .replace(/^(?!<[a-z])(.*[^\s].*)$/gm, '<p class="my-2">$1</p>')
    // Clean up list items into ul
    .replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc my-4">$&</ul>');
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { slug, name } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  const content = await getReportContent(slug, name);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/projects/${slug}`} className="hover:text-foreground">
          {project.name}
        </Link>
        <span>/</span>
        <span>reports</span>
        <span>/</span>
        <span className="text-foreground font-medium">{name}</span>
      </div>

      {content ? (
        <article
          className="prose prose-slate dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
      ) : (
        <Card className="bg-muted/50">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Report not found: {name}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Make sure{" "}
              <code className="bg-background px-1 py-0.5 rounded">
                reports/{name}.md
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

export async function generateMetadata({ params }: ReportPageProps) {
  const { slug, name } = await params;
  const project = await getProject(slug);

  if (!project) {
    return {
      title: "Report Not Found",
    };
  }

  return {
    title: `${name} | ${project.name} | Rippling OS`,
    description: `Report from ${project.name}`,
  };
}
