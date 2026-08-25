import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Card, Spinner } from "@/components/ui/Card";
import { api } from "@/lib/api";
import type { TripListData } from "@/types/api";

export default function TripsPage() {
  const trips = useQuery({
    queryKey: ["trips"],
    queryFn: () => api.get<TripListData>("/trips/"),
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-50">Your trips</h1>
        <p className="mt-1 text-sm text-slate-400">
          {trips.data ? `${trips.data.count} saved itinerary${trips.data.count === 1 ? "" : "s"}` : "Loading…"}
        </p>
      </header>

      {trips.isLoading && <Spinner label="Loading trips…" />}
      {trips.isError && <Card className="p-4 text-sm text-red-300">Couldn't load trips.</Card>}

      {trips.data && trips.data.count === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-300">No trips yet.</p>
          <Link to="/planner" className="mt-3 inline-block text-sm font-medium text-brand-400 hover:text-brand-300">
            Plan your first trip →
          </Link>
        </Card>
      )}

      {trips.data && trips.data.results.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.data.results.map((trip) => (
            <li key={trip.id}>
              <Link
                to={`/trips/${trip.id}`}
                className="block h-full rounded-xl border border-ink-700 bg-ink-800/80 p-4 transition-colors hover:border-brand-500/40"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-brand-400">{trip.destination}</p>
                  <span className="rounded-full bg-ink-700 px-2 py-0.5 text-[10px] uppercase text-slate-400">
                    {trip.status}
                  </span>
                </div>
                <h2 className="mt-1.5 font-medium leading-snug text-slate-100">{trip.title}</h2>
                <dl className="mt-3 space-y-1 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <dt>Duration</dt>
                    <dd>{trip.duration_days} days</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Travellers</dt>
                    <dd>{trip.travelers}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Est. cost</dt>
                    <dd>
                      {trip.itinerary.total_estimated_cost.toLocaleString()} {trip.budget.currency}
                    </dd>
                  </div>
                </dl>
                {trip.optimization.score !== null && (
                  <p className="mt-3 rounded-md bg-brand-500/10 px-2 py-1 text-center text-[11px] font-medium text-brand-300">
                    Optimization score: {trip.optimization.score}/100
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
