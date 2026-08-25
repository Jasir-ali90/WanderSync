import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Wordmark } from "@/components/layout/Layouts";
import { Card, Spinner } from "@/components/ui/Card";
import { api } from "@/lib/api";
import type { Trip } from "@/types/api";

/** Public, read-only view of a shared itinerary (no auth required). */
export default function SharedTripPage() {
  const { token = "" } = useParams();
  const shared = useQuery({
    queryKey: ["shared", token],
    queryFn: () => api.get<{ trip: Trip }>(`/share/${token}/`),
    retry: false,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-ink-700/60 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Wordmark />
          <Link to="/register" className="text-sm font-medium text-brand-400 hover:text-brand-300">
            Plan your own →
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        {shared.isLoading && <Spinner label="Loading shared itinerary…" />}
        {shared.isError && (
          <Card className="p-8 text-center">
            <p className="text-sm text-slate-300">This share link is invalid or has been revoked.</p>
            <Link to="/" className="mt-3 inline-block text-sm text-brand-400">← Back to WanderSync</Link>
          </Card>
        )}
        {shared.data && (
          <>
            <p className="text-xs uppercase tracking-[0.18em] text-brand-400">
              {shared.data.trip.destination} · shared itinerary
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-50">
              {shared.data.trip.title}
            </h1>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {[
                ["Duration", `${shared.data.trip.duration_days} days`],
                ["Est. total", `${shared.data.trip.itinerary.total_estimated_cost.toLocaleString()} ${shared.data.trip.budget.currency}`],
                ["Score", shared.data.trip.optimization.score !== null ? `${shared.data.trip.optimization.score}/100` : "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-ink-700 bg-ink-800/70 px-3 py-2">
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
                  <dd className="mt-0.5 font-medium text-slate-100">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 space-y-4">
              {shared.data.trip.itinerary.days.map((day) => (
                <Card key={day.day_number} className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-ink-700 bg-ink-900/60 px-4 py-3">
                    <h2 className="font-medium text-slate-100">Day {day.day_number}{day.title && ` — ${day.title}`}</h2>
                    <p className="text-xs text-slate-500">est. {day.estimated_cost.toLocaleString()} {shared.data.trip.budget.currency}</p>
                  </div>
                  <ol className="divide-y divide-ink-700/70">
                    {day.activities.map((activity) => (
                      <li key={activity.name} className="flex gap-3 px-4 py-3">
                        <span className="w-12 shrink-0 pt-0.5 text-xs font-medium tabular-nums text-brand-300">
                          {activity.start_time || "—"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-100">{activity.name}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {activity.duration_minutes} min · {activity.category}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Card>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-slate-600">
              Costs are estimates only. Planned with WanderSync.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
