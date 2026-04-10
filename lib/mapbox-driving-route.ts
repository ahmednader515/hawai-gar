import mapboxgl from "mapbox-gl";

export type MapboxLatLng = { lat: number; lng: number };

const ROUTE_SOURCE_ID = "shipment-driving-route";
const ROUTE_LAYER_ID = "shipment-driving-route-line";

export { ROUTE_SOURCE_ID, ROUTE_LAYER_ID };

export type DrivingRouteLineString = {
  type: "LineString";
  coordinates: [number, number][];
};

/** Driving directions geometry, or null if the request fails. */
export async function fetchMapboxDrivingRoute(
  from: MapboxLatLng,
  to: MapboxLatLng,
  accessToken: string,
  signal?: AbortSignal
): Promise<DrivingRouteLineString | null> {
  if (
    !Number.isFinite(from.lat) ||
    !Number.isFinite(from.lng) ||
    !Number.isFinite(to.lat) ||
    !Number.isFinite(to.lng)
  ) {
    return null;
  }
  const path = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${path}`
  );
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    routes?: { geometry?: DrivingRouteLineString }[];
  };
  const geom = data?.routes?.[0]?.geometry;
  if (
    geom?.type === "LineString" &&
    Array.isArray(geom.coordinates) &&
    geom.coordinates.length >= 2
  ) {
    return geom;
  }
  return null;
}

/** Road-following line when possible; otherwise a straight segment between the points. */
export async function getDrivingRouteOrStraight(
  from: MapboxLatLng,
  to: MapboxLatLng,
  accessToken: string,
  signal?: AbortSignal
): Promise<DrivingRouteLineString> {
  try {
    const road = await fetchMapboxDrivingRoute(from, to, accessToken, signal);
    if (road) return road;
  } catch (e) {
    if (signal?.aborted) throw e;
  }
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  return {
    type: "LineString",
    coordinates: [
      [from.lng, from.lat],
      [to.lng, to.lat],
    ],
  };
}

export function removeDrivingRouteLayer(map: mapboxgl.Map): void {
  try {
    if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
    if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
  } catch {
    // ignore (style reloading / race)
  }
}

export function addDrivingRouteLayer(
  map: mapboxgl.Map,
  line: DrivingRouteLineString
): void {
  removeDrivingRouteLayer(map);
  map.addSource(ROUTE_SOURCE_ID, {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: line,
    },
  });
  map.addLayer({
    id: ROUTE_LAYER_ID,
    type: "line",
    source: ROUTE_SOURCE_ID,
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#2563eb",
      "line-width": 5,
      "line-opacity": 0.92,
    },
  });
}

export function fitMapToCoordinates(
  map: mapboxgl.Map,
  coordinates: [number, number][],
  padding = 48
): void {
  if (coordinates.length === 0) return;
  const first = coordinates[0];
  const bounds = coordinates
    .slice(1)
    .reduce(
      (b, c) => b.extend(c),
      new mapboxgl.LngLatBounds(first, first)
    );
  map.fitBounds(bounds, { padding, maxZoom: 12, duration: 0 });
}
