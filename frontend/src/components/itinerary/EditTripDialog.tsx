/** Edit trip details: title, dates, travellers, budget, status & notes. */
import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, api } from "@/lib/api";
import { convertCurrency } from "@/lib/currency";
import type { Trip } from "@/types/api";

const STATUSES = ["draft", "planned", "active", "completed", "cancelled"];
const BUDGET_LEVELS = ["budget", "moderate", "luxury"];
const CURRENCIES = ["USD", "EUR", "GBP", "PKR", "AED", "SAR", "INR"];
const VISIBILITIES = ["private", "public"];

export function EditTripDialog({
  trip,
  onClose,
  onSaved,
}: {
  trip: Trip;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: trip.title,
    start_date: trip.start_date ?? "",
    end_date: trip.end_date ?? "",
    travelers: String(trip.travelers),
    budget_amount: trip.budget.amount != null ? String(trip.budget.amount) : "",
    budget_currency: trip.budget.currency,
    budget_level: trip.budget.level,
    status: trip.status,
    visibility: trip.visibility,
    notes: trip.notes,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /** Changing currency also converts the displayed budget so the number
   *  actually changes — never just the label. */
  const changeCurrency = (next: string) => {
    setForm((prev) => {
      if (prev.budget_amount === "" || next === prev.budget_currency) {
        return { ...prev, budget_currency: next };
      }
      const converted = convertCurrency(
        Number(prev.budget_amount) || 0,
        prev.budget_currency,
        next,
      );
      return { ...prev, budget_currency: next, budget_amount: String(Math.round(converted)) };
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const rawBudget = form.budget_amount.trim();
    let parsedBudget: number | null = null;
    if (rawBudget !== "") {
      parsedBudget = Number(rawBudget);
      if (isNaN(parsedBudget) || parsedBudget < 0) {
        setError("Please enter a valid positive budget amount.");
        setSaving(false);
        return;
      }
    }

    const parsedTravelers = Number(form.travelers);
    if (isNaN(parsedTravelers) || parsedTravelers < 1) {
      setError("Please enter a valid number of travellers (at least 1).");
      setSaving(false);
      return;
    }

    try {
      await api.patch<{ trip: Trip }>(`/trips/${trip.id}/`, {
        title: form.title.trim(),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        travelers: parsedTravelers,
        budget_amount: parsedBudget,
        budget_currency: form.budget_currency,
        budget_level: form.budget_level,
        status: form.status,
        visibility: form.visibility,
        notes: form.notes,
      });
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Could not save trip changes. Please verify all fields.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit trip details"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-300 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">
            Edit trip details
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">
            ✕
          </Button>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3.5" noValidate>
          <Field label="Title">
            <Input value={form.title} onChange={(e) => set("title")(e.target.value)} required />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <Input type="date" value={form.start_date} onChange={(e) => set("start_date")(e.target.value)} />
            </Field>
            <Field label="End date">
              <Input type="date" value={form.end_date} min={form.start_date} onChange={(e) => set("end_date")(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Travellers">
              <Input
                type="number"
                min="1"
                max="50"
                value={form.travelers}
                onChange={(e) => set("travelers")(e.target.value)}
              />
            </Field>
            <Field label="Budget amount">
              <Input
                type="number"
                min="0"
                placeholder="Not set"
                value={form.budget_amount}
                onChange={(e) => set("budget_amount")(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select label="Currency" value={form.budget_currency} options={CURRENCIES} onChange={changeCurrency} />
            <Select label="Level" value={form.budget_level} options={BUDGET_LEVELS} onChange={set("budget_level")} />
            <Select label="Status" value={form.status} options={STATUSES} onChange={set("status")} />
          </div>

          <Select label="Visibility" value={form.visibility} options={VISIBILITIES} onChange={set("visibility")} />

          <Field label="Notes">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes")(e.target.value)}
              placeholder="Packing reminders, bookings, anything important…"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </Field>

          {error && (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium capitalize text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm capitalize text-slate-800 focus:border-blue-500 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
