"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/providers/i18n-provider";

export function FeatureCarouselSection() {
  const { t } = useI18n();
  const slides = useMemo(
    () => [
      {
        id: "slide-1",
        image: "/land-shipping-7.png",
        title: t("carousel.slide1Title"),
        description: t("carousel.slide1Desc"),
        href: "/#solutions",
      },
      {
        id: "slide-2",
        image: "/land-shipping-8.png",
        title: t("carousel.slide2Title"),
        description: t("carousel.slide2Desc"),
        href: "/register",
      },
    ],
    [t],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const slide = slides[activeIndex];

  const goPrev = () => setActiveIndex((i) => (i === 0 ? slides.length - 1 : i - 1));
  const goNext = () => setActiveIndex((i) => (i === slides.length - 1 ? 0 : i + 1));

  return (
    <section id="carousel" className="bg-background mt-0">
      <div className="container mx-auto max-w-6xl px-3 sm:px-4 md:px-4">
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
          <button
            type="button"
            onClick={goPrev}
            className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center border border-border shadow-sm transition-colors touch-manipulation"
            aria-label={t("aria.previous")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="flex-1 min-w-0 overflow-hidden rounded-lg sm:rounded-xl border border-border shadow-lg">
            <div className="grid md:grid-cols-[1.2fr_0.8fr] min-h-[320px] sm:min-h-[380px] md:min-h-[420px]">
              <div className="relative order-1 md:order-1 bg-muted min-h-[200px] sm:min-h-0">
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 60vw"
                  quality={75}
                />
                <div className="absolute inset-0 bg-foreground/20" />
              </div>
              <div className="relative order-2 md:order-2 flex flex-col justify-center p-5 sm:p-6 md:p-10 bg-primary/10 dark:bg-primary/10 border-s border-border">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-3 sm:mb-4 leading-snug">
                  {slide.title}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4 sm:mb-6 line-clamp-3 sm:line-clamp-none">
                  {slide.description}
                </p>
                <Link
                  href={slide.href}
                  className="inline-flex items-center gap-1 text-foreground font-medium text-sm hover:underline mt-auto"
                >
                  {t("carousel.readMore")}
                  <span className="text-primary" aria-hidden>
                    »
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={goNext}
            className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center border border-border shadow-sm transition-colors touch-manipulation"
            aria-label={t("aria.next")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        <div className="flex justify-center gap-2 mt-4">
          {slides.map((_, i) => (
            <button
              key={`carousel-dot-${i}`}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`h-2 rounded-full transition-colors ${i === activeIndex ? "w-8 bg-primary" : "w-2 bg-muted-foreground/40"}`}
              aria-label={`${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
