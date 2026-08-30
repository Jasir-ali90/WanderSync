import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

import { Wordmark } from "@/components/layout/Layouts";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const schema = z
  .object({
    fullName: z
      .string()
      .min(1, "Tell us your name")
      .max(120)
      .regex(/^[A-Za-z\s.'-]+$/, "Name can only contain letters, spaces, hyphens and apostrophes"),
    email: z
      .string()
      .email("Enter a valid email address")
      .refine((value) => value === value.toLowerCase(), {
        message: "Email must be in lowercase letters only",
      }),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/\d/, "Include a number")
      .regex(/[^A-Za-z0-9]/, "Include a special character"),
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
      await registerAccount({
        email: values.email,
        full_name: values.fullName,
        password: values.password,
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldMessage = Object.values(error.fieldErrors)[0];
        setFormError(fieldMessage ?? error.message);
      } else {
        setFormError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#0a101d] p-12 lg:flex">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-1/4 h-72 w-72 rounded-full bg-blue-600/20 blur-[100px]" />
          <div className="absolute bottom-10 right-0 h-56 w-56 rounded-full bg-indigo-500/20 blur-[90px]" />
        </div>
        <Wordmark className="[&_span:first-child]:bg-gradient-to-tr [&_span:first-child]:from-blue-500 [&_span:first-child]:to-indigo-600 relative [&_span:last-child]:text-white" />
        <div className="relative">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-snug text-white">
            Plan smarter,
            <br />
            <span className="text-blue-400">travel further.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            One free account unlocks AI day-by-day planning, live weather
            intelligence, collaborative itineraries and smart budget tools.
          </p>
          <div className="mt-8 flex items-center gap-6">
            {[
              ["Instant", "AI itineraries"],
              ["Free", "to get started"],
              ["PKR-first", "budgeting"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="text-base font-extrabold text-white">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-slate-600">
          © {new Date().getFullYear()} WanderSync — AI Travel Companion
        </p>
      </div>

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
            Create your account
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Start planning smart AI itineraries with WanderSync
          </p>
        </div>

        {formError && (
          <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            {formError}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Full name"
            type="text"
            autoComplete="name"
            placeholder="Jasir Ali"
            error={errors.fullName?.message}
            {...register("fullName")}
          />

          <Input
            label="Email address (lowercase only)"
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
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
          <p className="-mt-2 text-xs text-slate-500">
            Use uppercase + lowercase letters, a number and a special character.
          </p>

          <Input
            label="Confirm password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter password"
            error={errors.confirm?.message}
            {...register("confirm")}
          />

          <Button type="submit" loading={isSubmitting} className="w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
        </motion.div>
        </div>
    </div>
  );
}
