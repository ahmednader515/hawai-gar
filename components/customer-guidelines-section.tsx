"use client";

import { useRef } from "react";
import Link from "next/link";
import { LATN_NUMBERING } from "@/lib/locale";
import { useI18n } from "@/components/providers/i18n-provider";
import type { AppLocale } from "@/lib/i18n/config";
import { pickAdvisoryExcerpt, pickLocalizedTitle } from "@/lib/i18n/pick-localized";

export type CustomerAdvisoryType = {
  id: string;
  titleAr: string;
  titleEn?: string | null;
  excerpt?: string | null;
  excerptEn?: string | null;
  publishedAt: Date;
  link?: string | null;
};

const PLACEHOLDER_ADVISORIES: CustomerAdvisoryType[] = [
  {
    id: "1",
    titleAr: "إرشاد وقود طارئ - خطوط من وإلى شمال أوروبا",
    titleEn: "Emergency Fuel Surcharge - Trades from/to Northern Europe",
    excerpt: "تحديث تعريفة الوقود الطارئ للمسارات المذكورة",
    excerptEn: "Updated emergency fuel surcharge for these trades",
    publishedAt: new Date("2026-03-11"),
    link: "#",
  },
  {
    id: "2",
    titleAr: "إعلان أسعار - خط من الشرق الأقصى إلى أفريقيا",
    titleEn: "Price Announcement - Trade from Far East to Sub-Saharan Africa",
    excerpt: "أسعار FAK جديدة، الشرق الأقصى",
    excerptEn: "New FAK rates, Far East",
    publishedAt: new Date("2026-03-10"),
    link: "#",
  },
  {
    id: "3",
    titleAr: "تحديث أوقات العبور - آسيا إلى البحر الأحمر",
    titleEn: "Transit Times Update - Asia to Red Sea",
    excerpt: "أوقات عبور تنافسية عبر ميناء الملك عبدالله وجدة",
    excerptEn: "Competitive transit via King Abdullah Port and Jeddah",
    publishedAt: new Date("2026-03-09"),
    link: "#",
  },
  {
    id: "4",
    titleAr: "توسيع التغطية - الربط بين المدن والمحطات الجافة",
    titleEn: "Expanded coverage - City and dry port connectivity",
    excerpt: "إضافة مسارات جديدة للنقل البري",
    excerptEn: "New inland routes added",
    publishedAt: new Date("2026-03-08"),
    link: "#",
  },
  {
    id: "5",
    titleAr: "إرشادات الشحن للموسم القادم",
    titleEn: "Shipping guidelines for next season",
    excerpt: "مواعيد وضوابط النقل البري للحاويات",
    excerptEn: "Schedules and rules for inland container moves",
    publishedAt: new Date("2026-03-07"),
    link: "#",
  },
];

function formatDate(d: unknown, locale: AppLocale) {
  const date = d instanceof Date ? d : new Date(d as string);
  if (Number.isNaN(date.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ar-SA-u-nu-latn", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      ...LATN_NUMBERING,
    }).format(date);
  } catch {
    return "—";
  }
}

export function CustomerGuidelinesSection({
  items,
  hideViewMore,
  itemLink,
}: {
  items?: CustomerAdvisoryType[];
  hideViewMore?: boolean;
  itemLink?: (item: CustomerAdvisoryType) => string;
}) {
  const { t, locale } = useI18n();
  const list = items ?? PLACEHOLDER_ADVISORIES;
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "prev" | "next") => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.clientWidth * 0.9;
    scrollRef.current.scrollBy({
      left: dir === "next" ? -width : width,
      behavior: "smooth",
    });
  };

  return (
    <section id="advisories" className="pt-0 pb-12 sm:pb-16 md:pb-24 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground px-1">
            {t("advisoriesUi.sectionTitle")}
          </h2>
          {!hideViewMore && (
            <Link
              href="/advisories"
              className="inline-flex items-center gap-1 text-foreground font-medium hover:underline text-sm sm:text-base touch-manipulation"
            >
              {t("advisoriesUi.viewMore")}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        <div className="relative flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => scroll("prev")}
            className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted border border-border flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors touch-manipulation"
            aria-label={t("aria.previous")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div
            ref={scrollRef}
            className="flex-1 overflow-x-auto scroll-smooth flex gap-4 pb-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {list.map((item) => {
              const ex = pickAdvisoryExcerpt(item, locale);
              return (
                <Link
                  key={item.id}
                  href={itemLink ? itemLink(item) : (item.link ?? "#")}
                  className="shrink-0 w-[260px] sm:w-[280px] md:w-[320px] snap-start rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <time className="text-sm text-muted-foreground block mb-2">
                    {formatDate(item.publishedAt, locale)}
                  </time>
                  <h3 className="font-bold text-foreground text-base leading-snug mb-2 line-clamp-2">
                    {pickLocalizedTitle(item, locale)}
                  </h3>
                  {ex ? <p className="text-sm text-muted-foreground line-clamp-2">{ex}</p> : null}
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scroll("next")}
            className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted border border-border flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors touch-manipulation"
            aria-label={t("aria.next")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
