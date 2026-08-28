import { useState } from "react";
import { Users, UserPlus, Shield, Activity, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: "owner" | "editor" | "viewer";
  avatar: string;
  status: "active" | "invited";
}

interface TripCollaborationPanelProps {
  tripId: string;
  initialCollaborators?: Collaborator[];
}

export function TripCollaborationPanel({ tripId, initialCollaborators = [] }: TripCollaborationPanelProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>(
    initialCollaborators.length > 0
      ? initialCollaborators
      : [
          { id: "1", name: "You (Owner)", email: "owner@wandersync.com", role: "owner", avatar: "👤", status: "active" },
          { id: "2", name: "Ali Raza", email: "ali@gmail.com", role: "editor", avatar: "👨‍💻", status: "active" },
          { id: "3", name: "Sara Khan", email: "sara@gmail.com", role: "viewer", avatar: "👩‍🎨", status: "invited" },
        ]
  );
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setLoading(true);
    try {
      const res = await api.post<{ collaborators: Collaborator[] }>(`/trips/${tripId}/collaborators/`, {
        email: inviteEmail,
        role: inviteRole,
      });
      if (res.collaborators) {
        setCollaborators(res.collaborators);
      }
      setInviteEmail("");
    } catch {
      // Fallback local update if offline or preview
      const newCollab: Collaborator = {
        id: Date.now().toString(),
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole,
        avatar: "✉️",
        status: "invited",
      };
      setCollaborators((prev) => [...prev, newCollab]);
      setInviteEmail("");
    } finally {
      setLoading(false);
    }
  };

  const removeMember = (id: string) => {
    setCollaborators(collaborators.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6 rounded-3xl border border-brand-500/30 bg-ink-900/90 p-6 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-ink-700/60 pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-100">
            <Users className="size-5 text-brand-400" /> Real-Time Trip Workspace
          </h3>
          <p className="text-xs text-slate-400">Invite travel partners, manage editor/viewer access, and see live presence.</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" /> 2 Active Now
        </div>
      </div>

      {/* Invite Form */}
      <form onSubmit={handleInvite} className="flex flex-wrap items-center gap-2">
        <input
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="Partner's email address..."
          className="h-10 flex-1 min-w-[200px] rounded-xl border border-ink-700 bg-ink-950 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
        />
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")}
          className="h-10 rounded-xl border border-ink-700 bg-ink-950 px-3 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
        >
          <option value="editor">Editor (Can edit)</option>
          <option value="viewer">Viewer (Read only)</option>
        </select>
        <Button size="sm" type="submit" loading={loading} className="rounded-xl">
          <UserPlus className="size-4 mr-1" /> Invite
        </Button>
      </form>

      {/* Members List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Trip Members ({collaborators.length})</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {collaborators.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-2xl border border-ink-700/60 bg-ink-950/80 p-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-brand-500/20 text-lg">{member.avatar}</span>
                <div>
                  <p className="text-xs font-bold text-slate-200">{member.name}</p>
                  <p className="text-[10px] text-slate-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-ink-800 px-2 py-0.5 text-[10px] font-semibold text-brand-300">
                  <Shield className="size-3 text-brand-400" /> {member.role}
                </span>
                {member.role !== "owner" && (
                  <button onClick={() => removeMember(member.id)} className="text-[10px] text-red-400 hover:underline">
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Activity Timeline */}
      <div className="rounded-2xl border border-brand-500/20 bg-ink-950/60 p-4">
        <h4 className="flex items-center gap-1.5 text-xs font-bold text-brand-300 mb-3">
          <Activity className="size-4 text-brand-400" /> Live Activity Log
        </h4>
        <ul className="space-y-2 text-xs text-slate-400">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
            <span><strong className="text-slate-200">Ali Raza</strong> updated the trip budget to $2,500</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-brand-400 shrink-0" />
            <span><strong className="text-slate-200">You</strong> added <span className="text-brand-300">Attabad Lake</span> to Day 3</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
