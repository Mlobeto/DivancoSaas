import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { dashboardService } from "@/core/services/dashboard.service";
import { Layout } from "@/core/components/Layout";
import { DynamicDashboardCards } from "@/core/components/DynamicDashboardCards";
import { ChevronDown, ChevronUp, BarChart3 } from "lucide-react";

export function DashboardPage() {
  const { tenant, businessUnit } = useAuthStore();
  const [showTenantStats, setShowTenantStats] = useState(false);
  const [showBuStats, setShowBuStats] = useState(false);

  // Fetch tenant stats
  const { data: tenantStats, isLoading: loadingTenantStats } = useQuery({
    queryKey: ["tenantStats", tenant?.id],
    queryFn: () => dashboardService.getTenantStats(),
    enabled: !!tenant?.id,
  });

  // Fetch business unit stats if available
  const { data: buStats, isLoading: loadingBuStats } = useQuery({
    queryKey: ["businessUnitStats", businessUnit?.id],
    queryFn: () => dashboardService.getBusinessUnitStats(businessUnit!.id),
    enabled: !!businessUnit?.id,
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ["recentActivity", tenant?.id],
    queryFn: () => dashboardService.getRecentActivity(5),
    enabled: !!tenant?.id,
  });

  return (
    <Layout title="Dashboard">
      <div className="p-8">
        {/* Welcome Message & Modules */}
        <div className="card bg-gradient-to-br from-dark-800 to-dark-900 border-primary-800">
          <h3 className="text-lg font-semibold mb-2">
            Bienvenido a DivancoSaaS
          </h3>
          <p className="text-dark-300 text-sm leading-relaxed mb-4">
            Sistema de gestión modular multitenant profesional. La arquitectura
            permite activar módulos según las necesidades de cada Business Unit,
            con datos completamente aislados y workflows configurables.
          </p>

          {/* Dynamic Module Cards */}
          <DynamicDashboardCards />
        </div>

        {/* Collapsible Statistics Panels */}
        <div className="mt-8 space-y-4">
          {/* Tenant Stats */}
          {tenantStats && (
            <div className="card">
              <button
                onClick={() => setShowTenantStats(!showTenantStats)}
                className="w-full flex items-center justify-between py-2 hover:text-primary-400 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">
                    Estadísticas del Tenant
                  </h3>
                </div>
                {showTenantStats ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {showTenantStats && (
                <div className="mt-4 pt-4 border-t border-dark-700">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="card bg-dark-800">
                      <p className="text-dark-400 text-sm mb-1">
                        Business Units
                      </p>
                      <p className="text-3xl font-bold text-primary-400">
                        {loadingTenantStats
                          ? "..."
                          : tenantStats.overview.totalBusinessUnits}
                      </p>
                    </div>

                    <div className="card bg-dark-800">
                      <p className="text-dark-400 text-sm mb-1">
                        Usuarios Totales
                      </p>
                      <p className="text-3xl font-bold text-primary-400">
                        {loadingTenantStats
                          ? "..."
                          : tenantStats.overview.totalUsers}
                      </p>
                    </div>

                    <div className="card bg-dark-800">
                      <p className="text-dark-400 text-sm mb-1">
                        Usuarios Activos
                      </p>
                      <p className="text-3xl font-bold text-green-400">
                        {loadingTenantStats
                          ? "..."
                          : tenantStats.overview.activeUsers}
                      </p>
                    </div>

                    <div className="card bg-dark-800">
                      <p className="text-dark-400 text-sm mb-1">
                        Módulos Activos
                      </p>
                      <p className="text-3xl font-bold text-primary-400">
                        {loadingTenantStats
                          ? "..."
                          : tenantStats.overview.activeModules}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Business Unit Stats */}
          {buStats && businessUnit && (
            <div className="card">
              <button
                onClick={() => setShowBuStats(!showBuStats)}
                className="w-full flex items-center justify-between py-2 hover:text-primary-400 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">
                    Estadísticas de {businessUnit.name}
                  </h3>
                </div>
                {showBuStats ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {showBuStats && (
                <div className="mt-4 pt-4 border-t border-dark-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="card bg-dark-800">
                      <p className="text-dark-400 text-sm mb-1">Usuarios</p>
                      <p className="text-3xl font-bold text-primary-400">
                        {loadingBuStats ? "..." : buStats.overview.totalUsers}
                      </p>
                    </div>

                    <div className="card bg-dark-800">
                      <p className="text-dark-400 text-sm mb-1">
                        Usuarios Activos
                      </p>
                      <p className="text-3xl font-bold text-green-400">
                        {loadingBuStats ? "..." : buStats.overview.activeUsers}
                      </p>
                    </div>

                    <div className="card bg-dark-800">
                      <p className="text-dark-400 text-sm mb-1">
                        Módulos Activos
                      </p>
                      <p className="text-3xl font-bold text-primary-400">
                        {loadingBuStats
                          ? "..."
                          : buStats.overview.activeModules}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {recentActivity && recentActivity.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Actividad Reciente</h2>
            <div className="card">
              <div className="space-y-3">
                {loadingActivity ? (
                  <p className="text-dark-400">Cargando actividad...</p>
                ) : (
                  recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 pb-3 border-b border-dark-700 last:border-0"
                    >
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">
                            {activity.userName}
                          </span>{" "}
                          {activity.action}{" "}
                          <span className="text-dark-400">
                            {activity.entity}
                          </span>
                        </p>
                        <p className="text-xs text-dark-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
