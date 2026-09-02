import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpDown,
  Calendar,
  Globe2,
  MapPinned,
  Search,
  Sparkles,
  Trash2,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, Spinner } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { TripListData } from "@/types/api";

const STATUS_FILTERS = ["all", "draft", "planned", "active", "completed", "cancelled"] as const;

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-700 border-slate-500/40",
  planned: "bg-blue-500/20 text-blue-700 border-blue-500/40",
  active: "bg-emerald-500/20 text-emerald-700 border-emerald-500/40",
  completed: "bg-indigo-500/20 text-indigo-700 border-indigo-500/40",
  cancelled: "bg-red-500/20 text-red-700 border-red-500/40",
};

const DEST_IMAGES: Record<string, string> = {
  dubai: "photo-1512453979798-5ea266f8880c",
  paris: "photo-1502602898657-3e91760cbb34",
  tokyo: "photo-1542051841857-5f90071e7989",
  rome: "photo-1552832230-c0197dd311b5",
  istanbul: "photo-1544984243-ec57ea16bb25",
  london: "photo-1513635269975-59663e0ac1ad",
  newyork: "photo-1496442226666-8d4d0e62e6e9",
  bali: "photo-1537996194471-e657df975ab4",
  malaysia: "photo-1596422846543-75c6fc197f07",
  cairo: "photo-1572252009286-268acec5ca0a",
  hunza: "photo-1587574293340-e0011c4e8ecf",
  default: "photo-1488646953014-85cb44e25828",
};

