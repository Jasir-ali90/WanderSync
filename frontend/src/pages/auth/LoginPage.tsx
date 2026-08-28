import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

import { OtpVerification } from "@/components/auth/OtpVerification";
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
  const { login, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

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
      if (error instanceof ApiError && error.code === "EMAIL_UNVERIFIED") {
        setPendingEmail(values.email.toLowerCase().trim());
      } else {
        setFormError(error instanceof ApiError ? error.message : "Sign in failed. Please try again.");
      }
    }
  };

  const handleVerify = async (code: string) => {
    if (!pendingEmail) return;
    setOtpError(null);
    setOtpMessage(null);
    setVerifying(true);
    try {
      await verifyOtp(pendingEmail, code);
      const target = (location.state as { from?: string } | null)?.from ?? "/dashboard";
      navigate(target, { replace: true });
    } catch (error) {
      setOtpError(error instanceof ApiError ? error.message : "That code was not accepted. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    setOtpError(null);
    setOtpMessage(null);
    try {
      const result = await resendOtp(pendingEmail);
      setOtpMessage("A new verification code has been sent.");
      setDevCode(result.dev_otp ?? null);
    } catch (error) {
      setOtpError(error instanceof ApiError ? error.message : "Could not resend the code. Please try again.");
    }
  };

  if (pendingEmail) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
        <Wordmark className="mb-8 scale-125" />
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <OtpVerification
            email={pendingEmail}
            verifying={verifying}
            error={otpError}
            devCode={devCode}
            resendMessage={otpMessage}
            onVerify={handleVerify}
            onResend={handleResend}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <Wordmark className="mb-8 scale-125" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
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
  );
}
