import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { dashboardService } from "@/services/dashboard.service";

export function DashboardPage() {
  const { user, tenant, businessUnit, role } = useAuthStore();

  // Fetch tenant stats
  const { data: tenantStats, isLoading: loadingTenantStats } = useQuery({
    queryKey: ["tenantStats", tenant?.id],
    queryFn: () => dashboardService.getTenantStats(tenant!.id),
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
    queryFn: () => dashboardService.getRecentActivity(tenant!.id, 5),
    enabled: !!tenant?.id,
  });

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="header px-8 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-dark-400 text-sm">
              {user?.firstName} {user?.lastName}
            </span>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
              className="btn-ghost text-sm"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* User & Tenant Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>
              <div>
                <h3 className="font-semibold">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-dark-400 text-xs">{user?.email}</p>
              </div>
            </div>
            {role && (
              <div className="mt-2 px-2 py-1 bg-dark-700 rounded text-xs inline-block">
                {role}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-dark-400 mb-2">Tenant</h3>
            <p className="text-lg font-semibold">{tenant?.name}</p>
            <p className="text-xs text-dark-500 mt-1">Plan: {tenant?.plan}</p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-dark-400 mb-2">
              Business Unit
            </h3>
            <p className="text-lg font-semibold">
              {businessUnit?.name || "N/A"}
            </p>
            {businessUnit?.slug && (
              <p className="text-xs text-dark-500 mt-1">{businessUnit.slug}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        {tenantStats && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Estadísticas del Tenant
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <p className="text-dark-400 text-sm mb-1">Business Units</p>
                <p className="text-3xl font-bold text-primary-400">
                  {loadingTenantStats ? "..." : tenantStats.businessUnitsCount}
                </p>
              </div>

              <div className="card">
                <p className="text-dark-400 text-sm mb-1">Usuarios</p>
                <p className="text-3xl font-bold text-primary-400">
                  {loadingTenantStats ? "..." : tenantStats.usersCount}
                </p>
              </div>

              <div className="card">
                <p className="text-dark-400 text-sm mb-1">Módulos Activos</p>
                <p className="text-3xl font-bold text-primary-400">
                  {loadingTenantStats ? "..." : tenantStats.activeModulesCount}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Business Unit Modules */}
        {buStats && businessUnit && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Módulos de {businessUnit.name}
            </h2>
            <div className="card">
              {loadingBuStats ? (
                <p className="text-dark-400">Cargando módulos...</p>
              ) : buStats.activeModules.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {buStats.activeModules.map((module) => (
                    <div
                      key={module.moduleId}
                      className="p-3 bg-dark-700 rounded border border-dark-600 hover:border-primary-600 transition-colors"
                    >
                      <p className="font-medium text-sm">
                        {module.displayName}
                      </p>
                      <p className="text-xs text-dark-400 mt-1">
                        {module.moduleName}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-sm">No hay módulos activos</p>
              )}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentActivity && recentActivity.length > 0 && (
          <div>
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

        {/* Welcome Message */}
        <div className="card mt-8 bg-gradient-to-br from-dark-800 to-dark-900 border-primary-800">
          <h3 className="text-lg font-semibold mb-2">
            Bienvenido a DivancoSaaS
          </h3>
          <p className="text-dark-300 text-sm leading-relaxed mb-4">
            Sistema de gestión modular multitenant profesional. La arquitectura
            permite activar módulos según las necesidades de cada Business Unit,
            con datos completamente aislados y workflows configurables.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="/equipment" className="btn-primary">
              Ver Equipment →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
