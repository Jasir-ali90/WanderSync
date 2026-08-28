import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Sparkles } from "lucide-react";

import { Wordmark } from "@/components/layout/Layouts";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const schema = z
  .object({
    fullName: z.string().min(1, "Tell us your name").max(120),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Za-z]/, "Include a letter")
      .regex(/\d/, "Include a number"),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    path: ["confirm"],
    message: "Passwords don't match",
  });
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
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
      await registerAccount(values.email, values.fullName, values.password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldMessage = Object.values(error.fieldErrors)[0];
        setFormError(fieldMessage ?? error.message);
      } else {
        setFormError("Registration failed. Try again.");
      }
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
            Create VVIP Account
          </h1>
          <p className="mt-1.5 text-xs text-brand-300 font-medium uppercase tracking-wider flex items-center justify-center gap-1">
            <Sparkles className="size-3.5" /> Start Your Generative Journey
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3.5" noValidate>
          <div>
            <label htmlFor="fullName" className="mb-1 block text-xs font-semibold text-slate-300">
              Full Name
            </label>
            <Input id="fullName" autoComplete="name" placeholder="Amelia Explorer" invalid={Boolean(errors.fullName)} {...register("fullName")} className="h-10 rounded-xl border-ink-600 bg-ink-950/70" />
            {errors.fullName && <p className="mt-1 text-xs text-red-400">{errors.fullName.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-semibold text-slate-300">
              Email Address
            </label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" invalid={Boolean(errors.email)} {...register("email")} className="h-10 rounded-xl border-ink-600 bg-ink-950/70" />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-semibold text-slate-300">
              Password
            </label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" invalid={Boolean(errors.password)} {...register("password")} className="h-10 pr-10 rounded-xl border-ink-600 bg-ink-950/70" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1 block text-xs font-semibold text-slate-300">
              Confirm Password
            </label>
            <div className="relative">
              <Input id="confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" invalid={Boolean(errors.confirm)} {...register("confirm")} className="h-10 pr-10 rounded-xl border-ink-600 bg-ink-950/70" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirm && <p className="mt-1 text-xs text-red-400">{errors.confirm.message}</p>}
          </div>

          {formError && (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-300">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-full h-11 rounded-xl font-bold text-sm shadow-xl shadow-brand-500/30 mt-2" loading={isSubmitting}>
            {isSubmitting ? "Creating Account…" : "Create VVIP Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-brand-300 hover:text-brand-200 underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
