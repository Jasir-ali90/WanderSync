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
      </div>
    </div>
  );
}
