import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function loginRedirect(req: Request, status: "success" | "invalid" | "expired") {
  const url = new URL(req.url);
  url.pathname = "/login";
  url.search = `verifyEmail=${status}`;
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
  const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";

  if (!token || !email) {
    return loginRedirect(req, "invalid");
  }

  const verification = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verification || verification.identifier.toLowerCase() !== email) {
    return loginRedirect(req, "invalid");
  }

  if (verification.expires < new Date()) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: verification.identifier },
    });
    return loginRedirect(req, "expired");
  }

  await prisma.user.updateMany({
    where: { email: verification.identifier },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.deleteMany({
    where: { identifier: verification.identifier },
  });

  return loginRedirect(req, "success");
}