function tripImage(destination: string) {
  const key = Object.keys(DEST_IMAGES).find((k) =>
    destination.toLowerCase().replace(/[\s-]/g, "").includes(k)
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
  const [sortBy, setSortBy] = useState<"newest" | "duration" | "cost" | "score">("newest");
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
    if (window.confirm(`Delete "${title}" permanently?\n\nIts itinerary, budget and activities will be removed.`)) {
      setDeletingId(tripId);
      removeTrip.mutate(tripId);
    }
  };

  // Dynamic Metrics computed from live trips
  const stats = useMemo(() => {
    const list = trips.data?.results ?? [];
    const totalCount = list.length;
    const uniqueDestinations = new Set(list.map((t) => t.destination.trim().toLowerCase())).size;
    const totalDays = list.reduce((acc, t) => acc + (t.duration_days || 0), 0);
    const totalEstimatedCost = list.reduce(
      (acc, t) => acc + (t.itinerary?.total_estimated_cost || 0),
      0
    );
    const activeCount = list.filter((t) => t.status === "active" || t.status === "planned").length;
    const currency = list[0]?.budget?.currency || "PKR";

    return {
      totalCount,
      uniqueDestinations,
      totalDays,
      totalEstimatedCost,
      activeCount,
      currency,
    };
  }, [trips.data]);

  const visible = useMemo(() => {
    const results = trips.data?.results ?? [];
    const needle = search.trim().toLowerCase();
    const filtered = results.filter((trip) => {
      if (statusFilter !== "all" && trip.status !== statusFilter) return false;
      if (!needle) return true;
      return trip.title.toLowerCase().includes(needle) || trip.destination.toLowerCase().includes(needle);
    });

    return filtered.sort((a, b) => {
      if (sortBy === "duration") return (b.duration_days || 0) - (a.duration_days || 0);
      if (sortBy === "cost") return (b.itinerary?.total_estimated_cost || 0) - (a.itinerary?.total_estimated_cost || 0);
      if (sortBy === "score") return (b.optimization?.score || 0) - (a.optimization?.score || 0);
      return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
    });
  }, [trips.data, search, statusFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header with Live Overview */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/70 to-indigo-50/50 p-6 backdrop-blur-xl shadow-lg"
      >
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 flex items-center gap-1.5">
              <MapPinned className="size-3.5" /> Dynamic Travel Portfolio
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900">
              My Trips & Itineraries
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {trips.data
                ? `${stats.totalCount} saved trip${stats.totalCount === 1 ? "" : "s"} across ${stats.uniqueDestinations} destination${stats.uniqueDestinations === 1 ? "" : "s"}`
                : "Loading your adventures…"}
            </p>
          </div>

          {/* Real-time calculated counters */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="rounded-2xl border border-blue-200/80 bg-white/90 p-3 text-center shadow-xs">
              <Trophy className="mx-auto size-4 text-blue-600 mb-1" />
              <p className="text-lg font-bold text-slate-900">{stats.totalCount}</p>
              <p className="text-[10px] font-bold uppercase text-slate-500">Total Trips</p>
            </div>
            <div className="rounded-2xl border border-blue-200/80 bg-white/90 p-3 text-center shadow-xs">
              <Globe2 className="mx-auto size-4 text-indigo-600 mb-1" />
              <p className="text-lg font-bold text-slate-900">{stats.uniqueDestinations}</p>
              <p className="text-[10px] font-bold uppercase text-slate-500">Destinations</p>
            </div>
            <div className="rounded-2xl border border-blue-200/80 bg-white/90 p-3 text-center shadow-xs">
              <Calendar className="mx-auto size-4 text-emerald-600 mb-1" />
              <p className="text-lg font-bold text-slate-900">{stats.totalDays}</p>
              <p className="text-[10px] font-bold uppercase text-slate-500">Total Days</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Search, Filter & Sort Controls */}
      {trips.data && trips.data.count > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <label className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <span className="sr-only">Search trips</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search destination or title…"
                className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
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
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-all",
                    statusFilter === status
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-slate-300 bg-white text-slate-600 hover:border-blue-400 hover:text-slate-900"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="size-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="duration">Longest Duration</option>
              <option value="cost">Highest Cost</option>
              <option value="score">Optimization Score</option>
            </select>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </p>
      )}

      {trips.isLoading && <Spinner label="Loading trips…" />}
      {trips.isError && <Card className="p-4 text-sm text-red-600 border-red-200 bg-red-50">Couldn't load trips.</Card>}

      {trips.data && trips.data.count === 0 && (
        <Card className="p-10 text-center border-blue-200 bg-white rounded-3xl shadow-sm">
          <Globe2 className="mx-auto size-14 text-blue-600 mb-4 animate-pulse" />
          <p className="text-lg font-bold text-slate-800">No trips planned yet!</p>
          <p className="mt-1 text-sm text-slate-500">
            Tell the AI Planner where you want to go, and it will generate a complete day-by-day itinerary in seconds.
          </p>
          <Link to="/planner" className="mt-5 inline-block">
            <Button size="sm" className="rounded-full px-8 shadow-sm">
              <Sparkles className="size-4" /> Launch AI Planner
            </Button>
          </Link>
        </Card>
      )}

      {trips.data && trips.data.count > 0 && visible.length === 0 && (
        <Card className="p-6 text-center text-sm text-slate-500 rounded-2xl">
          No trips match your search or filter criteria.
        </Card>
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
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -5 }}
                className="group relative"
              >
                <Link
                  to={`/trips/${trip.id}`}
                  className="block h-full rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all hover:border-blue-400 hover:shadow-md"
                >
                  {/* Hero image with dynamic destination matching */}
                  <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                    <img
                      src={tripImage(trip.destination)}
                      alt={trip.destination}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <span className={`absolute bottom-3 right-3 rounded-full border px-2.5 py-0.5 text-[11px] uppercase font-bold backdrop-blur-md bg-white/90 ${STATUS_COLORS[trip.status] ?? "text-slate-700"}`}>
                      {trip.status}
                    </span>
                    <span className="absolute bottom-3 left-3 text-xs font-semibold text-white drop-shadow-md">
                      {trip.destination}
                    </span>
                  </div>

                  <div className="p-4">
                    <h2 className="font-bold leading-snug text-slate-900 group-hover:text-blue-600 line-clamp-1">
                      {trip.title}
                    </h2>

                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-slate-50 p-2.5 text-center border border-slate-100">
                        <dt className="text-[10px] font-bold uppercase text-slate-500">Duration</dt>
                        <dd className="mt-0.5 font-bold text-slate-800">{trip.duration_days} days</dd>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2.5 text-center border border-slate-100">
                        <dt className="text-[10px] font-bold uppercase text-slate-500">Travellers</dt>
                        <dd className="mt-0.5 font-bold text-slate-800">{trip.travelers} people</dd>
                      </div>
                    </dl>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                      <span className="font-medium">
                        Cost: <strong className="text-slate-900">{trip.itinerary?.total_estimated_cost?.toLocaleString() || 0} {trip.budget?.currency || "USD"}</strong>
                      </span>
                      {trip.optimization?.score !== null && (
                        <span className="font-bold text-blue-600">
                          Score: {trip.optimization.score}/100
                        </span>
                      )}
                    </div>

                    {trip.optimization?.score !== null && (
                      <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500"
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
                    "absolute right-3 top-3 rounded-xl p-2 text-slate-600 transition-all backdrop-blur-md bg-white/90 border border-slate-200 shadow-sm",
                    "hover:bg-red-50 hover:text-red-600 hover:border-red-300 focus-visible:text-red-600",
                    "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
                    deletingId === trip.id && "animate-pulse opacity-100"
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
