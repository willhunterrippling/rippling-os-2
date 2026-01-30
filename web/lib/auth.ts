import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

// Session cookie name
const SESSION_COOKIE = "ros_session";

// Session duration: 30 days in milliseconds
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// Admin email with special privileges
export const ADMIN_EMAIL = "willhunter@rippling.com";

// Session type
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

export interface Session {
  user: SessionUser;
}

/**
 * Generate a cryptographically secure random passcode
 * Format: 4 groups of 4 alphanumeric characters (e.g., "ABCD-1234-EFGH-5678")
 */
export function generatePasscode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars: 0, O, 1, I
  let code = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Hash a passcode using bcrypt
 */
export async function hashPasscode(passcode: string): Promise<string> {
  return bcrypt.hash(passcode, 10);
}

/**
 * Verify a passcode against a hash
 */
export async function verifyPasscode(
  passcode: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(passcode, hash);
}

/**
 * Get the hint (last 4 characters) from a passcode
 */
export function getPasscodeHint(passcode: string): string {
  // Remove dashes and get last 4 chars
  const clean = passcode.replace(/-/g, "");
  return clean.slice(-4);
}

/**
 * Generate a secure session token
 */
function generateSessionToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

/**
 * Validate a passcode and return the associated user
 * Returns null if passcode is invalid
 */
export async function validatePasscode(
  code: string
): Promise<SessionUser | null> {
  // Normalize the passcode (remove dashes, uppercase)
  const normalizedCode = code.replace(/-/g, "").toUpperCase();

  // Get all passcodes and check each one
  // Note: We iterate because bcrypt hashes can't be directly queried
  const passcodes = await prisma.passcode.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  for (const passcode of passcodes) {
    // Normalize stored passcode for comparison
    const isValid = await verifyPasscode(normalizedCode, passcode.codeHash);
    if (isValid) {
      // Update lastUsedAt
      await prisma.passcode.update({
        where: { id: passcode.id },
        data: { lastUsedAt: new Date() },
      });

      return {
        id: passcode.user.id,
        email: passcode.user.email,
        name: passcode.user.name,
      };
    }
  }

  return null;
}

/**
 * Create a new session for a user
 * Sets a secure httpOnly cookie and stores session in DB
 */
export async function createSession(userId: string): Promise<string> {
  const sessionToken = generateSessionToken();
  const expires = new Date(Date.now() + SESSION_DURATION_MS);

  // Create session in database
  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });

  return sessionToken;
}

/**
 * Get the current session from cookie
 * Returns null if no valid session exists
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return null;
  }

  // Look up session in database
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  // Check if session has expired
  if (session.expires < new Date()) {
    // Clean up expired session
    await prisma.session.delete({
      where: { id: session.id },
    });
    return null;
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
  };
}

/**
 * Destroy the current session (logout)
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionToken) {
    // Delete session from database
    try {
      await prisma.session.delete({
        where: { sessionToken },
      });
    } catch {
      // Session may already be deleted, that's fine
    }
  }

  // Clear cookie
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.user.email === ADMIN_EMAIL;
}

/**
 * Require authentication - redirects to login if not authenticated
 * For use in server components/pages
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    // We can't redirect from here (this is a utility function)
    // The caller should handle the redirect
    throw new Error("Not authenticated");
  }
  return session;
}
