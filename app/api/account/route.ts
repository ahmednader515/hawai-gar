import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { parseTagList } from "@/lib/catalog-tags";
import { normalizeAndValidateE164 } from "@/lib/phone";

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
        companyProfile: true,
        driverProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const base = {
      name: user.name,
      email: user.email,
      role: user.role,
    };

    if (user.role === UserRole.COMPANY) {
      return NextResponse.json({
        ...base,
        companyProfile: user.companyProfile,
      });
    }

    if (user.role === UserRole.DRIVER) {
      return NextResponse.json({
        ...base,
        driverProfile: user.driverProfile,
      });
    }

    return NextResponse.json(base);
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
      include: { driverProfile: true, companyProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const currentPassword = body.currentPassword != null ? String(body.currentPassword) : "";
    const newPasswordRaw = body.newPassword != null ? String(body.newPassword) : "";
    const newEmail = body.email != null ? String(body.email).trim() : user.email;
    const emailChanged = newEmail !== user.email;

    const needsPasswordCheck = emailChanged || newPasswordRaw.length > 0;

    if (user.role === UserRole.COMPANY) {
      if (!user.companyProfile) {
        return NextResponse.json({ error: "GENERIC" }, { status: 500 });
      }

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

      const companyName =
        body.companyName != null
          ? String(body.companyName).trim()
          : user.companyProfile.companyName;
      const contactPerson =
        body.contactPerson != null
          ? String(body.contactPerson).trim()
          : user.companyProfile.contactPerson;
      const phone =
        body.phone != null ? String(body.phone).trim() : user.companyProfile.phone;
      const address =
        body.address !== undefined
          ? body.address === null || body.address === ""
            ? null
            : String(body.address).trim()
          : user.companyProfile.address;
      const city =
        body.city !== undefined
          ? body.city === null || body.city === ""
            ? null
            : String(body.city).trim()
          : user.companyProfile.city;
      const commercialRegister =
        body.commercialRegister !== undefined
          ? body.commercialRegister === null || body.commercialRegister === ""
            ? null
            : String(body.commercialRegister).trim()
          : user.companyProfile.commercialRegister;

      if (!companyName || !contactPerson || !phone) {
        return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
      }
      const phoneCheck = normalizeAndValidateE164(phone);
      if (!phoneCheck.ok) {
        return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            name: contactPerson,
            email: emailChanged ? newEmail : undefined,
            ...(passwordHash ? { passwordHash } : {}),
          },
        }),
        prisma.companyProfile.update({
          where: { userId: user.id },
          data: {
            companyName,
            contactPerson,
            phone: phoneCheck.e164,
            address,
            city,
            commercialRegister,
          },
        }),
      ]);

      return NextResponse.json({ ok: true });
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.DRIVER) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

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
    const carType =
      body.carType !== undefined && body.carType !== null
        ? String(body.carType).trim()
        : user.driverProfile?.carType ?? "";
    const carCapacity =
      body.carCapacity !== undefined && body.carCapacity !== null
        ? String(body.carCapacity).trim()
        : user.driverProfile?.carCapacity ?? "";

    if (!fullName || !phone || !carType || !carCapacity) {
      return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
    }
    const phoneCheck = normalizeAndValidateE164(phone);
    if (!phoneCheck.ok) {
      return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
    }

    const dp = user.driverProfile;
    const strOr = (v: unknown, fallback: string) =>
      v !== undefined && v !== null && String(v).trim() ? String(v).trim() : fallback;

    const vehicleTruckSummary = [carType, carCapacity, dp?.carPlate].filter(Boolean).join(" ").trim();

    const listingCompanyName = strOr(
      body.listingCompanyName,
      dp?.listingCompanyName?.trim() || fullName,
    );
    const representativeName = strOr(
      body.representativeName,
      dp?.representativeName?.trim() || fullName,
    );
    const truckTypesCatalog = strOr(
      body.truckTypesCatalog,
      dp?.truckTypesCatalog?.trim() || vehicleTruckSummary || fullName,
    );
    const serviceDestinationsRaw =
      body.serviceDestinations !== undefined && body.serviceDestinations !== null
        ? String(body.serviceDestinations).trim()
        : null;
    const serviceDestinations =
      serviceDestinationsRaw !== null && serviceDestinationsRaw !== ""
        ? serviceDestinationsRaw
        : dp?.serviceDestinations?.trim() ?? null;

    if (!user.driverProfile) {
      return NextResponse.json({ error: "GENERIC" }, { status: 500 });
    }

    if (
      !listingCompanyName ||
      parseTagList(truckTypesCatalog).length === 0 ||
      parseTagList(serviceDestinations ?? "").length === 0
    ) {
      return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
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
          phone: phoneCheck.e164,
          carType,
          carCapacity,
          listingCompanyName,
          representativeName,
          truckTypesCatalog,
          serviceDestinations,
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "GENERIC" }, { status: 500 });
  }
}
