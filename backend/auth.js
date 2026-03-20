import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import prisma from "./lib/prisma.js";
import { dash } from "@better-auth/infra";
import { sendEmail } from "./services/email.js";

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

const isProduction = process.env.BETTER_AUTH_URL?.startsWith("https://");
const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Reset your Dialcues password",
        html: `
          <h2>Password Reset</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>We received a request to reset your password. Click the link below to choose a new one:</p>
          <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Reset password</a></p>
          <p style="color:#6b7280;font-size:14px;">If you didn't request this, you can safely ignore this email. The link expires in 1 hour.</p>
        `,
        text: `Reset your password: ${url}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Verify your Dialcues email",
        html: `
          <h2>Email Verification</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>Thanks for signing up! Please verify your email address by clicking the link below:</p>
          <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Verify email</a></p>
          <p style="color:#6b7280;font-size:14px;">If you didn't create an account, you can safely ignore this email.</p>
        `,
        text: `Verify your email: ${url}`,
      });
    },
  },
  plugins: [
    organization({
      teams: {
        enabled: true,
      },
      async sendInvitationEmail(data) {
        const inviteLink = `${frontendUrl}/accept-invitation/${data.id}`;
        void sendEmail({
          to: data.email,
          subject: `You've been invited to ${data.organization.name} on Dialcues`,
          html: `
            <h2>Organization Invitation</h2>
            <p>Hi,</p>
            <p><strong>${data.inviter.user.name || data.inviter.user.email}</strong> has invited you to join <strong>${data.organization.name}</strong> on Dialcues as a <strong>${data.role}</strong>.</p>
            <p><a href="${inviteLink}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Accept invitation</a></p>
            <p style="color:#6b7280;font-size:14px;">If you don't have a Dialcues account yet, you'll be asked to create one first.</p>
          `,
          text: `${data.inviter.user.name || data.inviter.user.email} invited you to join ${data.organization.name} on Dialcues. Accept here: ${inviteLink}`,
        });
      },
    }),
    ...(process.env.BETTER_AUTH_API_KEY
      ? [
          dash({
            apiKey: process.env.BETTER_AUTH_API_KEY,
            activityTracking: {
              enabled: true,
              updateInterval: 60000,
            },
          }),
        ]
      : []),
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8000",
  trustedOrigins: corsOrigins,
  advanced: {
    defaultCookieAttributes: {
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
    },
  },
});
