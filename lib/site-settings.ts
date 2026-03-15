import { prisma } from "@/lib/db";

const KEY_HERO_CONTACT_EMAIL = "hero_contact_email";
const KEY_HERO_CONTACT_PHONE = "hero_contact_phone";

const DEFAULT_EMAIL = "info@hawajgar.com";

export type HeroContactInfo = {
  email: string;
  phone: string | null;
};

export async function getHeroContact(): Promise<HeroContactInfo> {
  try {
    const [emailRow, phoneRow] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: KEY_HERO_CONTACT_EMAIL } }),
      prisma.siteSetting.findUnique({ where: { key: KEY_HERO_CONTACT_PHONE } }),
    ]);
    return {
      email: emailRow?.value?.trim() || DEFAULT_EMAIL,
      phone: phoneRow?.value?.trim() || null,
    };
  } catch {
    return { email: DEFAULT_EMAIL, phone: null };
  }
}

export async function setHeroContact(data: { email?: string; phone?: string | null }) {
  if (data.email !== undefined) {
    await prisma.siteSetting.upsert({
      where: { key: KEY_HERO_CONTACT_EMAIL },
      create: { key: KEY_HERO_CONTACT_EMAIL, value: data.email.trim() },
      update: { value: data.email.trim() },
    });
  }
  if (data.phone !== undefined) {
    const value = data.phone?.trim() || "";
    await prisma.siteSetting.upsert({
      where: { key: KEY_HERO_CONTACT_PHONE },
      create: { key: KEY_HERO_CONTACT_PHONE, value },
      update: { value },
    });
  }
}
