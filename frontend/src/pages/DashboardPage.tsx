import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  Globe2,
  Landmark,
  MapPinned,
  MapPinPlus,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, Spinner } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { RecommendationData, TripListData } from "@/types/api";

import { TravelWorld3D } from "@/components/world/TravelWorld3D";
import { GamificationWidget } from "@/components/gamification/GamificationWidget";
import { CarbonTrackerWidget } from "@/components/eco/CarbonTrackerWidget";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { SafetyCenterModal } from "@/components/safety/SafetyCenterModal";
import { DestinationCompareModal } from "@/components/compare/DestinationCompareModal";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  planned: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  completed: "bg-brand-500/20 text-brand-300 border-brand-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
};

const ORB_IMAGES = [
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80",
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [showSafety, setShowSafety] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

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
      {/* VVIP Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-ink-900/90 via-ink-950/90 to-brand-950/60 p-6 backdrop-blur-xl shadow-2xl"
      >
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-cyan-500/10 blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-300">
              <Sparkles className="inline size-3.5 mr-1 animate-pulse" />
              WanderSync VVIP Platform
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-50">
              {greeting()}, {user?.full_name?.split(" ")[0] || "Explorer"} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {trips.data?.count
                ? `You have ${trips.data.count} saved itinerary${trips.data.count === 1 ? "" : "s"}. Ready to explore?`
                : "Where are we dreaming of today?"}
            </p>
          </div>

          <div className="hidden sm:flex -space-x-3">
            {ORB_IMAGES.map((img, i) => (
              <motion.div
                key={img}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, delay: i * 0.6, repeat: Infinity }}
                className="size-14 rounded-full border-2 border-brand-500/40 overflow-hidden shadow-xl"
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "Trips Saved", value: trips.data?.count ?? "–", icon: MapPinned },
            { label: "AI Sessions", value: "Active", icon: Globe2 },
            { label: "VVIP Score", value: "Elite", icon: Trophy },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-ink-950/60 p-3 text-center backdrop-blur-md">
              <Icon className="mx-auto size-4 text-brand-300" />
              <p className="mt-1 text-lg font-extrabold text-slate-100">{value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </motion.header>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div whileHover={{ scale: 1.02, y: -4 }} transition={{ duration: 0.25 }}>
          <Card className="relative overflow-hidden border-brand-500/30 bg-gradient-to-br from-brand-500/15 via-ink-900/90 to-ink-950/90 p-6 shadow-2xl backdrop-blur-xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(134,59,255,0.15),_transparent_70%)]" />
            <span className="relative grid size-11 place-items-center rounded-xl bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/30">
              <Sparkles aria-hidden className="size-5" />
            </span>
            <h2 className="relative mt-4 text-lg font-bold text-slate-100">AI Trip Planner</h2>
            <p className="relative mt-1 text-sm text-slate-400">
              Describe your dream trip in one sentence — generative AI handles everything else.
            </p>
            <Link to="/planner" className="relative mt-5 inline-block">
              <Button size="sm" className="rounded-full px-5 shadow-lg shadow-brand-500/30">
                Launch Planner <ArrowRight aria-hidden className="size-3.5" />
              </Button>
            </Link>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -4 }} transition={{ duration: 0.25 }}>
          <Card className="relative overflow-hidden border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-ink-900/90 to-ink-950/90 p-6 shadow-2xl backdrop-blur-xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.1),_transparent_70%)]" />
            <span className="relative grid size-11 place-items-center rounded-xl bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30">
              <MapPinPlus aria-hidden className="size-5" />
            </span>
            <h2 className="relative mt-4 text-lg font-bold text-slate-100">My Itineraries</h2>
            <p className="relative mt-1 text-sm text-slate-400">
              Every saved plan lives here — open any to edit, share, export PDF, or sync calendar.
            </p>
            <Link to="/trips" className="relative mt-5 inline-block">
              <Button size="sm" variant="secondary" className="rounded-full px-5">
                View All Trips <ArrowRight aria-hidden className="size-3.5" />
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>

      {/* Recent trips */}
      <section aria-labelledby="recent-trips">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="recent-trips" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <Star className="size-3.5 text-brand-400" /> Recent Itineraries
          </h2>
          <Link to="/trips" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
            View all →
          </Link>
        </div>

        {trips.isLoading && <Spinner label="Loading your trips…" />}
        {trips.isError && (
          <Card className="p-4 text-sm text-red-300 border-red-500/20 bg-red-500/5">Couldn't load trips. Is the backend running?</Card>
        )}
        {trips.data && trips.data.count === 0 && (
          <Card className="p-8 text-center border-brand-500/20 bg-ink-900/60 backdrop-blur-xl">
            <Globe2 className="mx-auto size-12 text-brand-400 mb-3 animate-pulse" />
            <p className="text-sm text-slate-300 font-semibold">No trips yet!</p>
            <p className="mt-1 text-xs text-slate-500">Start a chat with the AI Planner — your first itinerary appears here instantly.</p>
            <Link to="/planner" className="mt-5 inline-block">
              <Button size="sm" className="rounded-full px-6 shadow-lg shadow-brand-500/30">
                Plan My First Trip
              </Button>
            </Link>
          </Card>
        )}
        {trips.data && trips.data.count > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.data.results.map((trip, i) => (
              <motion.li
                key={trip.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <Link
                  to={`/trips/${trip.id}`}
                  className="group block h-full rounded-2xl border border-ink-700/60 bg-ink-900/80 p-4 transition-all hover:border-brand-500/40 hover:shadow-xl hover:shadow-brand-500/10 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-400">{trip.destination}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase font-semibold ${STATUS_COLORS[trip.status] ?? "bg-slate-500/20 text-slate-300"}`}>
                      {trip.status}
                    </span>
                  </div>
                  <h3 className="mt-2 line-clamp-1 font-bold text-slate-100 group-hover:text-brand-200">{trip.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {trip.duration_days} days · {trip.travelers} traveller{trip.travelers !== 1 ? "s" : ""}
                  </p>
                  {trip.optimization.score !== null && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-ink-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-400"
                          style={{ width: `${trip.optimization.score}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-brand-300">{trip.optimization.score}/100</span>
                    </div>
                  )}
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      {/* Recommendations */}
      <section aria-labelledby="recommended">
        <div className="mb-4 flex items-center gap-2">
          <Compass aria-hidden className="size-4 text-brand-400" />
          <h2 id="recommended" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Recommended for You
          </h2>
          {recommendations.data?.interests && recommendations.data.interests.length > 0 && (
            <span className="hidden text-[10px] text-slate-600 sm:block">
              Based on: {recommendations.data.interests.slice(0, 3).join(" · ")}
            </span>
          )}
        </div>

        {recommendations.isLoading && <Spinner label="Finding ideas…" />}
        {recommendations.data && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {recommendations.data.destinations.map((destination) => (
                <Link
                  key={destination.code}
                  to="/planner"
                  state={{ destination: destination.country }}
                  title={destination.reason}
                  className="rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-300 transition-all hover:bg-brand-500/20 hover:scale-105"
                >
                  🌍 {destination.country}
                </Link>
              ))}
            </div>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.data.spots.map((suggestion) => (
                <li key={`${suggestion.country_code}-${suggestion.spot.name}`}>
                  <Link
                    to={`/spots?country=${encodeURIComponent(suggestion.country)}`}
                    className="group block h-full rounded-2xl border border-ink-700/60 bg-ink-900/80 p-4 transition-all hover:border-brand-500/40 hover:shadow-xl backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between">
                      <Landmark aria-hidden className="size-4 text-brand-300" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">{suggestion.country}</span>
                    </div>
                    <h3 className="mt-2 font-bold text-slate-100 group-hover:text-brand-200">{suggestion.spot.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-400">{suggestion.reason}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Interactive 3D World Globe */}
      <TravelWorld3D />

      {/* Gamification & Carbon Tracker Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <GamificationWidget />
        <CarbonTrackerWidget />
      </div>

      {/* Action Buttons for Safety SOS & Smart Compare */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-2">
        <Button size="lg" onClick={() => setShowCompare(true)} className="rounded-full px-6 bg-gradient-to-r from-brand-500 to-indigo-600 shadow-xl shadow-brand-500/20 font-bold">
          ⚖️ Smart Destination Comparison
        </Button>
        <Button size="lg" variant="danger" onClick={() => setShowSafety(true)} className="rounded-full px-6 shadow-xl shadow-red-500/20 font-bold">
          🚨 Travel Safety Center & SOS
        </Button>
      </div>

      {/* Travel Community Feed */}
      <CommunityFeed />

      {showSafety && <SafetyCenterModal onClose={() => setShowSafety(false)} />}
      {showCompare && <DestinationCompareModal onClose={() => setShowCompare(false)} />}
    </div>
  );
}
