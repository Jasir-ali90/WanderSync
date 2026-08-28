import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Search, Edit2, Check, X, MessageSquarePlus } from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SavedConversation {
  id: string;
  title: string;
  message_count?: number;
  updated_at?: string;
  is_pinned?: boolean;
}

export function SavedChats({
  activeId,
  onOpen,
  onNewChat,
}: {
  activeId: string | null;
  onOpen: (id: string) => void;
  onNewChat?: () => void;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const chats = useQuery({
    queryKey: ["planner-conversations"],
    queryFn: () =>
      api.get<{ results: SavedConversation[] }>("/planner/conversations/?page_size=50"),
    staleTime: 10_000,
  });

  async function remove(id: string) {
    if (!window.confirm("Delete this saved chat permanently?")) return;
    await api.delete(`/planner/conversations/${id}/`);
    void queryClient.invalidateQueries({ queryKey: ["planner-conversations"] });
  }

  async function saveRename(id: string) {
    if (!editTitle.trim()) return setEditingId(null);
    try {
      await api.patch(`/planner/conversations/${id}/`, { title: editTitle.trim() });
      void queryClient.invalidateQueries({ queryKey: ["planner-conversations"] });
    } catch {
      // Ignore
    } finally {
      setEditingId(null);
    }
  }

  const results = (chats.data?.results ?? []).filter((chat) =>
    (chat.title || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <aside
      aria-label="Saved conversations"
      className="hidden h-[calc(100vh-9rem)] w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-300/80 bg-white/80 backdrop-blur-md md:flex md:h-[calc(100vh-7rem)] shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-slate-300/70 p-3">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
          💬 Saved Chats
        </span>
        {onNewChat && (
          <button
            type="button"
            onClick={onNewChat}
            className="rounded-lg bg-blue-700/15 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-700/25 transition-colors flex items-center gap-1"
          >
            <MessageSquarePlus className="size-3" /> New
          </button>
        )}
      </div>

      {/* Search box */}
      <div className="p-2 border-b border-slate-300/50">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 size-3.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-500 focus:border-brand-400 focus:outline-none"
          />
        </div>
      </div>

      {chats.isLoading && <p className="px-3 py-3 text-xs text-slate-500">Loading history…</p>}
      {!chats.isLoading && results.length === 0 && (
        <p className="px-3 py-4 text-center text-xs text-slate-500">
          {search ? "No matching chats found." : "No saved topics yet."}
        </p>
      )}

      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {results.map((chat) => (
          <li key={chat.id} className="group relative">
            {editingId === chat.id ? (
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 rounded bg-slate-50 px-2 py-1 text-xs text-slate-800 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => saveRename(chat.id)}
                  className="p-1 text-blue-600 hover:text-blue-700"
                >
                  <Check className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="p-1 text-slate-500 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => onOpen(chat.id)}
                className={cn(
                  "cursor-pointer rounded-xl px-3 py-2 text-left transition-all duration-200 border",
                  chat.id === activeId
                    ? "bg-gradient-to-r from-blue-600/20 to-brand-600/10 border-brand-500/40 text-blue-700 shadow-md"
                    : "border-transparent text-slate-600 hover:bg-slate-100/60 hover:text-slate-800",
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="line-clamp-1 block text-xs font-semibold">
                    {chat.title || "Trip planning"}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      type="button"
                      title="Rename"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(chat.id);
                        setEditTitle(chat.title || "");
                      }}
                      className="text-slate-500 hover:text-blue-700"
                    >
                      <Edit2 className="size-3" />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        void remove(chat.id);
                      }}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{chat.message_count ?? 0} messages</span>
                  {chat.updated_at && (
                    <span>{new Date(chat.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
