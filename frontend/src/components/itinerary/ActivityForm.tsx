import { useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/** Inline form for adding an activity to the active day. */
export function ActivityForm({
  onCancel,
  onSubmit,
  saving,
}: {
  onCancel: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [cost, setCost] = useState("0");

  return (
    <form
      className="grid gap-3 border-t border-ink-700 p-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) return;
        onSubmit({
          name: name.trim(),
          start_time: start,
          duration_minutes: Number(duration),
          cost_estimate: Number(cost),
          category: "attraction",
        });
      }}
    >
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-xs font-medium text-slate-300">Activity name</span>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Guided city walk"
          required
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-300">Start</span>
        <Input type="time" value={start} onChange={(event) => setStart(event.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-300">Duration (min)</span>
        <Input
          type="number"
          min={15}
          max={600}
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-300">Est. cost per person</span>
        <Input type="number" min={0} value={cost} onChange={(event) => setCost(event.target.value)} />
      </label>
      <div className="flex items-end justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          <Plus aria-hidden className="size-4" /> Add to day
        </Button>
      </div>
    </form>
  );
}
