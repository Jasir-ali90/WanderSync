import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-ink-950 hover:bg-brand-400 focus-visible:outline-brand-300 shadow-[0_8px_24px_-10px_rgb(13_148_136/0.7)]",
  secondary:
    "bg-ink-700 text-slate-100 hover:bg-ink-600 focus-visible:outline-brand-400 border border-ink-600",
  ghost: "bg-transparent text-slate-200 hover:bg-ink-800 focus-visible:outline-brand-400",
  danger: "bg-red-600/90 text-white hover:bg-red-500 focus-visible:outline-red-300",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  ),
);

Button.displayName = "Button";
