"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PageLoadingScreen } from "@/components/page-loading-screen";
import type { TruckRunSpec } from "@/lib/route-loading-types";

/** Minimum truck travel time (ms). */
const MIN_LOADING_MS = 1000;

/** Loading overlay never stays longer than this from when it was armed (ms). */
const MAX_LOADING_MS = 3000;

/**
 * Shows the truck loader during client navigations while the next route is
 * loading / compiling (RSC fetch). Covers Link clicks, form GET navigations,
 * and browser back/forward.
 *
 * Important: we arm loading in setTimeout(0) after click so the browser can
 * perform the default navigation before React paints the full-screen overlay.
 */
function NavigationLoadingInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [truckRun, setTruckRun] = useState<TruckRunSpec | null>(null);

  const pendingRef = useRef(false);
  pendingRef.current = pending;

  const loadStartedAtRef = useRef<number | null>(null);
  const truckIdRef = useRef(0);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Avoid firing truck twice for the same route (e.g. Strict Mode). */
  const lastTruckForRouteKeyRef = useRef<string | null>(null);

  const routeKey = `${pathname}?${searchParams.toString()}`;

  const clearLoading = useCallback(() => {
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    setPending(false);
    setTruckRun(null);
    loadStartedAtRef.current = null;
    lastTruckForRouteKeyRef.current = null;
  }, []);

  const clearLoadingRef = useRef(clearLoading);
  clearLoadingRef.current = clearLoading;

  /** Defer so <a> default navigation / form submit runs before overlay paints. */
  const armLoading = useCallback(() => {
    window.setTimeout(() => {
      loadStartedAtRef.current = Date.now();
      lastTruckForRouteKeyRef.current = null;
      setPending(true);
      setTruckRun(null);

      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
      maxTimerRef.current = setTimeout(() => {
        clearLoadingRef.current();
      }, MAX_LOADING_MS);
    }, 0);
  }, []);

  /** When the route updates, compute truck duration (one shot left → right), capped by MAX_LOADING_MS from arm. */
  useEffect(() => {
    if (!pendingRef.current) return;
    const arm = loadStartedAtRef.current;
    if (arm === null) return;
    if (lastTruckForRouteKeyRef.current === routeKey) return;
    lastTruckForRouteKeyRef.current = routeKey;

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
  }, [routeKey]);

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

      armLoading();
    },
    [armLoading],
  );

  useEffect(() => {
    const onSubmitCapture = (e: Event) => {
      const form = (e as SubmitEvent).target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.method.toLowerCase() !== "get") return;
      armLoading();
    };
    const onPopState = () => armLoading();
    window.addEventListener("click", onClickCapture, true);
    window.addEventListener("submit", onSubmitCapture, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("submit", onSubmitCapture, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [onClickCapture, armLoading]);

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
