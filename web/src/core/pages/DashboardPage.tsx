import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { dashboardService } from "@/core/services/dashboard.service";
import { Layout } from "@/core/components/Layout";
import { BrandingStatusCard } from "@/core/components/BrandingStatusCard";
import { ManualNotificationModal } from "@/core/components/ManualNotificationModal";
import { businessUnitService } from "@/core/services/businessUnit.service";
import {
  ChevronDown,
  ChevronUp,
  BarChart3,
  Settings,
  Briefcase,
  Wrench,
  Bell,
  Shield,
} from "lucide-react";

const TIMEZONE_OPTIONS = [
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "UTC",
];

interface ActionCard {
  id: string;
  title: string;
  description: string;
  path: string;
}

export function DashboardPage() {
  const { user, tenant, businessUnit, role, permissions, setAuth } =
    useAuthStore();
  const [showTenantStats, setShowTenantStats] = useState(false);
  const [showBuStats, setShowBuStats] = useState(false);
  const [showOwnerPanel, setShowOwnerPanel] = useState(true);
  const [showOperationsPanel, setShowOperationsPanel] = useState(true);
  const [showMaintenancePanel, setShowMaintenancePanel] = useState(true);
  const [manualNotificationOpen, setManualNotificationOpen] = useState(false);
  const [timezoneValue, setTimezoneValue] = useState(
    businessUnit?.timezone || "America/Mexico_City",
  );

  const roleName = role || "USER";
  const userPermissions = permissions || [];

  const hasAccess = (
    allowedRoles: string[] = [],
    requiredPermissions: string[] = [],
  ) => {
    if (roleName === "SUPER_ADMIN" || roleName === "OWNER") return true;
    if (allowedRoles.includes(roleName)) return true;
    if (requiredPermissions.length === 0) return false;
    return requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );
  };

  const canManageConfiguration = hasAccess(
    ["OWNER"],
    ["business_unit:update", "business_units:update", "branding:update"],
  );

  const canViewOperations = hasAccess(
    ["ADMIN", "MANAGER"],
    [
      "rental:quotation:read",
      "rental:quotation:create",
      "rental:billing:read",
      "contracts:read",
      "clients:read",
    ],
  );

  const canViewMaintenance = hasAccess(
    ["MAINTENANCE", "OPERATOR", "TECHNICIAN", "MANAGER"],
    ["operators:read", "operators:create", "inventory:read", "assets:read"],
  );

  const ownerActions = useMemo<ActionCard[]>(
    () => [
      {
        id: "branding",
        title: "Branding de la Business Unit",
        description: "Configura logo, colores, fuentes y estilo institucional.",
        path: "/settings/branding",
      },
      {
        id: "staff",
        title: "Gestión de personal",
        description:
          "Define equipo, roles base y permisos adicionales por usuario.",
        path: "/settings/staff",
      },
    ],
    [],
  );

  const operationsActions = useMemo<ActionCard[]>(
    () => [
      {
        id: "quotations",
        title: "Cotizaciones",
        description: "Crea, revisa y aprueba cotizaciones operativas.",
        path: "/rental/quotations",
      },
      {
        id: "contracts",
        title: "Contratos",
        description: "Monitorea contratos activos y su ciclo de vida.",
        path: "/rental/contracts",
      },
      {
        id: "accounts",
        title: "Cuentas",
        description:
          "Consulta cuentas corrientes y estado financiero operativo.",
        path: "/rental/accounts",
      },
    ],
    [],
  );

  const maintenanceActions = useMemo<ActionCard[]>(
    () => [
      {
        id: "operators",
        title: "Operadores",
        description: "Administra perfiles, disponibilidad y documentación.",
        path: "/rental/operators",
      },
      {
        id: "inventory",
        title: "Inventario",
        description: "Visualiza activos y estado operativo de equipos.",
        path: "/inventory",
      },
    ],
    [],
  );

  const updateTimezoneMutation = useMutation({
    mutationFn: async (timezone: string) => {
      if (!businessUnit) return;
      return businessUnitService.update(businessUnit.id, { timezone });
    },
    onSuccess: (updatedBusinessUnit) => {
      if (!updatedBusinessUnit || !user || !tenant) return;
      setAuth({
        user,
        tenant,
        businessUnit: {
          ...businessUnit,
          ...updatedBusinessUnit,
        },
        role: role || undefined,
        permissions: userPermissions,
      });
    },
  });

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
    <Layout title="Configuración inicial">
      <div className="p-8">
        <div className="card bg-dark-800 border-dark-700">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary-400 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold mb-1">
                Acceso por rol + permisos
              </h2>
              <p className="text-dark-300 text-sm">
                Este panel combina accesos por rol base con permisos adicionales
                asignados al usuario. Si un permiso explícito habilita una
                función, también se mostrará aunque no sea parte del rol por
                defecto.
              </p>
              <p className="text-dark-500 text-xs mt-2">
                Rol activo: {roleName} · Permisos activos:{" "}
                {userPermissions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-dark-800 border-dark-700 mt-4">
          <div className="flex items-start justify-between gap-3">
            <Bell className="w-5 h-5 text-primary-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold">
                Notificaciones para todos los roles
              </h3>
              <p className="text-dark-300 text-sm">
                Todos los usuarios pueden revisar y gestionar notificaciones
                desde la campana en la barra superior.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setManualNotificationOpen(true)}
            >
              Enviar manual
            </button>
          </div>
        </div>

        {businessUnit && (
          <div className="mt-8 space-y-4">
            {canManageConfiguration && (
              <div className="card">
                <button
                  onClick={() => setShowOwnerPanel(!showOwnerPanel)}
                  className="w-full flex items-center justify-between py-2 hover:text-primary-400 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">
                      Panel OWNER · Configuración inicial
                    </h3>
                  </div>
                  {showOwnerPanel ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {showOwnerPanel && (
                  <div className="mt-4 pt-4 border-t border-dark-700 space-y-4">
                    <BrandingStatusCard />

                    <div className="card bg-dark-800 border-dark-700">
                      <h4 className="font-medium mb-2">
                        Zona horaria de la Business Unit
                      </h4>
                      <p className="text-dark-400 text-sm mb-3">
                        Esta zona horaria debe ser la referencia operativa para
                        cotizaciones, contratos y reportes.
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <select
                          value={timezoneValue}
                          onChange={(event) =>
                            setTimezoneValue(event.target.value)
                          }
                          className="input flex-1"
                        >
                          {TIMEZONE_OPTIONS.map((timezone) => (
                            <option key={timezone} value={timezone}>
                              {timezone}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={updateTimezoneMutation.isPending}
                          onClick={() =>
                            updateTimezoneMutation.mutate(timezoneValue)
                          }
                        >
                          {updateTimezoneMutation.isPending
                            ? "Guardando..."
                            : "Guardar zona horaria"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ownerActions.map((action) => (
                        <Link
                          key={action.id}
                          to={action.path}
                          className="card bg-dark-800 hover:bg-dark-700 transition-colors"
                        >
                          <h4 className="font-semibold">{action.title}</h4>
                          <p className="text-dark-400 text-sm mt-1">
                            {action.description}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {canViewOperations && (
              <div className="card">
                <button
                  onClick={() => setShowOperationsPanel(!showOperationsPanel)}
                  className="w-full flex items-center justify-between py-2 hover:text-primary-400 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Panel operativo</h3>
                  </div>
                  {showOperationsPanel ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {showOperationsPanel && (
                  <div className="mt-4 pt-4 border-t border-dark-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {operationsActions.map((action) => (
                      <Link
                        key={action.id}
                        to={action.path}
                        className="card bg-dark-800 hover:bg-dark-700 transition-colors"
                      >
                        <h4 className="font-semibold">{action.title}</h4>
                        <p className="text-dark-400 text-sm mt-1">
                          {action.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {canViewMaintenance && (
              <div className="card">
                <button
                  onClick={() => setShowMaintenancePanel(!showMaintenancePanel)}
                  className="w-full flex items-center justify-between py-2 hover:text-primary-400 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">
                      Panel de mantenimiento
                    </h3>
                  </div>
                  {showMaintenancePanel ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {showMaintenancePanel && (
                  <div className="mt-4 pt-4 border-t border-dark-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {maintenanceActions.map((action) => (
                      <Link
                        key={action.id}
                        to={action.path}
                        className="card bg-dark-800 hover:bg-dark-700 transition-colors"
                      >
                        <h4 className="font-semibold">{action.title}</h4>
                        <p className="text-dark-400 text-sm mt-1">
                          {action.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!canManageConfiguration &&
              !canViewOperations &&
              !canViewMaintenance && (
                <div className="card bg-yellow-900/20 border-yellow-800 text-yellow-400">
                  <p className="text-sm">
                    No hay paneles habilitados con tu rol/permisos actuales en
                    esta Business Unit. Solicita permisos adicionales al
                    OWNER/ADMIN.
                  </p>
                </div>
              )}
          </div>
        )}

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

        <ManualNotificationModal
          isOpen={manualNotificationOpen}
          onClose={() => setManualNotificationOpen(false)}
        />
      </div>
    </Layout>
  );
}
