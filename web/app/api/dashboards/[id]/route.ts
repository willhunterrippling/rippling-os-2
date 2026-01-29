import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PATCH - Update dashboard config (for reordering widgets, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: dashboardId } = await params;
  const body = await request.json();
  const { config } = body;

  if (!config) {
    return NextResponse.json({ error: "Config is required" }, { status: 400 });
  }

  // Get the dashboard and check permissions
  const dashboard = await prisma.dashboard.findUnique({
    where: { id: dashboardId },
    include: {
      project: {
        include: {
          owner: true,
          shares: {
            where: { user: { email: session.user.email } },
          },
        },
      },
    },
  });

  if (!dashboard) {
    return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
  }

  // Check if user has edit permission
  const isOwner = dashboard.project.owner.email === session.user.email;
  const hasEditPermission = dashboard.project.shares.some(
    (s) => s.permission === "EDIT" || s.permission === "ADMIN"
  );

  if (!isOwner && !hasEditPermission) {
    return NextResponse.json(
      { error: "You don't have permission to edit this dashboard" },
      { status: 403 }
    );
  }

  // Update the dashboard config
  const updated = await prisma.dashboard.update({
    where: { id: dashboardId },
    data: { config },
  });

  return NextResponse.json({ success: true, config: updated.config });
}
