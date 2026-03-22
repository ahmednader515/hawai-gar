"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/i18n-provider";

const STATS_ICONS = [
  <svg key="i1" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
  </svg>,
  <svg key="i2" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-1.607-1.374-2.874-2.981-2.874a2.872 2.872 0 00-2.8 2.058 2.872 2.872 0 01-2.8 2.058 2.872 2.872 0 00-2.981 2.874v.958m0 0v.041m0-.041v-.041m0 0h-2.25" />
  </svg>,
  <svg key="i3" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>,
  <svg key="i4" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>,
];

const STAT_VALUE_KEYS = ["9+", "50+", "100+", "50+"] as const;
const STAT_LABEL_KEYS = ["stat1", "stat2", "stat3", "stat4"] as const;

export function StatsHeroSection() {
  const { t } = useI18n();

  return (
    <section id="about" className="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-[85vh] flex flex-col justify-between overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video
          className="absolute inset-0 h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
        >
          <source src="/video-2.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-foreground/60" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-3 sm:px-4 py-12 sm:py-16 md:py-24 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white max-w-4xl mx-auto mb-4 sm:mb-6 drop-shadow-lg leading-tight px-2">
          {t("stats.headline")}
        </h2>
        <div className="w-24 h-1 bg-primary rounded-full mb-6 sm:mb-8" />
        <p className="text-white/95 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 drop-shadow-md px-2">
          {t("stats.body")}
        </p>
        <Link
          href="/news"
          className="inline-flex items-center gap-2 rounded-full border-2 border-primary bg-transparent px-5 py-2.5 sm:px-6 sm:py-3 text-white text-sm sm:text-base font-medium hover:bg-primary/20 transition-colors touch-manipulation"
        >
          <span>{t("stats.cta")}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="relative z-10 border-t border-white/20 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 sm:py-8 md:py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-12">
            {STAT_LABEL_KEYS.map((key, i) => (
              <div key={key} className="flex flex-col items-center text-center text-white">
                <div className="mb-2 sm:mb-3 opacity-95 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
                  {STATS_ICONS[i]}
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-0.5 sm:mb-1 tabular-nums min-h-[1.5em]">
                  {STAT_VALUE_KEYS[i]}
                </div>
                <div className="text-xs sm:text-sm md:text-base text-white/90 leading-snug">{t(`stats.${key}`)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
