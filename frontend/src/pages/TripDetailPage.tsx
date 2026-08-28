import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarPlus,
  FileDown,
  Pencil,
  Plus,
  Share2,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

import { ActivityForm } from "@/components/itinerary/ActivityForm";
import { EditTripDialog } from "@/components/itinerary/EditTripDialog";
import { TripCollaborationPanel } from "@/components/itinerary/TripCollaborationPanel";
import { TripExpensesPanel } from "@/components/itinerary/TripExpensesPanel";
import { TripMap } from "@/components/itinerary/TripMap";
import { TripPollsPanel } from "@/components/itinerary/TripPollsPanel";
import { WeatherPanel } from "@/components/itinerary/WeatherPanel";
import { TravelJournalPanel } from "@/components/journal/TravelJournalPanel";
import { SmartPackingPanel } from "@/components/itinerary/SmartPackingPanel";
import { TripSimulationModal } from "@/components/simulation/TripSimulationModal";
import { Button } from "@/components/ui/Button";
import { Card, Spinner } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Trip } from "@/types/api";

const MOODS = ["relaxed", "balanced", "packed", "budget", "premium", "family"];

interface BudgetBreakdown {
  categories: Record<string, number>;
  total_estimate: number;
  currency: string;
  daily_average: number;
  declared_budget: number | null;
  budget_remaining: number | null;
  is_estimate: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  accommodation: "Accommodation",
  transportation: "Transport",
  activities: "Activities",
  food: "Food",
  miscellaneous: "Misc",
};

