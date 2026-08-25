import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const profileSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(120),
  homeCity: z.string().max(120),
  preferredCurrency: z.string().length(3, "3-letter code (e.g. USD)"),
});
type ProfileForm = z.infer<typeof profileSchema>;

const STYLES = [
  "balanced", "relaxed", "packed", "luxury",
  "adventure", "cultural", "romantic", "family", "foodie",
] as const;

export default function ProfilePage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: user
      ? {
          fullName: user.full_name,
          homeCity: user.profile.home_city ?? "",
          preferredCurrency: user.profile.preferred_currency || "USD",
        }
      : undefined,
  });

  const onSubmit = async (values: ProfileForm) => {
    setSaved(false);
    setFormError(null);
    try {
      await api.patch("/auth/me/", {
        full_name: values.fullName,
        home_city: values.homeCity,
        preferred_currency: values.preferredCurrency.toUpperCase(),
      });
      window.location.reload(); // simplest way to refresh the auth context
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Save failed.");
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-50">Profile</h1>
        <p className="mt-1 text-sm text-slate-400">{user?.email}</p>
      </header>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-xs font-medium text-slate-300">Full name</label>
            <Input id="fullName" invalid={Boolean(errors.fullName)} {...register("fullName")} />
            {errors.fullName && <p className="mt-1 text-xs text-red-400">{errors.fullName.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="homeCity" className="mb-1.5 block text-xs font-medium text-slate-300">Home city</label>
              <Input id="homeCity" placeholder="Lisbon" invalid={Boolean(errors.homeCity)} {...register("homeCity")} />
              {errors.homeCity && <p className="mt-1 text-xs text-red-400">{errors.homeCity.message}</p>}
            </div>
            <div>
              <label htmlFor="currency" className="mb-1.5 block text-xs font-medium text-slate-300">Preferred currency</label>
              <Input id="currency" maxLength={3} invalid={Boolean(errors.preferredCurrency)} {...register("preferredCurrency")} />
              {errors.preferredCurrency && (
                <p className="mt-1 text-xs text-red-400">{errors.preferredCurrency.message}</p>
              )}
            </div>
          </div>

          {user && (
            <fieldset>
              <legend className="mb-1.5 block text-xs font-medium text-slate-300">Travel style</legend>
              <div className="flex flex-wrap gap-2 rounded-lg border border-ink-600 bg-ink-900 p-2.5">
                {STYLES.map((style) => (
                  <span
                    key={style}
                    className={
                      user.profile.travel_style === style
                        ? "rounded-full bg-brand-500/20 px-2.5 py-1 text-xs text-brand-300"
                        : "rounded-full px-2.5 py-1 text-xs text-slate-500"
                    }
                  >
                    {style}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-slate-600">
                Change it any time — the planner adapts future itineraries.
              </p>
            </fieldset>
          )}

          {formError && (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {formError}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" loading={isSubmitting}>Save changes</Button>
            {saved && <span className="text-xs text-brand-300">Saved.</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}
