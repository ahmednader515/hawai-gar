import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

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
      nationalId,
      licenseNumber,
      carPlate,
      carType,
      carCapacity,
    } = body;

    if (!email || !password || !role) {
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
      const user = await prisma.user.create({
        data: {
          email: String(email).trim(),
          name: name ? String(name) : null,
          passwordHash,
          role: UserRole.COMPANY,
        },
      });
      await prisma.companyProfile.create({
        data: {
          userId: user.id,
          companyName: String(companyName),
          commercialRegister: commercialRegister ? String(commercialRegister) : null,
          contactPerson: String(contactPerson),
          phone: String(phone),
          address: address ? String(address) : null,
          city: city ? String(city) : null,
        },
      });
      return NextResponse.json({
        ok: true,
        userId: user.id,
        role: user.role,
        redirect: "/dashboard/company",
      });
    }

    if (r === UserRole.DRIVER) {
      if (!fullName || !phone || !carPlate) {
        return NextResponse.json(
          {
            error:
              "الاسم الكامل والهاتف ورقم اللوحة مطلوبة لإنشاء حساب شركة نقل",
          },
          { status: 400 }
        );
      }
      const user = await prisma.user.create({
        data: {
          email: String(email).trim(),
          name: fullName ? String(fullName) : null,
          passwordHash,
          role: UserRole.DRIVER,
        },
      });
      await prisma.driverProfile.create({
        data: {
          userId: user.id,
          fullName: String(fullName),
          nationalId: nationalId ? String(nationalId) : null,
          phone: String(phone),
          licenseNumber: licenseNumber ? String(licenseNumber) : null,
          carPlate: String(carPlate),
          carType: carType ? String(carType) : null,
          carCapacity: carCapacity ? String(carCapacity) : null,
        },
      });
      return NextResponse.json({
        ok: true,
        userId: user.id,
        role: user.role,
        redirect: "/dashboard/client",
      });
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
