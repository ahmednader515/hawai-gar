import mapboxgl from "mapbox-gl";
import type { MapboxLatLng } from "@/lib/mapbox-driving-route";

export const FROM_LOCATION_AREA_RADIUS_KM = 10;

const FROM_AREA_SOURCE_ID = "shipment-from-area";
const FROM_AREA_FILL_LAYER_ID = "shipment-from-area-fill";
const FROM_AREA_LINE_LAYER_ID = "shipment-from-area-line";

export const FROM_AREA_COLOR = "#1b8254";

const EARTH_RADIUS_KM = 6371;

export type GeoJsonPolygon = {
  type: "Polygon";
  coordinates: [number, number][][];
};

/** Great-circle polygon approximating a circle on the Earth's surface. */
export function createGeodesicCirclePolygon(
  center: MapboxLatLng,
  radiusKm: number,
  steps = 64,
): GeoJsonPolygon {
  const coords: [number, number][] = [];
  const latRad = (center.lat * Math.PI) / 180;
  const lngRad = (center.lng * Math.PI) / 180;
  const angularDistance = radiusKm / EARTH_RADIUS_KM;

  for (let i = 0; i <= steps; i++) {
    const bearing = (i / steps) * 2 * Math.PI;
    const lat2 = Math.asin(
      Math.sin(latRad) * Math.cos(angularDistance) +
        Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const lng2 =
      lngRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad),
        Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(lat2),
      );
    coords.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }

  return { type: "Polygon", coordinates: [coords] };
}

/** Outer ring coordinates [lng, lat] for bounds fitting. */
export function getGeodesicCircleRing(
  center: MapboxLatLng,
  radiusKm: number,
  steps = 64,
): [number, number][] {
  return createGeodesicCirclePolygon(center, radiusKm, steps).coordinates[0];
}

export function removeFromAreaLayers(map: mapboxgl.Map): void {
  try {
    if (map.getLayer(FROM_AREA_LINE_LAYER_ID)) map.removeLayer(FROM_AREA_LINE_LAYER_ID);
    if (map.getLayer(FROM_AREA_FILL_LAYER_ID)) map.removeLayer(FROM_AREA_FILL_LAYER_ID);
    if (map.getSource(FROM_AREA_SOURCE_ID)) map.removeSource(FROM_AREA_SOURCE_ID);
  } catch {
    // ignore (style reloading / race)
  }
}

export function addFromAreaLayers(
  map: mapboxgl.Map,
  center: MapboxLatLng,
  radiusKm: number,
): void {
  removeFromAreaLayers(map);
  const geometry = createGeodesicCirclePolygon(center, radiusKm);
  map.addSource(FROM_AREA_SOURCE_ID, {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry,
    },
  });
  map.addLayer({
    id: FROM_AREA_FILL_LAYER_ID,
    type: "fill",
    source: FROM_AREA_SOURCE_ID,
    paint: {
      "fill-color": FROM_AREA_COLOR,
      "fill-opacity": 0.2,
    },
  });
  map.addLayer({
    id: FROM_AREA_LINE_LAYER_ID,
    type: "line",
    source: FROM_AREA_SOURCE_ID,
    paint: {
      "line-color": FROM_AREA_COLOR,
      "line-width": 2,
      "line-opacity": 0.85,
    },
  });
}
