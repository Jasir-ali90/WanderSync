import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useState } from "react";

import { Wordmark } from "@/components/layout/Layouts";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await login(values.email, values.password);
      const target = (location.state as { from?: string } | null)?.from ?? "/dashboard";
      navigate(target, { replace: true });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Sign in failed. Try again.");
    }
  };

  return (
    <div className="bg-radial-teal flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Wordmark className="mb-8 scale-110" />
      <div className="w-full max-w-sm rounded-xl border border-ink-700 bg-ink-800/80 p-6 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.55)]">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-50">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-slate-400">Sign in to continue planning.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-300">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-300">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              invalid={Boolean(errors.password)}
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          {formError && (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-full" loading={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-400">
          New to WanderSync?{" "}
          <Link to="/register" className="font-medium text-brand-400 hover:text-brand-300">
            Create an account
          </Link>
        </p>

        {/* Demo credentials (seeded via `manage.py seed_demo`) */}
        <details className="group mt-4 rounded-lg border border-ink-600 bg-ink-900/60">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-medium text-slate-300 transition-colors hover:text-brand-300 [&::-webkit-details-marker]:hidden">
            🎭 Demo credentials <span className="float-right text-slate-500 group-open:hidden">show</span>
            <span className="float-right hidden text-slate-500 group-open:inline">hide</span>
          </summary>
          <div className="space-y-2 border-t border-ink-700 px-3 py-3">
            {[
              { label: "👤 User demo", email: "demo@wandersync.test", password: "Demo@12345" },
              { label: "🛡️ Admin demo", email: "admin@wandersync.test", password: "Admin@12345" },
            ].map((account) => (
              <div key={account.email} className="flex items-center justify-between gap-2 rounded-lg bg-ink-800 px-3 py-2">
                <div className="min-w-0 text-xs">
                  <p className="font-medium text-slate-200">{account.label}</p>
                  <p className="truncate text-slate-500">{account.email} · {account.password}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setValue("email", account.email);
                    setValue("password", account.password);
                    setFormError(null);
                  }}
                >
                  Fill
                </Button>
              </div>
            ))}
            <p className="text-[10px] leading-relaxed text-slate-600">
              Admin accounts unlock the Admin Console (/admin) for managing users,
              trips and platform stats.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
