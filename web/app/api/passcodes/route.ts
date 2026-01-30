import { NextRequest, NextResponse } from "next/server";
import { getSession, ADMIN_EMAIL } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/passcodes - List passcodes for the current user
 * Admin can list passcodes for any user by providing ?email=user@rippling.com
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const targetEmail = searchParams.get("email");
    const isAdmin = session.user.email === ADMIN_EMAIL;

    // Determine which user's passcodes to fetch
    let userEmail = session.user.email;
    if (targetEmail && targetEmail !== session.user.email) {
      // Only admin can view other users' passcodes
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Not authorized to view other users' passcodes" },
          { status: 403 }
        );
      }
      userEmail = targetEmail;
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        passcodes: {
          select: {
            id: true,
            codeHint: true,
            name: true,
            createdAt: true,
            lastUsedAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      passcodes: user.passcodes,
      isAdmin,
    });
  } catch (error) {
    console.error("Error listing passcodes:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/passcodes?id=xxx - Delete a passcode
 * Users can only delete their own passcodes
 * Admin can delete any passcode
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const passcodeId = searchParams.get("id");

    if (!passcodeId) {
      return NextResponse.json(
        { error: "Passcode ID is required" },
        { status: 400 }
      );
    }

    // Find the passcode
    const passcode = await prisma.passcode.findUnique({
      where: { id: passcodeId },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    if (!passcode) {
      return NextResponse.json(
        { error: "Passcode not found" },
        { status: 404 }
      );
    }

    // Check authorization
    const isAdmin = session.user.email === ADMIN_EMAIL;
    const isOwner = passcode.user.email === session.user.email;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Not authorized to delete this passcode" },
        { status: 403 }
      );
    }

    // Delete the passcode
    await prisma.passcode.delete({
      where: { id: passcodeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting passcode:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
