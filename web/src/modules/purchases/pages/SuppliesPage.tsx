/**
 * SUPPLIES PAGE
 * Gestión de suministros (catálogo de productos comprables)
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { supplyService } from "../services/supply.service";
import { supplyCategoryService } from "../services/supply-category.service";
import {
  Package2,
  Plus,
  Search,
  AlertTriangle,
  Pencil,
  Trash2,
  Archive,
  Upload,
} from "lucide-react";
import type { Supply } from "../types/supply.types";
import { CSVImportUpload } from "@/shared/components/CSVImportUpload.tsx";

export function SuppliesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [showInactive, setShowInactive] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Fetch supplies
  const { data: suppliesResponse, isLoading } = useQuery({
    queryKey: [
      "supplies",
      searchTerm,
      filterCategory,
      showInactive,
      showLowStock,
    ],
    queryFn: () =>
      supplyService.getAll({
        search: searchTerm || undefined,
        categoryId: filterCategory !== "ALL" ? filterCategory : undefined,
        isActive: showInactive ? undefined : true,
        lowStock: showLowStock || undefined,
      }),
  });

  // Fetch categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ["supply-categories"],
    queryFn: supplyCategoryService.getAll,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: supplyService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: supplyService.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
    },
  });

  const supplies = suppliesResponse?.data || [];

  const handleDelete = async (supply: Supply) => {
    if (
      window.confirm(
        `¿Eliminar "${supply.name}"?\n\nAdvertencia: No podrás eliminarlo si tiene transacciones asociadas.`,
      )
    ) {
      try {
        await deleteMutation.mutateAsync(supply.id);
      } catch (error: any) {
        alert(error?.response?.data?.error || "Error al eliminar suministro");
      }
    }
  };

  const handleToggleActive = async (supply: Supply) => {
    await toggleActiveMutation.mutateAsync(supply.id);
  };

  const handleImport = async (file: File) => {
    const result = await supplyService.importCSV(file);
    // Invalidar query para refrescar la lista
    queryClient.invalidateQueries({ queryKey: ["supplies"] });
    return result;
  };

  if (isLoading) {
    return (
      <Layout title="Suministros">
        <div className="p-8 text-center">
          <Package2 className="w-12 h-12 text-dark-500 mx-auto mb-4 animate-pulse" />
          <p className="text-dark-400">Cargando suministros...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Suministros"
      subtitle={`${supplies.length} suministro${supplies.length !== 1 ? "s" : ""} en catálogo · Productos comprables`}
      actions={
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Importar CSV
          </button>
          <button
            onClick={() => navigate("/supplies/new")}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Suministro
          </button>
        </div>
      }
    >
      <div className="p-8">
        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, código, SKU..."
                className="input pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="md:col-span-3">
              <select
                className="input w-full"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="ALL">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggles */}
            <div className="md:col-span-4 flex gap-3 items-center">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLowStock}
                  onChange={(e) => setShowLowStock(e.target.checked)}
                  className="rounded"
                />
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Stock bajo
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded"
                />
                <Archive className="w-4 h-4" />
                Ver inactivos
              </label>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {supplies.length === 0 && (
          <div className="card text-center py-12">
            <Package2 className="w-16 h-16 text-dark-500 mx-auto mb-4" />
            {searchTerm || filterCategory !== "ALL" || showLowStock ? (
              <>
                <h3 className="text-xl font-bold mb-2">
                  No se encontraron suministros
                </h3>
                <p className="text-dark-400 mb-6">
                  Intenta con otros filtros de búsqueda
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterCategory("ALL");
                    setShowLowStock(false);
                  }}
                  className="btn-secondary"
                >
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-2">
                  No hay suministros configurados
                </h3>
                <p className="text-dark-400 mb-4">
                  Los suministros son productos que puedes comprar y gestionar
                  en inventario.
                </p>
                <div className="bg-dark-700/50 rounded-lg p-4 mb-6 max-w-2xl mx-auto text-left">
                  <p className="text-sm text-dark-300 mb-2">
                    💡 <strong>Ejemplos:</strong>
                  </p>
                  <ul className="text-sm text-dark-400 space-y-1 ml-4">
                    <li>
                      • "Andamio Tubular" → Se compra y genera Assets
                      individuales
                    </li>
                    <li>
                      • "Aceite Motor 15W40" → Consumible para mantenimiento
                    </li>
                    <li>• "Filtro Aire" → Repuesto para equipos</li>
                  </ul>
                </div>
                <button
                  onClick={() => navigate("/supplies/new")}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Crear Primer Suministro
                </button>
              </>
            )}
          </div>
        )}

        {/* Supplies Table */}
        {supplies.length > 0 && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-800 border-b border-dark-700">
                  <tr>
                    <th className="text-left p-4">Código</th>
                    <th className="text-left p-4">Nombre</th>
                    <th className="text-left p-4">Categoría</th>
                    <th className="text-right p-4">Stock</th>
                    <th className="text-right p-4">Costo/Unit</th>
                    <th className="text-center p-4">Estado</th>
                    <th className="text-right p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {supplies.map((supply) => {
                    const isLowStock =
                      supply.minStock &&
                      supply.stock.toString() < supply.minStock.toString();

                    return (
                      <tr
                        key={supply.id}
                        className="border-b border-dark-800 hover:bg-dark-800/50 transition"
                      >
                        <td className="p-4">
                          <span className="font-mono text-sm text-primary-400">
                            {supply.code || "-"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{supply.name}</div>
                            {supply.sku && (
                              <div className="text-xs text-dark-400">
                                SKU: {supply.sku}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {supply.category && (
                            <span
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: `${supply.category.color}20`,
                                color: supply.category.color,
                                borderColor: supply.category.color,
                                borderWidth: "1px",
                              }}
                            >
                              {supply.category.icon} {supply.category.name}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isLowStock && (
                              <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            )}
                            <span
                              className={
                                isLowStock ? "text-yellow-400 font-bold" : ""
                              }
                            >
                              {supply.stock} {supply.unit}
                            </span>
                          </div>
                          {supply.minStock && (
                            <div className="text-xs text-dark-400">
                              Mín: {supply.minStock}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {supply.costPerUnit
                            ? `$${Number(supply.costPerUnit).toLocaleString()}`
                            : "-"}
                        </td>
                        <td className="p-4 text-center">
                          {supply.isActive ? (
                            <span className="px-2 py-1 rounded text-xs bg-green-900/40 text-green-400 border border-green-800">
                              Activo
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs bg-dark-700 text-dark-400 border border-dark-600">
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                navigate(`/supplies/${supply.id}/edit`)
                              }
                              className="p-2 rounded hover:bg-dark-700 text-blue-400 transition"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(supply)}
                              className="p-2 rounded hover:bg-dark-700 text-yellow-400 transition"
                              title={supply.isActive ? "Desactivar" : "Activar"}
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(supply)}
                              className="p-2 rounded hover:bg-dark-700 text-red-400 transition"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* CSV Import Modal */}
      {showImportModal && (
        <CSVImportUpload
          title="Importar Suministros desde CSV"
          description="Sube un archivo CSV con tus suministros. Descarga la plantilla para ver el formato requerido."
          templateName="import_supplies_initial.csv"
          templateUrl="/templates/import_supplies_initial.csv"
          onImport={handleImport}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </Layout>
  );
}
