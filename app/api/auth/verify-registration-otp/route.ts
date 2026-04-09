import { NextResponse } from "next/server";
import { verifyRegistrationOtp } from "@/lib/email-verification";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!email || !code) {
      return NextResponse.json({ error: "البريد والرمز مطلوبان" }, { status: 400 });
    }

    const result = await verifyRegistrationOtp({ email, code });
    if (!result.ok) {
      const msg =
        result.reason === "expired"
          ? "انتهت صلاحية الرمز. اطلب رمزاً جديداً."
          : "رمز غير صحيح.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
