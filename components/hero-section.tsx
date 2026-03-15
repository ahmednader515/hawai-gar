"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const HERO_TABS = [
  { id: "supplier", label: "مورد" },
  { id: "carrier", label: "ناقل" },
  { id: "contact", label: "تواصل معنا" },
] as const;

const MAIN_NAV_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/#solutions", label: "حلولنا" },
  { href: "/#carousel", label: "اعرف المزيد", className: "hidden sm:inline" },
  { href: "/#about", label: "من نحن", className: "hidden sm:inline" },
  { href: "/#news", label: "الأخبار" },
  { href: "/#advisories", label: "إرشادات العملاء" },
];

export function HeroSection({
  isLoggedIn = false,
  contactEmail = "info@hawajgar.com",
  contactPhone = null,
}: {
  isLoggedIn?: boolean;
  contactEmail?: string;
  contactPhone?: string | null;
}) {
  const [activeTab, setActiveTab] = useState<"supplier" | "carrier" | "contact">("supplier");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-[85vh] flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero.png"
          alt="شحن حاويات"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-foreground/50" />
      </div>

      {/* Mobile sidebar: overlay + panel with slide animation */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ease-out ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!sidebarOpen}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/50"
          aria-label="إغلاق القائمة"
          onClick={() => setSidebarOpen(false)}
        />
      </div>
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-72 max-w-[85vw] bg-card border-s border-border shadow-xl md:hidden flex flex-col transition-transform duration-300 ease-out will-change-transform ${
          sidebarOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
        aria-modal="true"
        role="dialog"
        aria-label="القائمة"
        aria-hidden={!sidebarOpen}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-semibold text-foreground">القائمة</span>
          <button
            type="button"
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-transform"
            aria-label="إغلاق"
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col p-4 gap-1 overflow-y-auto">
          {MAIN_NAV_LINKS.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="py-3 px-3 rounded-lg text-foreground hover:bg-muted active:bg-muted transition-colors min-h-[44px] flex items-center"
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {isLoggedIn && (
            <Link
              href="/dashboard"
              className="py-3 px-3 rounded-lg font-medium text-foreground bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 active:bg-amber-500/25 transition-colors min-h-[44px] flex items-center mt-2 border-t border-border pt-4"
              onClick={() => setSidebarOpen(false)}
            >
              لوحة التحكم
            </Link>
          )}
        </nav>
      </aside>

      {/* Top Navbar */}
      <header className="relative z-20 border-b border-white/20 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          {/* Nav links - right side on desktop; hidden on mobile */}
          <nav className="hidden md:flex flex-1 items-center justify-start gap-4 md:gap-5 text-sm text-white/90">
            {MAIN_NAV_LINKS.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`hover:text-white transition-colors ${item.className ?? ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Menu button - visible only on mobile; opens sidebar */}
          <div className="flex shrink-0 items-center md:hidden">
            <button
              type="button"
              className="p-2 text-white/90 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="فتح القائمة"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Logo + vertical separator + Sign in / Sign up - same on mobile and desktop */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="hawai GAR" width={48} height={48} className="object-contain size-auto" />
              <span className="text-xl font-bold text-white hidden sm:inline">hawai GAR</span>
            </Link>
            <div className="h-5 sm:h-6 w-px bg-white/40 shrink-0" aria-hidden />
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="px-2.5 py-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors whitespace-nowrap"
                >
                  لوحة التحكم
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-2.5 py-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium text-white border border-white/60 hover:bg-white/10 hover:border-white/80 transition-colors whitespace-nowrap"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/register"
                    className="px-2.5 py-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors whitespace-nowrap"
                  >
                    إنشاء حساب
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Headline + White card */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-3 sm:px-4 pt-6 sm:pt-8 pb-16 sm:pb-24">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center max-w-4xl mx-auto mb-6 sm:mb-8 drop-shadow-lg leading-tight">
          رواد في النقل البري والخدمات اللوجستية
        </h1>

        {/* White card */}
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 border border-gray-100 mx-2 sm:mx-0">
          {/* Tabs */}
          <div className="flex flex-wrap gap-4 border-b border-gray-200 pb-4 mb-6">
            {HERO_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="relative pb-1 text-sm font-medium text-gray-600 hover:text-foreground transition-colors"
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {activeTab === "supplier" && (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                شركات الشحن بين مواني ومدن المملكة والخليج العربي — سجّل معنا لطلب خدمات النقل البري للحاويات وإدارة شحناتك.
              </p>
              <Link
                href="/register?type=company"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto h-12 px-6 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
              >
                تسجيل كشركة شحن
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}

          {activeTab === "carrier" && (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                شركات النقل — انضم إلى منصتنا كشريك نقل معتمد واربط طلبات الشحن من الشركات في أنحاء المملكة والخليج.
              </p>
              <Link
                href="/register?type=carrier"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto h-12 px-6 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
              >
                تسجيل كشركة نقل
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                نرحب بتواصلكم. للاستفسارات أو الدعم الفني، تواصل معنا عبر البريد الإلكتروني أو زر صفحة الأخبار والإرشادات.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg border-2 border-amber-500 text-amber-600 hover:bg-amber-50 font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  راسلنا
                </a>
                {contactPhone && (
                  <a
                    href={`tel:${contactPhone.replace(/\s/g, "")}`}
                    className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg border-2 border-amber-500 text-amber-600 hover:bg-amber-50 font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    اتصل بنا
                  </a>
                )}
                <Link
                  href="/news"
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg border-2 border-gray-200 text-foreground hover:bg-gray-50 font-medium transition-colors"
                >
                  الأخبار والإرشادات
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="text-white/90 text-sm sm:text-base mt-6 sm:mt-8 mb-3 drop-shadow-md">
          بالتعاون مع
        </p>
        <div className="relative w-full max-w-md mx-auto h-14 sm:h-16 md:h-20 px-6 py-3 bg-white rounded-xl shadow-lg">
          <Image
            src="/logisti.png"
            alt="شركاؤنا"
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 100vw, 448px"
            priority={false}
          />
        </div>
      </div>

      {/* Gold divider */}
      <div className="relative z-10 h-2 bg-amber-600" />
      <div className="relative z-10 h-0.5 bg-amber-500/80" />
    </section>
  );
}
