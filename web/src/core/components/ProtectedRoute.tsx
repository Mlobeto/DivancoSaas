/**
 * ProtectedRoute Component
 *
 * Redirects to login if user is not authenticated.
 * Used to wrap all authenticated routes.
 */

import { Navigate, Outlet } from "react-router-dom";
import { authService } from "@/core/services/auth.service";

export function ProtectedRoute() {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
