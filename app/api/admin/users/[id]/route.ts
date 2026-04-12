import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { parseTagList } from "@/lib/catalog-tags";

function str(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  return String(v).trim();
}

function optStr(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
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

  const target = await prisma.user.findUnique({
    where: { id },
    include: { companyProfile: true, driverProfile: true },
  });

  if (!target) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (target.role !== UserRole.COMPANY && target.role !== UserRole.DRIVER) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const newEmailRaw = body.email != null ? str(body.email) : target.email;
  const emailChanged = newEmailRaw !== target.email;

  if (emailChanged) {
    const taken = await prisma.user.findFirst({
      where: { email: newEmailRaw, NOT: { id: target.id } },
    });
    if (taken) {
      return NextResponse.json({ error: "EMAIL_IN_USE" }, { status: 400 });
    }
  }

  const newPasswordRaw = body.newPassword != null ? String(body.newPassword) : "";
  let passwordHash: string | undefined;
  if (newPasswordRaw.length > 0) {
    if (newPasswordRaw.length < 8) {
      return NextResponse.json({ error: "WEAK_PASSWORD" }, { status: 400 });
    }
    passwordHash = await bcrypt.hash(newPasswordRaw, 10);
  }

  if (target.role === UserRole.COMPANY) {
    if (!target.companyProfile) {
      return NextResponse.json({ error: "GENERIC" }, { status: 500 });
    }

    const companyName = body.companyName != null ? str(body.companyName) : target.companyProfile.companyName;
    const contactPerson = body.contactPerson != null ? str(body.contactPerson) : target.companyProfile.contactPerson;
    const phone = body.phone != null ? str(body.phone) : target.companyProfile.phone;
    const address =
      body.address !== undefined
        ? optStr(body.address)
        : target.companyProfile.address;
    const city =
      body.city !== undefined ? optStr(body.city) : target.companyProfile.city;
    const commercialRegister =
      body.commercialRegister !== undefined
        ? optStr(body.commercialRegister)
        : target.companyProfile.commercialRegister;

    if (!companyName || !contactPerson || !phone) {
      return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: target.id },
        data: {
          name: contactPerson,
          email: emailChanged ? newEmailRaw : undefined,
          ...(passwordHash ? { passwordHash } : {}),
        },
      }),
      prisma.companyProfile.update({
        where: { userId: target.id },
        data: {
          companyName,
          contactPerson,
          phone,
          address: address === undefined ? undefined : address,
          city: city === undefined ? undefined : city,
          commercialRegister: commercialRegister === undefined ? undefined : commercialRegister,
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  }

  // DRIVER
  if (!target.driverProfile) {
    return NextResponse.json({ error: "GENERIC" }, { status: 500 });
  }

  const dp = target.driverProfile;
  const fullName = body.fullName != null ? str(body.fullName) : dp.fullName;
  const phone = body.phone != null ? str(body.phone) : dp.phone;
  const carType = body.carType != null ? str(body.carType) : dp.carType ?? "";
  const carCapacity = body.carCapacity != null ? str(body.carCapacity) : dp.carCapacity ?? "";

  const vehicleTruckSummary = [carType, carCapacity, dp.carPlate].filter(Boolean).join(" ").trim();

  const listingCompanyName =
    body.listingCompanyName != null ? str(body.listingCompanyName) : dp.listingCompanyName?.trim() || fullName;
  const representativeName =
    body.representativeName != null ? str(body.representativeName) : dp.representativeName?.trim() || fullName;
  const truckTypesCatalog =
    body.truckTypesCatalog != null ? str(body.truckTypesCatalog) : dp.truckTypesCatalog?.trim() || vehicleTruckSummary || fullName;
  const serviceDestinations =
    body.serviceDestinations !== undefined ? optStr(body.serviceDestinations) : dp.serviceDestinations;

  if (
    !fullName ||
    !phone ||
    !carType ||
    !carCapacity ||
    !listingCompanyName ||
    parseTagList(truckTypesCatalog).length === 0 ||
    parseTagList(serviceDestinations ?? "").length === 0
  ) {
    return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: target.id },
      data: {
        name: fullName,
        email: emailChanged ? newEmailRaw : undefined,
        ...(passwordHash ? { passwordHash } : {}),
      },
    }),
    prisma.driverProfile.update({
      where: { userId: target.id },
      data: {
        fullName,
        phone,
        carType,
        carCapacity,
        listingCompanyName,
        representativeName,
        truckTypesCatalog,
        serviceDestinations: serviceDestinations === undefined ? undefined : serviceDestinations,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "CANNOT_DELETE_SELF" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });

  if (!target) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (target.role !== UserRole.COMPANY && target.role !== UserRole.DRIVER) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.shipmentRequest.updateMany({ where: { companyId: id }, data: { companyId: null } }),
    prisma.shipmentRequest.updateMany({ where: { carrierId: id }, data: { carrierId: null } }),
    prisma.shipmentRequest.updateMany({ where: { adminId: id }, data: { adminId: null } }),
    prisma.user.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
