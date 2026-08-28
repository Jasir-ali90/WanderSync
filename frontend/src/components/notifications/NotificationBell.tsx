import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { NotificationListData } from "@/types/api";

const KIND_ICONS: Record<string, string> = {
  trip_saved: "🧳",
  itinerary_generated: "✨",
  share_created: "🔗",
  export_completed: "📄",
  system: "🔔",
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Header notification bell with unread badge and dropdown panel. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<NotificationListData>("/notifications/"),
    refetchInterval: 30_000,
  });

  const markRead = useMutation({
    mutationFn: () => api.post("/notifications/read-all/"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = notifications.data?.unread ?? 0;
  const items = notifications.data?.results ?? [];

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        onClick={() => setOpen((v) => !v)}
        className="relative grid size-9 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-ink-800 hover:text-slate-100"
      >
        <Bell aria-hidden className="size-4.5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-4.5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-ink-950">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Click-away layer */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-[0_16px_48px_-12px_rgb(0_0_0/0.7)]"
            >
              <div className="flex items-center justify-between border-b border-ink-700 px-3 py-2.5">
                <p className="text-sm font-medium text-slate-100">Notifications</p>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={() => markRead.mutate()}
                    disabled={markRead.isPending}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-brand-400 transition-colors hover:bg-ink-800 hover:text-brand-300"
                  >
                    <CheckCheck aria-hidden className="size-3" /> Mark all read
                  </button>
                )}
              </div>

              <ul className="max-h-80 divide-y divide-ink-800 overflow-y-auto">
                {items.length === 0 && (
                  <li className="px-3 py-8 text-center text-xs text-slate-500">
                    Nothing yet — plan a trip to see updates here.
                  </li>
                )}
                {items.map((item) => {
                  const content = (
                    <>
                      <span aria-hidden className="mt-0.5 text-base">
                        {KIND_ICONS[item.kind] ?? "🔔"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-xs", item.read ? "text-slate-400" : "font-medium text-slate-100")}>
                          {item.title}
                        </p>
                        {item.body && <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{item.body}</p>}
                        <p className="mt-0.5 text-[10px] text-slate-600">{timeAgo(item.created_at)}</p>
                      </div>
                      {!item.read && <span aria-hidden className="mt-1 size-1.5 shrink-0 rounded-full bg-brand-400" />}
                    </>
                  );
                  return (
                    <li key={item.id}>
                      {item.link ? (
                        <Link
                          to={item.link}
                          onClick={() => setOpen(false)}
                          className="flex gap-2.5 px-3 py-2.5 transition-colors hover:bg-ink-800"
                        >
                          {content}
                        </Link>
                      ) : (
                        <div className="flex gap-2.5 px-3 py-2.5">{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
