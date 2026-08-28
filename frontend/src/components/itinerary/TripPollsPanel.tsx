import { useState } from "react";
import { Vote, Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  votedBy: string[];
}

export interface Poll {
  id: string;
  question: string;
  category: "hotel" | "spot" | "restaurant" | "activity";
  options: PollOption[];
}

export function TripPollsPanel() {
  const [polls, setPolls] = useState<Poll[]>([
    {
      id: "1",
      question: "Which hotel should we book in Hunza?",
      category: "hotel",
      options: [
        { id: "opt1", text: "Luxus Hunza Resort", votes: 3, votedBy: ["Ali", "Sara", "You"] },
        { id: "opt2", text: "Serena Inn Karimabad", votes: 1, votedBy: ["Zayn"] },
      ],
    },
  ]);

  const [newQuestion, setNewQuestion] = useState("");
  const [newOpt1, setNewOpt1] = useState("");
  const [newOpt2, setNewOpt2] = useState("");

  const handleVote = (pollId: string, optionId: string) => {
    setPolls((prev) =>
      prev.map((poll) => {
        if (poll.id !== pollId) return poll;
        return {
          ...poll,
          options: poll.options.map((opt) => {
            if (opt.id === optionId) {
              return { ...opt, votes: opt.votes + 1, votedBy: [...opt.votedBy, "You"] };
            }
            return opt;
          }),
        };
      })
    );
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion || !newOpt1 || !newOpt2) return;
    const newPoll: Poll = {
      id: Date.now().toString(),
      question: newQuestion,
      category: "hotel",
      options: [
        { id: "o1", text: newOpt1, votes: 0, votedBy: [] },
        { id: "o2", text: newOpt2, votes: 0, votedBy: [] },
      ],
    };
    setPolls([...polls, newPoll]);
    setNewQuestion("");
    setNewOpt1("");
    setNewOpt2("");
  };

  return (
    <div className="space-y-6 rounded-3xl border border-brand-500/30 bg-ink-900/90 p-6 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-ink-700/60 pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-100">
            <Vote className="size-5 text-brand-400" /> Group Decision Polls
          </h3>
          <p className="text-xs text-slate-400">Vote on hotels, activities, and dining options with live percentage bars.</p>
        </div>
      </div>

      {/* Create Poll Form */}
      <form onSubmit={handleCreatePoll} className="space-y-3 rounded-2xl border border-ink-700/60 bg-ink-950/60 p-4">
        <h4 className="text-xs font-bold text-slate-300">Create New Group Poll</h4>
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Poll question (e.g. Where to have dinner?)"
          className="h-9 w-full rounded-xl border border-ink-700 bg-ink-950 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="text"
            value={newOpt1}
            onChange={(e) => setNewOpt1(e.target.value)}
            placeholder="Option 1"
            className="h-9 rounded-xl border border-ink-700 bg-ink-950 px-3 text-xs text-slate-100 focus:border-brand-500 focus:outline-none"
          />
          <input
            type="text"
            value={newOpt2}
            onChange={(e) => setNewOpt2(e.target.value)}
            placeholder="Option 2"
            className="h-9 rounded-xl border border-ink-700 bg-ink-950 px-3 text-xs text-slate-100 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <Button size="sm" type="submit" className="rounded-xl">
          <Plus className="size-4 mr-1" /> Launch Poll
        </Button>
      </form>

      {/* Poll Cards */}
      <div className="space-y-4">
        {polls.map((poll) => {
          const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);

          return (
            <div key={poll.id} className="rounded-2xl border border-brand-500/20 bg-ink-950/80 p-4 space-y-3">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span className="rounded-md bg-brand-500/20 px-2 py-0.5 text-[10px] uppercase font-bold text-brand-300">
                  {poll.category}
                </span>
                {poll.question}
              </h4>

              <div className="space-y-2">
                {poll.options.map((opt) => {
                  const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                  const hasVoted = opt.votedBy.includes("You");

                  return (
                    <div key={opt.id} className="relative rounded-xl border border-ink-700/60 bg-ink-900/90 p-3 overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-brand-500/20 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />

                      <div className="relative flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">{opt.text}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-brand-300">{pct}% ({opt.votes} votes)</span>
                          <button
                            disabled={hasVoted}
                            onClick={() => handleVote(poll.id, opt.id)}
                            className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                              hasVoted
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-brand-500 text-ink-950 hover:scale-105"
                            }`}
                          >
                            {hasVoted ? <span className="flex items-center gap-1"><CheckCircle className="size-3" /> Voted</span> : "Vote"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
