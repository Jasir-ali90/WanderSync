import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-[family-name:var(--font-display)] text-7xl font-extrabold text-brand-500/30">404</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold text-slate-100">
        This destination isn't on the map
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        The page you're looking for doesn't exist — but plenty of real destinations do.
      </p>
      <Link to="/" className="mt-6">
        <Button>Back to WanderSync</Button>
      </Link>
    </div>
  );
}
