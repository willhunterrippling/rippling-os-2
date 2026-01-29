import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject, getReportContent, canUserAdminProject } from "@/lib/projects";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { ShareButton } from "@/components/project/ShareDialog";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReportPageProps {
  params: Promise<{
    slug: string;
    name: string;
  }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { slug, name } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  const content = await getReportContent(slug, name);

  // Check if current user can manage shares
  const session = await auth();
  const canManageShares = session?.user?.email
    ? await canUserAdminProject(session.user.email, project.id)
    : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/projects/${slug}`} className="hover:text-foreground">
            {project.name}
          </Link>
          <span>/</span>
          <span>reports</span>
          <span>/</span>
          <span className="text-foreground font-medium">{name}</span>
        </div>
        <ShareButton
          projectId={project.id}
          projectName={project.name}
          canManageShares={canManageShares}
        />
      </div>

      {content ? (
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Headings with anchor links
              h1: ({ children }) => {
                const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                return (
                  <h1 id={id} className="scroll-mt-20 group">
                    {children}
                    <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-50 text-muted-foreground no-underline">#</a>
                  </h1>
                );
              },
              h2: ({ children }) => {
                const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                return (
                  <h2 id={id} className="scroll-mt-20 border-b border-border pb-2 group">
                    {children}
                    <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-50 text-muted-foreground no-underline">#</a>
                  </h2>
                );
              },
              h3: ({ children }) => {
                const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                return (
                  <h3 id={id} className="scroll-mt-20 group">
                    {children}
                    <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-50 text-muted-foreground no-underline">#</a>
                  </h3>
                );
              },
              // Tables
              table: ({ children }) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full border-collapse border border-border">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-muted">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="border border-border px-4 py-2 text-left font-semibold">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-border px-4 py-2">{children}</td>
              ),
              tr: ({ children }) => (
                <tr className="even:bg-muted/50">{children}</tr>
              ),
              // Code
              code: ({ children, className }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                ) : (
                  <code className={`${className} text-slate-900 dark:text-slate-100`}>{children}</code>
                );
              },
              pre: ({ children }) => (
                <pre className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg p-4 overflow-x-auto text-sm my-4 border border-slate-300 dark:border-slate-700 font-mono whitespace-pre">
                  {children}
                </pre>
              ),
              // Horizontal rules
              hr: () => (
                <hr className="border-border my-8" />
              ),
              // Blockquotes as callouts
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary bg-muted/50 px-4 py-3 my-4 not-italic rounded-r">
                  {children}
                </blockquote>
              ),
              // Strong emphasis
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
            }}
          >
            {content.content}
          </Markdown>
        </article>
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
