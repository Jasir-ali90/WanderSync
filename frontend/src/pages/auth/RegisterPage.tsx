import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";

import { useState } from "react";

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
    <div className="bg-radial-teal flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Wordmark className="mb-8 scale-110" />
      <div className="w-full max-w-sm rounded-xl border border-ink-700 bg-ink-800/80 p-6 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.55)]">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-50">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-slate-400">Your first itinerary is minutes away.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-xs font-medium text-slate-300">
              Full name
            </label>
            <Input id="fullName" autoComplete="name" placeholder="Amelia Explorer" invalid={Boolean(errors.fullName)} {...register("fullName")} />
            {errors.fullName && <p className="mt-1 text-xs text-red-400">{errors.fullName.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-300">
              Email
            </label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" invalid={Boolean(errors.email)} {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-300">
              Password
            </label>
            <Input id="password" type="password" autoComplete="new-password" invalid={Boolean(errors.password)} {...register("password")} />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-xs font-medium text-slate-300">
              Confirm password
            </label>
            <Input id="confirm" type="password" autoComplete="new-password" invalid={Boolean(errors.confirm)} {...register("confirm")} />
            {errors.confirm && <p className="mt-1 text-xs text-red-400">{errors.confirm.message}</p>}
          </div>

          {formError && (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-full" loading={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
