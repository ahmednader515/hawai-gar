"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useI18n } from "@/components/providers/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import Image from "next/image";
import { AR_LOCALE_LATN } from "@/lib/locale";
import { formatSarAmount, sarAmountInWords } from "@/lib/format-sar";
import { SarPriceDisplay } from "@/components/sar-price-display";
import { ShipmentPriceChangeAlert } from "@/components/shipment-price-change-alert";
import Link from "next/link";
import type { PickedLocation } from "@/components/mapbox-location-picker";
import { signOut } from "next-auth/react";
import { CopyableRequestId } from "@/components/copyable-request-id";

/** Mapbox + geocoder are large; load only when the shipper panel or track map is shown */
const MapboxLocationPicker = dynamic(
  () => import("@/components/mapbox-location-picker").then((m) => m.MapboxLocationPicker),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[min(400px,50vh)] w-full animate-pulse rounded-lg bg-muted"
        aria-hidden
      />
    ),
  },
);

const MapboxLocationPreview = dynamic(
  () => import("@/components/mapbox-location-preview").then((m) => m.MapboxLocationPreview),
  {
    ssr: false,
    loading: () => <div className="h-40 animate-pulse rounded-lg bg-muted sm:h-48" aria-hidden />,
  },
);

const CompanyInvoiceProofUpload = dynamic(
  () => import("@/components/company-invoice-proof-upload").then((m) => m.CompanyInvoiceProofUpload),
  {
    ssr: false,
    loading: () => <div className="min-h-[5rem] animate-pulse rounded-lg bg-muted" aria-hidden />,
  },
);

