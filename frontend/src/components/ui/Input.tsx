import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, invalid, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    return (
      <div className="w-full space-y-1 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={invalid || Boolean(error) || undefined}
          className={cn(
            "h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500",
            "focus:outline-none focus:border-blue-600",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error || invalid
              ? "border-red-500 text-red-900 focus:border-red-500"
              : "border-slate-300",
            className,
          )}
          {...props}
        />
        {error && <p className="text-[11px] font-medium text-red-600">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
