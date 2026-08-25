import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-10 w-full rounded-lg border bg-ink-900 px-3 text-sm text-slate-100 placeholder:text-slate-500",
        "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-50",
        invalid
          ? "border-red-500/70 focus-visible:outline-red-400"
          : "border-ink-600 focus-visible:outline-brand-400",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
