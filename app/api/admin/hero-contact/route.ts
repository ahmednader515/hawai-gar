import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getHeroContact, setHeroContact } from "@/lib/site-settings";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const contact = await getHeroContact();
    return NextResponse.json(contact);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load contact" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { email, phone } = body;
    await setHeroContact({
      email: typeof email === "string" ? email : undefined,
      phone: phone !== undefined ? (typeof phone === "string" ? phone : null) : undefined,
    });
    const contact = await getHeroContact();
    return NextResponse.json(contact);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
  }
}
