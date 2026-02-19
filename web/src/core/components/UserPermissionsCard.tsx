/**
 * User Permissions Card
 *
 * Displays the current user's role and permissions.
 * Useful for profile pages or settings sections.
 */

import { useAuthStore } from "@/store/auth.store";
import { Shield, CheckCircle } from "lucide-react";

/**
 * User Permissions Card Component
 */
export function UserPermissionsCard() {
  const { user, role, permissions } = useAuthStore();

  if (!user) return null;

  // Group permissions by category
  const groupedPermissions = permissions.reduce(
    (acc, perm) => {
      const [category] = perm.split(":");
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(perm);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  const categoryLabels: Record<string, string> = {
    users: "Usuarios",
    assets: "Activos",
    clients: "Clientes",
    contracts: "Contratos",
    quotations: "Cotizaciones",
    templates: "Plantillas",
    reports: "Reportes",
    rental: "Alquileres",
    settings: "Configuración",
    admin: "Administración",
    accounts: "Cuentas",
  };

  const actionLabels: Record<string, string> = {
    read: "Ver",
    create: "Crear",
    update: "Editar",
    delete: "Eliminar",
    approve: "Aprobar",
    sign: "Firmar",
    system: "Sistema",
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-dark-100">
            Rol y Permisos
          </h3>
          <p className="text-sm text-dark-400">
            {role === "SUPER_ADMIN" && "Acceso total al sistema"}
            {role === "OWNER" && "Acceso completo al tenant"}
            {role === "ADMIN" && "Administrador"}
            {role === "MANAGER" && "Gerente de operaciones"}
            {!["SUPER_ADMIN", "OWNER", "ADMIN", "MANAGER"].includes(
              role || "",
            ) && "Usuario estándar"}
          </p>
        </div>
      </div>

      {/* Role Badge */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30">
          <Shield className="w-4 h-4" />
          {role}
        </span>
      </div>

      {/* Permissions List */}
      {role === "SUPER_ADMIN" || role === "OWNER" ? (
        <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">
              Acceso total a todas las funciones
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm font-medium text-dark-300 mb-3">
            Permisos Asignados ({permissions.length})
          </div>

          <div className="space-y-3">
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div
                key={category}
                className="bg-dark-800/50 rounded-lg p-3 border border-dark-700"
              >
                <div className="font-medium text-dark-200 mb-2">
                  {categoryLabels[category] || category}
                </div>
                <div className="flex flex-wrap gap-2">
                  {perms.map((perm) => {
                    const action = perm.split(":")[1];
                    return (
                      <span
                        key={perm}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-dark-700 text-dark-300 border border-dark-600"
                      >
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        {actionLabels[action] || action}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {permissions.length === 0 && (
            <div className="text-center py-6 text-dark-400">
              No tienes permisos asignados
            </div>
          )}
        </div>
      )}
    </div>
  );
}
