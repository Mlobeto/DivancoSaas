/**
 * SUPPLIERS PAGE
 * Página principal de gestión de proveedores
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierService } from "../services/supplier.service";
import { SupplierForm } from "../components/SupplierForm";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import {
  Supplier,
  SupplierFilters,
  SupplierStatus,
} from "../types/purchases.types";

export function SuppliersPage() {
  const queryClient = useQueryClient();
  const { tenant, businessUnit } = useAuthStore();
  const [filters, setFilters] = useState<SupplierFilters>({
    page: 1,
    limit: 20,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );

  // Fetch suppliers list
  const { data, isLoading, error } = useQuery({
    queryKey: ["suppliers", tenant?.id, businessUnit?.id, filters],
    queryFn: () => supplierService.list(filters),
    enabled: !!tenant?.id && !!businessUnit?.id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: supplierService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este proveedor?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    handleCloseModal();
  };

  const statusColors: Record<SupplierStatus, string> = {
    ACTIVE: "bg-green-900/30 text-green-400 border-green-800",
    INACTIVE: "bg-gray-700/30 text-gray-400 border-gray-600",
    BLOCKED: "bg-red-900/30 text-red-400 border-red-800",
  };

  const statusLabels: Record<SupplierStatus, string> = {
    ACTIVE: "Activo",
    INACTIVE: "Inactivo",
    BLOCKED: "Bloqueado",
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
      title="Proveedores"
      subtitle={`Gestión de proveedores y cuenta corriente - ${businessUnit.name}`}
      actions={
        <>
          <a href="/dashboard" className="btn-ghost">
            ← Dashboard
          </a>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Nuevo Proveedor
          </button>
        </>
      }
    >
      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre, código o tax ID..."
            value={filters.search || ""}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value, page: 1 })
            }
            className="form-input col-span-2"
          />

          <select
            value={filters.status || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value as SupplierStatus | undefined,
                page: 1,
              })
            }
            className="form-input"
          >
            <option value="">Todos los estados</option>
            <option value={SupplierStatus.ACTIVE}>Activos</option>
            <option value={SupplierStatus.INACTIVE}>Inactivos</option>
            <option value={SupplierStatus.BLOCKED}>Bloqueados</option>
          </select>

          <input
            type="text"
            placeholder="País"
            value={filters.country || ""}
            onChange={(e) =>
              setFilters({ ...filters, country: e.target.value, page: 1 })
            }
            className="form-input"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="spinner" />
          <p className="text-gray-400 mt-4">Cargando proveedores...</p>
        </div>
      )}

      {error && (
        <div className="card bg-red-900/20 border-red-800 text-red-400">
          <p>Error al cargar proveedores</p>
          <p className="text-sm mt-2">
            {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      )}

      {data && data.data && (
        <>
          {/* Suppliers Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Tax ID</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>País</th>
                    <th>Estado</th>
                    <th>Balance</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="text-center py-8 text-gray-500"
                      >
                        No se encontraron proveedores
                      </td>
                    </tr>
                  ) : (
                    data.data.map((supplier) => (
                      <tr key={supplier.id}>
                        <td className="font-mono">{supplier.code}</td>
                        <td>
                          <div>
                            <div className="font-semibold">{supplier.name}</div>
                            {supplier.tradeName && (
                              <div className="text-sm text-gray-400">
                                {supplier.tradeName}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="font-mono text-sm">
                          {supplier.taxId || "-"}
                        </td>
                        <td className="text-sm">{supplier.email || "-"}</td>
                        <td className="text-sm">{supplier.phone || "-"}</td>
                        <td className="text-sm">{supplier.country || "-"}</td>
                        <td>
                          <span
                            className={`status-badge ${statusColors[supplier.status]}`}
                          >
                            {statusLabels[supplier.status]}
                          </span>
                        </td>
                        <td className="text-right">
                          {supplier.accountBalance !== undefined ? (
                            <span
                              className={
                                supplier.accountBalance < 0
                                  ? "text-red-400 font-semibold"
                                  : "text-gray-300"
                              }
                            >
                              ${supplier.accountBalance.toFixed(2)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedSupplier(supplier)}
                              className="btn-ghost text-sm"
                              title="Ver detalles"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => handleEdit(supplier)}
                              className="btn-ghost text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(supplier.id)}
                              className="btn-ghost text-sm text-red-400"
                              disabled={deleteMutation.isPending}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <p className="text-sm text-gray-400">
                Mostrando {data.data.length} de {data.pagination.total}{" "}
                proveedores
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page! - 1 })
                  }
                  disabled={filters.page === 1}
                  className="btn-ghost"
                >
                  ← Anterior
                </button>
                <span className="px-4 py-2 text-gray-300">
                  Página {filters.page} de {data.pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page! + 1 })
                  }
                  disabled={filters.page === data.pagination.totalPages}
                  className="btn-ghost"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <SupplierForm
              supplier={editingSupplier || undefined}
              onSuccess={handleSuccess}
              onCancel={handleCloseModal}
            />
          </div>
        </div>
      )}

      {/* Supplier Details Modal */}
      {selectedSupplier && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Detalles del Proveedor</h2>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="text-gray-400 hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Código</label>
                  <p className="font-mono">{selectedSupplier.code}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Estado</label>
                  <p>
                    <span
                      className={`status-badge ${statusColors[selectedSupplier.status]}`}
                    >
                      {statusLabels[selectedSupplier.status]}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Nombre</label>
                <p className="text-lg font-semibold">{selectedSupplier.name}</p>
                {selectedSupplier.tradeName && (
                  <p className="text-sm text-gray-400">
                    {selectedSupplier.tradeName}
                  </p>
                )}
              </div>

              {selectedSupplier.taxId && (
                <div>
                  <label className="text-sm text-gray-400">Tax ID</label>
                  <p className="font-mono">{selectedSupplier.taxId}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedSupplier.email && (
                  <div>
                    <label className="text-sm text-gray-400">Email</label>
                    <p>{selectedSupplier.email}</p>
                  </div>
                )}
                {selectedSupplier.phone && (
                  <div>
                    <label className="text-sm text-gray-400">Teléfono</label>
                    <p>{selectedSupplier.phone}</p>
                  </div>
                )}
              </div>

              {selectedSupplier.notes && (
                <div>
                  <label className="text-sm text-gray-400">Notas</label>
                  <p className="text-sm">{selectedSupplier.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    handleEdit(selectedSupplier);
                    setSelectedSupplier(null);
                  }}
                  className="btn-primary"
                >
                  Editar
                </button>
                <button
                  onClick={() => setSelectedSupplier(null)}
                  className="btn-ghost"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
