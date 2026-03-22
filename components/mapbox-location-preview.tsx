"use client";

import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useI18n } from "@/components/providers/i18n-provider";

type LatLng = { lat: number; lng: number };

export function MapboxLocationPreview({
  from,
  to,
  heightClassName = "h-28 sm:h-32",
  interactive = false,
}: {
  from: LatLng | null | undefined;
  to: LatLng | null | undefined;
  heightClassName?: string;
  interactive?: boolean;
}) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

  const points = useMemo(() => {
    const p: LatLng[] = [];
    if (from) p.push(from);
    if (to) p.push(to);
    return p;
  }, [from, to]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!token) return;
    if (!points.length) return;
    mapboxgl.accessToken = token;

    // Recreate map when inputs change, so interactive mode remains correct.
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new mapboxgl.Map({
      container: el,
      style: "mapbox://styles/mapbox/streets-v12",
      attributionControl: false,
      center: [points[0].lng, points[0].lat],
      zoom: 9,
      interactive,
    });
    mapRef.current = map;

    const addMarkers = () => {
      // Cleanup any previous markers (shouldn't happen often, but safe)
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      if (from) {
        const m = new mapboxgl.Marker({ color: "#1b8254" }).setLngLat([from.lng, from.lat]).addTo(map);
        markersRef.current.push(m);
      }
      if (to) {
        const m = new mapboxgl.Marker({ color: "#f59e0b" }).setLngLat([to.lng, to.lat]).addTo(map);
        markersRef.current.push(m);
      }
    };

    const fit = () => {
      if (points.length === 2 && from && to) {
        const bounds = new mapboxgl.LngLatBounds(
          [Math.min(from.lng, to.lng), Math.min(from.lat, to.lat)],
          [Math.max(from.lng, to.lng), Math.max(from.lat, to.lat)],
        );
        map.fitBounds(bounds, { padding: 40, maxZoom: 12, duration: 0 });
      }
    };

    map.on("load", () => {
      addMarkers();
      fit();
    });

    if (interactive) {
      map.addControl(
        new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: false }),
        "top-right",
      );
      map.scrollZoom?.enable();
      map.dragPan?.enable();
      map.boxZoom?.enable();
      map.keyboard?.enable();
      map.doubleClickZoom?.enable();
      map.touchZoomRotate?.enable();
    } else {
      map.scrollZoom?.disable();
      map.dragPan?.disable();
      map.boxZoom?.disable();
      map.keyboard?.disable();
      map.doubleClickZoom?.disable();
      map.touchZoomRotate?.disable();
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [token, points.length, interactive, from, to]);

  // If coords change, easiest is to rely on rerender + effect guard being strict.
  // We intentionally keep this lightweight; details page usually navigates to different ids.
  return (
    <div
      ref={containerRef}
      className={`w-full rounded-lg overflow-hidden border border-border bg-muted/30 ${heightClassName}`}
      aria-label={t("mapPicker.mapAria")}
    />
  );
}

