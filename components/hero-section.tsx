"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapboxLocationPicker, type PickedLocation } from "@/components/mapbox-location-picker";

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
  const [mode, setMode] = useState<"shipper" | null>(null);
  const [fromLoc, setFromLoc] = useState<PickedLocation | null>(null);
  const [toLoc, setToLoc] = useState<PickedLocation | null>(null);
  const [containerSize, setContainerSize] = useState<"20" | "40" | "">("");
  const [containersCount, setContainersCount] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [notes, setNotes] = useState("");
  const [shipperPhone, setShipperPhone] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<null | { ok: true; id: string } | { ok: false; error: string }>(
    null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const submitShipmentRequest = async () => {
    setSubmitResult(null);
    const from = fromLoc?.address?.trim() ?? "";
    const to = toLoc?.address?.trim() ?? "";
    if (!from || !to) {
      setSubmitResult({ ok: false, error: "الرجاء تعبئة حقلي «من» و«إلى»." });
      return;
    }
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/shipment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to,
          containerSize: containerSize || null,
          containersCount: containersCount.trim() || null,
          pickupDate: pickupDate || null,
          notes: notes.trim() || null,
          phone: shipperPhone.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitResult({ ok: false, error: data.error ?? "تعذر إرسال الطلب" });
        return;
      }
      setSubmitResult({ ok: true, id: String(data.id) });
      setFromLoc(null);
      setToLoc(null);
      setContainerSize("");
      setContainersCount("");
      setPickupDate("");
      setNotes("");
      setShipperPhone("");
    } catch {
      setSubmitResult({ ok: false, error: "حدث خطأ أثناء الإرسال" });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-[85vh] flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
        >
          <source src="/video-1.mp4" type="video/mp4" />
        </video>
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
              className="py-3 px-3 rounded-lg font-medium text-foreground bg-primary/15 text-primary hover:bg-primary/25 active:bg-primary/25 transition-colors min-h-[44px] flex items-center mt-2 border-t border-border pt-4"
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
                  className="px-2.5 py-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
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
                    className="px-2.5 py-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
                  >
                    إنشاء حساب
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Headline + content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-3 sm:px-4 pt-6 sm:pt-8 pb-16 sm:pb-24">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center max-w-4xl mx-auto mb-6 sm:mb-8 drop-shadow-lg leading-tight">
          رواد في النقل البري والخدمات اللوجستية
        </h1>

        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 px-2 sm:px-0">
          {/* Right side: shippers */}
          <div className="md:order-1 rounded-2xl border border-white/20 bg-black/35 backdrop-blur-sm p-5 sm:p-6 text-white shadow-xl">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">ترغب في نقل بضائع؟</h2>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-5">
              ابدأ بإدخال بيانات الشحنة المطلوبة وسيتم إرسال الطلب مباشرة إلى لوحة التحكم.
            </p>
            <button
              type="button"
              onClick={() => setMode("shipper")}
              className={`inline-flex items-center justify-center w-full h-12 rounded-xl font-semibold transition-colors ${
                mode === "shipper"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-white text-foreground hover:bg-white/90"
              }`}
            >
              إدخال بيانات الشحنة
            </button>
          </div>

          {/* Left side: carriers */}
          <div className="md:order-2 rounded-2xl border border-white/20 bg-black/35 backdrop-blur-sm p-5 sm:p-6 text-white shadow-xl">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">شركة نقل؟</h2>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-5">
              انضم إلى منصتنا كشركة نقل معتمدة لتلقي طلبات الشحن وتنفيذها عبر الشبكة.
            </p>
            <Link
              href="/register?type=carrier"
              className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-white text-foreground font-semibold hover:bg-white/90 transition-colors"
            >
              إنشاء حساب (شركة نقل)
            </Link>
          </div>
        </div>

        {mode === "shipper" && (
          <div className="w-full max-w-2xl mt-6 sm:mt-8 bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border border-gray-100 mx-2 sm:mx-0">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">بيانات الشحنة</h3>
              <button
                type="button"
                onClick={() => setMode(null)}
                className="shrink-0 p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="إغلاق"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <MapboxLocationPicker
                valueFrom={fromLoc}
                valueTo={toLoc}
                onChangeFrom={setFromLoc}
                onChangeTo={setToLoc}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">حجم الحاوية</label>
                <select
                  value={containerSize}
                  onChange={(e) => setContainerSize(e.target.value as "20" | "40" | "")}
                  className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="">اختر</option>
                  <option value="20">20 قدم</option>
                  <option value="40">40 قدم</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">عدد الحاويات (اختياري)</label>
                <input
                  value={containersCount}
                  onChange={(e) => setContainersCount(e.target.value)}
                  placeholder="مثال: 2"
                  inputMode="numeric"
                  className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">تاريخ الاستلام (اختياري)</label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">ملاحظات (اختياري)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="تفاصيل إضافية عن الشحنة..."
                  className="w-full min-h-24 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">رقم التواصل (اختياري)</label>
                <input
                  value={shipperPhone}
                  onChange={(e) => setShipperPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              </div>
            </div>

            {submitResult && (
              <p
                className={`mt-4 text-sm p-3 rounded-lg ${
                  submitResult.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                }`}
              >
                {submitResult.ok
                  ? "تم إرسال طلب الشحن بنجاح وسيظهر في لوحة التحكم."
                  : submitResult.error}
              </p>
            )}

            <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                سيتم إرسال الطلب مباشرة إلى لوحة التحكم—بدون إنشاء حساب.
              </div>
              <button
                type="button"
                onClick={submitShipmentRequest}
                disabled={submitLoading}
                className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed text-primary-foreground font-semibold transition-colors"
              >
                {submitLoading ? "جاري الإرسال..." : "إرسال الطلب"}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border-2 border-gray-200 text-foreground hover:bg-gray-50 font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                راسلنا
              </a>
              {contactPhone && (
                <a
                  href={`tel:${contactPhone.replace(/\\s/g, "")}`}
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border-2 border-gray-200 text-foreground hover:bg-gray-50 font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  اتصل بنا
                </a>
              )}
              <Link
                href="/news"
                className="inline-flex items-center justify-center h-11 px-5 rounded-xl border-2 border-gray-200 text-foreground hover:bg-gray-50 font-medium transition-colors"
              >
                الأخبار والإرشادات
              </Link>
            </div>
          </div>
        )}

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
      <div className="relative z-10 h-2 bg-primary" />
      <div className="relative z-10 h-0.5 bg-primary/80" />
    </section>
  );
}
