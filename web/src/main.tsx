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
// import { MachineryPage } from "@/modules/machinery/pages/MachineryPage"; // DEPRECATED
import { AssetsListPage } from "@/modules/machinery/pages/AssetsListPage";
import { AssetTemplatesPage } from "@/modules/machinery/pages/AssetTemplatesPage";
import { TemplateWizardPage } from "@/modules/machinery/pages/TemplateWizardPage";
import { DocumentTypesPage } from "@/modules/machinery/pages/DocumentTypesPage";
import { AssetFormPage } from "@/modules/machinery/pages/AssetFormPage";
import { AlertsDashboardPage } from "@/modules/machinery/pages/AlertsDashboardPage";
import {
  SuppliersPage,
  PurchaseOrdersPage,
  SupplyCategoriesPage,
  CategoryWizardPage,
  SuppliesPage,
  SupplyFormPage,
} from "@/modules/purchases";
import {
  ClientsPage,
  ClientDetailPage,
  ClientWizardPage,
} from "@/modules/clients";

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
                <AssetsListPage />
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
          <Route
            path="/machinery/document-types"
            element={
              <ProtectedRoute>
                <DocumentTypesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machinery/assets/new"
            element={
              <ProtectedRoute>
                <AssetFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machinery/assets/:id/edit"
            element={
              <ProtectedRoute>
                <AssetFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machinery/alerts"
            element={
              <ProtectedRoute>
                <AlertsDashboardPage />
              </ProtectedRoute>
            }
          />
          {/* Redirect old /equipment route to /machinery */}
          <Route
            path="/equipment"
            element={<Navigate to="/machinery" replace />}
          />
          {/* Purchases Module Routes */}
          <Route
            path="/purchases"
            element={<Navigate to="/purchase-orders" replace />}
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <SuppliersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase-orders"
            element={
              <ProtectedRoute>
                <PurchaseOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases/categories"
            element={
              <ProtectedRoute>
                <SupplyCategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases/categories/new"
            element={
              <ProtectedRoute>
                <CategoryWizardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases/categories/:id/edit"
            element={
              <ProtectedRoute>
                <CategoryWizardPage />
              </ProtectedRoute>
            }
          />
          {/* Supplies Routes */}
          <Route
            path="/supplies"
            element={
              <ProtectedRoute>
                <SuppliesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplies/new"
            element={
              <ProtectedRoute>
                <SupplyFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplies/:id/edit"
            element={
              <ProtectedRoute>
                <SupplyFormPage />
              </ProtectedRoute>
            }
          />
          {/* Clients Module Routes */}
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <ClientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/new"
            element={
              <ProtectedRoute>
                <ClientWizardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/:id"
            element={
              <ProtectedRoute>
                <ClientDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/:id/edit"
            element={
              <ProtectedRoute>
                <ClientWizardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
