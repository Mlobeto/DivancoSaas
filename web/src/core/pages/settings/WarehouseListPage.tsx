/**
 * Warehouse List Page
 *
 * Gestión de bodegas y talleres
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { ProtectedAction } from "@/core/components/ProtectedAction";
import {
  warehouseService,
  type Warehouse,
  WarehouseType,
} from "@/modules/inventory/services/warehouse.service";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Wrench,
  Building,
  MapPin,
  X,
} from "lucide-react";

const TYPE_CONFIG: Record<
  WarehouseType,
  { icon: any; label: string; className: string }
> = {
  BODEGA: {
    icon: Package,
    label: "Bodega",
    className: "bg-blue-900/30 text-blue-400 border-blue-800",
  },
  TALLER: {
    icon: Wrench,
    label: "Taller",
    className: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
  },
  OBRA: {
    icon: Building,
    label: "Obra",
    className: "bg-green-900/30 text-green-400 border-green-800",
  },
};

export function WarehouseListPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );

  // Fetch warehouses
  const { data, isLoading, error } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => warehouseService.list(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: warehouseService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la bodega "${name}"?`)) return;

    try {
      await deleteMutation.mutateAsync(id);
    } catch (error: any) {
      alert(error.message || "Error al eliminar la bodega");
    }
  };

  return (
    <Layout title="Bodegas y Talleres" subtitle="Gestión de ubicaciones">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Bodegas y Talleres
            </h1>
            <p className="text-gray-400 mt-1">
              Administra las ubicaciones de tus activos
            </p>
          </div>
          <ProtectedAction permission="assets:create">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nueva Bodega
            </button>
          </ProtectedAction>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">
            Cargando bodegas...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">
            Error al cargar bodegas: {(error as Error).message}
          </div>
        ) : data?.data && data.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.map((warehouse: Warehouse) => {
              const typeConfig = TYPE_CONFIG[warehouse.type];
              const TypeIcon = typeConfig.icon;

              return (
                <div
                  key={warehouse.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-5 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${typeConfig.className} border`}
                      >
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {warehouse.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {warehouse.code}
                        </p>
                      </div>
                    </div>
                  </div>

                  {warehouse.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{warehouse.address}</span>
                    </div>
                  )}

                  {warehouse.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {warehouse.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                    <span className="text-sm text-gray-400">
                      {warehouse._count?.assets || 0} activos
                    </span>

                    <div className="flex gap-2">
                      <ProtectedAction permission="assets:update">
                        <button
                          onClick={() => setEditingWarehouse(warehouse)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </ProtectedAction>
                      <ProtectedAction permission="assets:delete">
                        <button
                          onClick={() =>
                            handleDelete(warehouse.id, warehouse.name)
                          }
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                          title="Eliminar"
                          disabled={
                            (warehouse._count?.assets || 0) > 0 ||
                            deleteMutation.isPending
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </ProtectedAction>
                    </div>
                  </div>

                  {!warehouse.isActive && (
                    <div className="mt-3 px-2 py-1 bg-gray-900/50 border border-gray-700 rounded text-xs text-gray-400 text-center">
                      Inactivo
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No hay bodegas configuradas</p>
            <p className="text-sm mt-2">
              Crea la primera bodega para organizar tus activos
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingWarehouse) && (
        <WarehouseModal
          warehouse={editingWarehouse}
          onClose={() => {
            setShowCreateModal(false);
            setEditingWarehouse(null);
          }}
        />
      )}
    </Layout>
  );
}

// ============================================
// Warehouse Modal Component
// ============================================

interface WarehouseModalProps {
  warehouse: Warehouse | null;
  onClose: () => void;
}

function WarehouseModal({ warehouse, onClose }: WarehouseModalProps) {
  const queryClient = useQueryClient();
  const isEdit = !!warehouse;

  const [formData, setFormData] = useState({
    code: warehouse?.code || "",
    name: warehouse?.name || "",
    type: warehouse?.type || WarehouseType.BODEGA,
    address: warehouse?.address || "",
    description: warehouse?.description || "",
    isActive: warehouse?.isActive ?? true,
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) =>
      isEdit
        ? warehouseService.update(warehouse.id, data)
        : warehouseService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? "Editar Bodega" : "Nueva Bodega"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Código *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              required
              disabled={isEdit}
              placeholder="BOD-01"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="Bodega Central"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tipo *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as WarehouseType,
                })
              }
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={WarehouseType.BODEGA}>Bodega</option>
              <option value={WarehouseType.TALLER}>Taller</option>
              <option value={WarehouseType.OBRA}>Obra</option>
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Av. Principal #123"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              placeholder="Información adicional..."
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-300">
              Activo
            </label>
          </div>

          {/* Error */}
          {mutation.isError && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
              {(mutation.error as Error).message || "Error al guardar"}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {mutation.isPending
                ? "Guardando..."
                : isEdit
                  ? "Guardar"
                  : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
