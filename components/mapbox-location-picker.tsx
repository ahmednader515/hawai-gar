"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  addDrivingRouteLayer,
  getDrivingRouteOrStraight,
  removeDrivingRouteLayer,
  fitMapToCoordinates,
} from "@/lib/mapbox-driving-route";

export type PickedLocation = {
  address: string;
  lat: number;
  lng: number;
};

function isValidPicked(v: PickedLocation | null): v is PickedLocation {
  return !!v && Number.isFinite(v.lat) && Number.isFinite(v.lng) && !!v.address?.trim();
}

export function MapboxLocationPicker({
  valueFrom,
  valueTo,
  onChangeFrom,
  onChangeTo,
  className,
}: {
  valueFrom: PickedLocation | null;
  valueTo: PickedLocation | null;
  onChangeFrom: (v: PickedLocation | null) => void;
  onChangeTo: (v: PickedLocation | null) => void;
  className?: string;
}) {
  const { t, locale } = useI18n();
  const labelFrom = t("hero.mapFrom");
  const labelTo = t("hero.mapTo");
  const placeholderFrom = t("mapPicker.placeholderFrom");
  const placeholderTo = t("mapPicker.placeholderTo");
  const geocoderLanguage = locale === "ar" ? "ar" : "en";

  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const geocoderFromHostRef = useRef<HTMLDivElement | null>(null);
  const geocoderToHostRef = useRef<HTMLDivElement | null>(null);
  const markerFromRef = useRef<mapboxgl.Marker | null>(null);
  const markerToRef = useRef<mapboxgl.Marker | null>(null);
  const routeAbortRef = useRef<AbortController | null>(null);
  const activeRef = useRef<"from" | "to">("from");

  const [active, setActive] = useState<"from" | "to">("from");
  activeRef.current = active;

  const center = useMemo(() => {
    if (valueFrom && Number.isFinite(valueFrom.lat) && Number.isFinite(valueFrom.lng)) {
      return [valueFrom.lng, valueFrom.lat] as [number, number];
    }
    if (valueTo && Number.isFinite(valueTo.lat) && Number.isFinite(valueTo.lng)) {
      return [valueTo.lng, valueTo.lat] as [number, number];
    }
    return [46.6753, 24.7136] as [number, number]; // Riyadh default (lng, lat)
  }, [valueFrom, valueTo]);

  const setPicked = useCallback(
    (which: "from" | "to", picked: PickedLocation | null) => {
      if (which === "from") onChangeFrom(picked);
      else onChangeTo(picked);
    },
    [onChangeFrom, onChangeTo],
  );

  // Init map + geocoders — rebuild when locale / copy changes so placeholders & geocoder language match UI
  useEffect(() => {
    if (!token) return;
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom: 6,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-left");

    const mkGeocoder = (which: "from" | "to") =>
      new MapboxGeocoder({
        accessToken: token,
        mapboxgl: mapboxgl as any,
        marker: false,
        placeholder: which === "from" ? placeholderFrom : placeholderTo,
        language: geocoderLanguage,
        countries: "sa,ae,kw,qa,bh,om",
      });

    const geocoderFrom = mkGeocoder("from");
    const geocoderTo = mkGeocoder("to");

    if (geocoderFromHostRef.current) {
      geocoderFromHostRef.current.replaceChildren(geocoderFrom.onAdd(map));
    }
    if (geocoderToHostRef.current) {
      geocoderToHostRef.current.replaceChildren(geocoderTo.onAdd(map));
    }

    setActive("from");
    activeRef.current = "from";
    const fromInput = geocoderFromHostRef.current?.querySelector("input");
    if (fromInput) {
      requestAnimationFrame(() => {
        fromInput.focus();
      });
    }

    geocoderFrom.on("result", (e: any) => {
      const c = e?.result?.center;
      if (!Array.isArray(c) || c.length !== 2) return;
      const [lng, lat] = c;
      setActive("from");
      setPicked("from", { address: e.result.place_name ?? `${lat}, ${lng}`, lat, lng });
      map.flyTo({ center: [lng, lat], zoom: 9, essential: true });
    });

    geocoderTo.on("result", (e: any) => {
      const c = e?.result?.center;
      if (!Array.isArray(c) || c.length !== 2) return;
      const [lng, lat] = c;
      setActive("to");
      setPicked("to", { address: e.result.place_name ?? `${lat}, ${lng}`, lat, lng });
      map.flyTo({ center: [lng, lat], zoom: 9, essential: true });
    });

    map.on("click", (ev) => {
      const { lng, lat } = ev.lngLat;
      const which = activeRef.current;
      const coordsStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setPicked(which, { address: coordsStr, lat, lng });
      const host = which === "from" ? geocoderFromHostRef.current : geocoderToHostRef.current;
      const input = host?.querySelector("input");
      if (input) input.value = coordsStr;
    });

    return () => {
      try {
        geocoderFrom.clear();
        geocoderTo.clear();
      } catch {
        // ignore
      }
      if (geocoderFromHostRef.current) geocoderFromHostRef.current.replaceChildren();
      if (geocoderToHostRef.current) geocoderToHostRef.current.replaceChildren();
      map.remove();
      mapRef.current = null;
    };
  }, [token, placeholderFrom, placeholderTo, geocoderLanguage, setPicked]);

  // Keep markers in sync with values
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isValidPicked(valueFrom)) {
      const pos = [valueFrom.lng, valueFrom.lat] as [number, number];
      if (!markerFromRef.current) markerFromRef.current = new mapboxgl.Marker({ color: "#1b8254" }).setLngLat(pos).addTo(map);
      else markerFromRef.current.setLngLat(pos);
    } else if (markerFromRef.current) {
      markerFromRef.current.remove();
      markerFromRef.current = null;
    }

    if (isValidPicked(valueTo)) {
      const pos = [valueTo.lng, valueTo.lat] as [number, number];
      if (!markerToRef.current) markerToRef.current = new mapboxgl.Marker({ color: "#0f3d28" }).setLngLat(pos).addTo(map);
      else markerToRef.current.setLngLat(pos);
    } else if (markerToRef.current) {
      markerToRef.current.remove();
      markerToRef.current = null;
    }
  }, [valueFrom, valueTo]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !token) return;

    const applyRoute = () => {
      routeAbortRef.current?.abort();
      routeAbortRef.current = new AbortController();
      const signal = routeAbortRef.current.signal;

      void (async () => {
        if (!isValidPicked(valueFrom) || !isValidPicked(valueTo)) {
          removeDrivingRouteLayer(map);
          return;
        }

        try {
          const line = await getDrivingRouteOrStraight(valueFrom, valueTo, token, signal);
          if (signal.aborted || mapRef.current !== map) return;
          if (!map.loaded()) return;
          addDrivingRouteLayer(map, line);
          fitMapToCoordinates(map, line.coordinates);
        } catch {
          /* aborted */
        }
      })();
    };

    if (map.loaded()) applyRoute();
    else map.once("load", applyRoute);

    return () => {
      routeAbortRef.current?.abort();
      const m = mapRef.current;
      if (m) removeDrivingRouteLayer(m);
    };
  }, [valueFrom, valueTo, token]);

  if (!token) {
    return (
      <div className={className}>
        <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          {t("mapPicker.missingToken")}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{labelFrom}</label>
          <div
            ref={geocoderFromHostRef}
            onFocusCapture={() => setActive("from")}
            className={`rounded-lg border bg-gray-50 px-2 py-1 focus-within:ring-2 ${
              active === "from" ? "border-primary focus-within:ring-primary/30" : "border-gray-200 focus-within:ring-primary/20"
            }`}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{labelTo}</label>
          <div
            ref={geocoderToHostRef}
            onFocusCapture={() => setActive("to")}
            className={`rounded-lg border bg-gray-50 px-2 py-1 focus-within:ring-2 ${
              active === "to" ? "border-primary focus-within:ring-primary/30" : "border-gray-200 focus-within:ring-primary/20"
            }`}
          />
        </div>
      </div>

      <div className="mt-3 rounded-lg overflow-hidden border border-border">
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-background">
          <div className="text-xs text-muted-foreground">
            {t("mapPicker.clickHint")}{" "}
            <span className="font-medium text-foreground">{active === "from" ? labelFrom : labelTo}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActive("from")}
              className={`h-8 px-3 rounded-md text-xs font-medium border ${
                active === "from"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              {labelFrom}
            </button>
            <button
              type="button"
              onClick={() => setActive("to")}
              className={`h-8 px-3 rounded-md text-xs font-medium border ${
                active === "to"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              {labelTo}
            </button>
          </div>
        </div>
        <div ref={mapContainerRef} className="w-full h-[280px]" role="presentation" aria-label={t("mapPicker.mapAria")} />
      </div>
    </div>
  );
}
