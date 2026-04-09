import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmailVerificationCode } from "@/lib/email-verification";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw = typeof body?.email === "string" ? body.email.trim() : "";
    if (!raw) {
      return NextResponse.json({ error: "البريد مطلوب" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: raw, mode: "insensitive" } },
    });

    if (!user) {
      return NextResponse.json({ error: "لم يتم العثور على الحساب" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "البريد مُفعّل مسبقاً" }, { status: 400 });
    }

    const result = await sendEmailVerificationCode({ email: user.email });
    if (!result.sent) {
      return NextResponse.json(
        { error: "تعذر إرسال البريد. تحقق من إعدادات الخادم." },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
