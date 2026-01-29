import { notFound } from "next/navigation";
import { getProject, getDashboardWithData } from "@/lib/projects";
import { DashboardRenderer } from "@/components/dashboard/DashboardRenderer";

interface DashboardPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { id } = await params;
  
  // The id is the project slug for now
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  const dashboard = await getDashboardWithData(id);

  if (!dashboard) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <DashboardRenderer config={dashboard} />
    </div>
  );
}

export async function generateMetadata({ params }: DashboardPageProps) {
  const { id } = await params;
  const project = await getProject(id);
  const dashboard = await getDashboardWithData(id);

  if (!project || !dashboard) {
    return {
      title: "Dashboard Not Found",
    };
  }

  return {
    title: `${dashboard.title} | Rippling OS`,
    description: dashboard.description,
  };
}
