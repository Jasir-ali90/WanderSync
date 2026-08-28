import { useEffect, useRef, useState } from "react";
import { Globe, MapPin, Navigation } from "lucide-react";
import { motion } from "framer-motion";

interface DestinationPin {
  country: string;
  name: string;
  lat: number;
  lng: number;
  visited: boolean;
  notes: string;
}

const SAMPLE_PINS: DestinationPin[] = [
  { country: "Pakistan", name: "Hunza Valley", lat: 36.3167, lng: 74.65, visited: true, notes: "Explored 8 spots" },
  { country: "France", name: "Paris", lat: 48.8566, lng: 2.3522, visited: true, notes: "Eiffel & Louvre" },
  { country: "UAE", name: "Dubai", lat: 25.2048, lng: 55.2708, visited: false, notes: "Upcoming Trip" },
  { country: "Japan", name: "Tokyo", lat: 35.6762, lng: 139.6503, visited: false, notes: "Dream Destination" },
];

export function TravelWorld3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPin, setSelectedPin] = useState<DestinationPin | null>(SAMPLE_PINS[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let rotation = 0;
    const width = (canvas.width = 450);
    const height = (canvas.height = 450);
    const radius = 170;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      rotation += 0.005;

      const cx = width / 2;
      const cy = height / 2;

      // Draw Globe Outer Glow
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.2);
      glow.addColorStop(0, "rgba(134, 59, 255, 0.2)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Draw Sphere Body
      const sphereGrad = ctx.createRadialGradient(cx - 40, cy - 40, 20, cx, cy, radius);
      sphereGrad.addColorStop(0, "#1e143b");
      sphereGrad.addColorStop(0.7, "#0c081f");
      sphereGrad.addColorStop(1, "#05030a");
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(134, 59, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Grid Lines (Latitude & Longitude)
      ctx.strokeStyle = "rgba(134, 59, 255, 0.15)";
      ctx.lineWidth = 1;

      for (let lat = -60; lat <= 60; lat += 30) {
        const rad = (lat * Math.PI) / 180;
        const r = radius * Math.cos(rad);
        const y = cy + radius * Math.sin(rad);
        ctx.beginPath();
        ctx.ellipse(cx, y, r, r * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let lon = 0; lon < 360; lon += 45) {
        const rad = ((lon + rotation * 50) * Math.PI) / 180;
        const x = cx + radius * Math.sin(rad);
        ctx.beginPath();
        ctx.moveTo(x, cy - radius);
        ctx.lineTo(x, cy + radius);
        ctx.stroke();
      }

      // Render Pins & Flight Arcs
      SAMPLE_PINS.forEach((pin, idx) => {
        const lonRad = ((pin.lng + rotation * 60) * Math.PI) / 180;
        const latRad = (pin.lat * Math.PI) / 180;

        const x = cx + radius * Math.cos(latRad) * Math.sin(lonRad);
        const y = cy - radius * Math.sin(latRad);
        const z = radius * Math.cos(latRad) * Math.cos(lonRad);

        // Only draw pins on front hemisphere
        if (z > 0) {
          ctx.beginPath();
          ctx.arc(x, y, pin.visited ? 6 : 4, 0, Math.PI * 2);
          ctx.fillStyle = pin.visited ? "#00f2fe" : "#863bff";
          ctx.shadowBlur = 12;
          ctx.shadowColor = pin.visited ? "#00f2fe" : "#863bff";
          ctx.fill();

          // Connect arcs between pins
          if (idx < SAMPLE_PINS.length - 1) {
            const next = SAMPLE_PINS[idx + 1];
            const nextLon = ((next.lng + rotation * 60) * Math.PI) / 180;
            const nextLat = (next.lat * Math.PI) / 180;
            const nx = cx + radius * Math.cos(nextLat) * Math.sin(nextLon);
            const ny = cy - radius * Math.sin(nextLat);

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo((x + nx) / 2, (y + ny) / 2 - 30, nx, ny);
            ctx.strokeStyle = "rgba(0, 242, 254, 0.4)";
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative flex flex-col md:flex-row items-center gap-6 rounded-3xl border border-brand-500/30 bg-ink-900/80 p-6 backdrop-blur-2xl shadow-2xl overflow-hidden">
      <div className="flex-1 space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/40 bg-brand-500/10 px-3.5 py-1 text-xs font-bold text-brand-300">
          <Globe className="size-4 animate-spin text-brand-400" />
          <span>YOUR TRAVEL WORLD 3D</span>
        </div>

        <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-slate-100">
          Interactive Globe & Memory Arcs
        </h2>

        <p className="text-xs text-slate-400 leading-relaxed">
          Track countries visited, active flight paths, upcoming trips, and dream destinations in real-time.
        </p>

        {/* Selected Pin Details */}
        {selectedPin && (
          <motion.div
            key={selectedPin.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-brand-500/20 bg-ink-950/80 p-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <MapPin className="size-4 text-brand-400" />
                {selectedPin.country} — {selectedPin.name}
              </span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${selectedPin.visited ? "bg-emerald-500/20 text-emerald-300" : "bg-brand-500/20 text-brand-300"}`}>
                {selectedPin.visited ? "Visited" : "Upcoming"}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">{selectedPin.notes}</p>
          </motion.div>
        )}

        <div className="flex flex-wrap gap-2">
          {SAMPLE_PINS.map((pin) => (
            <button
              key={pin.name}
              onClick={() => setSelectedPin(pin)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedPin?.name === pin.name
                  ? "border-brand-400 bg-brand-500/20 text-brand-200 shadow-lg shadow-brand-500/20"
                  : "border-ink-700 bg-ink-950/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              {pin.country}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Canvas Globe */}
      <div className="relative grid place-items-center">
        <canvas ref={canvasRef} className="size-[320px] md:size-[380px] cursor-grab active:cursor-grabbing" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
          <Navigation className="size-3 text-cyan-400 animate-pulse" /> Live 3D Globe View
        </div>
      </div>
    </div>
  );
}
