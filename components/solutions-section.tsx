"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { SOLUTION_IMAGE_LAYOUT, SOLUTION_IMAGES, type SolutionSlug } from "@/lib/solutions-config";

const SOLUTION_ICONS: Record<string, ReactNode> = {
  shipping: (
    <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 32h48v16H8z" />
      <path d="M12 32V20l20-12 20 12v12" />
      <path d="M32 8v24M20 32l12-12 12 12" />
    </svg>
  ),
  inland: (
    <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 36h40l4 12H4l4-12z" />
      <path d="M48 36h4l4 12" />
      <circle cx="14" cy="48" r="4" />
      <circle cx="38" cy="48" r="4" />
      <circle cx="50" cy="48" r="4" />
      <path d="M8 36l4-16h32l4 16" />
    </svg>
  ),
  digital: (
    <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="12" y="16" width="40" height="28" rx="2" />
      <path d="M12 28h40M20 36h24M20 42h16" />
      <path d="M32 16V8M32 8l-4 4M32 8l4 4" />
    </svg>
  ),
  cargo: (
    <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 20v24M20 28l12-8 12 8M24 44h16M28 36h8" />
      <rect x="22" y="24" width="20" height="16" rx="1" />
    </svg>
  ),
};

const SOLUTION_DEFS: { id: SolutionSlug; titleKey: string }[] = [
  { id: "shipping", titleKey: "solutions.shipping" },
  { id: "inland", titleKey: "solutions.inland" },
  { id: "digital", titleKey: "solutions.digital" },
  { id: "cargo", titleKey: "solutions.cargo" },
];

export function SolutionsSection() {
  const { t } = useI18n();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const SOLUTIONS = SOLUTION_DEFS.map((d) => ({
    ...d,
    image: SOLUTION_IMAGES[d.id],
    imageClass: SOLUTION_IMAGE_LAYOUT[d.id],
    icon: SOLUTION_ICONS[d.id],
    title: t(d.titleKey),
  }));

  return (
    <section id="solutions" className="relative">
      <div className="bg-background pt-0 pb-10 sm:pb-12 md:pb-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 px-2">{t("solutions.title")}</h2>
          <div className="w-24 h-0.5 bg-primary mx-auto mb-6 sm:mb-8" />
          <p className="text-muted-foreground text-center max-w-3xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed px-2">
            {t("solutions.intro")}
          </p>
        </div>
      </div>

      <div
        className="relative min-h-[380px] sm:min-h-[420px] md:min-h-[500px]"
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div className="absolute inset-0 z-0">
          <Image
            key="solutions-base"
            src={SOLUTIONS[0].image}
            alt=""
            fill
            className={SOLUTIONS[0].imageClass}
            sizes="100vw"
            quality={72}
          />
          <div className="absolute inset-0 bg-slate-900/40" />
        </div>

        {SOLUTIONS.map((solution) => (
          <div
            key={solution.id}
            className="absolute inset-0 z-[1] transition-opacity duration-300"
            style={{
              opacity: hoveredCard === solution.id ? 1 : 0,
              pointerEvents: "none",
            }}
          >
            <Image
              key={`solutions-hover-${solution.id}`}
              src={solution.image}
              alt=""
              fill
              className={solution.imageClass}
              sizes="100vw"
              quality={72}
            />
            <div className="absolute inset-0 bg-slate-900/40" />
          </div>
        ))}

        <div className="relative z-10 grid h-full min-h-[380px] grid-cols-1 sm:min-h-[420px] sm:grid-cols-2 md:min-h-[500px] lg:grid-cols-4">
          {SOLUTIONS.map((solution, index) => (
            <Link
              key={solution.id}
              href={`/solutions/${solution.id}`}
              className="group relative flex min-h-[140px] flex-col items-center justify-center p-4 text-white outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:min-h-0 sm:p-6"
              onMouseEnter={() => setHoveredCard(solution.id)}
            >
              <div
                className={`absolute inset-0 border-white/35 bg-gradient-to-b from-blue-900/50 via-blue-900/40 to-slate-900/80 opacity-70 transition-opacity duration-300 hover:opacity-60
                  ${index > 0 ? "border-t sm:border-t-0 sm:border-s" : ""}
                  ${index < SOLUTIONS.length - 1 ? "border-b sm:border-b-0 sm:border-e" : ""}
                `}
              />
              <div className="relative z-10 flex h-full w-full flex-col items-center justify-center">
                <div className="mb-4 h-16 w-16 md:mb-6 md:h-20 md:w-20">{solution.icon}</div>
                <h3 className="text-center text-lg font-semibold leading-tight md:text-xl">{solution.title}</h3>
                <span className="mt-3 inline-flex items-center gap-0.5 text-sm font-medium text-white/95 transition-transform duration-200 group-hover:translate-y-0.5">
                  <span>{t("solutions.discoverMore")}</span>
                  <ChevronRight
                    className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
