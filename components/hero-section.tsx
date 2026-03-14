"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

type Station = { id: string; nameAr: string; slug: string };

const HERO_TABS = [
  { id: "tracking", label: "التتبع" },
  { id: "schedules", label: "ابحث في جدول مواعيدنا" },
] as const;

const MAIN_NAV_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/#solutions", label: "حلولنا" },
  { href: "/#carousel", label: "اعرف المزيد", className: "hidden sm:inline" },
  { href: "/#about", label: "من نحن", className: "hidden sm:inline" },
  { href: "/#news", label: "الأخبار" },
  { href: "/#advisories", label: "إرشادات العملاء" },
];

export function HeroSection({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [activeTab, setActiveTab] = useState<"tracking" | "schedules">("tracking");
  const [bookingNumberInput, setBookingNumberInput] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackResult, setTrackResult] = useState<{
    found: true;
    bookingNumber: string;
    from: string;
    to: string;
    status: string;
    statusLabel: string;
    createdAt: string;
  } | { found: false; error: string } | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<{
    available: boolean;
    count: number;
    date: string;
  } | { error: string } | null>(null);

  useEffect(() => {
    fetch("/api/locations")
      .then((res) => res.ok ? res.json() : [])
      .then((data: Station[]) => setStations(Array.isArray(data) ? data : []))
      .catch(() => setStations([]));
  }, []);

  const swapStations = () => {
    setFromStation(toStation);
    setToStation(fromStation);
    setScheduleResult(null);
  };

  const searchByBookingNumber = async () => {
    const num = bookingNumberInput.trim().toUpperCase();
    if (!num) {
      setTrackResult({ found: false, error: "أدخل رقم الحجز" });
      return;
    }
    setTrackLoading(true);
    setTrackResult(null);
    try {
      const res = await fetch(`/api/track?bookingNumber=${encodeURIComponent(num)}`);
      const data = await res.json();
      if (res.status === 404) {
        setTrackResult({ found: false, error: data.error ?? "لا يوجد طلب بهذا رقم الحجز" });
        return;
      }
      if (!res.ok) {
        setTrackResult({ found: false, error: data.error ?? "حدث خطأ" });
        return;
      }
      setTrackResult({
        found: true,
        bookingNumber: data.bookingNumber,
        from: data.from,
        to: data.to,
        status: data.status,
        statusLabel: data.statusLabel ?? data.status,
        createdAt: data.createdAt,
      });
    } catch {
      setTrackResult({ found: false, error: "حدث خطأ في الاتصال" });
    } finally {
      setTrackLoading(false);
    }
  };

  const searchSchedule = async () => {
    if (!fromStation || !toStation) {
      setScheduleResult({ error: "اختر المحطة الأولى والمحطة الثانية" });
      return;
    }
    if (fromStation === toStation) {
      setScheduleResult({ error: "المحطة الأولى والثانية يجب أن تكونا مختلفتين" });
      return;
    }
    setScheduleLoading(true);
    setScheduleResult(null);
    try {
      const params = new URLSearchParams({
        from: fromStation,
        to: toStation,
        date: scheduleDate,
      });
      const res = await fetch(`/api/schedule?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setScheduleResult({ error: data.error ?? "حدث خطأ" });
        return;
      }
      setScheduleResult({
        available: data.available,
        count: data.count ?? 0,
        date: data.date ?? scheduleDate,
      });
    } catch {
      setScheduleResult({ error: "حدث خطأ في الاتصال" });
    } finally {
      setScheduleLoading(false);
    }
  };

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

          {activeTab === "tracking" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={bookingNumberInput}
                    onChange={(e) => {
                      setBookingNumberInput(e.target.value);
                      setTrackResult(null);
                    }}
                    placeholder="رقم الحجز"
                    className="w-full h-12 pl-4 pr-12 rounded-lg border border-gray-200 bg-gray-50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={searchByBookingNumber}
                  disabled={trackLoading}
                  className="h-12 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium flex items-center gap-2 transition-colors shrink-0"
                >
                  {trackLoading ? (
                    <span className="size-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      بحث
                    </>
                  )}
                </button>
              </div>
              {trackResult && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    trackResult.found
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                  role="status"
                >
                  {trackResult.found ? (
                    <>
                      <p className="font-medium mb-2">نتيجة التتبع</p>
                      <p>رقم الحجز: {trackResult.bookingNumber}</p>
                      <p>من {trackResult.from} → إلى {trackResult.to}</p>
                      <p>الحالة: {trackResult.statusLabel}</p>
                    </>
                  ) : (
                    trackResult.error
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "schedules" && (
            <div className="space-y-4">
              {/* From / To stations with swap */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <select
                    value={fromStation}
                    onChange={(e) => setFromStation(e.target.value)}
                    className="w-full h-12 pl-4 pr-11 rounded-lg border border-gray-200 bg-gray-50 text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 appearance-none cursor-pointer"
                    aria-label="من (المحطة)"
                  >
                    <option value="">من (المحطة)</option>
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameAr}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={swapStations}
                  className="shrink-0 w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors flex items-center justify-center"
                  aria-label="تبديل المحطتين"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
                <div className="flex-1 relative">
                  <select
                    value={toStation}
                    onChange={(e) => setToStation(e.target.value)}
                    className="w-full h-12 pl-4 pr-11 rounded-lg border border-gray-200 bg-gray-50 text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 appearance-none cursor-pointer"
                    aria-label="إلى (المحطة)"
                  >
                    <option value="">إلى (المحطة)</option>
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameAr}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                </div>
              </div>
              {/* Date + Search */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[140px] relative">
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full h-12 pl-4 pr-11 rounded-lg border border-gray-200 bg-gray-50 text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={searchSchedule}
                  disabled={scheduleLoading}
                  className="h-12 px-6 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium flex items-center gap-2 transition-colors shrink-0"
                >
                  {scheduleLoading ? (
                    <>
                      <span className="size-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      جاري البحث...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      بحث
                    </>
                  )}
                </button>
              </div>
              {scheduleResult && (
                <div
                  className={`mt-4 p-3 rounded-lg text-sm ${
                    "error" in scheduleResult
                      ? "bg-red-50 text-red-800 border border-red-200"
                      : scheduleResult.available
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                  role="status"
                >
                  {"error" in scheduleResult ? (
                    scheduleResult.error
                  ) : scheduleResult.available ? (
                    <>
                      يوجد نقل متاح في هذا التاريخ بين المحطتين.
                      {scheduleResult.count > 0 && (
                        <span className="block mt-1 font-medium">
                          عدد الرحلات: {scheduleResult.count}
                        </span>
                      )}
                    </>
                  ) : (
                    "لا يوجد نقل في هذا التاريخ بين المحطتين. جرّب تاريخاً آخر أو سجّل الدخول لطلب نقل."
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Gold divider */}
      <div className="relative z-10 h-2 bg-amber-600" />
      <div className="relative z-10 h-0.5 bg-amber-500/80" />
    </section>
  );
}
