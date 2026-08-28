import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  MapPinned,
  MessagesSquare,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  UserRoundX,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface AdminStats {
  total_users: number;
  active_users: number;
  staff_users: number;
  total_trips: number;
  total_conversations: number;
  ai_generations: number;
  top_destinations: Array<{ destination: string; trips: number }>;
  ai_enabled: boolean;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_staff: boolean;
  trip_count: number;
}

interface AdminTripRow {
  id: string;
  title: string;
  destination: string;
  owner_email: string;
  status: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [userQuery, setUserQuery] = useState("");
  const [tripQuery, setTripQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get<AdminStats>("/admin/stats/"),
  });

  const users = useQuery({
    queryKey: ["admin", "users", userQuery],
    queryFn: () =>
      api.get<{ count: number; results: AdminUser[] }>(
        `/admin/users/${userQuery ? `?q=${encodeURIComponent(userQuery)}` : ""}`,
      ),
  });

  const trips = useQuery({
    queryKey: ["admin", "trips", tripQuery],
    queryFn: () =>
      api.get<{ count: number; results: AdminTripRow[] }>(
        `/admin/trips/${tripQuery ? `?q=${encodeURIComponent(tripQuery)}` : ""}`,
      ),
  });

  if (user && !user.is_staff) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <ShieldCheck aria-hidden className="mx-auto size-10 text-red-400" />
        <h1 className="mt-3 font-semibold text-slate-800">Admin access required</h1>
        <p className="mt-1 text-sm text-slate-500">Your account doesn't have admin rights.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm text-brand-400">← Back to dashboard</Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
            Admin Console
          </h1>
          <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck aria-hidden className="size-3.5 text-brand-400" />
            Staff only · manage users, trips and monitor the platform
          </p>
        </div>
        <span
          className={
            stats.data?.ai_enabled
              ? "rounded-full bg-blue-700/15 px-3 py-1 text-xs font-medium text-blue-700"
              : "rounded-full bg-slate-500/15 px-3 py-1 text-xs font-medium text-slate-500"
          }
        >
          AI key: {stats.data?.ai_enabled ? "loaded ✅" : "not set (demo mode)"}
        </span>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { icon: Users, label: "Users", value: stats.data?.total_users },
          { icon: UserRoundCheck, label: "Active", value: stats.data?.active_users },
          { icon: MapPinned, label: "Trips", value: stats.data?.total_trips },
          { icon: MessagesSquare, label: "Conversations", value: stats.data?.total_conversations },
          { icon: Bot, label: "AI generations", value: stats.data?.ai_generations },
        ].map((card) => (
          <Card key={card.label} className="p-4 transition-transform hover:-translate-y-0.5">
            <card.icon aria-hidden className="size-5 text-brand-400" />
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
              {card.value ?? "—"}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">{card.label}</p>
          </Card>
        ))}
      </div>


      {/* Users management */}
      <section aria-labelledby="admin-users">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="admin-users" className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Users
          </h2>
          <Input
            placeholder="Search by email…"
            value={userQuery}
            onChange={(event) => setUserQuery(event.target.value)}
            className="h-8 w-56 text-xs"
          />
        </div>
        <Card className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Trips</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {(users.data?.results ?? []).map((row) => (
                <tr key={row.id} className="hover:bg-slate-100/50">
                  <td className="px-4 py-2.5 text-slate-700">{row.email}</td>
                  <td className="px-4 py-2.5 text-slate-500">{row.full_name || "—"}</td>
                  <td className="px-4 py-2.5 text-slate-500">{row.trip_count}</td>
                  <td className="px-4 py-2.5">
                    {row.is_staff ? (
                      <span className="rounded-full bg-blue-700/15 px-2 py-0.5 text-xs text-blue-700">staff</span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-500">user</span>
                    )}
                    {!row.is_active && (
                      <span className="ml-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-600">disabled</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        title={row.is_active ? "Deactivate" : "Activate"}
                        onClick={async () => {
                          setActionError(null);
                          try {
                            await api.patch(`/admin/users/${row.id}/`, { is_active: !row.is_active });
                            void queryClient.invalidateQueries({ queryKey: ["admin"] });
                          } catch {
                            setActionError("Update failed.");
                          }
                        }}
                      >
                        {row.is_active
                          ? <UserRoundX aria-hidden className="size-4" />
                          : <UserRoundCheck aria-hidden className="size-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Delete user"
                        className="text-slate-500 hover:text-red-600"
                        onClick={async () => {
                          if (!window.confirm(`Delete ${row.email} and ALL their data?`)) return;
                          setActionError(null);
                          try {
                            await api.delete(`/admin/users/${row.id}/`);
                            void queryClient.invalidateQueries({ queryKey: ["admin"] });
                          } catch {
                            setActionError("Delete failed.");
                          }
                        }}
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {stats.data && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Top destinations
          </h2>
          {stats.data.top_destinations.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No trips yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {stats.data.top_destinations.map((entry) => {
                const max = stats.data!.top_destinations[0].trips || 1;
                return (
                  <li key={entry.destination}>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>{entry.destination}</span>
                      <span>{entry.trips}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                        style={{ width: `${(entry.trips / max) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {/* Trips management */}
      <section aria-labelledby="admin-trips">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="admin-trips" className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            All trips
          </h2>
          <Input
            placeholder="Search destination…"
            value={tripQuery}
            onChange={(event) => setTripQuery(event.target.value)}
            className="h-8 w-56 text-xs"
          />
        </div>
        <Card className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium">Destination</th>
                <th className="px-4 py-2.5 font-medium">Owner</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {(trips.data?.results ?? []).map((row) => (
                <tr key={row.id} className="hover:bg-slate-100/50">
                  <td className="px-4 py-2.5 text-slate-700">
                    <Link to={`/trips/${row.id}`} className="hover:text-blue-700">{row.title}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{row.destination}</td>
                  <td className="px-4 py-2.5 text-slate-500">{row.owner_email}</td>
                  <td className="px-4 py-2.5 text-slate-500">{row.status}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Delete trip"
                      className="text-slate-500 hover:text-red-600"
                      onClick={async () => {
                        if (!window.confirm(`Delete trip "${row.title}"?`)) return;
                        setActionError(null);
                        try {
                          await api.delete(`/admin/trips/${row.id}/`);
                          void queryClient.invalidateQueries({ queryKey: ["admin"] });
                        } catch {
                          setActionError("Delete failed.");
                        }
                      }}
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {actionError && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600">
          {actionError}
        </p>
      )}
    </div>
  );
}

