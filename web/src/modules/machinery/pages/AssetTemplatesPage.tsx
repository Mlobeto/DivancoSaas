/**
 * ASSET TEMPLATES PAGE
 * Gestión de plantillas de activos (Admin)
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import {
  assetTemplateService,
  type AssetTemplate,
  AssetCategory,
  AssetCategoryLabels,
} from "@/modules/machinery/services/asset-template.service";
import { useNavigate } from "react-router-dom";
import {
  Construction,
  Truck,
  HardHat,
  Wrench,
  Hammer,
  Drill,
  Box,
  Package,
  Factory,
  PackageOpen,
  Container,
  Ruler,
  Fence,
  Pickaxe,
} from "lucide-react";

// Helper para renderizar iconos
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  construction: Construction,
  truck: Truck,
  hardhat: HardHat,
  wrench: Wrench,
  hammer: Hammer,
  drill: Drill,
  box: Box,
  package: Package,
  factory: Factory,
  packageopen: PackageOpen,
  container: Container,
  ruler: Ruler,
  fence: Fence,
  pickaxe: Pickaxe,
};

const renderIcon = (iconName?: string | null) => {
  if (!iconName) return null;
  const IconComponent = iconMap[iconName.toLowerCase()];
  if (IconComponent) {
    return <IconComponent className="w-8 h-8 text-white" />;
  }
  // Fallback para emojis u otros textos
  return <div className="text-3xl">{iconName}</div>;
};

export function AssetTemplatesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { tenant, businessUnit } = useAuthStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | "">("");

  // Fetch templates
  const { data, isLoading, error } = useQuery({
    queryKey: ["asset-templates", businessUnit?.id, search, categoryFilter],
    queryFn: () =>
      assetTemplateService.list({
        search: search || undefined,
        category: categoryFilter || undefined,
      }),
    enabled: !!tenant?.id && !!businessUnit?.id,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["asset-templates-stats", businessUnit?.id],
    queryFn: () => assetTemplateService.getStats(),
    enabled: !!tenant?.id && !!businessUnit?.id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: assetTemplateService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-templates"] });
      queryClient.invalidateQueries({ queryKey: ["asset-templates-stats"] });
    },
  });

  const handleDelete = async (template: AssetTemplate) => {
    const hasAssets = template._count && template._count.assets > 0;

    if (hasAssets) {
      alert(
        `No se puede eliminar esta plantilla porque tiene ${template._count!.assets} activos asociados.`,
      );
      return;
    }

    if (
      confirm(
        `¿Estás seguro de eliminar la plantilla "${template.name}"? Esta acción no se puede deshacer.`,
      )
    ) {
      deleteMutation.mutate(template.id);
    }
  };

  const handleDuplicate = async (template: AssetTemplate) => {
    const newName = prompt(
      `Duplicar plantilla "${template.name}". Ingresa el nuevo nombre:`,
      `${template.name} (copia)`,
    );

    if (newName && newName.trim()) {
      try {
        await assetTemplateService.duplicate(template.id, newName.trim());
        queryClient.invalidateQueries({ queryKey: ["asset-templates"] });
      } catch (error: any) {
        alert(
          `Error al duplicar: ${error.response?.data?.error || error.message}`,
        );
      }
    }
  };

  const categoryColors: Record<AssetCategory, string> = {
    [AssetCategory.MACHINERY]: "bg-blue-900/30 text-blue-400 border-blue-800",
    [AssetCategory.IMPLEMENT]:
      "bg-green-900/30 text-green-400 border-green-800",
    [AssetCategory.VEHICLE]:
      "bg-purple-900/30 text-purple-400 border-purple-800",
    [AssetCategory.TOOL]: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
  };

  // Validar contexto
  if (!tenant || !businessUnit) {
    return (
      <Layout>
        <div className="p-8">
          <div className="card bg-yellow-900/20 border-yellow-800 text-yellow-400">
            <p>No se ha seleccionado un tenant o business unit.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Plantillas de Activos"
      subtitle={`Configuración de plantillas de activos - ${businessUnit.name}`}
      actions={
        <>
          <button onClick={() => navigate("/machinery")} className="btn-ghost">
            ← Inventario
          </button>
          <button
            onClick={() => navigate("/machinery/templates/create")}
            className="btn-primary"
          >
            + Nueva Plantilla
          </button>
        </>
      }
    >
      <div className="p-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card bg-primary-900/10 border-primary-800">
              <div className="text-sm text-dark-400 mb-1">Total Plantillas</div>
              <div className="text-3xl font-bold text-primary-400">
                {stats.totalTemplates}
              </div>
            </div>
            <div className="card bg-blue-900/10 border-blue-800">
              <div className="text-sm text-dark-400 mb-1">Total Activos</div>
              <div className="text-3xl font-bold text-blue-400">
                {stats.totalAssets}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-dark-400 mb-2">Por Categoría</div>
              <div className="space-y-1 text-sm">
                {Object.entries(stats.byCategory).map(([cat, count]) => (
                  <div key={cat} className="flex justify-between">
                    <span className="text-dark-400">
                      {AssetCategoryLabels[cat as AssetCategory] || cat}:
                    </span>
                    <span className="font-semibold">{String(count)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card bg-green-900/10 border-green-800">
              <div className="text-sm text-dark-400 mb-1">
                Con Mantenimiento
              </div>
              <div className="text-3xl font-bold text-green-400">
                {data?.data.filter(
                  (t: AssetTemplate) => t.requiresPreventiveMaintenance,
                ).length || 0}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              className="input"
              placeholder="Buscar plantilla..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="input"
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as AssetCategory | "")
              }
            >
              <option value="">Todas las categorías</option>
              {Object.entries(AssetCategoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12 text-dark-400">
            Cargando plantillas...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card bg-red-900/20 border-red-800 text-red-400">
            Error al cargar plantillas:{" "}
            {error instanceof Error ? error.message : "Error desconocido"}
          </div>
        )}

        {/* Empty State */}
        {data && data.data && data.data.length === 0 && (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-dark-400 mb-4">No hay plantillas configuradas</p>
            <p className="text-sm text-dark-500 mb-6 max-w-md mx-auto">
              Las plantillas te permiten definir tipos de activos con campos
              personalizados. Por ejemplo: Retroexcavadora, Andamio, etc.
            </p>
            <button
              onClick={() => navigate("/machinery/templates/create")}
              className="btn-primary"
            >
              Crear primera plantilla
            </button>
          </div>
        )}

        {/* Templates Grid */}
        {data && data.data && data.data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.map((template: AssetTemplate) => (
              <div
                key={template.id}
                className="card hover:border-primary-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12">
                      {renderIcon(template.icon)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded border ${
                          categoryColors[template.category as AssetCategory]
                        }`}
                      >
                        {
                          AssetCategoryLabels[
                            template.category as AssetCategory
                          ]
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {template.description && (
                  <p className="text-dark-400 text-sm mb-4 line-clamp-2">
                    {template.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-400">
                      Campos personalizados:
                    </span>
                    <span className="font-medium">
                      {template.customFields.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-400">Activos creados:</span>
                    <span className="font-medium text-primary-400">
                      {template._count?.assets || 0}
                    </span>
                  </div>
                  {template.requiresPreventiveMaintenance && (
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <span>✓</span>
                      <span>Requiere mantenimiento preventivo</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-dark-700">
                  <button
                    onClick={() =>
                      navigate(`/machinery/templates/${template.id}/edit`)
                    }
                    className="btn-secondary flex-1 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="btn-ghost text-sm px-3"
                    title="Duplicar"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => handleDelete(template)}
                    className="btn-ghost text-red-400 hover:bg-red-900/20 text-sm px-3"
                    disabled={deleteMutation.isPending}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
