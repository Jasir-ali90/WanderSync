import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPinPlus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, Spinner } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { TripListData } from "@/types/api";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const trips = useQuery({
    queryKey: ["trips"],
    queryFn: () => api.get<TripListData>("/trips/?page_size=3"),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-50">
          {greeting()}, {user?.full_name?.split(" ")[0] || "explorer"} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Where are we dreaming of today?
        </p>
      </header>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-radial-teal p-5">
          <span className="grid size-10 place-items-center rounded-lg bg-brand-500/15 text-brand-400">
            <Sparkles aria-hidden className="size-5" />
          </span>
          <h2 className="mt-3 font-semibold text-slate-100">Plan with AI</h2>
          <p className="mt-1 text-sm text-slate-400">
            Describe your dream trip in one sentence — the planner handles the rest.
          </p>
          <Link to="/planner" className="mt-4 inline-block">
            <Button size="sm">
              Open planner <ArrowRight aria-hidden className="size-3.5" />
            </Button>
          </Link>
        </Card>
        <Card className="p-5">
          <span className="grid size-10 place-items-center rounded-lg bg-sand-400/15 text-sand-300">
            <MapPinPlus aria-hidden className="size-5" />
          </span>
          <h2 className="mt-3 font-semibold text-slate-100">Your trips</h2>
          <p className="mt-1 text-sm text-slate-400">
            Every itinerary lives here — open one to edit, export or share.
          </p>
          <Link to="/trips" className="mt-4 inline-block">
            <Button size="sm" variant="secondary">
              View all trips <ArrowRight aria-hidden className="size-3.5" />
            </Button>
          </Link>
        </Card>
      </div>

      {/* Recent trips */}
      <section aria-labelledby="recent-trips">
        <div className="flex items-center justify-between">
          <h2 id="recent-trips" className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Recent trips
          </h2>
          <Link to="/trips" className="text-xs font-medium text-brand-400 hover:text-brand-300">
            View all
          </Link>
        </div>

        {trips.isLoading && <Spinner label="Loading your trips…" />}
        {trips.isError && (
          <Card className="mt-3 p-4 text-sm text-red-300">Couldn't load trips. Is the backend running?</Card>
        )}
        {trips.data && trips.data.count === 0 && (
          <Card className="mt-3 p-6 text-center">
            <p className="text-sm text-slate-300">No trips yet.</p>
            <p className="mt-1 text-xs text-slate-500">
              Start a conversation with the planner and your first itinerary appears here.
            </p>
            <Link to="/planner" className="mt-4 inline-block">
              <Button size="sm">Plan my first trip</Button>
            </Link>
          </Card>
        )}
        {trips.data && trips.data.count > 0 && (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trips.data.results.map((trip) => (
              <li key={trip.id}>
                <Link
                  to={`/trips/${trip.id}`}
                  className="block rounded-xl border border-ink-700 bg-ink-800/80 p-4 transition-colors hover:border-brand-500/40"
                >
                  <p className="text-xs uppercase tracking-wide text-brand-400">{trip.destination}</p>
                  <h3 className="mt-1 line-clamp-1 font-medium text-slate-100">{trip.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {trip.duration_days} days · {trip.status}
                    {trip.optimization.score !== null && ` · score ${trip.optimization.score}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
