import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Globe2, MapPinned, Sparkles, User } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

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

/** Ready-made avatar gradients — pick one, no upload needed. */
const PRESET_AVATARS = [
  { emoji: "🧳", bg: "from-brand-500 to-indigo-600" },
  { emoji: "🌍", bg: "from-emerald-400 to-teal-600" },
  { emoji: "✈️", bg: "from-sky-400 to-blue-600" },
  { emoji: "🏝️", bg: "from-amber-300 to-orange-500" },
  { emoji: "🏔️", bg: "from-slate-400 to-slate-700" },
  { emoji: "🚂", bg: "from-rose-400 to-red-600" },
  { emoji: "🐼", bg: "from-lime-300 to-green-600" },
  { emoji: "🦜", bg: "from-fuchsia-400 to-purple-600" },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = user?.profile?.avatar_url ?? "";

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

  /** Canvas-resize any picked image to a small square data URL (≤128 KB). */
  const fileToAvatarDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("read-failed"));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("decode-failed"));
        image.onload = () => {
          const size = 160;
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("canvas-failed"));
          const scale = Math.max(size / image.width, size / image.height);
          ctx.drawImage(
            image,
            (size - image.width * scale) / 2,
            (size - image.height * scale) / 2,
            image.width * scale,
            image.height * scale,
          );
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        image.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });

  const saveAvatar = async (value: string) => {
    setAvatarBusy(true);
    setFormError(null);
    try {
      await api.patch("/auth/me/", { avatar_url: value });
      window.location.reload(); // refresh auth context everywhere
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Avatar save failed.");
    } finally {
      setAvatarBusy(false);
    }
  };

  const onPickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Please choose an image file.");
      return;
    }
    try {
      await saveAvatar(await fileToAvatarDataUrl(file));
    } catch {
      setFormError("Couldn't process that image — try another one.");
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-ink-900/90 via-ink-950/90 to-brand-950/40 p-6 backdrop-blur-xl shadow-2xl"
      >
        <div className="absolute -right-12 -top-12 size-36 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-600 text-2xl shadow-lg shadow-brand-500/30">
            <User className="size-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-300 flex items-center gap-1">
              <Sparkles className="size-3.5" /> VVIP Traveller
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-slate-50">Your Profile</h1>
            <p className="mt-0.5 text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>
      </motion.header>

      {/* Avatar picker */}
      <Card className="p-6 rounded-3xl border-white/10 bg-ink-900/80 backdrop-blur-xl shadow-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Your picture</h2>
        <div className="mt-4 flex items-center gap-5">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Your avatar"
                className="size-20 rounded-full border-2 border-brand-500/50 object-cover shadow-[0_0_24px_rgba(134,59,255,.35)]"
              />
            ) : (
              <div className="grid size-20 place-items-center rounded-full border-2 border-dashed border-ink-600 text-3xl">
                🧭
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={avatarBusy}
              onClick={() => fileInputRef.current?.click()}
            >
              ⬆️ Upload photo
            </Button>
            {avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={avatarBusy}
                onClick={() => void saveAvatar("")}
              >
                Remove current picture
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onPickFile(e)}
            />
          </div>
        </div>

        <p className="mt-5 mb-2 text-xs font-medium text-slate-400">…or pick a travel vibe:</p>
        <div role="group" aria-label="Preset avatars" className="flex flex-wrap gap-2.5">
          {PRESET_AVATARS.map((preset) => (
            <button
              key={preset.emoji}
              type="button"
              aria-label={`Avatar ${preset.emoji}`}
              disabled={avatarBusy}
              onClick={() => void saveAvatar(`preset:${preset.bg}:${preset.emoji}`)}
              className={cn(
                "grid size-11 place-items-center rounded-full bg-gradient-to-br text-xl transition-all duration-200",
                "hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(134,59,255,.6)]",
                preset.bg,
                avatarUrl === `preset:${preset.bg}:${preset.emoji}` &&
                  "ring-2 ring-brand-400 ring-offset-2 ring-offset-ink-900",
              )}
            >
              {preset.emoji}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-600">
          Presets are rendered as gradient badges in the header; uploaded photos are resized privately on your device.
        </p>
      </Card>

      <Card className="p-6 rounded-3xl border-white/10 bg-ink-900/80 backdrop-blur-xl shadow-2xl">
        <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Globe2 className="size-4 text-brand-400" /> Travel Settings
        </h2>
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
            <Button type="submit" loading={isSubmitting} className="rounded-full px-8 shadow-lg shadow-brand-500/30">
              <MapPinned className="size-4" /> Save Profile
            </Button>
            {saved && <span className="text-xs font-semibold text-brand-300 animate-pulse">✓ Saved!</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}
