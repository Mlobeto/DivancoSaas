import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { dashboardService } from "@/core/services/dashboard.service";

export function DashboardPage() {
  const { user, tenant, businessUnit, role } = useAuthStore();

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card">
                <p className="text-dark-400 text-sm mb-1">Business Units</p>
                <p className="text-3xl font-bold text-primary-400">
                  {loadingTenantStats
                    ? "..."
                    : tenantStats.overview.totalBusinessUnits}
                </p>
              </div>

              <div className="card">
                <p className="text-dark-400 text-sm mb-1">Usuarios Totales</p>
                <p className="text-3xl font-bold text-primary-400">
                  {loadingTenantStats ? "..." : tenantStats.overview.totalUsers}
                </p>
              </div>

              <div className="card">
                <p className="text-dark-400 text-sm mb-1">Usuarios Activos</p>
                <p className="text-3xl font-bold text-green-400">
                  {loadingTenantStats
                    ? "..."
                    : tenantStats.overview.activeUsers}
                </p>
              </div>

              <div className="card">
                <p className="text-dark-400 text-sm mb-1">Módulos Activos</p>
                <p className="text-3xl font-bold text-primary-400">
                  {loadingTenantStats
                    ? "..."
                    : tenantStats.overview.activeModules}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Business Unit Stats */}
        {buStats && businessUnit && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Estadísticas de {businessUnit.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <p className="text-dark-400 text-sm mb-1">Usuarios</p>
                <p className="text-3xl font-bold text-primary-400">
                  {loadingBuStats ? "..." : buStats.overview.totalUsers}
                </p>
              </div>

              <div className="card">
                <p className="text-dark-400 text-sm mb-1">Usuarios Activos</p>
                <p className="text-3xl font-bold text-green-400">
                  {loadingBuStats ? "..." : buStats.overview.activeUsers}
                </p>
              </div>

              <div className="card">
                <p className="text-dark-400 text-sm mb-1">Módulos Activos</p>
                <p className="text-3xl font-bold text-primary-400">
                  {loadingBuStats ? "..." : buStats.overview.activeModules}
                </p>
              </div>
            </div>

            {/* Equipment Stats */}
            {buStats.equipment && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Equipos</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="card bg-dark-800">
                    <p className="text-dark-400 text-xs mb-1">Total</p>
                    <p className="text-2xl font-bold text-white">
                      {buStats.equipment.total}
                    </p>
                  </div>
                  <div className="card bg-green-900/20 border-green-800">
                    <p className="text-dark-400 text-xs mb-1">Disponibles</p>
                    <p className="text-2xl font-bold text-green-400">
                      {buStats.equipment.available}
                    </p>
                  </div>
                  <div className="card bg-blue-900/20 border-blue-800">
                    <p className="text-dark-400 text-xs mb-1">Rentados</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {buStats.equipment.rented}
                    </p>
                  </div>
                  <div className="card bg-yellow-900/20 border-yellow-800">
                    <p className="text-dark-400 text-xs mb-1">Mantenimiento</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {buStats.equipment.maintenance}
                    </p>
                  </div>
                  <div className="card bg-red-900/20 border-red-800">
                    <p className="text-dark-400 text-xs mb-1">
                      Fuera de Servicio
                    </p>
                    <p className="text-2xl font-bold text-red-400">
                      {buStats.equipment.outOfService}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {/* Inventario y Activos */}
            <div className="card bg-dark-800 border-primary-800">
              <h4 className="text-sm font-semibold text-primary-400 mb-3">
                📦 INVENTARIO Y ACTIVOS
              </h4>
              <div className="space-y-2">
                <a
                  href="/machinery"
                  className="block px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors text-sm"
                >
                  📊 Activos →
                </a>
                <a
                  href="/machinery/templates"
                  className="block px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors text-sm"
                >
                  📋 Plantillas →
                </a>
                <a
                  href="/machinery/alerts"
                  className="block px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors text-sm"
                >
                  🚨 Alertas de Documentación →
                </a>
              </div>
            </div>

            {/* Compras y Proveedores */}
            <div className="card bg-dark-800 border-blue-800">
              <h4 className="text-sm font-semibold text-blue-400 mb-3">
                🛍️ COMPRAS Y PROVEEDORES
              </h4>
              <div className="space-y-2">
                <a
                  href="/suppliers"
                  className="block px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors text-sm"
                >
                  🏭 Proveedores →
                </a>
                <a
                  href="/purchase-orders"
                  className="block px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors text-sm"
                >
                  📝 Órdenes de Compra →
                </a>
                <a
                  href="/purchases/quotes"
                  className="block px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors text-sm"
                >
                  💰 Cotizaciones →
                </a>
              </div>
            </div>

            {/* Clientes */}
            <div className="card bg-dark-800 border-green-800">
              <h4 className="text-sm font-semibold text-green-400 mb-3">
                👥 CLIENTES
              </h4>
              <div className="space-y-2">
                <a
                  href="/clients"
                  className="block px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors text-sm"
                >
                  📋 Lista de Clientes →
                </a>
                <a
                  href="/clients/new"
                  className="block px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors text-sm"
                >
                  ➕ Nuevo Cliente →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
