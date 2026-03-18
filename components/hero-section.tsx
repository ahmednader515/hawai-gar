"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapboxLocationPicker, type PickedLocation } from "@/components/mapbox-location-picker";
import { signOut } from "next-auth/react";
import { MapboxLocationPreview } from "@/components/mapbox-location-preview";

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
  userRole = null,
  contactEmail = "info@hawajgar.com",
  contactPhone = null,
}: {
  isLoggedIn?: boolean;
  userRole?: string | null;
  contactEmail?: string;
  contactPhone?: string | null;
}) {
  const [mode, setMode] = useState<"shipper" | null>(null);
  const [fromLoc, setFromLoc] = useState<PickedLocation | null>(null);
  const [toLoc, setToLoc] = useState<PickedLocation | null>(null);
  const [shipmentType, setShipmentType] = useState("");
  const [containerSize, setContainerSize] = useState<"20" | "40" | "">("");
  const [containersCount, setContainersCount] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [notes, setNotes] = useState("");
  const [shipperPhone, setShipperPhone] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<null | { ok: true; id: string } | { ok: false; error: string }>(
    null
  );
  const [shipperTab, setShipperTab] = useState<"create" | "track">("create");
  const [locationLocked, setLocationLocked] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("openShipment") === "1") {
      setMode("shipper");
      setShipperTab("create");
      params.delete("openShipment");
      const next = window.location.pathname + (params.toString() ? `?${params.toString()}` : "") + window.location.hash;
      window.history.replaceState({}, "", next);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (mode !== "shipper") return;
    setShipperTab("create");
    setLocationLocked(false);
    setSubmitResult(null);
    setTrackingResult(null);
    setTrackingLoading(false);
  }, [mode]);

  const canShip = isLoggedIn && userRole === "COMPANY";
  const canSaveLocation = !!fromLoc && !!toLoc;

  const distanceKm = useMemo(() => {
    if (!fromLoc || !toLoc) return null;
    if (!Number.isFinite(fromLoc.lat) || !Number.isFinite(fromLoc.lng) || !Number.isFinite(toLoc.lat) || !Number.isFinite(toLoc.lng)) {
      return null;
    }
    const R = 6371;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(toLoc.lat - fromLoc.lat);
    const dLng = toRad(toLoc.lng - fromLoc.lng);
    const lat1 = toRad(fromLoc.lat);
    const lat2 = toRad(toLoc.lat);
    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return R * c;
  }, [fromLoc, toLoc]);

  const priceSar = useMemo(() => {
    if (distanceKm == null) return null;
    return distanceKm * 500 * 1.15;
  }, [distanceKm]);

  const priceLabel = useMemo(() => {
    if (priceSar == null) return "—";
    try {
      return new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(
        Math.round(priceSar)
      );
    } catch {
      return `${Math.round(priceSar)} ر.س`;
    }
  }, [priceSar]);

  const distanceLabel = useMemo(() => {
    if (distanceKm == null) return "—";
    return `${distanceKm.toFixed(1)} كم`;
  }, [distanceKm]);

  const formatSar = (v: number) => {
    try {
      return new Intl.NumberFormat("ar-SA", {
        style: "currency",
        currency: "SAR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.round(v));
    } catch {
      return `${Math.round(v)} ر.س`;
    }
  };

  const trackShipmentRequest = async (idRaw?: string) => {
    const id = (idRaw ?? trackingId).trim();
    if (!id) {
      setTrackingResult({ ok: false, error: "رقم الطلب مطلوب" });
      return;
    }
    setTrackingLoading(true);
    setTrackingResult(null);
    try {
      const res = await fetch(`/api/shipment-requests/track?id=${encodeURIComponent(id)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTrackingResult({ ok: false, error: data.error ?? "تعذر جلب حالة الطلب" });
        return;
      }
      setTrackingResult({ ok: true, data });
    } catch {
      setTrackingResult({ ok: false, error: "حدث خطأ أثناء التتبع" });
    } finally {
      setTrackingLoading(false);
    }
  };

  const submitShipmentRequest = async () => {
    setSubmitResult(null);
    const from = fromLoc?.address?.trim() ?? "";
    const to = toLoc?.address?.trim() ?? "";
    if (!from || !to || !locationLocked) {
      setSubmitResult({ ok: false, error: "الرجاء اختيار الموقع (من/إلى) ثم الضغط على «حفظ»." });
      return;
    }
    if (!shipmentType) {
      setSubmitResult({ ok: false, error: "الرجاء اختيار نوع الشحنة." });
      return;
    }
    if (!containerSize) {
      setSubmitResult({ ok: false, error: "الرجاء اختيار حجم الحاوية." });
      return;
    }
    if (!containersCount.trim()) {
      setSubmitResult({ ok: false, error: "الرجاء إدخال عدد الحاويات." });
      return;
    }
    if (!pickupDate) {
      setSubmitResult({ ok: false, error: "الرجاء تحديد تاريخ الاستلام." });
      return;
    }
    if (!shipperPhone.trim()) {
      setSubmitResult({ ok: false, error: "الرجاء إدخال رقم التواصل." });
      return;
    }
    if (priceSar == null || distanceKm == null) {
      setSubmitResult({ ok: false, error: "تعذر حساب المسافة والسعر. تأكد من اختيار موقعين صحيحين." });
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
          fromLat: fromLoc?.lat ?? null,
          fromLng: fromLoc?.lng ?? null,
          toLat: toLoc?.lat ?? null,
          toLng: toLoc?.lng ?? null,
          shipmentType,
          containerSize: containerSize || null,
          containersCount: containersCount.trim(),
          pickupDate,
          notes: notes.trim() || null,
          phone: shipperPhone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitResult({ ok: false, error: data.error ?? "تعذر إرسال الطلب" });
        return;
      }
      const createdId = String(data.id);
      setSubmitResult({ ok: true, id: createdId });
      setFromLoc(null);
      setToLoc(null);
      setShipmentType("");
      setContainerSize("");
      setContainersCount("");
      setPickupDate("");
      setNotes("");
      setShipperPhone("");
      setLocationLocked(false);

      // Move to tracking tab and prefill id
      setTrackingId(createdId);
      setShipperTab("track");
      trackShipmentRequest(createdId);
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
          {isLoggedIn && userRole !== "COMPANY" && (
            <Link
              href="/dashboard"
              className="py-3 px-3 rounded-lg font-medium text-foreground bg-primary/15 text-primary hover:bg-primary/25 active:bg-primary/25 transition-colors min-h-[44px] flex items-center mt-2 border-t border-border pt-4"
              onClick={() => setSidebarOpen(false)}
            >
              لوحة التحكم
            </Link>
          )}
          {isLoggedIn && (
            <div className="border-t border-border mt-2 pt-4">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-lg w-full text-destructive hover:text-destructive/90 hover:bg-muted/50 transition-colors"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                تسجيل الخروج
              </button>
            </div>
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
                <>
                  {userRole !== "COMPANY" ? (
                    <Link
                      href="/dashboard"
                      className="px-2.5 py-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
                    >
                      لوحة التحكم
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="px-2.5 py-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium text-white border border-white/60 hover:bg-white/10 hover:border-white/80 transition-colors whitespace-nowrap"
                  >
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-2.5 py-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium text-white border border-white/60 hover:bg-white/10 hover:border-white/80 transition-colors whitespace-nowrap"
                  >
                    تسجيل الدخول
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

        <div className="-mt-2 mb-6 sm:mb-8 flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-white/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            <span className="text-sm sm:text-base font-medium drop-shadow-sm">بالتعاون مع</span>
            <span className="h-4 w-px bg-white/25" aria-hidden />
            <span className="text-xs sm:text-sm text-white/80">LOGISTI</span>
          </div>

          <div className="relative w-full max-w-md mx-auto">
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-white/30 via-white/10 to-white/30 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
              <div className="relative h-14 sm:h-16 md:h-20 px-6 py-3 rounded-2xl bg-white border border-white/20 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 to-transparent" />
                <Image
                  src="/logisti.png"
                  alt="شركاؤنا"
                  fill
                  className="object-contain p-3"
                  sizes="(max-width: 768px) 100vw, 448px"
                  priority={false}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 px-2 sm:px-0">
          {/* Right side: shippers */}
          <div className="md:order-1 rounded-2xl border border-white/20 bg-black/35 backdrop-blur-sm p-5 sm:p-6 text-white shadow-xl">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">ترغب في نقل بضائع؟</h2>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-5">
              ابدأ بإدخال بيانات الشحنة المطلوبة وسيتم إرسال الطلب مباشرة إلى شركات النقل.
            </p>
            {isLoggedIn && userRole === "COMPANY" ? (
              <button
                type="button"
                onClick={() => setMode("shipper")}
                className={`inline-flex items-center justify-center w-full h-12 rounded-xl font-semibold transition-colors ${
                  mode === "shipper"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-white text-foreground hover:bg-white/90"
                }`}
              >
                إدخال بيانات الشحنة أو تتبّع الشحنات
              </button>
            ) : !isLoggedIn ? (
              <Link
                href="/register/company"
                className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                إنشاء حساب للشحن
              </Link>
            ) : null}
          </div>

          {/* Left side: carriers */}
          <div className="md:order-2 rounded-2xl border border-white/20 bg-black/35 backdrop-blur-sm p-5 sm:p-6 text-white shadow-xl">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">شركة نقل؟</h2>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-5">
              انضم إلى منصتنا كشركة نقل معتمدة لتلقي طلبات الشحن وتنفيذها عبر الشبكة.
            </p>
            <Link
              href="/register/carrier"
              className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-white text-foreground font-semibold hover:bg-white/90 transition-colors"
            >
              إنشاء حساب (شركة نقل)
            </Link>
          </div>
        </div>

        {mode === "shipper" && canShip && (
          <div className="w-full max-w-2xl mt-6 sm:mt-8 bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border border-gray-100 mx-2 sm:mx-0">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-foreground">إدارة الشحنة</h3>
                <div className="mt-2 inline-flex rounded-lg border border-border bg-muted/20 p-1">
                  <button
                    type="button"
                    onClick={() => setShipperTab("create")}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      shipperTab === "create"
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    إرسال طلب
                  </button>
                  <button
                    type="button"
                    onClick={() => setShipperTab("track")}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      shipperTab === "track"
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    تتبّع طلب
                  </button>
                </div>
              </div>
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

            {shipperTab === "create" ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground">الموقع</div>
                      {locationLocked ? (
                        <div className="mt-2 text-sm text-muted-foreground space-y-1">
                          <div className="break-words">
                            <span className="font-medium text-foreground">من:</span>{" "}
                            {fromLoc?.address ?? "—"}
                          </div>
                          <div className="break-words">
                            <span className="font-medium text-foreground">إلى:</span>{" "}
                            {toLoc?.address ?? "—"}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-muted-foreground">
                          اختر “من” و“إلى” ثم اضغط حفظ.
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (locationLocked) {
                          setLocationLocked(false);
                          return;
                        }
                        if (!canSaveLocation) return;
                        setLocationLocked(true);
                      }}
                      disabled={!locationLocked && !canSaveLocation}
                      className={`h-9 px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                        locationLocked
                          ? "bg-background border border-border text-foreground hover:bg-muted"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {locationLocked ? "تعديل" : "حفظ"}
                    </button>
                  </div>

                  {!locationLocked && (
                    <div className="mt-3">
                      <MapboxLocationPicker
                        valueFrom={fromLoc}
                        valueTo={toLoc}
                        onChangeFrom={setFromLoc}
                        onChangeTo={setToLoc}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">المسافة</label>
                    <input
                      value={distanceLabel}
                      readOnly
                      tabIndex={-1}
                      className="w-full h-11 rounded-lg border border-gray-200 bg-gray-100 px-3 text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">السعر التقديري</label>
                    <input
                      value={priceLabel}
                      readOnly
                      tabIndex={-1}
                      className="w-full h-11 rounded-lg border border-gray-200 bg-gray-100 px-3 text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">نوع الشحنة</label>
                    <select
                      value={shipmentType}
                      onChange={(e) => setShipmentType(e.target.value)}
                      required
                      className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    >
                      <option value="">اختر نوع الشحنة</option>
                      <option value="قابل للكسر">قابل للكسر</option>
                      <option value="مواد غذائية">مواد غذائية</option>
                      <option value="مواد كيميائية">مواد كيميائية</option>
                      <option value="أجهزة إلكترونية">أجهزة إلكترونية</option>
                      <option value="مواد بناء">مواد بناء</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">حجم الحاوية</label>
                <select
                  value={containerSize}
                  onChange={(e) => setContainerSize(e.target.value as "20" | "40" | "")}
                  required
                  className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="">اختر</option>
                  <option value="20">20 قدم</option>
                  <option value="40">40 قدم</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">عدد الحاويات</label>
                <input
                  value={containersCount}
                  onChange={(e) => setContainersCount(e.target.value)}
                  placeholder="مثال: 2"
                  inputMode="numeric"
                  required
                  className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">تاريخ الاستلام</label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  required
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
                <label className="text-sm font-medium text-foreground">رقم التواصل</label>
                <input
                  value={shipperPhone}
                  onChange={(e) => setShipperPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  required
                  className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-base font-semibold text-foreground">رقم الطلب</label>
                  <div className="flex gap-2">
                    <input
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      placeholder="اكتب رقم الطلب هنا"
                      className="flex-1 h-12 rounded-lg border border-gray-200 bg-gray-50 px-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => trackShipmentRequest()}
                      disabled={trackingLoading}
                      className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed text-primary-foreground font-semibold text-base transition-colors"
                    >
                      {trackingLoading ? "..." : "تتبّع"}
                    </button>
                  </div>
                </div>

                {trackingResult && (
                  <div
                    className={`text-base p-4 rounded-lg ${
                      trackingResult.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                    }`}
                  >
                    {trackingResult.ok ? (
                      <div className="space-y-2">
                        <div className="font-semibold">الحالة: {trackingResult.data.statusLabel}</div>
                        <div className="text-sm opacity-90">
                          من {trackingResult.data.from} → إلى {trackingResult.data.to}
                        </div>
                        {typeof trackingResult.data.distanceKm === "number" && (
                          <div className="text-sm opacity-90">
                            المسافة: {trackingResult.data.distanceKm.toFixed(1)} كم
                          </div>
                        )}
                        {typeof trackingResult.data.priceSar === "number" && (
                          <div className="text-sm opacity-90">
                            {trackingResult.data.status === "ADMIN_APPROVED"
                              ? "السعر النهائي: "
                              : "السعر: "}
                            {formatSar(trackingResult.data.priceSar)}
                          </div>
                        )}
                        {trackingResult.data?.status === "ADMIN_APPROVED" &&
                          trackingResult.data?.adminPriceChanged &&
                          typeof trackingResult.data?.estimatedPriceSar === "number" &&
                          typeof trackingResult.data?.priceSar === "number" && (
                            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 p-3 text-sm">
                              تم تعديل السعر بواسطة الأدمن من{" "}
                              <span className="font-semibold">{formatSar(trackingResult.data.estimatedPriceSar)}</span>{" "}
                              إلى{" "}
                              <span className="font-semibold">{formatSar(trackingResult.data.priceSar)}</span>.
                            </div>
                          )}
                        <div className="text-sm opacity-90">
                          تاريخ الإنشاء: {new Date(trackingResult.data.createdAt).toLocaleString("ar-SA")}
                        </div>

                        {trackingResult.data?.fromLat != null &&
                          trackingResult.data?.fromLng != null &&
                          trackingResult.data?.toLat != null &&
                          trackingResult.data?.toLng != null && (
                            <div className="pt-2">
                              <MapboxLocationPreview
                                from={{ lat: trackingResult.data.fromLat, lng: trackingResult.data.fromLng }}
                                to={{ lat: trackingResult.data.toLat, lng: trackingResult.data.toLng }}
                                heightClassName="h-40 sm:h-48"
                                interactive
                              />
                              <div className="mt-3 text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="inline-block w-3 h-3 rounded-sm bg-[#1b8254]" aria-hidden />
                                  من
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="inline-block w-3 h-3 rounded-sm bg-[#f59e0b]" aria-hidden />
                                  إلى
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    ) : (
                      trackingResult.error
                    )}
                  </div>
                )}

                {submitResult?.ok && (
                  <div className="text-sm text-muted-foreground">
                    رقم طلبك: <span className="font-mono text-foreground text-base">{submitResult.id}</span>
                  </div>
                )}
              </div>
            )}

            {submitResult && shipperTab === "create" && (
              <p
                className={`mt-4 text-sm p-3 rounded-lg ${
                  submitResult.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                }`}
              >
                {submitResult.ok
                  ? `تم إرسال طلب الشحن بنجاح. رقم الطلب: ${submitResult.id}`
                  : submitResult.error}
              </p>
            )}

            {shipperTab === "create" && (
              <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  سيتم إرسال الطلب مباشرة إلى شركات النقل المسجّلة.
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
            )}

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
      </div>

      {/* Gold divider */}
      <div className="relative z-10 h-2 bg-primary" />
      <div className="relative z-10 h-0.5 bg-primary/80" />
    </section>
  );
}
