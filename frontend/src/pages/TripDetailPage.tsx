import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarPlus,
  FileDown,
  Plus,
  Share2,
  X,
} from "lucide-react";

import { ActivityForm } from "@/components/itinerary/ActivityForm";
import { Button } from "@/components/ui/Button";
import { Card, Spinner } from "@/components/ui/Card";
import { api } from "@/lib/api";
import type { Trip } from "@/types/api";

const MOODS = ["relaxed", "balanced", "packed", "budget", "premium", "family"];

export default function TripDetailPage() {
  const { tripId = "" } = useParams();
  const queryClient = useQueryClient();
  const [activeDay, setActiveDay] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [shareInfo, setShareInfo] = useState<{ token: string; url: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const trip = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => api.get<{ trip: Trip }>(`/trips/${tripId}/`),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
    void queryClient.invalidateQueries({ queryKey: ["trips"] });
  };

  const regenerate = useMutation({
    mutationFn: (mood: string) =>
      api.post<{ trip: Trip; engine: string }>(`/trips/${tripId}/days/${activeDay}/regenerate/`, { mood }),
    onSuccess: () => invalidate(),
    onError: () => setActionError("Couldn't regenerate that day."),
  });

  const addActivity = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post<{ trip: Trip }>(`/trips/${tripId}/days/${activeDay}/activities/`, payload),
    onSuccess: () => {
      setShowAdd(false);
      invalidate();
    },
  });

  const removeActivity = useMutation({
    mutationFn: (index: number) =>
      api.delete<{ trip: Trip }>(`/trips/${tripId}/days/${activeDay}/activities/${index}/`),
    onSuccess: () => invalidate(),
  });

  const createShare = useMutation({
    mutationFn: () => api.post<{ token: string; url: string }>(`/share/trips/${tripId}/`),
    onSuccess: (data) => setShareInfo(data),
    onError: () => setActionError("Couldn't create a share link."),
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
  const day = data.itinerary.days.find((d) => d.day_number === activeDay) ?? data.itinerary.days[0];
  const currency = data.budget.currency;

  const exportFile = (kind: "pdf" | "ics") => {
    const slug = data.destination.toLowerCase().replace(/\s+/g, "-");
    api
      .download(`/export/trips/${tripId}/${kind}/`, `wandersync-${slug}.${kind}`)
      .catch(() => setActionError(`${kind.toUpperCase()} export failed. Is the backend running?`));
  };

  return (
    <div className="space-y-5">
      <Link to="/trips" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
        <ArrowLeft aria-hidden className="size-3.5" /> All trips
      </Link>

      <header className="bg-radial-teal rounded-xl border border-ink-700 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-brand-400">{data.destination}</p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-50">{data.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => exportFile("pdf")}>
              <FileDown aria-hidden className="size-3.5" /> PDF
            </Button>
            <Button size="sm" variant="secondary" onClick={() => exportFile("ics")}>
              <CalendarPlus aria-hidden className="size-3.5" /> Calendar
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void createShare.mutate()} loading={createShare.isPending}>
              <Share2 aria-hidden className="size-3.5" /> Share
            </Button>
          </div>
        </div>
        {actionError && (
          <p role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {actionError}
          </p>
        )}
        {shareInfo && (
          <p className="mt-3 truncate rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-xs text-brand-200">
            Share link: {window.location.origin}
            {shareInfo.url}
          </p>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {[
            ["Duration", `${data.duration_days} days`],
            ["Travellers", String(data.travelers)],
            ["Est. total", `${data.itinerary.total_estimated_cost.toLocaleString()} ${currency}`],
            ["Score", data.optimization.score !== null ? `${data.optimization.score}/100` : "—"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-ink-900/60 px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
              <dd className="mt-0.5 font-medium text-slate-100">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Trip days">
        {data.itinerary.days.map((d) => (
          <button
            key={d.day_number}
            type="button"
            role="tab"
            aria-selected={d.day_number === day?.day_number}
            onClick={() => setActiveDay(d.day_number)}
            className={
              d.day_number === day?.day_number
                ? "rounded-lg bg-brand-500 px-3.5 py-1.5 text-xs font-medium text-ink-950"
                : "rounded-lg bg-ink-800 px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            }
          >
            Day {d.day_number}
          </button>
        ))}
      </div>

      {day && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700 bg-ink-900/60 px-4 py-3">
            <h2 className="font-medium text-slate-100">
              Day {day.day_number}
              {day.title && <span className="ml-2 text-sm font-normal text-slate-400">{day.title}</span>}
            </h2>
            <div className="flex items-center gap-3">
              <p className="text-xs text-slate-500">est. {day.estimated_cost.toLocaleString()} {currency}</p>
              <select
                aria-label="Regenerate day with a mood"
                value=""
                disabled={regenerate.isPending}
                onChange={(event) => {
                  if (event.target.value) void regenerate.mutate(event.target.value);
                }}
                className="h-8 rounded-lg border border-ink-600 bg-ink-900 px-2 text-xs text-slate-200"
              >
                <option value="" disabled>
                  {regenerate.isPending ? "Regenerating…" : "Regenerate…"}
                </option>
                {MOODS.map((mood) => (
                  <option key={mood} value={mood}>{mood}</option>
                ))}
              </select>
            </div>
          </div>

          <ol className="divide-y divide-ink-700/70">
            {day.activities.map((activity, index) => (
              <li key={`${activity.name}-${index}`} className="flex gap-3 px-4 py-3">
                <span className="w-12 shrink-0 pt-0.5 text-xs font-medium tabular-nums text-brand-300">
                  {activity.start_time || "—"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-100">{activity.name}</p>
                  {activity.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-400">{activity.description}</p>
                  )}
                  <p className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                    <span>{activity.duration_minutes} min</span>
                    <span>·</span>
                    <span>{activity.category}</span>
                    {activity.cost_estimate > 0 && (
                      <>
                        <span>·</span>
                        <span>~{activity.cost_estimate.toLocaleString()} {currency}</span>
                      </>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove ${activity.name}`}
                  onClick={() => void removeActivity.mutate(index)}
                  className="shrink-0 text-slate-500 hover:text-red-300"
                >
                  <X aria-hidden className="size-4" />
                </Button>
              </li>
            ))}
          </ol>

          {day.activities.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              Nothing planned yet — add an activity or regenerate the day.
            </p>
          )}

          <div className="border-t border-ink-700 p-3">
            {showAdd ? (
              <ActivityForm
                onCancel={() => setShowAdd(false)}
                onSubmit={(payload) => void addActivity.mutate(payload)}
                saving={addActivity.isPending}
              />
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setShowAdd(true)}>
                <Plus aria-hidden className="size-3.5" /> Add activity
              </Button>
            )}
          </div>
        </Card>
      )}

      {data.optimization.insights.length > 0 && (
        <section aria-label="Optimization insights" className="space-y-1.5">
          {data.optimization.insights.map((insight) => (
            <p
              key={insight}
              className="rounded-lg border border-brand-500/20 bg-brand-500/5 px-3 py-2 text-xs text-brand-200/90"
            >
              💡 {insight}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}