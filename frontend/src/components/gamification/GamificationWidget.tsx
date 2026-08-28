import { Trophy, Flame } from "lucide-react";

export function GamificationWidget() {
  const userXP = 2450;
  const userLevel = 5;
  const nextLevelXP = 3000;
  const progressPct = Math.round((userXP / nextLevelXP) * 100);

  const badges = [
    { name: "First Adventure", icon: "🏆", desc: "Created 1st trip plan" },
    { name: "Frequent Flyer", icon: "✈️", desc: "Explored 3+ destinations" },
    { name: "Mountain Explorer", icon: "🏔️", desc: "Visited high altitude spots" },
    { name: "Travel Planner Pro", icon: "🧳", desc: "Completed AI itinerary" },
  ];

  return (
    <div className="rounded-3xl border border-brand-500/30 bg-ink-900/90 p-6 backdrop-blur-2xl shadow-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-600 font-extrabold text-white text-xl shadow-lg shadow-brand-500/30">
            Lvl {userLevel}
          </div>
          <div>
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5">
              <Trophy className="size-4 text-amber-400" /> Travel Explorer XP & Level
            </h3>
            <p className="text-xs text-slate-400">{userXP} / {nextLevelXP} XP ({progressPct}% to Level {userLevel + 1})</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          <Flame className="size-4 animate-bounce" /> 5 Day Streak!
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2.5 w-full rounded-full bg-ink-950 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-cyan-400 transition-all duration-500" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Badges Grid */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Unlocked Badges & Achievements</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((b) => (
            <div key={b.name} className="flex flex-col items-center justify-center rounded-2xl border border-brand-500/20 bg-ink-950/80 p-3 text-center transition-all hover:scale-105">
              <span className="text-2xl mb-1">{b.icon}</span>
              <p className="text-xs font-bold text-slate-200">{b.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
