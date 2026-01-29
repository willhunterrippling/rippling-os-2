import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { Resend as ResendClient } from "resend";
import { prisma } from "./db";

// Generate a 6-digit OTP code
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const resendClient = new ResendClient(process.env.AUTH_RESEND_KEY);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      from: "onboarding@resend.dev",
      generateVerificationToken: () => generateOTP(),
      sendVerificationRequest: async ({ identifier: email, token, url }) => {
        try {
          await resendClient.emails.send({
            from: "Rippling OS <onboarding@resend.dev>",
            to: email,
            subject: `${token} is your verification code`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 24px; color: #18181b;">Sign in to Rippling OS</h1>
                <p style="font-size: 14px; color: #71717a; margin-bottom: 24px;">Enter this code to sign in:</p>
                <div style="background: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 32px; font-weight: 700; letter-spacing: 4px; color: #18181b;">${token}</span>
                </div>
                <p style="font-size: 12px; color: #a1a1aa;">This code expires in 24 hours. If you didn't request this, you can ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
                <p style="font-size: 12px; color: #a1a1aa;">Or <a href="${url}" style="color: #3b82f6;">click here</a> to sign in directly.</p>
              </div>
            `,
          });
        } catch (error) {
          console.error("Failed to send verification email:", error);
          throw new Error("Failed to send verification email");
        }
      },
    }),
  ],
  callbacks: {
    signIn({ user }) {
      // Only allow @rippling.com emails
      if (!user.email?.endsWith("@rippling.com")) {
        return false;
      }
      return true;
    },
    session({ session, user }) {
      // Add user id to session
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
    error: "/login?error=1",
  },
  session: {
    strategy: "database",
  },
});

// Type augmentation for session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }
}
