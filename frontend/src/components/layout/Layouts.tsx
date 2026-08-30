import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Landmark,
  LayoutDashboard,
  MapPinned,
  Menu,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const PUBLIC_LINKS = [
  { to: "/", label: "Home" },
  { to: "/#spots", label: "Explore" },
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it works" },
];

export function Wordmark({ className }: { className?: string }) {
  const { user } = useAuth();
  const target = user ? "/dashboard" : "/";
  return (
    <Link
      to={target}
      className={cn(
        "group flex items-center gap-2 text-[15px] font-bold text-slate-800 transition-opacity hover:opacity-90",
        className,
      )}
    >
      <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 font-extrabold text-white shadow-md shadow-brand-500/30">
        W
      </span>
      <span className="font-[family-name:var(--font-display)] tracking-tight">
        Wander<span className="text-brand-400 font-extrabold">Sync</span>
      </span>
    </Link>
  );
}

function PublicNavbar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  // Close the mobile menu whenever the route changes.
  const routeKey = location.pathname;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 shadow-[0_1px_12px_-6px_rgb(15_23_42/0.12)] backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <Wordmark />

        <ul className="hidden items-center gap-1 md:flex">
          {PUBLIC_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "relative rounded-lg px-3 py-2 text-sm transition-colors duration-200",
                    isActive
                      ? "text-blue-700"
                      : "text-slate-600 hover:text-slate-900",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <motion.span
                        layoutId="public-nav-active"
                        className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-blue-600"
                      />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}{" "}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Button size="sm" onClick={() => (window.location.href = "/dashboard")}>
              Open app
            </Button>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:text-slate-900"
              >
                Sign in
              </Link>
              <Link to="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="grid size-9 place-items-center rounded-lg border border-slate-300 text-slate-700 md:hidden"
        >
          {menuOpen ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key={`menu-${routeKey}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-300/60 bg-slate-50/95 backdrop-blur-md md:hidden"
          >
            <ul className="space-y-1 px-4 py-3">
              {PUBLIC_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "block rounded-lg px-3 py-2.5 text-sm",
                        isActive ? "bg-slate-100 text-blue-700" : "text-slate-600 hover:bg-slate-100/60 hover:text-slate-900",
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li className="flex gap-2 border-t border-slate-300/60 pt-3">
                <Link to="/login" className="flex-1" onClick={() => setMenuOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register" className="flex-1" onClick={() => setMenuOpen(false)}>
                  <Button size="sm" className="w-full">
                    Get started
                  </Button>
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-300/60 py-10 text-sm text-slate-500">
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
  { to: "/planner", label: "AI Planner", icon: Sparkles },
  { to: "/trips", label: "My Trips", icon: MapPinned },
  { to: "/spots", label: "Explore", icon: Landmark },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export function ProtectedLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navItems = user?.is_staff
    ? [...APP_NAV, { to: "/admin", label: "Admin", icon: ShieldCheck }]
    : APP_NAV;
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 shadow-[0_1px_12px_-6px_rgb(15_23_42/0.12)] backdrop-blur">
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
                    isActive ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )
                }
              >
                <item.icon aria-hidden className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="hidden truncate sm:inline">{user?.email}</span>
            <Avatar
              url={user?.profile?.avatar_url}
              fallbackName={user?.full_name || user?.email}
            />
            <NotificationBell />
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
            ? "fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-slate-200 bg-white/95 shadow-[0_-4px_16px_-8px_rgb(15_23_42/0.15)] backdrop-blur md:hidden"
            : "fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 shadow-[0_-4px_16px_-8px_rgb(15_23_42/0.15)] backdrop-blur md:hidden"
        }
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[11px]",
                isActive ? "text-blue-700 font-semibold" : "text-slate-500",
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
