import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { getTranslations } from "@/lib/i18n/server";
import {
  isSolutionSlug,
  SOLUTION_IMAGE_LAYOUT,
  SOLUTION_IMAGES,
  SOLUTION_SLUGS,
} from "@/lib/solutions-config";

export function generateStaticParams() {
  return SOLUTION_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSolutionSlug(slug)) {
    return { title: "Hawai Logisti" };
  }
  const t = await getTranslations();
  const title = t(`solutions.${slug}`);
  const description = t(`solutions.pages.${slug}.metaDescription`);
  return {
    title: `${title} | Hawai Logisti`,
    description,
  };
}

export default async function SolutionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSolutionSlug(slug)) notFound();

  const t = await getTranslations();
  const imageSrc = SOLUTION_IMAGES[slug];
  const imageClass = SOLUTION_IMAGE_LAYOUT[slug];
  const title = t(`solutions.${slug}`);
  const body = t(`solutions.pages.${slug}.body`);
  const paragraphs = body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicSiteHeader />
      <main className="flex-1">
        <section className="relative min-h-[38vh] w-full sm:min-h-[45vh] md:min-h-[50vh]">
          <Image
            key={slug}
            src={imageSrc}
            alt=""
            fill
            className={imageClass}
            priority
            sizes="100vw"
            quality={85}
          />
          <div className="absolute inset-0 bg-slate-900/45" aria-hidden />
          <div className="relative z-10 flex min-h-[38vh] flex-col items-center justify-end px-4 pb-10 sm:min-h-[45vh] sm:pb-14 md:min-h-[50vh]">
            <h1 className="max-w-4xl text-center text-2xl font-bold text-white drop-shadow-lg sm:text-4xl md:text-5xl">
              {title}
            </h1>
          </div>
        </section>

        <div className="container mx-auto max-w-3xl px-4 py-10 sm:py-14 md:py-16">
          <Link href="/#solutions" className="mb-8 inline-block text-sm font-medium text-primary hover:underline">
            {t("solutions.pages.backToSolutions")}
          </Link>
          <div className="space-y-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                {p}
              </p>
            ))}
          </div>
        </div>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
