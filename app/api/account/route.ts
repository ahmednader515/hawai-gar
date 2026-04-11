import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        driverProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.DRIVER) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      role: user.role,
      driverProfile: user.driverProfile,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "GENERIC" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { driverProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.DRIVER) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const currentPassword = body.currentPassword != null ? String(body.currentPassword) : "";
    const newPasswordRaw = body.newPassword != null ? String(body.newPassword) : "";
    const newEmail = body.email != null ? String(body.email).trim() : user.email;
    const emailChanged = newEmail !== user.email;

    const needsPasswordCheck = emailChanged || newPasswordRaw.length > 0;

    if (needsPasswordCheck) {
      if (!currentPassword.trim()) {
        return NextResponse.json(
          { error: "PASSWORD_REQUIRED" },
          { status: 400 },
        );
      }
      if (!user.passwordHash) {
        return NextResponse.json(
          { error: "INVALID_PASSWORD" },
          { status: 400 },
        );
      }
      const ok = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!ok) {
        return NextResponse.json(
          { error: "INVALID_PASSWORD" },
          { status: 400 },
        );
      }
    }

    if (emailChanged) {
      const taken = await prisma.user.findFirst({
        where: { email: newEmail, NOT: { id: user.id } },
      });
      if (taken) {
        return NextResponse.json({ error: "EMAIL_IN_USE" }, { status: 400 });
      }
    }

    let passwordHash: string | undefined;
    if (newPasswordRaw.length > 0) {
      if (newPasswordRaw.length < 8) {
        return NextResponse.json({ error: "WEAK_PASSWORD" }, { status: 400 });
      }
      passwordHash = await bcrypt.hash(newPasswordRaw, 10);
    }

    if (user.role === UserRole.ADMIN) {
      let name = user.name;
      if (body.name !== undefined && body.name !== null) {
        name = String(body.name).trim() || null;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name,
          email: emailChanged ? newEmail : undefined,
          ...(passwordHash ? { passwordHash } : {}),
        },
      });
      return NextResponse.json({ ok: true });
    }

    // DRIVER (carrier)
    const fullName =
      body.fullName !== undefined && body.fullName !== null
        ? String(body.fullName).trim()
        : user.driverProfile?.fullName ?? "";
    const phone =
      body.phone !== undefined && body.phone !== null
        ? String(body.phone).trim()
        : user.driverProfile?.phone ?? "";
    const carPlate =
      body.carPlate !== undefined && body.carPlate !== null
        ? String(body.carPlate).trim()
        : user.driverProfile?.carPlate ?? "";
    const carType =
      body.carType !== undefined && body.carType !== null
        ? String(body.carType).trim()
        : user.driverProfile?.carType ?? "";
    const carCapacity =
      body.carCapacity !== undefined && body.carCapacity !== null
        ? String(body.carCapacity).trim()
        : user.driverProfile?.carCapacity ?? "";

    if (!fullName || !phone || !carPlate || !carType || !carCapacity) {
      return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
    }

    const nationalId =
      body.nationalId !== undefined && body.nationalId !== null && String(body.nationalId).trim()
        ? String(body.nationalId).trim()
        : null;
    const licenseNumber =
      body.licenseNumber !== undefined && body.licenseNumber !== null && String(body.licenseNumber).trim()
        ? String(body.licenseNumber).trim()
        : null;

    if (!user.driverProfile) {
      return NextResponse.json({ error: "GENERIC" }, { status: 500 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          name: fullName,
          email: emailChanged ? newEmail : undefined,
          ...(passwordHash ? { passwordHash } : {}),
        },
      }),
      prisma.driverProfile.update({
        where: { userId: user.id },
        data: {
          fullName,
          phone,
          nationalId,
          licenseNumber,
          carPlate,
          carType,
          carCapacity,
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "GENERIC" }, { status: 500 });
  }
}
