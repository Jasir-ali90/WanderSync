/** User avatar: uploaded photo, or a `preset:<bg>:<emoji>` travel-vibe badge. */
import { cn } from "@/lib/utils";

export function Avatar({
  url,
  fallbackName,
  className,
}: {
  url?: string;
  fallbackName?: string;
  className?: string;
}) {
  const size = className ?? "size-8 text-xs";
  const ring = "border border-sand-500/40 shadow-sm";

  if (url?.startsWith("preset:")) {
    const [, bg = "", emoji = "🧭"] = url.split(":");
    return (
      <span
        aria-hidden
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-gradient-to-br",
          bg,
          ring,
          size,
        )}
      >
        {emoji}
      </span>
    );
  }
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", ring, size)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-sand-500/40 bg-sand-500/15 font-bold text-sand-300",
        size,
      )}
    >
      {(fallbackName || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}
