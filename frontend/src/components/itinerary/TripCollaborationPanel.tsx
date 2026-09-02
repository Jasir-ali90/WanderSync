import { useState } from "react";
import { Users, UserPlus, Shield, Activity, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { TripCollaborator, ActivityLog } from "@/types/api";

interface TripCollaborationPanelProps {
  tripId: string;
  collaborators: TripCollaborator[];
  activityLogs: ActivityLog[];
}

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-blue-100 text-blue-700 border-blue-300",
  editor: "bg-emerald-100 text-emerald-700 border-emerald-300",
  viewer: "bg-slate-100 text-slate-600 border-slate-300",
};

function getInitials(name: string, email: string): string {
  const n = (name || email.split("@")[0]).trim();
  const parts = n.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}

function formatTimestamp(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export function TripCollaborationPanel({ tripId, collaborators: initialCollaborators, activityLogs }: TripCollaborationPanelProps) {
  const [collaborators, setCollaborators] = useState<TripCollaborator[]>(initialCollaborators);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await api.post<{ collaborators: TripCollaborator[] }>(`/trips/${tripId}/collaborators/`, {
        email,
        role: inviteRole,
      });
      if (res.collaborators) {
        setCollaborators(res.collaborators);
      }
      setSuccess(`Invited ${email} as ${inviteRole}.`);
      setInviteEmail("");
      void queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
    } catch (err: any) {
      const msg = err?.data?.detail || err?.data?.error || "Could not invite this person. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 rounded-3xl border border-blue-200 bg-white p-6 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <Users className="size-5 text-blue-600" /> Trip Workspace
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Invite travel partners and manage access to this trip.
          </p>
        </div>
        {collaborators.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
            <span className="size-2 rounded-full bg-blue-400 animate-pulse" />
            {collaborators.length} member{collaborators.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Invite Form */}
      <form onSubmit={handleInvite} className="flex flex-wrap items-center gap-2">
        <input
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="Partner's email addressâ€¦"
          required
          className="h-10 flex-1 min-w-[200px] rounded-xl border border-slate-300 bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
        />
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")}
          className="h-10 rounded-xl border border-slate-300 bg-slate-50 px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="editor">Editor â€” can edit trip</option>
          <option value="viewer">Viewer â€” read only</option>
        </select>
        <Button size="sm" type="submit" loading={loading} className="rounded-xl">
          <UserPlus className="size-4 mr-1" /> Invite
        </Button>
      </form>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          âœ“ {success}
        </p>
      )}

      {/* Members List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Trip Members ({collaborators.length})
        </h4>

        {collaborators.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <Users className="mx-auto size-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-500">No partners yet</p>
            <p className="text-xs text-slate-400 mt-1">Enter a partner's email above to invite them to this trip.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {collaborators.map((member) => (
              <div
                key={member.user_public_id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3"
              >
                {/* Avatar initials */}
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700 select-none">
                  {getInitials(member.name, member.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800">
                    {member.name || member.email.split("@")[0]}
                  </p>
                  <p className="truncate text-[10px] text-slate-500">{member.email}</p>
                  {member.joined_at && (
                    <p className="text-[10px] text-slate-400">Joined {formatTimestamp(member.joined_at)}</p>
                  )}
                </div>
                <span className={`shrink-0 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${ROLE_COLORS[member.role] ?? ROLE_COLORS.viewer}`}>
                  <Shield className="size-3" /> {member.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real Activity Log from Backend */}
      {activityLogs.length > 0 && (
        <div className="rounded-2xl border border-blue-100 bg-slate-50 p-4">
          <h4 className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-3">
            <Activity className="size-4" /> Activity Log
          </h4>
          <ul className="space-y-2">
            {activityLogs.slice(0, 10).map((log) => (
              <li key={log.id} className="flex items-start gap-2 text-xs text-slate-500">
                <Clock className="size-3.5 mt-0.5 shrink-0 text-blue-400" />
                <span className="flex-1">{log.action}</span>
                {log.created_at && (
                  <span className="shrink-0 text-[10px] text-slate-400">{formatTimestamp(log.created_at)}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
}
