import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject, getReportContent, canUserAdminProject } from "@/lib/projects";
import { getSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { ShareButton } from "@/components/project/ShareDialog";
import { CollapsibleSection } from "@/components/project/CollapsibleSection";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReportPageProps {
  params: Promise<{
    slug: string;
    name: string;
  }>;
}

// Parse citation references like [1]: query_name and return processed content + reference list
function processCitations(
  content: string,
  slug: string
): { content: string; references: Array<{ num: string; queryName: string }> } {
  const references: Array<{ num: string; queryName: string }> = [];
  
  // Match [N]: query_name patterns (where query_name doesn't start with http/https//)
  const refRegex = /^\[(\d+)\]:\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*$/gm;
  
  // Extract references and transform them to full URLs
  const processedContent = content.replace(refRegex, (match, num, queryName) => {
    references.push({ num, queryName });
    // Transform to markdown reference-style link URL
    return `[${num}]: /projects/${slug}/queries/${queryName}`;
  });
  
  // Sort references by number
  references.sort((a, b) => parseInt(a.num) - parseInt(b.num));
  
  return { content: processedContent, references };
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { slug, name } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  const content = await getReportContent(slug, name);

  // Check if current user can manage shares
  const session = await getSession();
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
        (() => {
          // Process citations to transform [N]: query_name into full URLs
          const { content: processedContent, references } = processCitations(
            content.content,
            slug
          );
          
          return (
            <>
              <article className="prose prose-slate dark:prose-invert max-w-none">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Citation links (superscript style for query references)
                    a: ({ href, children }) => {
                      // Check if this is a citation link (links to a query page and content is just a number)
                      const isCitation = href?.includes('/queries/') && 
                        /^\d+$/.test(String(children));
                      
                      if (isCitation) {
                        return (
                          <Link
                            href={href || '#'}
                            className="text-primary hover:underline no-underline text-xs align-super font-medium"
                            title={`View source query`}
                          >
                            [{children}]
                          </Link>
                        );
                      }
                      
                      // Regular links
                      return (
                        <a href={href} className="text-primary hover:underline">
                          {children}
                        </a>
                      );
                    },
                // Headings with anchor links
                h1: ({ children }) => {
                  const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                  return (
                    <h1 id={id} className="scroll-mt-20 group">
                      <a href={`#${id}`} className="mr-2 opacity-25 hover:opacity-70 text-muted-foreground no-underline">#</a>
                      {children}
                    </h1>
                  );
                },
                h2: ({ children }) => {
                  const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                  return (
                    <h2 id={id} className="scroll-mt-20 border-b border-border pb-2 group">
                      <a href={`#${id}`} className="mr-2 opacity-25 hover:opacity-70 text-muted-foreground no-underline">#</a>
                      {children}
                    </h2>
                  );
                },
                h3: ({ children }) => {
                  const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                  return (
                    <h3 id={id} className="scroll-mt-20 group">
                      <a href={`#${id}`} className="mr-2 opacity-25 hover:opacity-70 text-muted-foreground no-underline">#</a>
                      {children}
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
                  {processedContent}
                </Markdown>
              </article>

              {/* References Section - shows citation mappings */}
              {references.length > 0 && (
                <div className="border-t border-border pt-6 mt-8">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    References
                  </h3>
                  <ol className="list-none space-y-1 text-sm">
                    {references.map(({ num, queryName }) => (
                      <li key={num} className="flex items-baseline gap-2">
                        <span className="text-muted-foreground font-medium">[{num}]</span>
                        <Link
                          href={`/projects/${slug}/queries/${queryName}`}
                          className="text-primary hover:underline font-mono text-xs"
                        >
                          {queryName}
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Queries Used Section */}
              {content.linkedQueries && content.linkedQueries.length > 0 && (
                <CollapsibleSection
                  title="Queries Used"
                  description="SQL queries referenced in this report"
                  count={content.linkedQueries.length}
                  defaultExpanded={false}
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
                    {content.linkedQueries.map((query) => (
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
                          {query.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}
            </>
          );
        })()
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
