import Link from "next/link";
import { prisma } from "@/lib/db";
import { LATN_NUMBERING } from "@/lib/locale";
import { getLocale, getTranslations } from "@/lib/i18n/server";
import { pickAdvisoryExcerpt, pickLocalizedTitle } from "@/lib/i18n/pick-localized";
import { PublicSiteHeader } from "@/components/public-site-header";
import { PublicSiteFooter } from "@/components/public-site-footer";

const PLACEHOLDER_ADVISORIES = [
  {
    id: "1",
    titleAr: "إرشاد وقود طارئ - خطوط من وإلى شمال أوروبا",
    titleEn: "Emergency fuel surcharge",
    excerpt: "تحديث تعريفة الوقود الطارئ للمسارات المذكورة",
    excerptEn: "Updated emergency fuel surcharge",
    publishedAt: new Date("2026-03-11"),
    link: "#",
  },
  {
    id: "2",
    titleAr: "إعلان أسعار - خط من الشرق الأقصى إلى أفريقيا",
    titleEn: "Price announcement",
    excerpt: "أسعار FAK جديدة، الشرق الأقصى",
    excerptEn: "New FAK rates",
    publishedAt: new Date("2026-03-10"),
    link: "#",
  },
  {
    id: "3",
    titleAr: "تحديث أوقات العبور - آسيا إلى البحر الأحمر",
    titleEn: "Transit times update",
    excerpt: "أوقات عبور تنافسية عبر ميناء الملك عبدالله وجدة",
    excerptEn: "Competitive transit times",
    publishedAt: new Date("2026-03-09"),
    link: "#",
  },
  {
    id: "4",
    titleAr: "توسيع التغطية - الربط بين المدن والمحطات الجافة",
    titleEn: "Expanded coverage",
    excerpt: "إضافة مسارات جديدة للنقل البري",
    excerptEn: "New inland routes",
    publishedAt: new Date("2026-03-08"),
    link: "#",
  },
  {
    id: "5",
    titleAr: "إرشادات الشحن للموسم القادم",
    titleEn: "Next season guidelines",
    excerpt: "مواعيد وضوابط النقل البري للحاويات",
    excerptEn: "Schedules and rules",
    publishedAt: new Date("2026-03-07"),
    link: "#",
  },
];

function formatDate(d: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ar-SA-u-nu-latn", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...LATN_NUMBERING,
  }).format(d);
}

export default async function AdvisoriesPage() {
  const t = await getTranslations();
  const locale = await getLocale();

  let items: Awaited<ReturnType<typeof prisma.customerAdvisory.findMany>> = [];
  try {
    items = await prisma.customerAdvisory.findMany({
      orderBy: { publishedAt: "desc" },
    });
  } catch {
    /* tables may not exist */
  }
  const list = items.length > 0 ? items : PLACEHOLDER_ADVISORIES;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicSiteHeader />

      <main className="flex-1 container mx-auto px-4 py-12 md:py-16">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-2">{t("advisoriesUi.pageTitle")}</h1>
        <div className="w-24 h-0.5 bg-primary mx-auto mb-12" />

        <div className="max-w-4xl mx-auto space-y-4">
          {list.map((item) => {
            const title = pickLocalizedTitle(item, locale);
            const ex = pickAdvisoryExcerpt(item, locale);
            return (
              <Link
                key={item.id}
                href={item.link ?? "#"}
                className="block rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <time className="text-sm text-muted-foreground block mb-2">
                  {formatDate(item.publishedAt, locale)}
                </time>
                <h2 className="font-bold text-foreground text-lg leading-snug mb-2">{title}</h2>
                {ex ? <p className="text-sm text-muted-foreground">{ex}</p> : null}
              </Link>
            );
          })}
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
