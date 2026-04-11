import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const email = String(credentials.email);
          const { prisma } = await import("@/lib/db");
          const bcrypt = await import("bcrypt");
          const user = await prisma.user.findUnique({
            where: { email },
          });
          if (!user || !user.passwordHash) return null;
          const ok = await bcrypt.default.compare(
            String(credentials.password),
            user.passwordHash
          );
          if (!ok) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            role: user.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.email = user.email ?? undefined;
        token.name = user.name ?? undefined;
      }
      if (trigger === "update" && session) {
        const s = session as { name?: string | null; email?: string | null };
        if (s.name !== undefined) token.name = s.name;
        if (s.email !== undefined) token.email = s.email;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        if (token.email) session.user.email = token.email as string;
        if (token.name !== undefined && token.name !== null) {
          session.user.name = token.name as string;
        }
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isDashboard && !isLoggedIn) {
        return false;
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
};
