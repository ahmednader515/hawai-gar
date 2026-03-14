import NextAuth from "next-auth";
import { authConfigEdge } from "./auth.config.edge";

/**
 * Auth instance for Edge (middleware). Uses config without Prisma.
 * API route continues to use auth.ts with full Credentials config.
 */
export const { auth } = NextAuth({
  ...authConfigEdge,
  trustHost: true,
});
