"use client";

import { useRef } from "react";
import Link from "next/link";

export type CustomerAdvisoryType = {
  id: string;
  titleAr: string;
  titleEn?: string | null;
  excerpt?: string | null;
  publishedAt: Date;
  link?: string | null;
};

const PLACEHOLDER_ADVISORIES: CustomerAdvisoryType[] = [
  {
    id: "1",
    titleAr: "إرشاد وقود طارئ - خطوط من وإلى شمال أوروبا",
    titleEn: "Emergency Fuel Surcharge - Trades from/to Northern Europe",
    excerpt: "تحديث تعريفة الوقود الطارئ للمسارات المذكورة",
    publishedAt: new Date("2026-03-11"),
    link: "#",
  },
  {
    id: "2",
    titleAr: "إعلان أسعار - خط من الشرق الأقصى إلى أفريقيا",
    titleEn: "Price Announcement - Trade from Far East to Sub-Saharan Africa",
    excerpt: "أسعار FAK جديدة، الشرق الأقصى",
    publishedAt: new Date("2026-03-10"),
    link: "#",
  },
  {
    id: "3",
    titleAr: "تحديث أوقات العبور - آسيا إلى البحر الأحمر",
    titleEn: "Transit Times Update - Asia to Red Sea",
    excerpt: "أوقات عبور تنافسية عبر ميناء الملك عبدالله وجدة",
    publishedAt: new Date("2026-03-09"),
    link: "#",
  },
  {
    id: "4",
    titleAr: "توسيع التغطية - الربط بين المدن والمحطات الجافة",
    titleEn: "Expanded coverage - City and dry port connectivity",
    excerpt: "إضافة مسارات جديدة للنقل البري",
    publishedAt: new Date("2026-03-08"),
    link: "#",
  },
  {
    id: "5",
    titleAr: "إرشادات الشحن للموسم القادم",
    titleEn: "Shipping guidelines for next season",
    excerpt: "مواعيد وضوابط النقل البري للحاويات",
    publishedAt: new Date("2026-03-07"),
    link: "#",
  },
];

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function CustomerGuidelinesSection({
  items,
  hideViewMore,
  itemLink,
}: {
  items?: CustomerAdvisoryType[];
  hideViewMore?: boolean;
  /** Optional: (item) => href for each card. If not set, uses item.link */
  itemLink?: (item: CustomerAdvisoryType) => string;
}) {
  const list = items ?? PLACEHOLDER_ADVISORIES;
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "prev" | "next") => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.clientWidth * 0.9;
    // In RTL, invert scroll so right arrow = go back (negative), left arrow = go forward (positive)
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
            إرشادات للعملاء
          </h2>
          {!hideViewMore && (
            <Link
              href="/advisories"
              className="inline-flex items-center gap-1 text-foreground font-medium hover:underline text-sm sm:text-base touch-manipulation"
            >
              معرفة المزيد
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
            aria-label="السابق"
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
            {list.map((item) => (
              <Link
                key={item.id}
                href={itemLink ? itemLink(item) : (item.link ?? "#")}
                className="shrink-0 w-[260px] sm:w-[280px] md:w-[320px] snap-start rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <time className="text-sm text-muted-foreground block mb-2">
                  {formatDate(item.publishedAt)}
                </time>
                <h3 className="font-bold text-foreground text-base leading-snug mb-2 line-clamp-2">
                  {item.titleAr}
                </h3>
                {item.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.excerpt}</p>
                )}
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scroll("next")}
            className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted border border-border flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors touch-manipulation"
            aria-label="التالي"
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
