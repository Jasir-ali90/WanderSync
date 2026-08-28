import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, CloudSun, MapPin, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, Spinner } from "@/components/ui/Card";
import { api } from "@/lib/api";

interface Spot {
  name: string;
  city: string;
  emoji: string;
  lat: number;
  lon: number;
  description: string;
}

interface SpotCountry {
  country: string;
  code: string;
  tagline: string;
  spots: Spot[];
}

type WeatherState = { condition: string; temp: number } | "loading" | undefined;

export default function FamousSpotsPage() {
  const spots = useQuery({
    queryKey: ["spots"],
    queryFn: () => api.get<{ count: number; countries: SpotCountry[] }>("/spots/"),
  });
  const [openCountry, setOpenCountry] = useState<string | null>(null);
  const [weather, setWeather] = useState<Record<string, WeatherState>>({});

  const fetchWeather = (spotKey: string, lat: number, lon: number) => {
    setWeather((prev) => ({ ...prev, [spotKey]: "loading" }));
    void api
      .get<{ current: { temperature_c: number; condition: string } }>(
        `/weather/?lat=${lat}&lon=${lon}&days=1`,
      )
      .then((data) =>
        setWeather((prev) => ({
          ...prev,
          [spotKey]: { condition: data.current.condition, temp: data.current.temperature_c },
        })),
      )
      .catch(() => setWeather((prev) => ({ ...prev, [spotKey]: undefined })));
  };

  if (spots.isLoading) return <Spinner label="Loading world famous spots…" />;

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
          Famous Spots
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Hand-picked icons of the world's greatest countries. Open a country to
          explore its landmarks, check live weather, and ask the AI planner to
          build a trip around it.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(spots.data?.countries ?? []).map((country, index) => {
          const isOpen = openCountry === country.country;
          return (
            <motion.div
              key={country.country}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className={isOpen ? "sm:col-span-2 lg:col-span-3" : ""}
            >
              <Card className="h-full overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-[0_18px_40px_-16px_rgb(13_148_136/0.4)]">
                <button
                  type="button"
                  onClick={() => setOpenCountry(isOpen ? null : country.country)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 p-5 text-left"
                >
                  <img
                    src={`https://flagcdn.com/w160/${country.code}.png`}
                    alt={`${country.country} flag`}
                    loading="lazy"
                    className="h-14 w-20 rounded-lg border border-slate-300 object-cover shadow-md"
                  />
                  <div className="min-w-0">
                    <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">
                      {country.country}
                    </h2>
                    <p className="line-clamp-1 text-sm text-slate-500">{country.tagline}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wider text-brand-400">
                      {country.spots.length} famous spots — {isOpen ? "close" : "explore"}
                    </p>
                  </div>
                </button>

                {isOpen && (
                  <motion.ul
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="divide-y divide-slate-200/70 border-t border-slate-300"
                  >
                    {country.spots.map((spot) => {
                      const spotKey = `${country.code}-${spot.name}`;
                      const wx = weather[spotKey];
                      return (
                        <li key={spot.name} className="p-4">
                          <div className="flex gap-3">
                            <span aria-hidden className="text-3xl">{spot.emoji}</span>
                            <div>
                              <h3 className="font-semibold text-slate-800">
                                {spot.name}{" "}
                                <span className="text-xs font-normal text-slate-500">· {spot.city}</span>
                              </h3>
                              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500">
                                {spot.description}
                              </p>
                              {wx === "loading" && (
                                <p className="mt-2 text-xs text-slate-500">Checking live weather…</p>
                              )}
                              {wx && wx !== "loading" && (
                                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-700/10 px-2.5 py-1 text-xs text-blue-700">
                                  <CloudSun aria-hidden className="size-3.5" />
                                  Live now: {wx.condition}, {wx.temp}°C
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 pl-12">
                            <Button size="sm" variant="ghost" onClick={() => fetchWeather(spotKey, spot.lat, spot.lon)}>
                              <CloudSun aria-hidden className="size-3.5" /> Live weather
                            </Button>
                            <Link
                              to={`/planner?q=${encodeURIComponent(
                                `Plan a trip to ${spot.city}, ${country.country}. I want to see the ${spot.name}.`,
                              )}`}
                            >
                              <Button size="sm">
                                <Sparkles aria-hidden className="size-3.5" /> Ask the planner
                              </Button>
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left">
        <MapPin aria-hidden className="size-8 shrink-0 text-brand-400" />
        <p className="flex-1 text-sm text-slate-500">
          Want a full multi-day itinerary around one of these spots? The planner
          builds routes, schedules and budgets automatically.
        </p>
        <Link to="/planner">
          <Button size="sm">
            Open planner <ArrowRight aria-hidden className="size-3.5" />
          </Button>
        </Link>
      </Card>
    </div>
  );
}