const MAIN_NAV_LINK_DEFS: { href: string; labelKey: string; className?: string }[] = [
  { href: "/", labelKey: "nav.public.home" },
  { href: "/#solutions", labelKey: "nav.public.solutions" },
  { href: "/#carousel", labelKey: "nav.public.learnMore", className: "hidden sm:inline" },
  { href: "/#about", labelKey: "nav.public.about", className: "hidden sm:inline" },
  { href: "/#news", labelKey: "nav.public.news" },
  { href: "/#advisories", labelKey: "nav.public.advisories" },
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
  const { t, locale } = useI18n();
  const mainNavLinks = useMemo(
    () =>
      MAIN_NAV_LINK_DEFS.map((item) => ({
        href: item.href,
        label: t(item.labelKey),
        className: item.className,
      })),
    [t],
  );
  /** Company users: shipment panel open by default on the homepage */
  const [mode, setMode] = useState<"shipper" | null>(() =>
    isLoggedIn && userRole === "COMPANY" ? "shipper" : null,
  );
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
    if (isLoggedIn && userRole === "COMPANY") {
      setMode("shipper");
    } else if (!isLoggedIn || userRole !== "COMPANY") {
      setMode(null);
    }
  }, [isLoggedIn, userRole]);

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
    return formatSarAmount(Math.round(priceSar), locale);
  }, [priceSar, locale]);

  const priceInWords = useMemo(() => {
    if (priceSar == null) return "";
    return sarAmountInWords(Math.round(priceSar), locale);
  }, [priceSar, locale]);

  const distanceLabel = useMemo(() => {
    if (distanceKm == null) return "—";
    return `${distanceKm.toFixed(1)} ${t("hero.km")}`;
  }, [distanceKm, t]);

  const trackShipmentRequest = async (idRaw?: string) => {
    const id = (idRaw ?? trackingId).trim();
    if (!id) {
      setTrackingResult({ ok: false, error: t("hero.errors.requestIdRequired") });
      return;
    }
    setTrackingLoading(true);
    setTrackingResult(null);
    try {
      const res = await fetch(`/api/shipment-requests/track?id=${encodeURIComponent(id)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTrackingResult({ ok: false, error: data.error ?? t("hero.errors.trackFailed") });
        return;
      }
      setTrackingResult({ ok: true, data });
    } catch {
      setTrackingResult({ ok: false, error: t("hero.errors.trackError") });
    } finally {
      setTrackingLoading(false);
    }
  };

  const submitShipmentRequest = async () => {
    setSubmitResult(null);
    const from = fromLoc?.address?.trim() ?? "";
    const to = toLoc?.address?.trim() ?? "";
    if (!from || !to || !locationLocked) {
      setSubmitResult({ ok: false, error: t("hero.errors.locationsRequired") });
      return;
    }
    if (!shipmentType) {
      setSubmitResult({ ok: false, error: t("hero.errors.shipmentType") });
      return;
    }
    if (!containerSize) {
      setSubmitResult({ ok: false, error: t("hero.errors.containerSize") });
      return;
    }
    if (!containersCount.trim()) {
      setSubmitResult({ ok: false, error: t("hero.errors.containersCount") });
      return;
    }
    if (!pickupDate) {
      setSubmitResult({ ok: false, error: t("hero.errors.pickupDate") });
      return;
    }
    if (!shipperPhone.trim()) {
      setSubmitResult({ ok: false, error: t("hero.errors.phone") });
      return;
    }
    if (priceSar == null || distanceKm == null) {
      setSubmitResult({ ok: false, error: t("hero.errors.priceDistance") });
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
        setSubmitResult({ ok: false, error: data.error ?? t("hero.errors.submitFailed") });
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
      setSubmitResult({ ok: false, error: t("hero.errors.submitError") });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-[85vh] flex flex-col overflow-hidden">
      {/* Background: video only — no poster image (avoids flash of hero.png before video) */}
      <div className="absolute inset-0 z-0">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src="/video-1.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-foreground/50" />
      </div>

      {/* Mobile only: overlay + drawer — single md:hidden wrapper so nothing flashes on desktop */}
      <div className="md:hidden">
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-300 ease-out ${
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-hidden={!sidebarOpen}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t("common.closeMenu")}
            onClick={() => setSidebarOpen(false)}
          />
        </div>
        <aside
          className={`fixed top-0 bottom-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col border-s border-border bg-card shadow-xl transition-transform duration-300 ease-out will-change-transform ${
            sidebarOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
          }`}
        aria-modal="true"
        role="dialog"
        aria-label={t("common.menu")}
        aria-hidden={!sidebarOpen}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-semibold text-foreground">{t("common.menu")}</span>
          <button
            type="button"
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-transform"
            aria-label={t("common.close")}
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col p-4 gap-1 overflow-y-auto">
          {mainNavLinks.map((item) => (
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
              {t("common.dashboard")}
            </Link>
          )}
          {isLoggedIn && (
            <div className="border-t border-border mt-2 pt-4">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-lg w-full text-destructive hover:text-destructive/90 hover:bg-muted/50 transition-colors"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                {t("common.logout")}
              </button>
            </div>
          )}
        </nav>
        </aside>
      </div>

      {/* Top Navbar: logo + inline links on desktop; mobile keeps drawer */}
      <header className="relative z-20 border-b border-white/20 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4">
          {/* Start: brand + desktop nav links in one bar */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4 md:gap-6">
            <Link href="/" className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Image
                src="/logo.png"
                alt="hawai GAR"
                width={48}
                height={48}
                className="object-contain h-9 w-9 sm:h-12 sm:w-12"
              />
              <span className="text-xl font-bold text-white hidden sm:inline">hawai GAR</span>
            </Link>
            <nav
              className="hidden min-w-0 md:flex md:flex-wrap md:items-center md:gap-x-4 md:gap-y-1 lg:gap-x-5 text-sm text-white/90"
              aria-label={t("common.menu")}
            >
              {mainNavLinks.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={`shrink-0 hover:text-white transition-colors ${item.className ?? ""}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* End: mobile menu + language + auth */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-4">
            <div className="flex shrink-0 items-center md:hidden">
              <button
                type="button"
                className="p-1.5 text-white/90 hover:text-white rounded-lg hover:bg-white/10 transition-colors sm:p-2"
                aria-label={t("common.openMenu")}
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen(true)}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <LanguageSwitcher variant="hero" className="shrink-0" />
            <div className="h-5 sm:h-6 w-px bg-white/40 shrink-0 hidden sm:block" aria-hidden />
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {isLoggedIn ? (
                <>
                  {userRole !== "COMPANY" ? (
                    <Link
                      href="/dashboard"
                      className="px-2.5 py-1.5 rounded-md text-xs font-medium sm:px-3 sm:py-1.5 sm:rounded-lg sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
                    >
                      {t("common.dashboard")}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="px-2.5 py-1.5 rounded-md text-xs font-medium sm:px-3 sm:py-1.5 sm:rounded-lg sm:text-sm text-white border border-white/60 hover:bg-white/10 hover:border-white/80 transition-colors whitespace-nowrap"
                  >
                    {t("common.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-2.5 py-1.5 rounded-md text-xs font-medium sm:px-3 sm:py-1.5 sm:rounded-lg sm:text-sm text-white border border-white/60 hover:bg-white/10 hover:border-white/80 transition-colors whitespace-nowrap"
                  >
                    {t("common.login")}
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
          {t("hero.headline")}
        </h1>

        <div className="-mt-2 mb-6 sm:mb-8 flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-white/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            <span className="text-sm sm:text-base font-medium drop-shadow-sm">{t("hero.cooperateWith")}</span>
            <span className="h-4 w-px bg-white/25" aria-hidden />
            <span className="text-xs sm:text-sm text-white/80">LOGISTI</span>
          </div>

          <div className="relative w-full max-w-md mx-auto">
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-white/30 via-white/10 to-white/30 shadow-[0_18px_55px_rgba(0,0,0,0.35)]">
              <div className="relative h-14 sm:h-16 md:h-20 px-6 py-3 rounded-2xl bg-white border border-white/20 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 to-transparent" />
                <Image
                  src="/logisti.png"
                  alt={t("hero.partnersAlt")}
                  fill
                  className="object-contain p-3"
                  sizes="(max-width: 768px) min(100vw, 448px), 448px"
                  priority
                  quality={85}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 px-2 sm:px-0">
          {/* Right side: shippers */}
          <div className="md:order-1 rounded-2xl border border-white/20 bg-black/35 backdrop-blur-sm p-5 sm:p-6 text-white shadow-xl">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{t("hero.shipperTitle")}</h2>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-5">
              {t("hero.shipperBody")}
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
                {t("hero.shipperCtaTabs")}
              </button>
            ) : !isLoggedIn ? (
              <Link
                href="/register/company"
                className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                {t("hero.shipperRegister")}
              </Link>
            ) : null}
          </div>

          {/* Left side: carriers */}
          <div className="md:order-2 rounded-2xl border border-white/20 bg-black/35 backdrop-blur-sm p-5 sm:p-6 text-white shadow-xl">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{t("hero.carrierTitle")}</h2>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-5">
              {t("hero.carrierBody")}
            </p>
            <Link
              href="/register/carrier"
              className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-white text-foreground font-semibold hover:bg-white/90 transition-colors"
            >
              {t("hero.carrierRegister")}
            </Link>
          </div>
        </div>

        {mode === "shipper" && canShip && (
          <div className="w-full max-w-2xl mt-6 sm:mt-8 bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border border-gray-100 mx-2 sm:mx-0">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-foreground">{t("hero.panelTitle")}</h3>
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
                    {t("hero.tabSend")}
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
                    {t("hero.tabTrack")}
                  </button>
                </div>
              </div>
              {/* No close control for company: panel stays open on the homepage */}
            </div>

            {shipperTab === "create" ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                  <div className="flex flex-col gap-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-foreground">{t("hero.locationTitle")}</div>
                        {locationLocked ? (
                          <div className="mt-2 text-sm text-muted-foreground space-y-1">
                            <div className="break-words">
                              <span className="font-medium text-foreground">{t("hero.from")}</span>{" "}
                              {fromLoc?.address ?? "—"}
                            </div>
                            <div className="break-words">
                              <span className="font-medium text-foreground">{t("hero.to")}</span>{" "}
                              {toLoc?.address ?? "—"}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {t("hero.pickHint")}
                          </div>
                        )}
                      </div>
                      {/* Save/Edit: beside title on md+ */}
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
                        className={`hidden md:inline-flex shrink-0 items-center justify-center h-9 min-h-9 px-4 rounded-lg text-sm font-semibold leading-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                          locationLocked
                            ? "bg-background border border-border text-foreground hover:bg-muted"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                      >
                        {locationLocked ? t("hero.edit") : t("hero.save")}
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

                    {/* Save/Edit: full width below map (or below addresses when locked) on mobile */}
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
                      className={`md:hidden flex w-full min-h-11 items-center justify-center mt-3 rounded-lg text-sm font-semibold leading-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                        locationLocked
                          ? "bg-background border border-border text-foreground hover:bg-muted"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {locationLocked ? t("hero.edit") : t("hero.save")}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{t("hero.distance")}</label>
                    <input
                      value={distanceLabel}
                      readOnly
                      tabIndex={-1}
                      className="w-full h-11 rounded-lg border border-gray-200 bg-gray-100 px-3 text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{t("hero.estimatedPrice")}</label>
                    <input
                      value={priceLabel}
                      readOnly
                      tabIndex={-1}
                      className="w-full h-11 rounded-lg border border-gray-200 bg-gray-100 px-3 text-foreground"
                    />
                    {priceInWords ? (
                      <p className="text-xs text-muted-foreground leading-snug">{priceInWords}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">{t("hero.shipmentType")}</label>
                    <select
                      value={shipmentType}
                      onChange={(e) => setShipmentType(e.target.value)}
                      required
                      className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    >
                      <option value="">{t("hero.shipmentTypePlaceholder")}</option>
                      <option value="قابل للكسر">{t("hero.types.fragile")}</option>
                      <option value="مواد غذائية">{t("hero.types.food")}</option>
                      <option value="مواد كيميائية">{t("hero.types.chemical")}</option>
                      <option value="أجهزة إلكترونية">{t("hero.types.electronics")}</option>
                      <option value="مواد بناء">{t("hero.types.building")}</option>
                      <option value="أخرى">{t("hero.types.other")}</option>
                    </select>
                  </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{t("hero.containerSize")}</label>
                <select
                  value={containerSize}
                  onChange={(e) => setContainerSize(e.target.value as "20" | "40" | "")}
                  required
                  className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="">{t("hero.containerPlaceholder")}</option>
                  <option value="20">{t("hero.container20")}</option>
                  <option value="40">{t("hero.container40")}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{t("hero.containersCount")}</label>
                <input
                  value={containersCount}
                  onChange={(e) => setContainersCount(e.target.value)}
                  placeholder={t("hero.containersPlaceholder")}
                  inputMode="numeric"
                  required
                  className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">{t("hero.pickupDate")}</label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  required
                  className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">{t("hero.notes")}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("hero.notesPlaceholder")}
                  className="w-full min-h-24 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">{t("hero.contactPhone")}</label>
                <input
                  value={shipperPhone}
                  onChange={(e) => setShipperPhone(e.target.value)}
                  placeholder={t("hero.contactPhonePlaceholder")}
                  required
                  className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-base font-semibold text-foreground">{t("hero.requestIdLabel")}</label>
                  {userRole === "COMPANY" ? (
                    <p className="text-xs text-muted-foreground leading-snug">{t("hero.trackSaveIdHint")}</p>
                  ) : null}
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
                    <input
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      placeholder={t("hero.trackPlaceholder")}
                      className="min-w-0 h-11 w-full flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary sm:h-12"
                    />
                    <button
                      type="button"
                      onClick={() => trackShipmentRequest()}
                      disabled={trackingLoading}
                      className="h-11 w-full shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 sm:h-12 sm:w-auto sm:px-5 sm:text-base"
                    >
                      {trackingLoading ? t("hero.tracking") : t("hero.track")}
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
                        {trackingResult.data?.id != null && (
                          <CopyableRequestId id={String(trackingResult.data.id)} compact />
                        )}
                        <div className="font-semibold">
                          {t("hero.status")}:{" "}
                          {(() => {
                            const st = trackingResult.data.status;
                            const key = `shipmentRequestStatus.${String(st)}`;
                            const localized = t(key);
                            return localized !== key ? localized : trackingResult.data.statusLabel;
                          })()}
                        </div>
                        <div className="text-sm opacity-90">
                          {t("hero.route")
                            .replace("{from}", String(trackingResult.data.from))
                            .replace("{to}", String(trackingResult.data.to))}
                        </div>
                        {typeof trackingResult.data.distanceKm === "number" && (
                          <div className="text-sm opacity-90">
                            {t("hero.distanceKm").replace(
                              "{n}",
                              trackingResult.data.distanceKm.toFixed(1),
                            )}
                          </div>
                        )}
                        {typeof trackingResult.data.priceSar === "number" && (
                          <div className="text-sm opacity-90">
                            <div className="font-medium mb-1">
                              {["ADMIN_APPROVED", "AWAITING_PAYMENT_APPROVAL", "COMPLETE"].includes(
                                String(trackingResult.data.status),
                              )
                                ? t("hero.priceFinal")
                                : t("hero.price")}
                            </div>
                            <SarPriceDisplay
                              amount={trackingResult.data.priceSar}
                              locale={locale}
                              amountClassName="font-semibold tabular-nums"
                            />
                          </div>
                        )}
                        {["ADMIN_APPROVED", "AWAITING_PAYMENT_APPROVAL", "COMPLETE"].includes(
                          String(trackingResult.data?.status),
                        ) &&
                          trackingResult.data?.adminPriceChanged &&
                          typeof trackingResult.data?.estimatedPriceSar === "number" &&
                          typeof trackingResult.data?.priceSar === "number" && (
                            <div className="mt-2">
                              <ShipmentPriceChangeAlert
                                estimatedPriceSar={trackingResult.data.estimatedPriceSar}
                                priceSar={trackingResult.data.priceSar}
                                locale={locale}
                                compact
                              />
                            </div>
                          )}
                        {userRole === "COMPANY" &&
                          typeof (trackingResult.data as { invoiceLink?: string | null }).invoiceLink ===
                            "string" &&
                          String((trackingResult.data as { invoiceLink?: string | null }).invoiceLink).trim() !==
                            "" && (
                            <div className="mt-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-foreground space-y-2">
                              <div className="font-semibold">{t("hero.invoiceLinkTitle")}</div>
                              <a
                                href={String(
                                  (trackingResult.data as { invoiceLink: string }).invoiceLink,
                                ).trim()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block font-medium text-primary underline underline-offset-2 break-all"
                              >
                                {t("hero.invoiceLinkOpen")}
                              </a>
                            </div>
                          )}
                        {trackingResult.data?.status === "AWAITING_PAYMENT_APPROVAL" && (
                          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                            {t("hero.paymentProofPendingAdmin")}
                          </p>
                        )}
                        {userRole === "COMPANY" &&
                          trackingResult.data?.id != null &&
                          ["ADMIN_APPROVED", "AWAITING_PAYMENT_APPROVAL"].includes(
                            String(trackingResult.data.status),
                          ) && (
                            <CompanyInvoiceProofUpload
                              requestId={String(trackingResult.data.id)}
                              initialImageUrl={
                                (trackingResult.data as { invoiceImageUrl?: string | null })
                                  .invoiceImageUrl ?? null
                              }
                              onSaved={() =>
                                void trackShipmentRequest(String(trackingResult.data.id))
                              }
                            />
                          )}
                        <div className="text-sm opacity-90">
                          {t("hero.createdAt")}:{" "}
                          {new Date(trackingResult.data.createdAt).toLocaleString(
                            locale === "ar" ? AR_LOCALE_LATN : "en-GB",
                          )}
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
                                  {t("hero.mapFrom")}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="inline-block w-3 h-3 rounded-sm bg-[#f59e0b]" aria-hidden />
                                  {t("hero.mapTo")}
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

                {submitResult?.ok && submitResult.id ? (
                  <CopyableRequestId id={submitResult.id} compact />
                ) : null}
              </div>
            )}

            {submitResult && shipperTab === "create" && (
              <p
                className={`mt-4 text-sm p-3 rounded-lg ${
                  submitResult.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                }`}
              >
                {submitResult.ok
                  ? t("hero.submitSuccess").replace("{id}", submitResult.id)
                  : submitResult.error}
              </p>
            )}

            {shipperTab === "create" && (
              <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  {t("hero.submitNote")}
                </div>
                <button
                  type="button"
                  onClick={submitShipmentRequest}
                  disabled={submitLoading}
                  className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed text-primary-foreground font-semibold transition-colors"
                >
                  {submitLoading ? t("hero.submitSending") : t("hero.submitSend")}
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
                {t("hero.emailUs")}
              </a>
              {contactPhone && (
                <a
                  href={`tel:${contactPhone.replace(/\\s/g, "")}`}
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border-2 border-gray-200 text-foreground hover:bg-gray-50 font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {t("hero.callUs")}
                </a>
              )}
              <Link
                href="/news"
                className="inline-flex items-center justify-center h-11 px-5 rounded-xl border-2 border-gray-200 text-foreground hover:bg-gray-50 font-medium transition-colors"
              >
                {t("hero.newsLink")}
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
