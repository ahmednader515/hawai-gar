import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";

const PLACEHOLDER_NEWS = [
  {
    id: "1",
    titleAr: "تعزيز الربط بين آسيا وأوروبا عبر النقل البري",
    category: "النقل البري والخدمات اللوجستية",
    imageUrl: "/land-shipping-1.png",
    excerpt: "خدمات نقل حاويات موثوقة بين المدن والمحطات الجافة",
    link: "#",
    publishedAt: new Date("2026-03-09"),
  },
  {
    id: "2",
    titleAr: "إرشادات للعملاء - تحديث أسعار النقل",
    category: "إرشادات العملاء",
    imageUrl: "/land-shipping-2.png",
    excerpt: "تحديثات على تعريفة النقل البري للحاويات",
    link: "#",
    publishedAt: new Date("2026-03-10"),
  },
  {
    id: "3",
    titleAr: "توسيع شبكة التغطية إلى مدن جديدة",
    category: "شبكة النقل",
    imageUrl: "/land-shipping-3.png",
    excerpt: "إضافة مسارات ومحطات جديدة في المملكة",
    link: "#",
    publishedAt: new Date("2026-03-11"),
  },
  {
    id: "4",
    titleAr: "عودة الخدمات الموسمية للنقل المكثف",
    category: "خدمات النقل",
    imageUrl: "/land-shipping-4.png",
    excerpt: "استعدادنا لفترة الذروة مع شركات نقل إضافية",
    link: "#",
    publishedAt: new Date("2026-03-12"),
  },
];

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export default async function NewsPage() {
  let items: Awaited<ReturnType<typeof prisma.newsItem.findMany>> = [];
  try {
    items = await prisma.newsItem.findMany({
      orderBy: { publishedAt: "desc" },
    });
  } catch {
    // Tables may not exist
  }
  const list = items.length > 0 ? items : PLACEHOLDER_NEWS;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Image src="/logo.png" alt="hawai GAR" width={32} height={32} className="object-contain" />
            hawai GAR
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            الرئيسية
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 md:py-16">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-2">
          آخر الأخبار
        </h1>
        <div className="w-24 h-0.5 bg-primary mx-auto mb-12" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {list.map((item) => (
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
                {item.category}
              </span>
              <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-5 text-white">
                <time className="text-sm text-white/80 mb-1 block">
                  {formatDate(item.publishedAt)}
                </time>
                <h2 className="font-bold text-base md:text-lg leading-snug mb-3 line-clamp-3">
                  {item.titleAr}
                </h2>
                {item.excerpt && (
                  <p className="text-sm text-white/80 line-clamp-2 mb-2">{item.excerpt}</p>
                )}
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
      </main>

      <footer className="border-t py-8 bg-muted/20 mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="hawai GAR" width={32} height={32} className="object-contain" />
            <p className="font-semibold">hawai GAR</p>
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:underline">تسجيل الدخول</Link>
            <Link href="/register" className="hover:underline">التسجيل</Link>
          </nav>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          © {new Date().getFullYear()} hawai GAR. جميع الحقوق محفوظة.
        </p>
      </footer>
    </div>
  );
}
