import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ink-700 bg-ink-800/80 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.55)]",
        className,
      )}
      {...props}
    />
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
      <span className="size-5 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" aria-hidden />
      {label ?? "Loading…"}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">{eyebrow}</p>
      )}
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-base leading-relaxed text-slate-400">{subtitle}</p>}
    </div>
  );
}
