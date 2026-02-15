/**
 * Module Assignment Manager (Provisional)
 *
 * Allows platform OWNER to assign modules to Business Units.
 * This is a temporary solution until subscriptions are implemented.
 *
 * IMPORTANT:
 * - Only accessible by OWNER role
 * - Will be replaced by subscription management later
 * - Currently stores assignments in localStorage (temporary)
 */

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { moduleRegistry, verticalRegistry } from "@/product";
import { Layout } from "@/core/components/Layout";
import {
  Settings,
  Save,
  AlertTriangle,
  CheckCircle,
  Package,
  Building2,
} from "lucide-react";

interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  type: "legacy" | "vertical";
}

/**
 * Module Assignment Manager Page
 */
export function ModuleAssignmentManager() {
  const { user, tenant, businessUnit, role } = useAuthStore();
  const [availableModules, setAvailableModules] = useState<ModuleInfo[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load available modules from registries
  useEffect(() => {
    const modules: ModuleInfo[] = [];

    // Get legacy modules
    const legacyModules = moduleRegistry.getAllModules();
    legacyModules.forEach((mod) => {
      modules.push({
        id: mod.id,
        name: mod.name,
        description: mod.description || "",
        type: "legacy",
      });
    });

    // Get vertical modules
    const verticals = verticalRegistry.getAllVerticals();
    verticals.forEach((vert) => {
      modules.push({
        id: vert.id,
        name: vert.name,
        description: vert.description || "",
        type: "vertical",
      });
    });

    setAvailableModules(modules);
  }, []);

  // Load assignments from localStorage (temporary storage)
  useEffect(() => {
    if (!tenant) return;

    const key = `module-assignments-${tenant.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setAssignments(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse module assignments:", error);
      }
    }
  }, [tenant]);

  // Save assignments to localStorage
  const handleSave = () => {
    if (!tenant) return;

    setSaving(true);
    const key = `module-assignments-${tenant.id}`;
    localStorage.setItem(key, JSON.stringify(assignments));

    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 500);
  };

  // Toggle module for current business unit
  const toggleModule = (moduleId: string) => {
    if (!businessUnit) return;

    const buId = businessUnit.id;
    const currentModules = assignments[buId] || [];

    if (currentModules.includes(moduleId)) {
      // Remove module
      setAssignments({
        ...assignments,
        [buId]: currentModules.filter((id) => id !== moduleId),
      });
    } else {
      // Add module
      setAssignments({
        ...assignments,
        [buId]: [...currentModules, moduleId],
      });
    }
  };

  // Check if module is assigned to current BU
  const isModuleAssigned = (moduleId: string): boolean => {
    if (!businessUnit) return false;
    const currentModules = assignments[businessUnit.id] || [];
    return currentModules.includes(moduleId);
  };

  // Check if user is SUPER_ADMIN (platform owner)
  const isPlatformOwner = user?.role === "SUPER_ADMIN";

  if (!isPlatformOwner) {
    return (
      <Layout title="Acceso Denegado">
        <div className="p-8">
          <div className="card bg-red-900/20 border-red-800 text-red-400">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold mb-1">Acceso Restringido</h3>
                <p className="text-sm">
                  Solo el propietario de la plataforma (SUPER_ADMIN) puede
                  gestionar módulos.
                </p>
                <p className="text-xs mt-2 text-dark-400">
                  Tu rol actual: {user?.role || "USER"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!businessUnit) {
    return (
      <Layout title="Gestión de Módulos">
        <div className="p-8">
          <div className="card bg-yellow-900/20 border-yellow-800 text-yellow-400">
            <p>Selecciona un Business Unit para gestionar sus módulos.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Gestión de Módulos"
      subtitle="Asignar módulos a Business Units (Provisional)"
      actions={
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Guardando...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Guardado
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar Cambios
            </>
          )}
        </button>
      }
    >
      <div className="p-8 space-y-6">
        {/* Warning Banner */}
        <div className="card bg-yellow-900/20 border-yellow-800 text-yellow-400">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Componente Provisional</p>
              <p>
                Esta interfaz es temporal y almacena asignaciones en
                localStorage. Será reemplazada por gestión de suscripciones y
                base de datos en el futuro.
              </p>
            </div>
          </div>
        </div>

        {/* Current Business Unit */}
        <div className="card border-primary-800">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-6 h-6 text-primary-400" />
            <div>
              <h3 className="font-semibold text-lg">
                Business Unit: {businessUnit.name}
              </h3>
              <p className="text-dark-400 text-sm">
                Gestiona qué módulos están disponibles para este Business Unit
              </p>
            </div>
          </div>
        </div>

        {/* Module Assignment Grid */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-primary-400" />
            <h3 className="font-semibold text-lg">Módulos Disponibles</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableModules.map((module) => {
              const isAssigned = isModuleAssigned(module.id);

              return (
                <div
                  key={module.id}
                  className={`card border transition-all cursor-pointer ${
                    isAssigned
                      ? "border-primary-600 bg-primary-900/10"
                      : "border-dark-700 hover:border-dark-600"
                  }`}
                  onClick={() => toggleModule(module.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => toggleModule(module.id)}
                        className="w-5 h-5 rounded border-dark-600 bg-dark-700 text-primary-600 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                      />
                    </div>

                    {/* Module Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-primary-400" />
                        <h4 className="font-semibold">{module.name}</h4>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            module.type === "vertical"
                              ? "bg-purple-900/30 text-purple-400"
                              : "bg-blue-900/30 text-blue-400"
                          }`}
                        >
                          {module.type === "vertical" ? "Vertical" : "Core"}
                        </span>
                      </div>
                      <p className="text-sm text-dark-400">
                        {module.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {availableModules.length === 0 && (
            <div className="text-center py-12 text-dark-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay módulos registrados en el sistema.</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="card bg-dark-800 border-dark-700">
          <h4 className="font-semibold mb-2 text-sm">Instrucciones</h4>
          <ul className="text-sm text-dark-400 space-y-1">
            <li>
              • Marca los módulos que quieres activar para este Business Unit
            </li>
            <li>• Los cambios se guardan en localStorage (temporal)</li>
            <li>
              • Los módulos aparecerán en el dashboard y navbar después de
              guardar
            </li>
            <li>• Recarga la página para ver los cambios aplicados</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