export default function TripDetailPage() {
  const { tripId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeDay, setActiveDay] = useState<number | "all">(1);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [shareInfo, setShareInfo] = useState<{ token: string; url: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const trip = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => api.get<{ trip: Trip }>(`/trips/${tripId}/`),
  });

  const budget = useQuery({
    queryKey: ["trip", tripId, "budget"],
    queryFn: () => api.get<{ budget: BudgetBreakdown }>(`/trips/${tripId}/budget/`),
    enabled: Boolean(trip.data),
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

  // Resolve missing activity coordinates so the map & weather work everywhere.
  const geocode = useMutation({
    mutationFn: () => api.post(`/trips/${tripId}/geocode/`),
    onSuccess: () => invalidate(),
    onError: () => setActionError("Couldn't resolve locations — try again shortly."),
  });

  const deleteTrip = useMutation({
    mutationFn: () => api.delete(`/trips/${tripId}/`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
      void navigate("/trips");
    },
    onError: () => setActionError("Couldn't delete the trip. Try again."),
  });

  if (trip.isLoading) return <Spinner label="Loading itinerary…" />;
  if (trip.isError || !trip.data) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-slate-600">Trip not found.</p>
        <Link to="/trips" className="mt-2 inline-block text-sm text-brand-400">← Back to trips</Link>
      </Card>
    );
  }

  const data = trip.data.trip;
  const day = data.itinerary.days.find((d) => d.day_number === activeDay) ?? data.itinerary.days[0];
  const currency = data.budget.currency;
  const budgetData = budget.data?.budget;

  const exportFile = (kind: "pdf" | "ics") => {
    const slug = data.destination.toLowerCase().replace(/\s+/g, "-");
    api
      .download(`/export/trips/${tripId}/${kind}/`, `wandersync-${slug}.${kind}`)
      .catch(() => setActionError(`${kind.toUpperCase()} export failed. Is the backend running?`));
  };

  return (
    <div className="space-y-5">
      <Link to="/trips" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
        <ArrowLeft aria-hidden className="size-3.5" /> All trips
      </Link>

      <header className="rounded-xl border border-blue-100 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-600">{data.destination}</p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">{data.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setShowSimulation(true)} className="rounded-xl font-bold">
              ✨ Experience My Trip
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowEdit(true)}>
              <Pencil aria-hidden className="size-3.5" /> Edit details
            </Button>
            <Button size="sm" variant="secondary" onClick={() => exportFile("pdf")}>
              <FileDown aria-hidden className="size-3.5" /> PDF
            </Button>
            <Button size="sm" variant="secondary" onClick={() => exportFile("ics")}>
              <CalendarPlus aria-hidden className="size-3.5" /> Calendar
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void createShare.mutate()} loading={createShare.isPending}>
              <Share2 aria-hidden className="size-3.5" /> Share
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (window.confirm(`Delete "${data.title}" permanently? This can't be undone.`)) {
                  void deleteTrip.mutate();
                }
              }}
              loading={deleteTrip.isPending}
            >
              <Trash2 aria-hidden className="size-3.5" /> Delete trip
            </Button>
          </div>
        </div>
        {actionError && (
          <p role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600">
            {actionError}
          </p>
        )}
        {shareInfo && (
          <p className="mt-3 truncate rounded-lg border border-blue-200 bg-blue-700/10 px-3 py-2 text-xs text-blue-700">
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
            <div key={label} className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
              <dd className="mt-0.5 font-medium text-slate-800">{value}</dd>
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
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors",
              d.day_number === day?.day_number
                ? "bg-blue-700 text-white"
                : "bg-slate-100 text-slate-500 hover:text-slate-700",
            )}
          >
            Day {d.day_number}
          </button>
        ))}
      </div>

      {day && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="font-medium text-slate-800">
              Day {day.day_number}
              {day.title && <span className="ml-2 text-sm font-normal text-slate-500">{day.title}</span>}
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
                className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700"
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

          <ol className="divide-y divide-slate-200">
            {day.activities.map((activity, index) => (
              <li key={`${activity.name}-${index}`} className="flex gap-3 px-4 py-3">
                <span className="w-12 shrink-0 pt-0.5 text-xs font-medium tabular-nums text-blue-700">
                  {activity.start_time || "—"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{activity.name}</p>
                  {activity.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{activity.description}</p>
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
                  className="shrink-0 text-slate-500 hover:text-red-600"
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

          <div className="border-t border-slate-200 p-3">
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

      <TripMap
        days={data.itinerary.days}
        activeDay={activeDay === "all" ? null : activeDay}
        onFillLocations={() => geocode.mutate()}
        filling={geocode.isPending}
      />

      {/* Live conditions + arrival-aligned forecast for the destination */}
      <WeatherPanel
        destination={data.destination}
        startDate={data.start_date}
        durationDays={data.duration_days}
      />

      {showEdit && (
        <EditTripDialog trip={data} onClose={() => setShowEdit(false)} onSaved={invalidate} />
      )}

      {budgetData && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-medium text-slate-800">
              <Wallet aria-hidden className="size-4 text-brand-400" /> Budget breakdown
            </h2>
            <p className="text-[11px] text-slate-500">Estimated values — not guaranteed prices.</p>
          </div>
          <dl className="mt-3 space-y-2.5">
            {Object.entries(budgetData.categories).map(([category, amount]) => {
              const share = budgetData.total_estimate > 0 ? (amount / budgetData.total_estimate) * 100 : 0;
              return (
                <div key={category}>
                  <div className="flex items-baseline justify-between text-xs">
                    <dt className="text-slate-600">{CATEGORY_LABELS[category] ?? category}</dt>
                    <dd className="tabular-nums text-slate-500">
                      {amount.toLocaleString()} {budgetData.currency}
                    </dd>
                  </div>
                  <div
                    role="img"
                    aria-label={`${CATEGORY_LABELS[category] ?? category}: ${share.toFixed(0)} percent of estimated cost`}
                    className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200"
                  >
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${Math.max(share, 1)}%` }} />
                  </div>
                </div>
              );
            })}
          </dl>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3 text-center text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Daily avg</p>
              <p className="font-medium text-slate-800 tabular-nums">
                {budgetData.daily_average.toLocaleString()} {budgetData.currency}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Declared budget</p>
              <p className="font-medium text-slate-800 tabular-nums">
                {budgetData.declared_budget != null
                  ? `${budgetData.declared_budget.toLocaleString()} ${budgetData.currency}`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Remaining</p>
              <p className={`font-medium tabular-nums ${
                budgetData.budget_remaining != null && budgetData.budget_remaining < 0
                  ? "text-red-600"
                  : "text-emerald-600"
              }`}>
                {budgetData.budget_remaining != null
                  ? `${budgetData.budget_remaining.toLocaleString()} ${budgetData.currency}`
                  : "—"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {data.optimization.insights.length > 0 && (
        <section aria-label="Optimization insights" className="space-y-1.5">
          {data.optimization.insights.map((insight) => (
            <p
              key={insight}
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700"
            >
              💡 {insight}
            </p>
          ))}
        </section>
      )}

      {/* Smart Ecosystem Panels */}
      <div className="space-y-8 pt-6 border-t border-slate-200">
        <TripCollaborationPanel tripId={tripId} />
        <TripPollsPanel />
        <TripExpensesPanel />
        <SmartPackingPanel />
        <TravelJournalPanel />
      </div>

      {showSimulation && <TripSimulationModal trip={data} onClose={() => setShowSimulation(false)} />}
    </div>
  );
}