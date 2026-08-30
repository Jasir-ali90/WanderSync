import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

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
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await login(values.email.toLowerCase().trim(), values.password);
      const target = (location.state as { from?: string } | null)?.from ?? "/dashboard";
      navigate(target, { replace: true });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Sign in failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Brand panel — premium split screen (desktop) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#0a101d] p-12 lg:flex">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-1/4 h-72 w-72 rounded-full bg-blue-600/20 blur-[100px]" />
          <div className="absolute bottom-10 right-0 h-56 w-56 rounded-full bg-indigo-500/20 blur-[90px]" />
        </div>
        <Wordmark className="[&_span:first-child]:bg-gradient-to-tr [&_span:first-child]:from-blue-500 [&_span:first-child]:to-indigo-600 relative [&_span:last-child]:text-white" />
        <div className="relative">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-snug text-white">
            From dream to itinerary,
            <br />
            <span className="text-blue-400">in one conversation.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Welcome back to WanderSync. Your saved itineraries, live weather
            intelligence and AI-built day plans are waiting.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {["AI Itineraries", "Live Weather", "Group Tools"].map((chip) => (
              <span key={chip} className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
                {chip}
              </span>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-slate-600">
          © {new Date().getFullYear()} WanderSync — AI Travel Companion
        </p>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 lg:hidden">
          <Wordmark className="scale-125" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card"
        >
          <div className="text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Welcome to WanderSync
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Sign in to access your saved itineraries and AI planner
          </p>
        </div>

        {formError && (
          <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            {formError}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-slate-500 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-600">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-blue-600 hover:underline">
            Create an account
          </Link>
        </p>
        </motion.div>
        </div>
    </div>
  );
}
