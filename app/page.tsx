import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { HeroSection } from "@/components/hero-section";
import { prisma } from "@/lib/db";
import { getHeroContact } from "@/lib/site-settings";
import { unstable_cache } from "next/cache";
import { getTranslations } from "@/lib/i18n/server";

/** Below-the-fold sections: separate chunks so first paint ships less JS */
function BelowFoldSkeleton({ className = "min-h-[12rem]" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/25 ${className}`} aria-hidden />;
}

const SolutionsSection = dynamic(
  () => import("@/components/solutions-section").then((m) => ({ default: m.SolutionsSection })),
  { loading: () => <BelowFoldSkeleton className="min-h-[220px]" /> },
);

const FeatureCarouselSection = dynamic(
  () => import("@/components/feature-carousel-section").then((m) => ({ default: m.FeatureCarouselSection })),
  { loading: () => <BelowFoldSkeleton className="min-h-[280px]" /> },
);

const StatsHeroSection = dynamic(
  () => import("@/components/stats-hero-section").then((m) => ({ default: m.StatsHeroSection })),
  { loading: () => <BelowFoldSkeleton className="min-h-[180px]" /> },
);

const NewsSection = dynamic(
  () => import("@/components/news-section").then((m) => ({ default: m.NewsSection })),
  { loading: () => <BelowFoldSkeleton className="min-h-[200px]" /> },
);

const CustomerGuidelinesSection = dynamic(
  () => import("@/components/customer-guidelines-section").then((m) => ({
    default: m.CustomerGuidelinesSection,
  })),
  { loading: () => <BelowFoldSkeleton className="min-h-[200px]" /> },
);

const getHomeContent = unstable_cache(
  async () => {
    const [newsItems, advisories, heroContact] = await Promise.all([
      prisma.newsItem.findMany({ orderBy: { publishedAt: "desc" }, take: 10 }),
      prisma.customerAdvisory.findMany({ orderBy: { publishedAt: "desc" }, take: 20 }),
      getHeroContact(),
    ]);
    return { newsItems, advisories, heroContact };
  },
  ["home-content-v1"],
  { revalidate: 300 }
);

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
  const t = await getTranslations();
  const session = await auth();
  let newsItems: Awaited<ReturnType<typeof prisma.newsItem.findMany>> = [];
  let advisories: Awaited<ReturnType<typeof prisma.customerAdvisory.findMany>> = [];
  let heroContact = { email: "info@hawajgar.com", phone: null as string | null };
  try {
    ({ newsItems, advisories, heroContact } = await getHomeContent());
  } catch {
    // Tables may not exist yet before migration; use placeholder in sections
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <HeroSection
        isLoggedIn={!!session?.user}
        userRole={session?.user?.role ?? null}
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
              session.user.role !== "COMPANY" ? (
                <Link href="/dashboard" className="hover:underline touch-manipulation py-1 font-medium">
                  {t("common.dashboard")}
                </Link>
              ) : null
            ) : (
              <>
                <Link href="/login" className="hover:underline touch-manipulation py-1">
                  {t("common.login")}
                </Link>
                <Link href="/register" className="hover:underline touch-manipulation py-1">
                  {t("footer.register")}
                </Link>
              </>
            )}
          </nav>
        </div>
        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4 px-2">
          {t("footer.copyright").replace("{year}", String(new Date().getFullYear()))}
        </p>
      </footer>
    </div>
  );
}
