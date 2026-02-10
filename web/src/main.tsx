import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Core Pages
import { LoginPage } from "@/core/pages/LoginPage";
import { RegisterPage } from "@/core/pages/RegisterPage";
import { ForgotPasswordPage } from "@/core/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/core/pages/ResetPasswordPage";
import { DashboardPage } from "@/core/pages/DashboardPage";

// Module Pages
import { MachineryPage } from "@/modules/machinery/pages/MachineryPage";
import { AssetTemplatesPage } from "@/modules/machinery/pages/AssetTemplatesPage";
import { TemplateWizardPage } from "@/modules/machinery/pages/TemplateWizardPage";

// Core Services
import { authService } from "@/core/services/auth.service";

import "./index.css";

// Configurar TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente de ruta protegida
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machinery"
            element={
              <ProtectedRoute>
                <MachineryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machinery/templates"
            element={
              <ProtectedRoute>
                <AssetTemplatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machinery/templates/create"
            element={
              <ProtectedRoute>
                <TemplateWizardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machinery/templates/:id/edit"
            element={
              <ProtectedRoute>
                <TemplateWizardPage />
              </ProtectedRoute>
            }
          />
          {/* Redirect old /equipment route to /machinery */}
          <Route
            path="/equipment"
            element={<Navigate to="/machinery" replace />}
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
