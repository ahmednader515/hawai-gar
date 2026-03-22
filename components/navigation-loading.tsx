"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PageLoadingScreen } from "@/components/page-loading-screen";
import type { TruckRunSpec } from "@/lib/route-loading-types";

/** Minimum truck travel time (ms). */
const MIN_LOADING_MS = 1000;

/** Loading overlay never stays longer than this from when it was armed (ms). */
const MAX_LOADING_MS = 3000;

type ArmMode = "none" | "initial" | "navigation";

/**
 * Shows the truck loader on:
 * - first paint / full page load & refresh (initial)
 * - client navigations (click links, GET forms) — wait until URL updates
 * - browser back/forward — same as navigation (popstate captures route before arm)
 *
 * Click handlers use setTimeout(0) so the default navigation runs before the overlay.
 */
function NavigationLoadingInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [truckRun, setTruckRun] = useState<TruckRunSpec | null>(null);

  const routeKey = `${pathname}?${searchParams.toString()}`;
  const routeKeyRef = useRef(routeKey);
  routeKeyRef.current = routeKey;

  const loadStartedAtRef = useRef<number | null>(null);
  const truckIdRef = useRef(0);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Dedupe truck start for same route + arm (Strict Mode / double effects). */
  const truckScheduledForRouteKeyRef = useRef<string | null>(null);

  const armModeRef = useRef<ArmMode>("none");
  /** For navigation: React route key at arm time (must change before we run the truck). */
  const armedAtRouteKeyRef = useRef<string | null>(null);

  const clearLoading = useCallback(() => {
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    setPending(false);
    setTruckRun(null);
    loadStartedAtRef.current = null;
    truckScheduledForRouteKeyRef.current = null;
    armModeRef.current = "none";
    armedAtRouteKeyRef.current = null;
  }, []);

  const clearLoadingRef = useRef(clearLoading);
  clearLoadingRef.current = clearLoading;

  const armCommon = useCallback(() => {
    loadStartedAtRef.current = Date.now();
    truckScheduledForRouteKeyRef.current = null;
    setTruckRun(null);
    setPending(true);

    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    maxTimerRef.current = setTimeout(() => {
      clearLoadingRef.current();
    }, MAX_LOADING_MS);
  }, []);

  /** Link / form: defer overlay until after default navigation. */
  const armLoadingFromInteraction = useCallback(() => {
    window.setTimeout(() => {
      armModeRef.current = "navigation";
      armedAtRouteKeyRef.current = routeKeyRef.current;
      armCommon();
    }, 0);
  }, [armCommon]);

  /** Full load & refresh: show loader for current URL (no route change to wait for). */
  const initialArmOnceRef = useRef(false);
  useEffect(() => {
    if (initialArmOnceRef.current) return;
    initialArmOnceRef.current = true;
    window.setTimeout(() => {
      armModeRef.current = "initial";
      armedAtRouteKeyRef.current = null;
      armCommon();
    }, 0);
  }, [armCommon]);

  /** Back / forward: capture React route key now (still “old” page), then arm like a navigation. */
  const onPopState = useCallback(() => {
    const keyWhenEventFired = routeKeyRef.current;
    window.setTimeout(() => {
      armModeRef.current = "navigation";
      armedAtRouteKeyRef.current = keyWhenEventFired;
      armCommon();
    }, 0);
  }, [armCommon]);

  /** Run when `pending` or `routeKey` changes so initial load schedules without a URL change. */
  useEffect(() => {
    if (!pending) return;
    const arm = loadStartedAtRef.current;
    if (arm === null) return;

    const mode = armModeRef.current;

    if (mode === "initial") {
      if (truckScheduledForRouteKeyRef.current === routeKey) return;
      truckScheduledForRouteKeyRef.current = routeKey;
      armModeRef.current = "none";
    } else if (mode === "navigation") {
      const armedAt = armedAtRouteKeyRef.current;
      if (armedAt === null) return;
      if (routeKey === armedAt) return;
      if (truckScheduledForRouteKeyRef.current === routeKey) return;
      truckScheduledForRouteKeyRef.current = routeKey;
      armModeRef.current = "none";
      armedAtRouteKeyRef.current = null;
    } else {
      return;
    }

    const now = Date.now();
    const timeLeft = arm + MAX_LOADING_MS - now;
    if (timeLeft <= 50) {
      clearLoadingRef.current();
      return;
    }

    const elapsed = now - arm;
    const durationMs = Math.min(
      timeLeft,
      Math.max(MIN_LOADING_MS, elapsed),
      MAX_LOADING_MS,
    );

    truckIdRef.current += 1;
    setTruckRun({ id: truckIdRef.current, durationMs });
  }, [pending, routeKey]);

  const onClickCapture = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const el = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!el) return;
      if (el.getAttribute("target") === "_blank") return;
      if (el.hasAttribute("download")) return;

      const href = el.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      const next = `${url.pathname}${url.search}`;
      const current = `${window.location.pathname}${window.location.search}`;
      if (next === current) return;

      armLoadingFromInteraction();
    },
    [armLoadingFromInteraction],
  );

  useEffect(() => {
    const onSubmitCapture = (e: Event) => {
      const form = (e as SubmitEvent).target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.method.toLowerCase() !== "get") return;
      armLoadingFromInteraction();
    };
    window.addEventListener("click", onClickCapture, true);
    window.addEventListener("submit", onSubmitCapture, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("submit", onSubmitCapture, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [onClickCapture, armLoadingFromInteraction, onPopState]);

  if (!pending) return null;
  return (
    <PageLoadingScreen truckRun={truckRun} onTruckComplete={clearLoading} />
  );
}

/** `useSearchParams` must be under Suspense in the App Router */
export function NavigationLoading() {
  return (
    <Suspense fallback={null}>
      <NavigationLoadingInner />
    </Suspense>
  );
}
