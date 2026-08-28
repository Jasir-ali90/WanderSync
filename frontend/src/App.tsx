import { lazy, Suspense, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ProtectedLayout, PublicLayout } from "@/components/layout/Layouts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Splash } from "@/components/Splash";
import { AuthProvider, useAuth } from "@/lib/auth";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import SharedTripPage from "@/pages/SharedTripPage";
import { ThemeProvider } from "@/context/ThemeContext";

/* Route-level code splitting keeps the initial bundle lean. */
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const FamousSpotsPage = lazy(() => import("@/pages/FamousSpotsPage"));
const FeaturesPage = lazy(() => import("@/pages/FeaturesPage"));
const HowItWorksPage = lazy(() => import("@/pages/HowItWorksPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const PlannerPage = lazy(() => import("@/pages/PlannerPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const TripDetailPage = lazy(() => import("@/pages/TripDetailPage"));
const TripsPage = lazy(() => import("@/pages/TripsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

/** Shown until the stored session is restored, then gates lazy routes.
 * The splash stays visible for a minimum beat so the brand moment lands
 * even when auth + the route chunk resolve instantly.
 */
import { WanderSyncPreloader } from "@/components/common/Preloader";

const MIN_SPLASH_MS = 2500;

function AppShell() {
  const { loading } = useAuth();
  const [minTimeUp, setMinTimeUp] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinTimeUp(true), MIN_SPLASH_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (loading || !minTimeUp) {
    return <WanderSyncPreloader onFinish={() => setMinTimeUp(true)} />;
  }
  return (
    <Suspense fallback={<Splash compact />}>
      <Routes>
        {/* Public marketing site */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
        </Route>

        {/* Auth (standalone layouts) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Public read-only shared itinerary */}
        <Route path="/shared/:token" element={<SharedTripPage />} />

        {/* Protected application */}
        <Route
          element={
            <ProtectedRoute>
              <ProtectedLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/spots" element={<FamousSpotsPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/:tripId" element={<TripDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        {/* Redirect /explore to /spots */}
        <Route path="/explore" element={<Navigate to="/spots" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
