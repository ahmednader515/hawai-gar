import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { LATN_NUMBERING } from "@/lib/locale";
import { getLocale, getTranslations } from "@/lib/i18n/server";
import { pickLocalizedTitle, pickNewsCategory, pickNewsExcerpt } from "@/lib/i18n/pick-localized";
import { PublicSiteHeader } from "@/components/public-site-header";
import { PublicSiteFooter } from "@/components/public-site-footer";

const PLACEHOLDER_NEWS = [
  {
    id: "1",
    titleAr: "تعزيز الربط بين آسيا وأوروبا عبر النقل البري",
    titleEn: "Enhancing Asia-Europe connectivity",
    category: "النقل البري والخدمات اللوجستية",
    categoryEn: "Land transport",
    imageUrl: "/land-shipping-1.png",
    excerpt: "خدمات نقل حاويات موثوقة بين مدن المملكة",
    excerptEn: "Reliable container services",
    link: "#",
    publishedAt: new Date("2026-03-09"),
  },
  {
    id: "2",
    titleAr: "إرشادات للعملاء - تحديث أسعار النقل",
    titleEn: "Customer advisory - rates",
    category: "إرشادات العملاء",
    categoryEn: "Advisories",
    imageUrl: "/land-shipping-2.png",
    excerpt: "تحديثات على تعريفة النقل البري للحاويات",
    excerptEn: "Updates to inland rates",
    link: "#",
    publishedAt: new Date("2026-03-10"),
  },
  {
    id: "3",
    titleAr: "توسيع شبكة التغطية إلى مدن جديدة",
    titleEn: "Expanding coverage",
    category: "شبكة النقل",
    categoryEn: "Network",
    imageUrl: "/land-shipping-3.png",
    excerpt: "إضافة مسارات ومحطات جديدة في المملكة",
    excerptEn: "New routes and hubs",
    link: "#",
    publishedAt: new Date("2026-03-11"),
  },
  {
    id: "4",
    titleAr: "عودة الخدمات الموسمية للنقل المكثف",
    titleEn: "Seasonal services",
    category: "خدمات النقل",
    categoryEn: "Services",
    imageUrl: "/land-shipping-4.png",
    excerpt: "استعدادنا لفترة الذروة مع شركات نقل إضافية",
    excerptEn: "Peak season readiness",
    link: "#",
    publishedAt: new Date("2026-03-12"),
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

export default async function NewsPage() {
  const t = await getTranslations();
  const locale = await getLocale();

  let items: Awaited<ReturnType<typeof prisma.newsItem.findMany>> = [];
  try {
    items = await prisma.newsItem.findMany({
      orderBy: { publishedAt: "desc" },
    });
  } catch {
    /* tables may not exist */
  }
  const list = items.length > 0 ? items : PLACEHOLDER_NEWS;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicSiteHeader />

      <main className="flex-1 container mx-auto px-4 py-12 md:py-16">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-2">{t("newsUi.pageTitle")}</h1>
        <div className="w-24 h-0.5 bg-primary mx-auto mb-12" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {list.map((item) => {
            const title = pickLocalizedTitle(item, locale);
            const cat = pickNewsCategory(item, locale);
            const ex = pickNewsExcerpt(item, locale);
            return (
              <Link
                key={item.id}
                href={item.link ?? "#"}
                className="group relative block overflow-hidden rounded-xl border border-border shadow-md min-h-[300px] md:min-h-[340px]"
              >
                <div className="absolute inset-0 z-0">
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>
                <span className="absolute top-3 right-3 z-10 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  {cat}
                </span>
                <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-5 text-white">
                  <time className="text-sm text-white/80 mb-1 block">
                    {formatDate(item.publishedAt, locale)}
                  </time>
                  <h2 className="font-bold text-base md:text-lg leading-snug mb-3 line-clamp-3">{title}</h2>
                  {ex ? <p className="text-sm text-white/80 line-clamp-2 mb-2">{ex}</p> : null}
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    {t("newsUi.readMore")}
                    <span className="w-6 h-6 rounded-full border border-primary flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
