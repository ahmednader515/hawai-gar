import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeEmailKey, sendEmailVerificationCode } from "@/lib/email-verification";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw = typeof body?.email === "string" ? body.email.trim() : "";
    if (!raw || !raw.includes("@")) {
      return NextResponse.json({ error: "بريد إلكتروني غير صالح" }, { status: 400 });
    }

    const emailKey = normalizeEmailKey(raw);

    const existing = await prisma.user.findFirst({
      where: { email: { equals: raw, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json({ error: "البريد الإلكتروني مستخدم مسبقاً" }, { status: 400 });
    }

    await prisma.registrationVerification.deleteMany({
      where: { email: emailKey },
    });

    const result = await sendEmailVerificationCode({ email: raw });
    if (!result.sent) {
      return NextResponse.json(
        { error: "تعذر إرسال رمز التحقق. تحقق من إعدادات البريد على الخادم." },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
