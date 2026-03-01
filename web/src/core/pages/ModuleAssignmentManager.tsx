/**
 * ModuleAssignmentManager
 * Placeholder page for module assignment administration (OWNER only).
 * TODO: Implement full UI when backend endpoints are ready.
 */

import { Layout } from "@/core/components/Layout";

export function ModuleAssignmentManager() {
  return (
    <Layout
      title="Asignación de Módulos"
      subtitle="Gestión de módulos habilitados por tenant (OWNER)"
    >
      <div className="p-8 text-center text-dark-400">
        <p className="text-lg font-medium mb-2">Módulo en construcción</p>
        <p className="text-sm">
          La administración de módulos por tenant estará disponible
          próximamente.
        </p>
      </div>
    </Layout>
  );
}
