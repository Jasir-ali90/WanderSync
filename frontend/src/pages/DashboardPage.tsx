import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Globe2, MapPinPlus, Star, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, Spinner } from "@/components/ui/Card";
import { TravelWorld3D } from "@/components/world/TravelWorld3D";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { RecommendationData, TripListData } from "@/types/api";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  planned: "bg-blue-50 text-blue-700 border-blue-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-indigo-50 text-indigo-700 border-indigo-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function DashboardPage() {
  const { user } = useAuth();

  const trips = useQuery({
    queryKey: ["trips"],
    queryFn: () => api.get<TripListData>("/trips/?page_size=3"),
  });
  const recommendations = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => api.get<RecommendationData>("/recommendations/"),
    staleTime: 5 * 60_000,
  });

  return (
    <div className="space-y-8">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/60 to-white p-6 shadow-sm"
      >
        <div className="absolute -right-20 -top-20 size-56 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-blue-600">
            <Sparkles className="size-3.5" /> AI Travel Companion
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900 sm:text-3xl">
            {greeting()}, {user?.full_name?.split(" ")[0] || "Explorer"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {trips.data?.count
              ? `You have ${trips.data.count} saved itinerary${trips.data.count === 1 ? "" : "s"}. Ready to explore?`
              : "Where are we dreaming of today?"}
          </p>
        </div>
      </motion.header>

      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
          <Card className="h-full border-blue-100 bg-white p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Sparkles aria-hidden className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900">AI Trip Planner</h2>
            <p className="mt-1 text-sm text-slate-600">
              Describe your dream trip in one sentence — the AI handles everything else.
            </p>
            <Link to="/planner" className="mt-5 inline-block">
              <Button size="sm">Launch Planner <ArrowRight aria-hidden className="size-3.5" /></Button>
            </Link>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
          <Card className="h-full border-blue-100 bg-white p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <MapPinPlus aria-hidden className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900">My Itineraries</h2>
            <p className="mt-1 text-sm text-slate-600">
              Every saved plan lives here — open any to edit, share or export.
            </p>
            <Link to="/trips" className="mt-5 inline-block">
              <Button size="sm" variant="secondary">View All Trips <ArrowRight aria-hidden className="size-3.5" /></Button>
            </Link>
          </Card>
        </motion.div>
      </div>

      <section aria-labelledby="recent-trips">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="recent-trips" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <Star className="size-3.5 text-blue-600" /> Recent Itineraries
          </h2>
          <Link to="/trips" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
            View all →
          </Link>
        </div>

        {trips.isLoading && <Spinner label="Loading your trips…" />}
        {trips.isError && (
          <Card className="border-red-200 bg-red-50/50 p-4 text-sm text-slate-700">
            Couldn't load trips. Please try again.
          </Card>
        )}
        {trips.data && trips.data.count === 0 && (
          <Card className="border-blue-100 bg-white p-8 text-center">
            <Globe2 className="mx-auto mb-3 size-12 text-blue-500" />
            <p className="text-sm font-semibold text-slate-700">No trips yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Start a chat with the AI Planner — your first itinerary appears here instantly.
            </p>
            <Link to="/planner" className="mt-5 inline-block">
              <Button size="sm">Plan My First Trip</Button>
            </Link>
          </Card>
        )}
        {trips.data && trips.data.count > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.data.results.map((trip, i) => (
              <motion.li key={trip.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Link
                  to={`/trips/${trip.id}`}
                  className="group block h-full rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">{trip.destination}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[trip.status] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>
                      {trip.status}
                    </span>
                  </div>
                  <h3 className="mt-2 line-clamp-1 font-bold text-slate-900">{trip.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {trip.duration_days} days · {trip.travelers} traveller{trip.travelers !== 1 ? "s" : ""}
                  </p>
                  {trip.optimization.score !== null && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${trip.optimization.score}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-blue-600">{trip.optimization.score}/100</span>
                    </div>
                  )}
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recommended">
        <div className="mb-4 flex items-center gap-2">
          <Compass aria-hidden className="size-4 text-blue-600" />
          <h2 id="recommended" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Recommended for You
          </h2>
          {recommendations.data?.interests && recommendations.data.interests.length > 0 && (
            <span className="hidden text-[10px] text-slate-500 sm:block">
              Based on: {recommendations.data.interests.slice(0, 3).join(" · ")}
            </span>
          )}
        </div>

        {recommendations.isLoading && <Spinner label="Finding ideas…" />}
        {recommendations.data && (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {recommendations.data.destinations.map((destination) => (
                <Link
                  key={destination.code}
                  to="/planner"
                  state={{ destination: destination.country }}
                  title={destination.reason}
                  className="rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                >
                  {destination.country}
                </Link>
              ))}
            </div>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.data.spots.map((suggestion) => (
                <li key={`${suggestion.country_code}-${suggestion.spot.name}`}>
                  <Link
                    to={`/spots?country=${encodeURIComponent(suggestion.country)}`}
                    className="group block h-full rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                        <Star className="size-4" />
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {suggestion.country}
                      </span>
                    </div>
                    <h3 className="mt-2 font-bold text-slate-800">{suggestion.spot.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{suggestion.reason}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <TravelWorld3D />
    </div>
  );
}


