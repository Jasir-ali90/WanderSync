/** Branded boot loader shown while the app starts up: session restore,
 * route-level code splitting, and every suspended page load.
 */
import { cn } from "@/lib/utils";

const SHIMMER_STYLES = `
@keyframes ws-shimmer { 0% { transform: translateX(-120%); } 100% { transform: translateX(420%); } }
.ws-shimmer-bar { animation: ws-shimmer 1.4s ease-in-out infinite; }
`;

export function Splash({ label, compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-5 px-6 bg-[#0a101d]",
        compact ? "min-h-[60vh]" : "fixed inset-0 z-50 min-h-screen",
      )}
    >
      <style>{SHIMMER_STYLES}</style>

      {/* Glowing logo */}
      <div className="animate-bounce [animation-duration:2.2s]">
        <img
          src="/favicon.svg"
          alt=""
          width={72}
          height={69}
          className="drop-shadow-[0_12px_32px_rgba(59,130,246,0.45)]"
        />
      </div>

      <div className="text-center">
        <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-white">
          Wander<span className="text-blue-400">Sync</span>
        </p>
        {!compact && (
          <p className="mt-1.5 text-sm tracking-wide text-slate-400">
            AI-planned journeys · Smart routes · Real weather
          </p>
        )}
      </div>

      {/* Shimmering progress bar */}
      <div className="h-1.5 w-44 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div className="ws-shimmer-bar h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
      </div>

      <p className="text-xs text-slate-400">{label ?? "Getting your trips ready…"}</p>
    </div>
  );
}
