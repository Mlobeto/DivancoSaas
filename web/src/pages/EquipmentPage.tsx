import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  equipmentService,
  type Equipment,
  type EquipmentFilters,
} from "@/services/equipment.service";

export function EquipmentPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<EquipmentFilters>({
    page: 1,
    limit: 20,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(
    null,
  );

  // Fetch equipment list
  const { data, isLoading, error } = useQuery({
    queryKey: ["equipment", filters],
    queryFn: () => equipmentService.list(filters),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: equipmentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
  });

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este equipo?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEquipment(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["equipment"] });
    handleCloseModal();
  };

  const statusColors: Record<Equipment["status"], string> = {
    AVAILABLE: "bg-green-900/30 text-green-400 border-green-800",
    RENTED: "bg-blue-900/30 text-blue-400 border-blue-800",
    MAINTENANCE: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
    OUT_OF_SERVICE: "bg-red-900/30 text-red-400 border-red-800",
    RESERVED: "bg-purple-900/30 text-purple-400 border-purple-800",
  };

  const conditionColors: Record<Equipment["condition"], string> = {
    EXCELLENT: "text-green-400",
    GOOD: "text-blue-400",
    FAIR: "text-yellow-400",
    POOR: "text-red-400",
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="header px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Equipment</h1>
            <p className="text-dark-400 text-sm mt-1">
              Gestión de equipos e implementos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="btn-ghost">
              ← Dashboard
            </a>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              + Nuevo Equipo
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              className="input"
              placeholder="Buscar por código, nombre..."
              value={filters.q || ""}
              onChange={(e) =>
                setFilters({ ...filters, q: e.target.value, page: 1 })
              }
            />

            <select
              className="input"
              value={filters.status || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: (e.target.value as Equipment["status"]) || undefined,
                  page: 1,
                })
              }
            >
              <option value="">Todos los estados</option>
              <option value="AVAILABLE">Disponible</option>
              <option value="RENTED">Rentado</option>
              <option value="MAINTENANCE">Mantenimiento</option>
              <option value="OUT_OF_SERVICE">Fuera de servicio</option>
              <option value="RESERVED">Reservado</option>
            </select>

            <select
              className="input"
              value={filters.condition || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  condition:
                    (e.target.value as Equipment["condition"]) || undefined,
                  page: 1,
                })
              }
            >
              <option value="">Todas las condiciones</option>
              <option value="EXCELLENT">Excelente</option>
              <option value="GOOD">Bueno</option>
              <option value="FAIR">Regular</option>
              <option value="POOR">Malo</option>
            </select>

            <input
              type="text"
              className="input"
              placeholder="Categoría..."
              value={filters.category || ""}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value, page: 1 })
              }
            />
          </div>
        </div>

        {/* Equipment List */}
        {isLoading && (
          <div className="text-center py-12 text-dark-400">
            Cargando equipos...
          </div>
        )}

        {error && (
          <div className="card bg-red-900/20 border-red-800 text-red-400">
            Error al cargar equipos:{" "}
            {error instanceof Error ? error.message : "Error desconocido"}
          </div>
        )}

        {data && data.data.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-dark-400 mb-4">No hay equipos registrados</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Crear primer equipo
            </button>
          </div>
        )}

        {data && data.data.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.data.map((equipment) => (
                <div
                  key={equipment.id}
                  className="card hover:border-primary-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {equipment.name}
                      </h3>
                      <p className="text-dark-400 text-sm">{equipment.code}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded border ${statusColors[equipment.status]}`}
                    >
                      {equipment.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-400">Categoría:</span>
                      <span className="font-medium">{equipment.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-400">Condición:</span>
                      <span
                        className={`font-medium ${conditionColors[equipment.condition]}`}
                      >
                        {equipment.condition}
                      </span>
                    </div>
                    {equipment.dailyRate > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-dark-400">Tarifa diaria:</span>
                        <span className="font-medium text-primary-400">
                          ${equipment.dailyRate.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {equipment.description && (
                    <p className="text-dark-400 text-sm mb-4 line-clamp-2">
                      {equipment.description}
                    </p>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-dark-700">
                    <button
                      onClick={() => handleEdit(equipment)}
                      className="btn-secondary flex-1 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(equipment.id)}
                      className="btn-ghost text-red-400 hover:bg-red-900/20 text-sm"
                      disabled={deleteMutation.isPending}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: (filters.page || 1) - 1 })
                  }
                  disabled={!data.pagination.hasPrev}
                  className="btn-secondary disabled:opacity-50"
                >
                  ← Anterior
                </button>
                <span className="text-dark-400 px-4">
                  Página {data.pagination.page} de {data.pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: (filters.page || 1) + 1 })
                  }
                  disabled={!data.pagination.hasNext}
                  className="btn-secondary disabled:opacity-50"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <EquipmentModal
          equipment={editingEquipment}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

// Equipment Modal Component
function EquipmentModal({
  equipment,
  onClose,
  onSuccess,
}: {
  equipment: Equipment | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    code: equipment?.code || "",
    name: equipment?.name || "",
    category: equipment?.category || "",
    description: equipment?.description || "",
    dailyRate: equipment?.dailyRate || 0,
    weeklyRate: equipment?.weeklyRate || 0,
    monthlyRate: equipment?.monthlyRate || 0,
    status: equipment?.status || ("AVAILABLE" as Equipment["status"]),
    condition: equipment?.condition || ("GOOD" as Equipment["condition"]),
  });

  const mutation = useMutation({
    mutationFn: equipment
      ? (data: typeof formData) => equipmentService.update(equipment.id, data)
      : equipmentService.create,
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 border border-dark-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-dark-700 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {equipment ? "Editar Equipo" : "Nuevo Equipo"}
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Código *</label>
              <input
                type="text"
                className="input"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Categoría *
              </label>
              <input
                type="text"
                className="input"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nombre *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Descripción
            </label>
            <textarea
              className="input"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tarifa Diaria
              </label>
              <input
                type="number"
                className="input"
                value={formData.dailyRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dailyRate: Number(e.target.value),
                  })
                }
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tarifa Semanal
              </label>
              <input
                type="number"
                className="input"
                value={formData.weeklyRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weeklyRate: Number(e.target.value),
                  })
                }
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tarifa Mensual
              </label>
              <input
                type="number"
                className="input"
                value={formData.monthlyRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monthlyRate: Number(e.target.value),
                  })
                }
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Estado</label>
              <select
                className="input"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Equipment["status"],
                  })
                }
              >
                <option value="AVAILABLE">Disponible</option>
                <option value="RENTED">Rentado</option>
                <option value="MAINTENANCE">Mantenimiento</option>
                <option value="OUT_OF_SERVICE">Fuera de servicio</option>
                <option value="RESERVED">Reservado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Condición
              </label>
              <select
                className="input"
                value={formData.condition}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    condition: e.target.value as Equipment["condition"],
                  })
                }
              >
                <option value="EXCELLENT">Excelente</option>
                <option value="GOOD">Bueno</option>
                <option value="FAIR">Regular</option>
                <option value="POOR">Malo</option>
              </select>
            </div>
          </div>

          {mutation.error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Error al guardar"}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
