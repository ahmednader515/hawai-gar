import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("aboutPage.title")} | Hawai Logisti`,
    description: t("aboutPage.metaDescription"),
  };
}

export default async function AboutPage() {
  const t = await getTranslations();
  const body = t("aboutPage.body");
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
            src="/land-shipping-7.png"
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
            quality={85}
          />
          <div className="absolute inset-0 bg-slate-900/45" aria-hidden />
          <div className="relative z-10 flex min-h-[38vh] flex-col items-center justify-end px-4 pb-10 sm:min-h-[45vh] sm:pb-14 md:min-h-[50vh]">
            <h1 className="max-w-4xl text-center text-2xl font-bold text-white drop-shadow-lg sm:text-4xl md:text-5xl">
              {t("aboutPage.title")}
            </h1>
          </div>
        </section>

        <div className="container mx-auto max-w-3xl px-4 py-10 sm:py-14 md:py-16">
          <Link href="/#about" className="mb-8 inline-block text-sm font-medium text-primary hover:underline">
            {t("aboutPage.backLink")}
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
