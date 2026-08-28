import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Globe2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";
import type { TripListData } from "@/types/api";

interface DestinationPin {
  label: string;
  lat: number;
  lng: number;
  tripId: string;
}

const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  pakistan: { lat: 30.4, lng: 69.3 },
  "united arab emirates": { lat: 24.0, lng: 54.0 },
  uae: { lat: 24.0, lng: 54.0 },
  "saudi arabia": { lat: 24.0, lng: 45.0 },
  turkey: { lat: 39.0, lng: 35.2 },
  italy: { lat: 41.9, lng: 12.5 },
  france: { lat: 46.6, lng: 2.4 },
  japan: { lat: 36.2, lng: 138.3 },
  thailand: { lat: 15.9, lng: 100.99 },
  malaysia: { lat: 4.2, lng: 101.98 },
  "united kingdom": { lat: 54.0, lng: -2.5 },
  uk: { lat: 54.0, lng: -2.5 },
  "united states": { lat: 39.8, lng: -98.6 },
  usa: { lat: 39.8, lng: -98.6 },
  spain: { lat: 40.2, lng: -3.7 },
  egypt: { lat: 26.8, lng: 30.8 },
  indonesia: { lat: -0.8, lng: 113.9 },
  switzerland: { lat: 46.8, lng: 8.2 },
};

function coordsFor(destination: string) {
  const key = (destination || "").trim().toLowerCase();
  for (const [country, coords] of Object.entries(COUNTRY_COORDS)) {
    if (key.includes(country)) return coords;
  }
  return { lat: 20, lng: 0 };
}

function TripOrbit({ pins }: { pins: DestinationPin[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || pins.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let rotation = 0;
    const size = 340;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    const radius = 140;
    const cx = size / 2;
    const cy = size / 2;

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      rotation += 0.0022;

      const sphere = ctx.createRadialGradient(cx - 45, cy - 55, 20, cx, cy, radius);
      sphere.addColorStop(0, "#eff6ff");
      sphere.addColorStop(0.55, "#dbeafe");
      sphere.addColorStop(1, "#bfdbfe");
      ctx.fillStyle = sphere;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#93c5fd";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.strokeStyle = "rgba(37, 99, 235, 0.14)";
      ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) {
        const rad = (lat * Math.PI) / 180;
        const r = radius * Math.cos(rad);
        const y = cy + radius * Math.sin(rad);
        ctx.beginPath();
        ctx.ellipse(cx, y, r, r * 0.18, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let lon = 0; lon < 360; lon += 30) {
        const rad = ((lon + rotation * 57) * Math.PI) / 180;
        const rx = radius * Math.abs(Math.cos(rad));
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      pins.forEach((pin) => {
        const lonRad = ((pin.lng + rotation * 57) * Math.PI) / 180;
        const latRad = (pin.lat * Math.PI) / 180;
        const x = cx + radius * Math.cos(latRad) * Math.sin(lonRad);
        const y = cy - radius * Math.sin(latRad);
        const z = radius * Math.cos(latRad) * Math.cos(lonRad);
        if (z <= 0) return;

        const halo = ctx.createRadialGradient(x, y, 0, x, y, 14);
        halo.addColorStop(0, "rgba(37, 99, 235, 0.35)");
        halo.addColorStop(1, "rgba(37, 99, 235, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#2563eb";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [pins]);

  return <canvas ref={canvasRef} style={{ width: 340, height: 340 }} aria-hidden />;
}



export function TravelWorld3D() {
  const trips = useQuery({
    queryKey: ["trips"],
    queryFn: () => api.get<TripListData>("/trips/?page_size=50"),
  });

  const tripsData = trips.data?.results ?? [];
  const pins: DestinationPin[] = tripsData.slice(0, 12).map((trip) => {
    const coords = coordsFor(trip.destination);
    return { label: trip.destination, lat: coords.lat, lng: coords.lng, tripId: trip.id };
  });
  const [active, setActive] = useState<DestinationPin | null>(null);
  const selected = active && pins.includes(active) ? active : (pins[0] ?? null);

  return (
    <Card className="border-blue-100 bg-white p-6">
      <div className="flex flex-col items-center gap-8 md:flex-row">
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700">
            <Globe2 className="size-4" />
            <span>YOUR TRAVEL WORLD</span>
          </div>

          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
            Your destinations, on one globe
          </h2>

          <p className="text-sm leading-relaxed text-slate-600">
            Every trip you plan with WanderSync appears here. Open a destination to review
            its day-by-day itinerary, budget and notes.
          </p>

          {selected ? (
            <Link
              to={`/trips/${selected.tripId}`}
              className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 transition-colors hover:bg-blue-50"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <MapPin className="size-4 text-blue-600" />
                {selected.label}
              </span>
              <span className="text-xs font-semibold text-blue-600">Open trip →</span>
            </Link>
          ) : (
            <Link to="/planner" className="inline-block">
              <Button size="sm">Plan your first trip</Button>
            </Link>
          )}

          {pins.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {pins.slice(0, 8).map((pin) => (
                <button
                  key={pin.tripId}
                  type="button"
                  onClick={() => setActive(pin)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selected?.tripId === pin.tripId
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
                  }`}
                >
                  {pin.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid shrink-0 place-items-center">
          {pins.length > 0 ? (
            <TripOrbit pins={pins} />
          ) : (
            <div className="grid size-[280px] place-items-center rounded-full border border-blue-100 bg-blue-50/60 text-center">
              <div className="px-8">
                <Globe2 className="mx-auto size-10 text-blue-400" />
                <p className="mt-3 text-sm font-semibold text-slate-700">No destinations yet</p>
                <p className="mt-1 text-xs text-slate-500">Trips you plan will show up here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}