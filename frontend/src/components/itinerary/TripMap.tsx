import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getGoogleMapsKey, loadGoogleMaps } from "@/lib/googleMaps";
import { cn } from "@/lib/utils";
import type { ItineraryDay } from "@/types/api";
const BRAND_ICON = L.divIcon({
  className: "",
  html: '<div style="width:14px;height:14px;border-radius:9999px;background:#d4af5e;border:2px solid #0a0812;box-shadow:0 0 0 3px rgba(212,175,94,.35)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface MapPoint {
  name: string;
  location: string;
  start_time: string;
  category: string;
  lat: number;
  lng: number;
}

type Engine = "google" | "osm";

/** Collect geo-tagged activities for the active day (or all days). */
function collectPoints(days: ItineraryDay[], activeDay: number | null): MapPoint[] {
  const source =
    days.find((d) => d.day_number === activeDay)?.activities ?? days.flatMap((d) => d.activities);
  return source
    .filter((a) => a.coordinates?.lat != null && a.coordinates?.lng != null)
    .map((a) => ({
      name: a.name,
      location: a.location,
      start_time: a.start_time,
      category: a.category,
      lat: a.coordinates.lat!,
      lng: a.coordinates.lng!,
    }));
}

/** Interactive itinerary map: Google Maps when a key is configured, OSM/Leaflet otherwise. */
export function TripMap({
  days,
  activeDay,
  onFillLocations,
  filling,
}: {
  days: ItineraryDay[];
  activeDay: number | null;
  onFillLocations?: () => void;
  filling?: boolean;
}) {
  const allPoints = useMemo(() => collectPoints(days, activeDay), [days, activeDay]);
  const [engine, setEngine] = useState<Engine>("osm");
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getGoogleMapsKey()
      .then((key) =>
        key
          ? loadGoogleMaps(key)
              .then(() => !cancelled && setGoogleReady(true))
              .catch(() => undefined)
          : undefined,
      )
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (allPoints.length === 0) {
    return (
      <Card className="flex h-64 flex-col items-center justify-center gap-2 p-6 text-center">
        <span aria-hidden className="text-3xl">🗺️</span>
        <p className="text-sm text-slate-600">No map locations yet.</p>
        <p className="max-w-sm text-xs text-slate-500">
          Activities don't have coordinates saved. Use “Find locations” to resolve them
          automatically via the places service — pins then appear on the map.
        </p>
        {onFillLocations && (
          <Button size="sm" onClick={onFillLocations} loading={filling} className="mt-2">
            📍 Find locations
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300">
      <div className="flex items-center justify-between gap-3 border-b border-slate-300 bg-white/60 px-3 py-1.5">
        <p className="text-[11px] text-slate-500">
          {activeDay ? `Showing day ${activeDay} · ` : "Showing all days · "}
          {allPoints.length} stop{allPoints.length === 1 ? "" : "s"}
        </p>
        {googleReady && (
          <div role="group" aria-label="Map provider" className="flex overflow-hidden rounded-full border border-slate-300">
            {(["google", "osm"] as Engine[]).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={engine === option}
                onClick={() => setEngine(option)}
                className={cn(
                  "px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors",
                  engine === option
                    ? "bg-blue-700 text-slate-900"
                    : "bg-transparent text-slate-500 hover:text-slate-700",
                )}
              >
                {option === "google" ? "Google Maps" : "OpenStreetMap"}
              </button>
            ))}
          </div>
        )}
      </div>

      {engine === "google" && googleReady ? (
        <GoogleTripMap points={allPoints} />
      ) : (
        <LeafletTripMap points={allPoints} />
      )}

      <p className="border-t border-slate-300 bg-white/60 px-3 py-1.5 text-[11px] text-slate-500">
        Tap a pin for each stop's details · numbered markers follow the daily plan order
      </p>
    </div>
  );
}
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Google Maps engine: numbered markers, info windows and the day's route line. */
function GoogleTripMap({ points }: { points: MapPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const g = (window as any).google;
    if (!g?.maps || !containerRef.current || points.length === 0) return;

    const map = new g.maps.Map(containerRef.current, {
      center: { lat: points[0].lat, lng: points[0].lng },
      zoom: 13,
      scrollwheel: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
    });
    const bounds = new g.maps.LatLngBounds();
    const infoWindow = new g.maps.InfoWindow();

    const infos = points.map(
      (point) =>
        `<div style="font-family:sans-serif;max-width:220px">
          <strong>${point.name}</strong><br/>
          <span style="color:#555;font-size:12px">${point.location || "—"}</span><br/>
          <span style="font-size:12px">⏰ ${point.start_time || "—"} · ${point.category}</span>
        </div>`,
    );

    points.forEach((point, index) => {
      const marker = new g.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map,
        title: `${index + 1}. ${point.name}`,
        label: { text: String(index + 1), color: "#0a0812", fontWeight: "700", fontSize: "10px" },
      });
      bounds.extend(marker.getPosition());
      marker.addListener("click", () => {
        infoWindow.setContent(infos[index]);
        infoWindow.open({ anchor: marker, map });
      });
    });

    // Route line connecting consecutive stops of the current selection.
    if (points.length > 1) {
      new g.maps.Polyline({
        path: points.map((point) => ({ lat: point.lat, lng: point.lng })),
        map,
        strokeColor: "#d4af5e",
        strokeOpacity: 0.8,
        strokeWeight: 3,
      });
      map.fitBounds(bounds, 48);
    }
  }, [points]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Itinerary map (Google Maps)"
      className="z-0 h-80 w-full"
    />
  );
}

/** OpenStreetMap/Leaflet fallback engine — standard light tiles. */
function LeafletTripMap({ points }: { points: MapPoint[] }) {
  const first = points[0];
  return (
    <MapContainer
      center={[first.lat, first.lng]}
      zoom={12}
      scrollWheelZoom={false}
      className="z-0 h-80 w-full rounded-b-xl"
      aria-label="Itinerary map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((point, index) => (
        <Marker key={`${point.name}-${index}`} position={[point.lat, point.lng]} icon={BRAND_ICON}>
          <Popup>
            <div className="p-1 min-w-[140px] font-sans">
              <strong className="text-sm font-bold block leading-tight text-slate-900">{index + 1}. {point.name}</strong>
              <span className="text-[11px] text-slate-600 block mt-0.5">{point.location || "—"}</span>
              <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-blue-600">
                <span>⏰ {point.start_time || "—"}</span>
                <span>{point.category}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
