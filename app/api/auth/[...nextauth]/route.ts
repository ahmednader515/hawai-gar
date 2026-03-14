import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const handler = NextAuth({
  ...authConfig,
  trustHost: true,
});

export const GET = handler.handlers.GET;
export const POST = handler.handlers.POST;
