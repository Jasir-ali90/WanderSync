/** Live weather: current conditions + arrival-date forecast for a trip. */
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CloudSun, Droplets, Thermometer, Wind } from "lucide-react";

import { Card, Spinner } from "@/components/ui/Card";
import { api } from "@/lib/api";

interface GeoResult {
  name: string;
  lat: number;
  lon: number;
}

interface ForecastDay {
  date: string;
  temp_max_c: number | null;
  temp_min_c: number | null;
  precipitation_mm: number | null;
  precipitation_chance_pct: number | null;
  wind_kmh: number | null;
  uv_index_max: number | null;
  sunrise: string | null;
  sunset: string | null;
  condition: string;
  icon: string;
}

interface WeatherData {
  source: string;
  location: { lat: number; lon: number };
  current: {
    temperature_c: number | null;
    feels_like_c: number | null;
    humidity_pct: number | null;
    wind_kmh: number | null;
    precipitation_mm: number | null;
    condition: string;
    icon: string;
  };
  forecast: ForecastDay[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatWeekday(dateStr: string): string {
  return WEEKDAYS[new Date(`${dateStr}T12:00:00`).getDay()] ?? "";
}

function formatDateLabel(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}

function hhmm(isoTimestamp: string | null): string {
  if (!isoTimestamp) return "—";
  const part = isoTimestamp.split("T")[1];
  return part ? part.slice(0, 5) : "—";
}

/** Simple rule-based packing/clothing hints from the stay's forecast. */
function packingAdvice(forecast: ForecastDay[]): string[] {
  if (forecast.length === 0) return [];
  const tips: string[] = [];
  const maxTemp = Math.max(...forecast.map((f) => f.temp_max_c ?? -99));
  const minTemp = Math.min(...forecast.map((f) => f.temp_min_c ?? 99));
  const rainChance = Math.max(
    ...forecast.map((f) =>
      f.precipitation_chance_pct ?? (f.precipitation_mm != null && f.precipitation_mm > 1 ? 60 : 0),
    ),
  );
  const maxUv = Math.max(...forecast.map((f) => f.uv_index_max ?? 0));

  if (maxTemp >= 28) tips.push("🧢 Light clothes, sunglasses & sunscreen — expect warm days");
  else if (maxTemp >= 18) tips.push("👕 Comfortable layers for pleasant daytime weather");
  if (minTemp <= 10) tips.push("🧥 Warm jacket & thermal base — nights get cold");
  else if (minTemp <= 16) tips.push("🧶 A light jacket or sweater for evenings");
  if (rainChance >= 40) tips.push("☂️ Umbrella or rain shell — rain is likely during your stay");
  if (maxUv >= 6) tips.push("🧴 UV index peaks high — pack SPF 30+ sunscreen");
  if (tips.length === 0) tips.push("🎒 Standard travel essentials should cover this climate");
  return tips.slice(0, 4);
}

const CITY_PRESETS: Record<string, GeoResult> = {
  dubai: { name: "Dubai", lat: 25.2048, lon: 55.2708 },
  paris: { name: "Paris", lat: 48.8566, lon: 2.3522 },
  tokyo: { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
  london: { name: "London", lat: 51.5074, lon: -0.1278 },
  rome: { name: "Rome", lat: 41.9028, lon: 12.4964 },
  venice: { name: "Venice", lat: 45.4408, lon: 12.3155 },
  "new york": { name: "New York", lat: 40.7128, lon: -74.006 },
  istanbul: { name: "Istanbul", lat: 41.0082, lon: 28.9784 },
  maldives: { name: "Maldives", lat: 3.2028, lon: 73.2207 },
  singapore: { name: "Singapore", lat: 1.3521, lon: 103.8198 },
  kuala: { name: "Kuala Lumpur", lat: 3.139, lon: 101.6869 },
  malaysia: { name: "Kuala Lumpur", lat: 3.139, lon: 101.6869 },
  cairo: { name: "Cairo", lat: 30.0444, lon: 31.2357 },
  skardu: { name: "Skardu", lat: 35.2971, lon: 75.6333 },
  hunza: { name: "Hunza", lat: 36.3167, lon: 74.65 },
  lahore: { name: "Lahore", lat: 31.5204, lon: 74.3587 },
  islamabad: { name: "Islamabad", lat: 33.6844, lon: 73.0479 },
};

export function WeatherPanel({
  destination,
  startDate,
  durationDays,
}: {
  destination: string;
  startDate: string | null;
  durationDays: number;
}) {
  // 1) Resolve the destination to coordinates through preset lookup or backend geocoder.
  const presetKey = Object.keys(CITY_PRESETS).find((k) => destination.toLowerCase().includes(k));

  const geo = useQuery({
    queryKey: ["weather-geo", destination.toLowerCase()],
    queryFn: async () => {
      if (presetKey) return { source: "preset", results: [CITY_PRESETS[presetKey]] };
      return api.get<{ source: string; results: GeoResult[] }>(
        `/places/search/?q=${encodeURIComponent(destination)}&limit=1`,
      );
    },
    staleTime: 30 * 60_000,
    retry: false,
  });

  const spot = geo.data?.results?.[0] || (presetKey ? CITY_PRESETS[presetKey] : null);
  const forecastDays = Math.min(Math.max(durationDays, 1), 7);

  // 2) Fetch weather aligned to the arrival date.
  const weather = useQuery({
    queryKey: ["weather", spot?.lat, spot?.lon, forecastDays, startDate],
    queryFn: () => {
      const params = new URLSearchParams({
        lat: String(spot!.lat),
        lon: String(spot!.lon),
        days: String(forecastDays),
      });
      if (startDate) params.set("start", startDate);
      return api.get<WeatherData>(`/weather/?${params.toString()}`);
    },
    enabled: Boolean(spot),
    staleTime: 15 * 60_000,
    retry: false,
  });

  if (geo.isLoading) return <Spinner label="Finding your destination…" />;
  if (geo.isError || !spot) {
    return (
      <Card className="flex items-center gap-3 p-4 text-sm text-slate-500">
        <CloudSun aria-hidden className="size-5 shrink-0 text-sand-300" />
        Couldn't locate “{destination}” for the weather panel right now.
      </Card>
    );
  }

  if (weather.isLoading) return <Spinner label="Checking the skies…" />;
  if (weather.isError || !weather.data) {
    return (
      <Card className="flex items-center gap-3 p-4 text-sm text-slate-500">
        <CloudSun aria-hidden className="size-5 shrink-0 text-sand-300" />
        Weather service is unavailable at the moment.
      </Card>
    );
  }

  return <WeatherBody data={weather.data} destination={spot.name} startDate={startDate} />;
}
function WeatherBody({
  data,
  destination,
  startDate,
}: {
  data: WeatherData;
  destination: string;
  startDate: string | null;
}) {
  const current = data.current;
  const mins = data.forecast.map((f) => f.temp_min_c).filter((v): v is number => v != null);
  const maxs = data.forecast.map((f) => f.temp_max_c).filter((v): v is number => v != null);

  return (
    <section aria-labelledby="weather-heading" className="space-y-3">
      <h2 id="weather-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-500">
        Weather · {destination}{" "}
        <span
          className={`ml-1 rounded-full px-2 py-0.5 align-middle text-[10px] uppercase ${
            data.source === "demo" ? "bg-amber-50 text-amber-700" : "bg-emerald-500/10 text-emerald-600"
          }`}
        >
          {data.source === "demo" ? "sample data" : "live"}
        </span>
      </h2>

      <Card className="flex flex-wrap items-center gap-x-8 gap-y-4 p-5">
        <div className="flex items-center gap-4">
          <span aria-hidden className="text-5xl leading-none">{current.icon}</span>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Now in {destination}</p>
            <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-slate-900 tabular-nums">
              {current.temperature_c != null ? `${Math.round(current.temperature_c)}°C` : "—"}
            </p>
            <p className="mt-0.5 text-sm text-slate-600">{current.condition}</p>
          </div>
        </div>

        <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Thermometer aria-hidden className="size-4 text-brand-400" />
            <dt>Feels like</dt>
            <dd className="tabular-nums">
              {current.feels_like_c != null ? `${Math.round(current.feels_like_c)}°C` : "—"}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Droplets aria-hidden className="size-4 text-sky-400" />
            <dt>Humidity</dt>
            <dd className="tabular-nums">
              {current.humidity_pct != null ? `${Math.round(current.humidity_pct)}%` : "—"}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind aria-hidden className="size-4 text-brand-400" />
            <dt>Wind</dt>
            <dd className="tabular-nums">
              {current.wind_kmh != null ? `${Math.round(current.wind_kmh)} km/h` : "—"}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays aria-hidden className="size-4 text-amber-300" />
            <dt>Range during your stay</dt>
            <dd className="tabular-nums">
              {mins.length && maxs.length
                ? `${Math.round(Math.min(...mins))}° – ${Math.round(Math.max(...maxs))}°C`
                : "—"}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Forecast aligned to arrival dates */}
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Trip forecast">
        {data.forecast.map((f) => (
          <li
            key={f.date}
            className="rounded-xl border border-slate-300 bg-slate-100/80 p-3 transition-colors hover:border-brand-500/40"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {formatWeekday(f.date)}
                  {startDate && f.date === startDate && " · arrive"}
                </p>
                <p className="text-[11px] tabular-nums text-slate-500">{formatDateLabel(f.date)}</p>
              </div>
              <span aria-hidden className="text-2xl">{f.icon}</span>
            </div>
            <p className="mt-1.5 text-sm font-medium text-slate-800 tabular-nums">
              {f.temp_max_c != null ? Math.round(f.temp_max_c) : "?"}° /{" "}
              {f.temp_min_c != null ? Math.round(f.temp_min_c) : "?"}°C
            </p>
            <p className="truncate text-[11px] text-slate-500">{f.condition}</p>
            {(f.precipitation_chance_pct ?? 0) >= 30 || (f.precipitation_mm ?? 0) > 0 ? (
              <p className="mt-1 text-[11px] text-sky-300">
                ☔ {f.precipitation_chance_pct != null ? `${Math.round(f.precipitation_chance_pct)}% rain chance` : `${f.precipitation_mm} mm expected`}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-emerald-700">Dry day · great for sightseeing</p>
            )}
            <p className="mt-1 flex items-center gap-2 text-[10px] tabular-nums text-slate-500">
              <span title="Sunrise">🌅 {hhmm(f.sunrise)}</span>
              <span title="Sunset">🌇 {hhmm(f.sunset)}</span>
              {(f.uv_index_max ?? 0) >= 6 && <span title="High UV" className="text-orange-300">UV {Math.round(f.uv_index_max!)}</span>}
            </p>
          </li>
        ))}
      </ul>

      {/* Packing & clothing intelligence */}
      {(() => {
        const tips = packingAdvice(data.forecast);
        if (tips.length === 0) return null;
        return (
          <Card className="border-blue-200 bg-blue-700/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              🧳 Packing suggestions for your dates
            </p>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {tips.map((tip) => (
                <li key={tip} className="text-xs leading-relaxed text-slate-600">{tip}</li>
              ))}
            </ul>
          </Card>
        );
      })()}

      <p className="text-[11px] text-slate-600">
        Forecasts reach up to 16 days ahead — trips further out unlock weather closer to departure.
      </p>
    </section>
  );
}
