import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ProtectedLayout, PublicLayout } from "@/components/layout/Layouts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Spinner } from "@/components/ui/Card";
import { AuthProvider } from "@/lib/auth";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

/* Route-level code splitting keeps the initial bundle lean. */
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<Spinner label="Loading…" />}>
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
                <Route path="/trips" element={<TripsPage />} />
                <Route path="/trips/:tripId" element={<TripDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}


