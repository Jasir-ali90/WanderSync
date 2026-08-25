import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Card, Spinner } from "@/components/ui/Card";
import { api } from "@/lib/api";
import type { Trip } from "@/types/api";

/**
 * Phase-13 will expand this into the full timeline/map/budget editor.
 * This version already renders the real optimized data.
 */
export default function TripDetailPage() {
  const { tripId = "" } = useParams();
  const trip = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => api.get<{ trip: Trip }>(`/trips/${tripId}/`),
  });

  if (trip.isLoading) return <Spinner label="Loading itinerary…" />;
  if (trip.isError || !trip.data) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-slate-300">Trip not found.</p>
        <Link to="/trips" className="mt-2 inline-block text-sm text-brand-400">← Back to trips</Link>
      </Card>
    );
  }

  const data = trip.data.trip;

  return (
    <div className="space-y-5">
      <Link to="/trips" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
        <ArrowLeft aria-hidden className="size-3.5" /> All trips
      </Link>

      <header className="bg-radial-teal rounded-xl border border-ink-700 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-brand-400">{data.destination}</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-50">{data.title}</h1>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {[
            ["Duration", `${data.duration_days} days`],
            ["Travellers", String(data.travelers)],
            ["Est. cost", `${data.itinerary.total_estimated_cost.toLocaleString()} ${data.budget.currency}`],
            ["Score", data.optimization.score !== null ? `${data.optimization.score}/100` : "—"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-ink-900/60 px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
              <dd className="mt-0.5 font-medium text-slate-100">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      {data.optimization.insights.length > 0 && (
        <section aria-label="Optimization insights" className="space-y-1.5">
          {data.optimization.insights.map((insight) => (
            <p key={insight} className="rounded-lg border border-brand-500/20 bg-brand-500/5 px-3 py-2 text-xs text-brand-200/90">
              💡 {insight}
            </p>
          ))}
        </section>
      )}

      <div className="space-y-4">
        {data.itinerary.days.map((day) => (
          <Card key={day.day_number} className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-700 bg-ink-900/60 px-4 py-3">
              <h2 className="font-medium text-slate-100">
                Day {day.day_number}
                {day.title && <span className="ml-2 text-sm font-normal text-slate-400">{day.title}</span>}
              </h2>
              <p className="text-xs text-slate-500">
                est. {day.estimated_cost.toLocaleString()} {data.budget.currency}
              </p>
            </div>
            <ol className="divide-y divide-ink-700/70">
              {day.activities.map((activity) => (
                <li key={activity.name} className="flex gap-3 px-4 py-3">
                  <span className="w-12 shrink-0 pt-0.5 text-xs font-medium tabular-nums text-brand-300">
                    {activity.start_time || "—"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">{activity.name}</p>
                    {activity.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-400">{activity.description}</p>
                    )}
                    <p className="mt-1 flex gap-2 text-[11px] text-slate-500">
                      <span>{activity.duration_minutes} min</span>
                      <span>·</span>
                      <span>{activity.category}</span>
                      {activity.cost_estimate > 0 && (
                        <>
                          <span>·</span>
                          <span>~{activity.cost_estimate.toLocaleString()} {data.budget.currency}</span>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>

      <p className="pb-4 text-center text-[11px] text-slate-600">
        Costs are estimates only. Full editing & map experience arrives with the itinerary studio.
      </p>
    </div>
  );
}
