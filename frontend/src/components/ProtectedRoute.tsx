import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { Spinner } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Spinner label="Checking your session…" />;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
