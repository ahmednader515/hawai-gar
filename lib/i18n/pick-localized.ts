import type { AppLocale } from "@/lib/i18n/config";

/** محتوى من الأدمن: عنوان حسب لغة العرض مع الرجوع للعربية */
export function pickLocalizedTitle(
  item: { titleAr: string; titleEn?: string | null },
  locale: AppLocale,
): string {
  if (locale === "en" && item.titleEn?.trim()) return item.titleEn.trim();
  return item.titleAr;
}

export function pickNewsCategory(
  item: { category: string; categoryEn?: string | null },
  locale: AppLocale,
): string {
  if (locale === "en" && item.categoryEn?.trim()) return item.categoryEn.trim();
  return item.category;
}

export function pickNewsExcerpt(
  item: { excerpt?: string | null; excerptEn?: string | null },
  locale: AppLocale,
): string | null {
  if (locale === "en" && item.excerptEn?.trim()) return item.excerptEn.trim();
  return item.excerpt?.trim() ? item.excerpt.trim() : null;
}

export function pickAdvisoryExcerpt(
  item: { excerpt?: string | null; excerptEn?: string | null },
  locale: AppLocale,
): string | null {
  if (locale === "en" && item.excerptEn?.trim()) return item.excerptEn.trim();
  return item.excerpt?.trim() ? item.excerpt.trim() : null;
}
