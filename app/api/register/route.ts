import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { normalizeEmailKey } from "@/lib/email-verification";
import { parseTagList } from "@/lib/catalog-tags";
import { normalizeAndValidateE164 } from "@/lib/phone";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      role,
      name,
      companyName,
      commercialRegister,
      contactPerson,
      phone,
      address,
      city,
      fullName,
      carType,
      carCapacity,
      listingCompanyName,
      representativeName,
      truckTypesCatalog,
      serviceDestinations,
      guestShipmentRegistration,
      registrationPreVerified,
    } = body;

    if (!email || !String(password).trim() || !role) {
      return NextResponse.json(
        { error: "البريد الإلكتروني وكلمة المرور ونوع الحساب مطلوبة" },
        { status: 400 }
      );
    }

    const r = role as string;
    if (r !== UserRole.COMPANY && r !== UserRole.DRIVER) {
      return NextResponse.json(
        { error: "نوع الحساب يجب أن يكون شركة أو شركة نقل" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: String(email).trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مستخدم مسبقاً" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    if (r === UserRole.COMPANY) {
      if (!companyName || !contactPerson || !phone) {
        return NextResponse.json(
          {
            error:
              "اسم الشركة واسم المسؤول والهاتف مطلوبة لإنشاء حساب شركة",
          },
          { status: 400 }
        );
      }
      const phoneCheck = normalizeAndValidateE164(phone);
      if (!phoneCheck.ok) {
        return NextResponse.json({ error: "رقم الهاتف غير صالح" }, { status: 400 });
      }

      const normalizedEmail = String(email).trim();
      const emailKey = normalizeEmailKey(normalizedEmail);
      const isGuestShipment = Boolean(guestShipmentRegistration);
      const isPreVerified = Boolean(registrationPreVerified);

      if (!isGuestShipment && !isPreVerified) {
        return NextResponse.json(
          { error: "يجب تأكيد البريد الإلكتروني برمز التحقق قبل إنشاء الحساب" },
          { status: 400 },
        );
      }

      try {
        const { user } = await prisma.$transaction(async (tx) => {
          const gate = await tx.registrationVerification.findUnique({
            where: { email: emailKey },
          });
          if (!gate || gate.expiresAt < new Date()) {
            throw Object.assign(new Error("NO_GATE"), { code: "NO_GATE" });
          }

          const createdUser = await tx.user.create({
            data: {
              email: normalizedEmail,
              name: name ? String(name) : null,
              passwordHash,
              role: UserRole.COMPANY,
              emailVerified: new Date(),
            },
          });

          await tx.companyProfile.create({
            data: {
              userId: createdUser.id,
              companyName: String(companyName),
              commercialRegister: commercialRegister ? String(commercialRegister) : null,
              contactPerson: String(contactPerson),
              phone: phoneCheck.e164,
              address: address ? String(address) : null,
              city: city ? String(city) : null,
            },
          });

          await tx.registrationVerification.delete({
            where: { email: emailKey },
          });

          return { user: createdUser };
        });

        return NextResponse.json({
          ok: true,
          userId: user.id,
          role: user.role,
          redirect: "/?openShipment=1",
          verificationEmailSent: false,
        });
      } catch (err: unknown) {
        if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "NO_GATE") {
          return NextResponse.json(
            { error: "يجب تأكيد البريد الإلكتروني برمز التحقق قبل إنشاء الحساب" },
            { status: 400 },
          );
        }
        throw err;
      }
    }

    if (r === UserRole.DRIVER) {
      const listing = listingCompanyName != null ? String(listingCompanyName).trim() : "";
      const truckCat = truckTypesCatalog != null ? String(truckTypesCatalog).trim() : "";
      const svcDest = serviceDestinations != null ? String(serviceDestinations).trim() : "";
      const repName =
        representativeName != null && String(representativeName).trim()
          ? String(representativeName).trim()
          : String(fullName ?? "").trim();

      const truckTagCount = parseTagList(truckCat).length;
      const destTagCount = parseTagList(svcDest).length;
      if (
        !fullName ||
        !phone ||
        !carType ||
        !carCapacity ||
        !listing ||
        truckTagCount === 0 ||
        destTagCount === 0
      ) {
        return NextResponse.json(
          {
            error:
              "اسم المنشأة الظاهر في الدليل والهاتف ونوع الشاحنة وحجم الشاحنة وأنواع الشاحنات والاتجاهات مطلوبة لإنشاء حساب شركة نقل",
          },
          { status: 400 }
        );
      }
      const phoneCheck = normalizeAndValidateE164(phone);
      if (!phoneCheck.ok) {
        return NextResponse.json({ error: "رقم الهاتف غير صالح" }, { status: 400 });
      }
      if (!registrationPreVerified) {
        return NextResponse.json(
          { error: "يجب تأكيد البريد الإلكتروني برمز التحقق قبل إنشاء الحساب" },
          { status: 400 },
        );
      }

      const normalizedEmail = String(email).trim();
      const emailKey = normalizeEmailKey(normalizedEmail);

      try {
        const { user } = await prisma.$transaction(async (tx) => {
          const gate = await tx.registrationVerification.findUnique({
            where: { email: emailKey },
          });
          if (!gate || gate.expiresAt < new Date()) {
            throw Object.assign(new Error("NO_GATE"), { code: "NO_GATE" });
          }

          const createdUser = await tx.user.create({
            data: {
              email: normalizedEmail,
              name: fullName ? String(fullName) : null,
              passwordHash,
              role: UserRole.DRIVER,
              emailVerified: new Date(),
            },
          });

          await tx.driverProfile.create({
            data: {
              fullName: String(fullName),
              nationalId: null,
              phone: phoneCheck.e164,
              licenseNumber: null,
              carPlate: null,
              carType: String(carType),
              carCapacity: String(carCapacity),
              listingCompanyName: listing,
              representativeName: repName,
              truckTypesCatalog: truckCat,
              serviceDestinations: svcDest,
              user: { connect: { id: createdUser.id } },
            },
          });

          await tx.registrationVerification.delete({
            where: { email: emailKey },
          });

          return { user: createdUser };
        });

        return NextResponse.json({
          ok: true,
          userId: user.id,
          role: user.role,
          redirect: "/dashboard/client",
          verificationEmailSent: false,
        });
      } catch (err: unknown) {
        if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "NO_GATE") {
          return NextResponse.json(
            { error: "يجب تأكيد البريد الإلكتروني برمز التحقق قبل إنشاء الحساب" },
            { status: 400 },
          );
        }
        throw err;
      }
    }

    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء التسجيل" },
      { status: 500 }
    );
  }
}
