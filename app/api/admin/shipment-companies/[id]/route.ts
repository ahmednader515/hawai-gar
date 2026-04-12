import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

function optStr(v: unknown): string | null {
  if (v == null || v === "") return null;
  return String(v).trim();
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
  }

  const existing = await prisma.shipmentCompany.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const company_name = body.company_name !== undefined ? optStr(body.company_name) : existing.company_name;
  const representative_name =
    body.representative_name !== undefined ? optStr(body.representative_name) : existing.representative_name;
  const email = body.email !== undefined ? optStr(body.email) : existing.email;
  const phone = body.phone !== undefined ? optStr(body.phone) : existing.phone;
  const truck_types = body.truck_types !== undefined ? optStr(body.truck_types) : existing.truck_types;
  const destinations = body.destinations !== undefined ? optStr(body.destinations) : existing.destinations;

  await prisma.shipmentCompany.update({
    where: { id },
    data: {
      company_name,
      representative_name,
      email,
      phone,
      truck_types,
      destinations,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.shipmentCompany.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.shipmentCompany.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
