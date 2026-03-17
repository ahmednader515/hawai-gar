import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { HeroSection } from "@/components/hero-section";
import { SolutionsSection } from "@/components/solutions-section";
import { FeatureCarouselSection } from "@/components/feature-carousel-section";
import { StatsHeroSection } from "@/components/stats-hero-section";
import { NewsSection } from "@/components/news-section";
import { CustomerGuidelinesSection } from "@/components/customer-guidelines-section";
import { prisma } from "@/lib/db";
import { getHeroContact } from "@/lib/site-settings";

function HomeSectionSeparator({ flip = true }: { flip?: boolean }) {
  return (
    <div className="relative w-full overflow-hidden bg-background m-0 p-0 block leading-[0]">
      <div className="relative w-full h-10 sm:h-12 md:h-14">
        <div className="absolute inset-0 flex">
          <div className="relative w-1/2 h-full">
            <Image
              src="/Frame.png"
              alt=""
              fill
              className={`object-contain ${flip ? "rotate-180" : ""}`}
              sizes="50vw"
              priority={false}
            />
          </div>
          <div className="relative w-1/2 h-full">
            <Image
              src="/Frame.png"
              alt=""
              fill
              className={`object-contain ${flip ? "rotate-180" : ""}`}
              sizes="50vw"
              priority={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Home() {
  const session = await auth();
  let newsItems: Awaited<ReturnType<typeof prisma.newsItem.findMany>> = [];
  let advisories: Awaited<ReturnType<typeof prisma.customerAdvisory.findMany>> = [];
  let heroContact = { email: "info@hawajgar.com", phone: null as string | null };
  try {
    [newsItems, advisories, heroContact] = await Promise.all([
      prisma.newsItem.findMany({ orderBy: { publishedAt: "desc" }, take: 10 }),
      prisma.customerAdvisory.findMany({ orderBy: { publishedAt: "desc" }, take: 20 }),
      getHeroContact(),
    ]);
  } catch {
    // Tables may not exist yet before migration; use placeholder in sections
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <HeroSection
        isLoggedIn={!!session?.user}
        contactEmail={heroContact.email}
        contactPhone={heroContact.phone}
      />
      <HomeSectionSeparator />
      <SolutionsSection />
      <HomeSectionSeparator />
      <FeatureCarouselSection />
      <HomeSectionSeparator flip={false} />
      <StatsHeroSection />
      <HomeSectionSeparator />
      <NewsSection items={newsItems.length > 0 ? newsItems : undefined} />
      <HomeSectionSeparator flip={false} />
      <CustomerGuidelinesSection items={advisories.length > 0 ? advisories : undefined} />

      {/* Footer */}
      <footer className="border-t py-6 sm:py-8 bg-muted/20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="hawai GAR" width={32} height={32} className="object-contain" />
            <p className="font-semibold text-sm sm:text-base">hawai GAR</p>
          </div>
          <nav className="flex gap-4 sm:gap-6 text-sm text-muted-foreground">
            {session?.user ? (
              <Link href="/dashboard" className="hover:underline touch-manipulation py-1 font-medium">لوحة التحكم</Link>
            ) : (
              <>
                <Link href="/login" className="hover:underline touch-manipulation py-1">تسجيل الدخول</Link>
                <Link href="/register" className="hover:underline touch-manipulation py-1">التسجيل</Link>
              </>
            )}
          </nav>
        </div>
        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4 px-2">
          © {new Date().getFullYear()} hawai GAR. جميع الحقوق محفوظة.
        </p>
      </footer>
    </div>
  );
}
