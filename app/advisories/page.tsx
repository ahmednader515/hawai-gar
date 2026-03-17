import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";

const PLACEHOLDER_ADVISORIES = [
  {
    id: "1",
    titleAr: "إرشاد وقود طارئ - خطوط من وإلى شمال أوروبا",
    excerpt: "تحديث تعريفة الوقود الطارئ للمسارات المذكورة",
    publishedAt: new Date("2026-03-11"),
    link: "#",
  },
  {
    id: "2",
    titleAr: "إعلان أسعار - خط من الشرق الأقصى إلى أفريقيا",
    excerpt: "أسعار FAK جديدة، الشرق الأقصى",
    publishedAt: new Date("2026-03-10"),
    link: "#",
  },
  {
    id: "3",
    titleAr: "تحديث أوقات العبور - آسيا إلى البحر الأحمر",
    excerpt: "أوقات عبور تنافسية عبر ميناء الملك عبدالله وجدة",
    publishedAt: new Date("2026-03-09"),
    link: "#",
  },
  {
    id: "4",
    titleAr: "توسيع التغطية - الربط بين المدن والمحطات الجافة",
    excerpt: "إضافة مسارات جديدة للنقل البري",
    publishedAt: new Date("2026-03-08"),
    link: "#",
  },
  {
    id: "5",
    titleAr: "إرشادات الشحن للموسم القادم",
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

export default async function AdvisoriesPage() {
  let items: Awaited<ReturnType<typeof prisma.customerAdvisory.findMany>> = [];
  try {
    items = await prisma.customerAdvisory.findMany({
      orderBy: { publishedAt: "desc" },
    });
  } catch {
    // Tables may not exist
  }
  const list = items.length > 0 ? items : PLACEHOLDER_ADVISORIES;

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
          إرشادات للعملاء
        </h1>
        <div className="w-24 h-0.5 bg-primary mx-auto mb-12" />

        <div className="max-w-4xl mx-auto space-y-4">
          {list.map((item) => (
            <Link
              key={item.id}
              href={item.link ?? "#"}
              className="block rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <time className="text-sm text-muted-foreground block mb-2">
                {formatDate(item.publishedAt)}
              </time>
              <h2 className="font-bold text-foreground text-lg leading-snug mb-2">
                {item.titleAr}
              </h2>
              {item.excerpt && (
                <p className="text-sm text-muted-foreground">{item.excerpt}</p>
              )}
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
