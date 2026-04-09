import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeEmailKey } from "@/lib/email-verification";

/** Clears OTP + “email verified for signup” state when user goes back or cancels guest signup. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw = typeof body?.email === "string" ? body.email.trim() : "";
    if (!raw) {
      return NextResponse.json({ ok: true });
    }

    const emailKey = normalizeEmailKey(raw);
    await prisma.registrationVerification.deleteMany({ where: { email: emailKey } });
    await prisma.emailVerificationOtp.deleteMany({ where: { email: emailKey } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
