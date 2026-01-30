import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SharePermission } from "@prisma/client";

// Helper to get user email (handles BYPASS_AUTH in development)
async function getUserEmail(): Promise<string | null> {
  // In development with BYPASS_AUTH, use the configured email
  if (
    process.env.NODE_ENV === "development" &&
    process.env.BYPASS_AUTH === "true"
  ) {
    return process.env.RIPPLING_ACCOUNT_EMAIL || "dev@rippling.com";
  }
  const session = await getSession();
  return session?.user?.email || null;
}

// GET - List shares for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userEmail = await getUserEmail();
  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { email: true, name: true } },
      shares: {
        include: {
          user: { select: { email: true, name: true } },
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    owner: project.owner,
    shares: project.shares.map((s: typeof project.shares[number]) => ({
      id: s.id,
      user: s.user,
      permission: s.permission,
    })),
  });
}

// POST - Add a new share
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userEmail = await getUserEmail();
  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const body = await request.json();
  const { email, permission } = body as {
    email: string;
    permission: SharePermission;
  };

  if (!email || !permission) {
    return NextResponse.json(
      { error: "Email and permission are required" },
      { status: 400 }
    );
  }

  // Validate permission
  if (!["VIEW", "EDIT", "ADMIN"].includes(permission)) {
    return NextResponse.json(
      { error: "Invalid permission. Must be VIEW, EDIT, or ADMIN" },
      { status: 400 }
    );
  }

  // Validate email domain
  if (!email.endsWith("@rippling.com")) {
    return NextResponse.json(
      { error: "Can only share with @rippling.com emails" },
      { status: 400 }
    );
  }

  // Check if user has permission to share (must be owner or have ADMIN permission)
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: true,
      shares: {
        where: { user: { email: userEmail } },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isOwner = project.owner.email === userEmail;
  const hasAdminShare = project.shares.some(
    (s: { permission: string }) => s.permission === "ADMIN"
  );

  if (!isOwner && !hasAdminShare) {
    return NextResponse.json(
      { error: "You don't have permission to share this project" },
      { status: 403 }
    );
  }

  // Find or create the user to share with
  let targetUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!targetUser) {
    // Create user if they don't exist yet (they'll verify via magic link when they log in)
    targetUser = await prisma.user.create({
      data: { email },
    });
  }

  // Can't share with the owner
  if (targetUser.id === project.ownerId) {
    return NextResponse.json(
      { error: "Can't share with the project owner" },
      { status: 400 }
    );
  }

  // Create or update the share
  const share = await prisma.projectShare.upsert({
    where: {
      projectId_userId: {
        projectId,
        userId: targetUser.id,
      },
    },
    update: { permission },
    create: {
      projectId,
      userId: targetUser.id,
      permission,
    },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  return NextResponse.json({
    id: share.id,
    user: share.user,
    permission: share.permission,
  });
}

// DELETE - Remove a share
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userEmail = await getUserEmail();
  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const { searchParams } = new URL(request.url);
  const shareId = searchParams.get("shareId");

  if (!shareId) {
    return NextResponse.json(
      { error: "shareId is required" },
      { status: 400 }
    );
  }

  // Check if user has permission to manage shares
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: true,
      shares: {
        where: { user: { email: userEmail } },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isOwner = project.owner.email === userEmail;
  const hasAdminShare = project.shares.some(
    (s: { permission: string }) => s.permission === "ADMIN"
  );

  if (!isOwner && !hasAdminShare) {
    return NextResponse.json(
      { error: "You don't have permission to manage shares" },
      { status: 403 }
    );
  }

  await prisma.projectShare.delete({
    where: { id: shareId },
  });

  return NextResponse.json({ success: true });
}
