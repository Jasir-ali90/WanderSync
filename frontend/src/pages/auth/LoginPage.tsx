import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Sparkles, Shield, User } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <Wordmark className="mb-8 scale-125 drop-shadow-[0_0_20px_rgba(134,59,255,0.4)]" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-3xl border border-white/20 bg-ink-900/80 p-8 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative z-10"
      >
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-slate-50">
            Welcome to WanderSync
          </h1>
          <p className="mt-1.5 text-xs text-brand-300 font-medium uppercase tracking-wider">
            VVIP AI Travel Platform
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-300">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              invalid={Boolean(errors.email)}
              {...register("email")}
              className="h-11 rounded-xl border-ink-600 bg-ink-950/70"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-300">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                invalid={Boolean(errors.password)}
                {...register("password")}
                className="h-11 pr-10 rounded-xl border-ink-600 bg-ink-950/70"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          {formError && (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-full h-11 rounded-xl font-bold text-sm shadow-xl shadow-brand-500/30" loading={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign In to Platform"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          New to WanderSync?{" "}
          <Link to="/register" className="font-bold text-brand-300 hover:text-brand-200 underline underline-offset-4">
            Create account
          </Link>
        </p>

        {/* Quick Demo Credentials */}
        <div className="mt-6 rounded-2xl border border-brand-500/20 bg-ink-950/60 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-300 flex items-center gap-1.5 mb-2.5">
            <Sparkles className="size-3.5" /> 1-Click Demo Login
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setValue("email", "demo@wandersync.test");
                setValue("password", "Demo@12345");
                setFormError(null);
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-ink-600 bg-ink-900/80 py-2 px-3 text-xs font-semibold text-slate-200 transition-colors hover:border-brand-500/50 hover:bg-brand-500/10"
            >
              <User className="size-3.5 text-cyan-300" />
              <span>User Demo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setValue("email", "admin@wandersync.test");
                setValue("password", "Admin@12345");
                setFormError(null);
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-ink-600 bg-ink-900/80 py-2 px-3 text-xs font-semibold text-slate-200 transition-colors hover:border-amber-500/50 hover:bg-amber-500/10"
            >
              <Shield className="size-3.5 text-amber-300" />
              <span>Admin Demo</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
