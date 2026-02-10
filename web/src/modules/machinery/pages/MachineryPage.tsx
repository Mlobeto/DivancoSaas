import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  machineryService,
  type Machinery,
  type MachineryFilters,
} from "@/modules/machinery/services/machinery.service";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";

export function MachineryPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { tenant, businessUnit } = useAuthStore();
  const [filters, setFilters] = useState<MachineryFilters>({
    page: 1,
    limit: 20,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingMachinery, setEditingMachinery] = useState<Machinery | null>(
    null,
  );

  // Fetch machinery list
  const { data, isLoading, error } = useQuery({
    queryKey: ["machinery", tenant?.id, businessUnit?.id, filters],
    queryFn: () => machineryService.list(filters),
    enabled: !!tenant?.id && !!businessUnit?.id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: machineryService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machinery"] });
    },
  });

  const handleEdit = (machinery: Machinery) => {
    setEditingMachinery(machinery);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta maquinaria?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMachinery(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["machinery"] });
    handleCloseModal();
  };

  const statusColors: Record<Machinery["status"], string> = {
    AVAILABLE: "bg-green-900/30 text-green-400 border-green-800",
    RENTED: "bg-blue-900/30 text-blue-400 border-blue-800",
    MAINTENANCE: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
    OUT_OF_SERVICE: "bg-red-900/30 text-red-400 border-red-800",
    RESERVED: "bg-purple-900/30 text-purple-400 border-purple-800",
  };

  const conditionColors: Record<Machinery["condition"], string> = {
    EXCELLENT: "text-green-400",
    GOOD: "text-blue-400",
    FAIR: "text-yellow-400",
    POOR: "text-red-400",
  };

  // Validar contexto
  if (!tenant || !businessUnit) {
    return (
      <Layout>
        <div className="p-8">
          <div className="card bg-yellow-900/20 border-yellow-800 text-yellow-400">
            <p>
              No se ha seleccionado un tenant o business unit. Por favor,
              configura tu contexto.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Maquinaria"
      subtitle={`Gestión de maquinaria e implementos - ${businessUnit.name}`}
      actions={
        <>
          <a href="/dashboard" className="btn-ghost">
            ← Dashboard
          </a>
          <button
            onClick={() => navigate("/machinery/templates")}
            className="btn-secondary"
          >
            ⚙️ Plantillas
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Nueva Maquinaria
          </button>
        </>
      }
    >
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
                  status: (e.target.value as Machinery["status"]) || undefined,
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
                    (e.target.value as Machinery["condition"]) || undefined,
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

        {/* Machinery List */}
        {isLoading && (
          <div className="text-center py-12 text-dark-400">
            Cargando maquinaria...
          </div>
        )}

        {error && (
          <div className="card bg-red-900/20 border-red-800 text-red-400">
            Error al cargar maquinaria:{" "}
            {error instanceof Error ? error.message : "Error desconocido"}
          </div>
        )}

        {data && data.data && data.data.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-dark-400 mb-4">No hay maquinaria registrada</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Crear primera maquinaria
            </button>
          </div>
        )}

        {data && data.data && data.data.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.data.map((machinery) => (
                <div
                  key={machinery.id}
                  className="card hover:border-primary-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {machinery.name}
                      </h3>
                      <p className="text-dark-400 text-sm">{machinery.code}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded border ${statusColors[machinery.status]}`}
                    >
                      {machinery.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-400">Categoría:</span>
                      <span className="font-medium">{machinery.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-400">Condición:</span>
                      <span
                        className={`font-medium ${conditionColors[machinery.condition]}`}
                      >
                        {machinery.condition}
                      </span>
                    </div>
                    {machinery.dailyRate > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-dark-400">Tarifa diaria:</span>
                        <span className="font-medium text-primary-400">
                          ${machinery.dailyRate.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {machinery.description && (
                    <p className="text-dark-400 text-sm mb-4 line-clamp-2">
                      {machinery.description}
                    </p>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-dark-700">
                    <button
                      onClick={() => handleEdit(machinery)}
                      className="btn-secondary flex-1 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(machinery.id)}
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
        <MachineryModal
          machinery={editingMachinery}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}
    </Layout>
  );
}

// Machinery Modal Component
function MachineryModal({
  machinery,
  onClose,
  onSuccess,
}: {
  machinery: Machinery | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    code: machinery?.code || "",
    name: machinery?.name || "",
    category: machinery?.category || "",
    description: machinery?.description || "",
    dailyRate: machinery?.dailyRate || 0,
    weeklyRate: machinery?.weeklyRate || 0,
    monthlyRate: machinery?.monthlyRate || 0,
    status: machinery?.status || ("AVAILABLE" as Machinery["status"]),
    condition: machinery?.condition || ("GOOD" as Machinery["condition"]),
  });

  const mutation = useMutation({
    mutationFn: machinery
      ? (data: typeof formData) => machineryService.update(machinery.id, data)
      : machineryService.create,
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
            {machinery ? "Editar Maquinaria" : "Nueva Maquinaria"}
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
                    status: e.target.value as Machinery["status"],
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
                    condition: e.target.value as Machinery["condition"],
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
