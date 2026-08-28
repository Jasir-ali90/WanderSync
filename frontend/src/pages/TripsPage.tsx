import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, MapPinned, Search, Sparkles, Trash2, Trophy } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, Spinner } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { TripListData } from "@/types/api";

const STATUS_FILTERS = ["all", "draft", "planned", "active", "completed", "cancelled"] as const;

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-600 border-slate-500/40",
  planned: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  active: "bg-emerald-100 text-emerald-600 border-emerald-500/40",
  completed: "bg-blue-700/20 text-blue-700 border-brand-500/40",
  cancelled: "bg-red-500/20 text-red-600 border-red-500/40",
};

const DEST_IMAGES: Record<string, string> = {
  dubai: "photo-1512453979798-5ea266f8880c",
  paris: "photo-1502602898657-3e91760cbb34",
  tokyo: "photo-1542051841857-5f90071e7989",
  rome: "photo-1552832230-c0197dd311b5",
  istanbul: "photo-1544984243-ec57ea16bb25",
  london: "photo-1513635269975-59663e0ac1ad",
  default: "photo-1488646953014-85cb44e25828",
};

function tripImage(destination: string) {
  const key = Object.keys(DEST_IMAGES).find((k) =>
    destination.toLowerCase().includes(k)
  ) ?? "default";
  return `https://images.unsplash.com/${DEST_IMAGES[key]}?auto=format&fit=crop&w=800&q=80`;
}

