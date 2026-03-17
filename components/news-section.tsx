import Image from "next/image";
import Link from "next/link";

export type NewsItemType = {
  id: string;
  titleAr: string;
  titleEn?: string | null;
  category: string;
  imageUrl: string;
  excerpt?: string | null;
  link?: string | null;
  publishedAt: Date;
};

const PLACEHOLDER_NEWS: NewsItemType[] = [
  {
    id: "1",
    titleAr: "تعزيز الربط بين آسيا وأوروبا عبر النقل البري",
    titleEn: "Enhancing Asia-Europe connectivity via land transport",
    category: "النقل البري والخدمات اللوجستية",
    imageUrl: "/land-shipping-1.png",
    excerpt: "خدمات نقل حاويات موثوقة بين المدن والمحطات الجافة",
    link: "#",
    publishedAt: new Date("2026-03-09"),
  },
  {
    id: "2",
    titleAr: "إرشادات للعملاء - تحديث أسعار النقل",
    titleEn: "Customer advisory - transport rates update",
    category: "إرشادات العملاء",
    imageUrl: "/land-shipping-2.png",
    excerpt: "تحديثات على تعريفة النقل البري للحاويات",
    link: "#",
    publishedAt: new Date("2026-03-10"),
  },
  {
    id: "3",
    titleAr: "توسيع شبكة التغطية إلى مدن جديدة",
    titleEn: "Expanding coverage to new cities",
    category: "شبكة النقل",
    imageUrl: "/land-shipping-3.png",
    excerpt: "إضافة مسارات ومحطات جديدة في المملكة",
    link: "#",
    publishedAt: new Date("2026-03-11"),
  },
  {
    id: "4",
    titleAr: "عودة الخدمات الموسمية للنقل المكثف",
    titleEn: "Seasonal high-volume transport services",
    category: "خدمات النقل",
    imageUrl: "/land-shipping-4.png",
    excerpt: "استعدادنا لفترة الذروة مع شركات نقل إضافية",
    link: "#",
    publishedAt: new Date("2026-03-12"),
  },
];

function formatDate(d: unknown) {
  const date = d instanceof Date ? d : new Date(d as any);
  if (Number.isNaN(date.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return "—";
  }
}

export function NewsSection({
  items,
  hideViewAll,
  itemLink,
  maxItems = 4,
}: {
  items?: NewsItemType[];
  hideViewAll?: boolean;
  /** Optional: (item) => href for each card. If not set, uses item.link */
  itemLink?: (item: NewsItemType) => string;
  /** Max number of cards to show (default 4). Omit or set high to show all. */
  maxItems?: number;
}) {
  const list = (items ?? PLACEHOLDER_NEWS).slice(0, maxItems);

  return (
    <section id="news" className="pt-0 pb-12 sm:pb-16 md:pb-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-foreground mb-2 px-2">
          اكتشف آخر الأخبار عن hawai GAR
        </h2>
        <div className="w-24 h-0.5 bg-primary mx-auto mb-8 sm:mb-12" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {list.map((item) => (
            <Link
              key={item.id}
              href={itemLink ? itemLink(item) : (item.link ?? "#")}
              className="group relative block overflow-hidden rounded-xl border border-border shadow-md min-h-[280px] sm:min-h-[320px] md:min-h-[360px]"
            >
              <div className="absolute inset-0 z-0">
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              </div>
              <span className="absolute top-3 right-3 z-10 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                {item.category}
              </span>
              <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-5 text-white">
                <time className="text-sm text-white/80 mb-1 block">
                  {formatDate(item.publishedAt)}
                </time>
                <h3 className="font-bold text-base md:text-lg leading-snug mb-3 line-clamp-3">
                  {item.titleAr}
                </h3>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  معرفة المزيد
                  <span className="w-6 h-6 rounded-full border border-primary flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {!hideViewAll && (
          <div className="flex justify-center mt-8 sm:mt-10">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary bg-transparent px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base text-foreground font-medium hover:bg-primary/10 transition-colors touch-manipulation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              رؤية كل الأخبار
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
