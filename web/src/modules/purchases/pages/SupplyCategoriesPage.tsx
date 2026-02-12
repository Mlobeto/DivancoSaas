/**
 * SUPPLY CATEGORIES PAGE
 * Gestión de categorías configurables de supplies
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { supplyCategoryService } from "../services/supply-category.service";
import { SupplyCategoryType } from "../types/supply-category.types";

const CATEGORY_TYPE_LABELS = {
  [SupplyCategoryType.CONSUMABLE]: "Consumible",
  [SupplyCategoryType.SPARE_PART]: "Repuesto",
  [SupplyCategoryType.RAW_MATERIAL]: "Materia Prima",
  [SupplyCategoryType.FINISHED_PRODUCT]: "Producto Terminado",
  [SupplyCategoryType.TOOL]: "Herramienta",
  [SupplyCategoryType.OTHER]: "Otro",
};

export function SupplyCategoriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<SupplyCategoryType | "ALL">(
    "ALL",
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["supply-categories"],
    queryFn: supplyCategoryService.getAll,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: supplyCategoryService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supply-categories"] });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: supplyCategoryService.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supply-categories"] });
    },
  });

  // Filter categories
  const filteredCategories = categories.filter((cat) => {
    const matchesType = filterType === "ALL" || cat.type === filterType;
    const matchesSearch =
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Group by type
  const groupedCategories = filteredCategories.reduce(
    (acc, cat) => {
      if (!acc[cat.type]) {
        acc[cat.type] = [];
      }
      acc[cat.type].push(cat);
      return acc;
    },
    {} as Record<SupplyCategoryType, typeof categories>,
  );

  const handleDelete = async (id: string, name: string) => {
    if (
      window.confirm(
        `¿Eliminar la categoría "${name}"?\n\nAdvertencia: No podrás eliminarla si hay suministros asignados.`,
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Layout title="Categorías de Suministros">
        <div className="p-8 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-dark-400">Cargando categorías...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Categorías de Suministros"
      subtitle={`${categories.length} categoría${categories.length !== 1 ? "s" : ""} configurada${categories.length !== 1 ? "s" : ""} · Implementos, Insumos, Repuestos y más`}
      actions={
        <button
          onClick={() => navigate("/purchases/categories/new")}
          className="btn-primary"
        >
          + Nueva Categoría
        </button>
      }
    >
      <div className="p-8">
        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              className="input flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="input md:w-64"
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as SupplyCategoryType | "ALL")
              }
            >
              <option value="ALL">Todos los tipos</option>
              {Object.entries(CATEGORY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            {searchTerm || filterType !== "ALL" ? (
              <>
                <h3 className="text-xl font-bold mb-2">
                  No se encontraron categorías
                </h3>
                <p className="text-dark-400 mb-6">
                  Intenta con otros filtros de búsqueda
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("ALL");
                  }}
                  className="btn-secondary"
                >
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-2">
                  No hay categorías configuradas
                </h3>
                <p className="text-dark-400 mb-4">
                  Las <strong>categorías</strong> son etiquetas personalizadas
                  para organizar tus suministros.
                </p>
                <div className="bg-dark-700/50 rounded-lg p-4 mb-6 max-w-2xl mx-auto text-left">
                  <p className="text-sm text-dark-300 mb-2">
                    💡 <strong>Ejemplo:</strong>
                  </p>
                  <ul className="text-sm text-dark-400 space-y-1 ml-4">
                    <li>
                      • Tipo CONSUMIBLE → Categorías: "Lubricantes", "Filtros",
                      "Tintas"
                    </li>
                    <li>
                      • Tipo REPUESTO → Categorías: "Neumáticos CAT", "Repuestos
                      JCB"
                    </li>
                    <li>
                      • Tipo HERRAMIENTA → Categorías: "Herramientas
                      Eléctricas", "Manuales"
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => navigate("/purchases/categories/new")}
                  className="btn-primary"
                >
                  + Crear Primera Categoría
                </button>
              </>
            )}
          </div>
        )}

        {/* Categories Grid - Grouped by Type */}
        {Object.entries(groupedCategories).map(([type, cats]) => (
          <div key={type} className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-primary-400">■</span>
              {CATEGORY_TYPE_LABELS[type as SupplyCategoryType]}
              <span className="text-dark-400 text-sm font-normal">
                ({cats.length})
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cats.map((category) => (
                <div
                  key={category.id}
                  className="card hover:border-dark-600 transition-all group relative"
                  style={{
                    borderLeft: `4px solid ${category.color || "#4B5563"}`,
                  }}
                >
                  {/* Status Badge */}
                  {!category.isActive && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 rounded text-xs bg-red-900/40 text-red-400 border border-red-800">
                        Inactiva
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className="text-4xl" title={category.icon || "📦"}>
                      {category.icon || "📦"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold truncate">{category.name}</h3>
                      </div>

                      <div
                        className="inline-block px-2 py-0.5 rounded text-xs font-mono mb-2"
                        style={{
                          backgroundColor: category.color || "#4B5563",
                          color: "white",
                        }}
                      >
                        {category.code}
                      </div>

                      {category.description && (
                        <p className="text-sm text-dark-400 line-clamp-2 mb-3">
                          {category.description}
                        </p>
                      )}

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 text-xs mb-3">
                        {category.requiresSerialTracking && (
                          <span className="px-2 py-1 rounded bg-dark-800">
                            🔢 Serie
                          </span>
                        )}
                        {category.requiresExpiryDate && (
                          <span className="px-2 py-1 rounded bg-dark-800">
                            📅 Vencimiento
                          </span>
                        )}
                        {category.allowsNegativeStock && (
                          <span className="px-2 py-1 rounded bg-dark-800">
                            ⚠️ Stock -
                          </span>
                        )}
                        {category.defaultReorderPoint && (
                          <span className="px-2 py-1 rounded bg-dark-800">
                            🔔 Reorden: {category.defaultReorderPoint}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate(
                              `/purchases/categories/${category.id}/edit`,
                            )
                          }
                          className="btn-ghost text-xs"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() =>
                            toggleActiveMutation.mutate(category.id)
                          }
                          className="btn-ghost text-xs"
                          disabled={toggleActiveMutation.isPending}
                        >
                          {category.isActive ? "⏸️ Desactivar" : "▶️ Activar"}
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(category.id, category.name)
                          }
                          className="btn-ghost text-xs text-red-400 hover:bg-red-900/20"
                          disabled={deleteMutation.isPending}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Info Box */}
        <div className="card bg-blue-900/20 border-blue-800 mt-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">
                Categorías configurables por Business Unit
              </h3>
              <p className="text-sm text-blue-300">
                Cada unidad de negocio puede definir sus propias categorías
                según su rubro. Una constructora puede tener "Lubricantes" y
                "Filtros", mientras que una textil puede tener "Telas" e
                "Hilos". El sistema se adapta a tus necesidades.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