export default function TripsPage() {
  const trips = useQuery({
    queryKey: ["trips"],
    queryFn: () => api.get<TripListData>("/trips/"),
  });
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const removeTrip = useMutation({
    mutationFn: (tripId: string) => api.delete(`/trips/${tripId}/`),
    onSuccess: () => {
      setDeletingId(null);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: () => {
      setDeletingId(null);
      setError("Couldn't delete the trip. Please try again.");
    },
  });

  const confirmDelete = (tripId: string, title: string) => {
    if (window.confirm(`Delete "${title}" permanently?\n\nIts itinerary, budget and share links will be removed.`)) {
      setDeletingId(tripId);
      removeTrip.mutate(tripId);
    }
  };

  const visible = useMemo(() => {
    const results = trips.data?.results ?? [];
    const needle = search.trim().toLowerCase();
    return results.filter((trip) => {
      if (statusFilter !== "all" && trip.status !== statusFilter) return false;
      if (!needle) return true;
      return trip.title.toLowerCase().includes(needle) || trip.destination.toLowerCase().includes(needle);
    });
  }, [trips.data, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-slate-700/90 via-ink-950/90 to-brand-950/40 p-6 backdrop-blur-xl shadow-2xl"
      >
        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-blue-700/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700 flex items-center gap-1">
              <MapPinned className="size-3.5" /> My Itineraries
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900">
              Your Trips
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {trips.data
                ? `${trips.data.count} saved itinerary${trips.data.count === 1 ? "" : "s"} — click any to dive in`
                : "Loading your adventures…"}
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-center justify-center rounded-2xl border border-blue-200 bg-blue-700/10 px-5 py-3 text-center backdrop-blur-md">
            <Trophy className="size-6 text-blue-700 mb-1" />
            <p className="text-2xl font-extrabold text-slate-800">{trips.data?.count ?? "–"}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Trips</p>
          </div>
        </div>
      </motion.header>

      {/* Search + status filters */}
      {trips.data && trips.data.count > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <span className="sr-only">Search trips</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or destination…"
              className="h-10 w-full rounded-xl border border-slate-300 bg-white/80 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 backdrop-blur-md"
            />
          </label>
          <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                aria-pressed={statusFilter === status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[11px] font-bold capitalize transition-all",
                  statusFilter === status
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-brand-500/30"
                    : "border border-slate-300 bg-white/80 text-slate-500 hover:text-slate-700 hover:border-brand-500/40",
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-600">
          {error}
        </p>
      )}

      {trips.isLoading && <Spinner label="Loading trips…" />}
      {trips.isError && <Card className="p-4 text-sm text-red-600 border-red-500/20 bg-red-500/5">Couldn't load trips.</Card>}

      {trips.data && trips.data.count === 0 && (
        <Card className="p-10 text-center border-blue-200 bg-white rounded-3xl">
          <Globe2 className="mx-auto size-14 text-blue-600 mb-4 animate-pulse" />
          <p className="text-lg font-bold text-slate-700">No trips yet!</p>
          <p className="mt-1 text-sm text-slate-500">Let the AI planner craft your first itinerary in seconds.</p>
          <Link to="/planner" className="mt-5 inline-block">
            <Button size="sm" className="rounded-full px-8 shadow-lg shadow-brand-500/30">
              <Sparkles className="size-4" /> Plan My First Trip
            </Button>
          </Link>
        </Card>
      )}

      {trips.data && trips.data.count > 0 && visible.length === 0 && (
        <Card className="p-6 text-center text-sm text-slate-500 rounded-2xl">No trips match your search or filter.</Card>
      )}

      <AnimatePresence>
        {visible.length > 0 && (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((trip, i) => (
              <motion.li
                key={trip.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -6, scale: 1.015 }}
                className="group relative"
              >
                <Link
                  to={`/trips/${trip.id}`}
                  className="block h-full rounded-3xl border border-slate-300/60 bg-white/80 overflow-hidden transition-all hover:border-brand-500/40 hover:shadow-2xl hover:shadow-brand-500/10 backdrop-blur-md"
                >
                  {/* Hero image */}
                  <div className="relative h-36 w-full overflow-hidden">
                    <img
                      src={tripImage(trip.destination)}
                      alt={trip.destination}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
                    <span className={`absolute bottom-3 right-3 rounded-full border px-2.5 py-0.5 text-[10px] uppercase font-bold backdrop-blur-md ${STATUS_COLORS[trip.status] ?? "bg-slate-500/20 text-slate-600"}`}>
                      {trip.status}
                    </span>
                  </div>

                  <div className="p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">{trip.destination}</p>
                    <h2 className="mt-1 font-bold leading-snug text-slate-800 group-hover:text-blue-700 line-clamp-1">{trip.title}</h2>

                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-50/60 px-2.5 py-2 text-center">
                        <dt className="text-[10px] font-semibold uppercase text-slate-600">Duration</dt>
                        <dd className="mt-0.5 font-bold text-slate-600">{trip.duration_days} days</dd>
                      </div>
                      <div className="rounded-lg bg-slate-50/60 px-2.5 py-2 text-center">
                        <dt className="text-[10px] font-semibold uppercase text-slate-600">Travellers</dt>
                        <dd className="mt-0.5 font-bold text-slate-600">{trip.travelers}</dd>
                      </div>
                    </dl>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{trip.itinerary.total_estimated_cost.toLocaleString()} {trip.budget.currency}</span>
                      {trip.optimization.score !== null && (
                        <span className="font-bold text-blue-600">Score: {trip.optimization.score}/100</span>
                      )}
                    </div>

                    {trip.optimization.score !== null && (
                      <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                          style={{ width: `${trip.optimization.score}%` }}
                        />
                      </div>
                    )}
                  </div>
                </Link>

                {/* Delete button */}
                <button
                  type="button"
                  aria-label={`Delete trip ${trip.title}`}
                  disabled={deletingId === trip.id}
                  onClick={() => confirmDelete(trip.id, trip.title)}
                  className={cn(
                    "absolute right-3 top-3 rounded-xl p-2 text-slate-500 transition-all backdrop-blur-md bg-slate-50/70 border border-slate-300/60",
                    "hover:bg-red-500/20 hover:text-red-600 hover:border-red-500/40 focus-visible:text-red-600",
                    "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
                    deletingId === trip.id && "animate-pulse opacity-100",
                  )}
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </AnimatePresence>
    </div>
  );
}
