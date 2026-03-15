"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const CAROUSEL_SLIDES = [
  {
    id: "slide-1",
    image: "/land-shipping-4.png",
    title: "استفد من تغطيتنا الواسعة للنقل البري بين مدن المملكة والمحطات الجافة",
    description:
      "استفد من خدمات النقل البري الفعالة للحاويات عبر شبكتنا. تغطية واسعة للمدن والطرق، وحلول مصممة بحسب احتياجاتك، وفترات نقل موثوقة.",
    href: "/#solutions",
  },
  {
    id: "slide-2",
    image: "/land-shipping-5.png",
    title: "خدمات النقل البري المتكاملة للحاويات",
    description:
      "نقل حاوياتك براً بين مدن المملكة والمحطات الجافة. فرق متخصصة، وخدمة متواصلة، وحلول مصممة لاحتياجاتكم.",
    href: "/register",
  },
];

export function FeatureCarouselSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const slide = CAROUSEL_SLIDES[activeIndex];

  const goPrev = () => setActiveIndex((i) => (i === 0 ? CAROUSEL_SLIDES.length - 1 : i - 1));
  const goNext = () => setActiveIndex((i) => (i === CAROUSEL_SLIDES.length - 1 ? 0 : i + 1));

  return (
    <section id="carousel" className="bg-background mt-12 sm:mt-16 md:mt-20">
      {/* Two-column carousel block with arrows outside */}
      <div className="container mx-auto max-w-6xl px-3 sm:px-4 md:px-4">
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
          {/* Prev arrow - outside card (points right in RTL / toward previous) */}
          <button
            type="button"
            onClick={goPrev}
            className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center border border-border shadow-sm transition-colors touch-manipulation"
            aria-label="السابق"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="flex-1 min-w-0 overflow-hidden rounded-lg sm:rounded-xl border border-border shadow-lg">
            <div className="grid md:grid-cols-[1.2fr_0.8fr] min-h-[320px] sm:min-h-[380px] md:min-h-[420px]">
              {/* Top on mobile, left on desktop: image */}
              <div className="relative order-1 md:order-1 bg-muted min-h-[200px] sm:min-h-0">
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 60vw"
                />
                <div className="absolute inset-0 bg-foreground/20" />
              </div>
              {/* Below image on mobile, right on desktop: content block (light yellow/beige) */}
              <div className="relative order-2 md:order-2 flex flex-col justify-center p-5 sm:p-6 md:p-10 bg-amber-50/90 dark:bg-amber-950/20 border-s border-border">
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
                  معرفة المزيد
                  <span className="text-amber-600" aria-hidden>»</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Next arrow - outside card (points left in RTL / toward next) */}
          <button
            type="button"
            onClick={goNext}
            className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center border border-border shadow-sm transition-colors touch-manipulation"
            aria-label="التالي"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        {/* Carousel dots */}
        <div className="flex justify-center gap-2 mt-4">
          {CAROUSEL_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === activeIndex
                  ? "bg-amber-500 scale-125"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`الشريحة ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Headline + intro paragraph below carousel */}
      <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-foreground mb-3 sm:mb-4 px-2">
          نلبي احتياجاتك في قطاع النقل البري للحاويات
        </h2>
        <p className="text-muted-foreground text-center max-w-3xl mx-auto text-sm sm:text-base leading-relaxed px-2">
          نحن نفخر بكوننا شريكاً للنقل البري للحاويات في المملكة، إذ نقدم حلولاً مصممة خصيصاً لتراعي
          احتياجات شركات الشحن (بين مواني ومدن المملكة والخليج) وشركات النقل، مع تغطية واسعة للمدن والمحطات الجافة والطرق البرية.
        </p>
      </div>
    </section>
  );
}
