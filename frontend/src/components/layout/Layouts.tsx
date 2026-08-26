import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Compass,
  Landmark,
  LayoutDashboard,
  MapPinned,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const PUBLIC_LINKS = [
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it works" },
];

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn("flex items-center gap-2 font-[family-name:var(--font-display)]", className)}
    >
      <span className="grid size-8 place-items-center rounded-lg bg-brand-500/15 text-brand-400">
        <Compass aria-hidden className="size-5" />
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-50">
        Wander<span className="text-brand-400">Sync</span>
      </span>
    </Link>
  );
}

function PublicNavbar() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/60 bg-ink-950/80 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Wordmark />
        <div className="hidden items-center gap-1 md:flex">
          {PUBLIC_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive ? "bg-ink-800 text-slate-50" : "text-slate-300 hover:text-slate-50",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Button size="sm" onClick={() => (window.location.href = "/dashboard")}>
              Open app
            </Button>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:text-slate-50"
              >
                Sign in
              </Link>
              <Link to="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-ink-700/60 py-10 text-sm text-slate-500">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row">
        <Wordmark className="[&_span:last-child]:text-base [&_span:first-child]:size-7" />
        <p>From Dream to Itinerary. © {new Date().getFullYear()} WanderSync.</p>
        <p className="text-xs">Built with Django · MongoDB · React</p>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

const APP_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/planner", label: "Planner", icon: Sparkles },
  { to: "/trips", label: "Trips", icon: MapPinned },
  { to: "/spots", label: "Spots", icon: Landmark },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export function ProtectedLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navItems = user?.is_staff
    ? [...APP_NAV, { to: "/admin", label: "Admin", icon: ShieldCheck }]
    : APP_NAV;
  return (
    <div className="flex min-h-screen flex-col bg-ink-950">
      <header className="sticky top-0 z-40 border-b border-ink-700/60 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Wordmark />
          <nav aria-label="App" className="hidden gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm",
                    isActive ? "bg-ink-800 text-brand-300" : "text-slate-400 hover:text-slate-100",
                  )
                }
              >
                <item.icon aria-hidden className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="hidden truncate sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Mobile"
        className={
          user?.is_staff
            ? "fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-ink-700/70 bg-ink-900/95 backdrop-blur md:hidden"
            : "fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-ink-700/70 bg-ink-900/95 backdrop-blur md:hidden"
        }
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[11px]",
                isActive ? "text-brand-300" : "text-slate-500",
              )
            }
          >
            <item.icon aria-hidden className="size-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
