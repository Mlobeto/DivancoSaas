/**
 * PURCHASE ORDERS PAGE
 * Página principal de gestión de órdenes de compra
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseOrderService } from "../services/purchase-order.service";
import { PurchaseOrderForm } from "../components/PurchaseOrderForm";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import {
  PurchaseOrder,
  PurchaseOrderFilters,
  PurchaseOrderStatus,
} from "../types/purchases.types";

export function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const { tenant, businessUnit } = useAuthStore();
  const [filters, setFilters] = useState<PurchaseOrderFilters>({
    page: 1,
    limit: 20,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null,
  );

  // Fetch purchase orders list
  const { data, isLoading, error } = useQuery({
    queryKey: ["purchase-orders", tenant?.id, businessUnit?.id, filters],
    queryFn: () => purchaseOrderService.list(filters),
    enabled: !!tenant?.id && !!businessUnit?.id,
  });

  // Confirm mutation
  const confirmMutation = useMutation({
    mutationFn: purchaseOrderService.confirm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: purchaseOrderService.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });

  const handleEdit = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setShowModal(true);
  };

  const handleConfirm = async (id: string) => {
    if (confirm("¿Confirmar esta orden de compra?")) {
      confirmMutation.mutate(id);
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm("¿Cancelar esta orden de compra?")) {
      cancelMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOrder(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    handleCloseModal();
  };

  const statusColors: Record<PurchaseOrderStatus, string> = {
    DRAFT: "bg-gray-700/30 text-gray-400 border-gray-600",
    CONFIRMED: "bg-blue-900/30 text-blue-400 border-blue-800",
    CANCELLED: "bg-red-900/30 text-red-400 border-red-800",
    PARTIALLY_RECEIVED: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
    COMPLETED: "bg-green-900/30 text-green-400 border-green-800",
  };

  const statusLabels: Record<PurchaseOrderStatus, string> = {
    DRAFT: "Borrador",
    CONFIRMED: "Confirmada",
    CANCELLED: "Cancelada",
    PARTIALLY_RECEIVED: "Parcial",
    COMPLETED: "Completada",
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
      title="Órdenes de Compra"
      subtitle={`Gestión de órdenes de compra - ${businessUnit.name}`}
      actions={
        <>
          <a href="/dashboard" className="btn-ghost">
            ← Dashboard
          </a>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Nueva Orden
          </button>
        </>
      }
    >
      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-3 gap-4">
          <select
            value={filters.status || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value as PurchaseOrderStatus | undefined,
                page: 1,
              })
            }
            className="form-input"
          >
            <option value="">Todos los estados</option>
            <option value={PurchaseOrderStatus.DRAFT}>Borrador</option>
            <option value={PurchaseOrderStatus.CONFIRMED}>Confirmada</option>
            <option value={PurchaseOrderStatus.CANCELLED}>Cancelada</option>
            <option value={PurchaseOrderStatus.PARTIALLY_RECEIVED}>
              Parcialmente Recibida
            </option>
            <option value={PurchaseOrderStatus.COMPLETED}>Completada</option>
          </select>

          <input
            type="date"
            value={filters.fromDate || ""}
            onChange={(e) =>
              setFilters({ ...filters, fromDate: e.target.value, page: 1 })
            }
            className="form-input"
            placeholder="Desde"
          />

          <input
            type="date"
            value={filters.toDate || ""}
            onChange={(e) =>
              setFilters({ ...filters, toDate: e.target.value, page: 1 })
            }
            className="form-input"
            placeholder="Hasta"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="spinner" />
          <p className="text-gray-400 mt-4">Cargando órdenes...</p>
        </div>
      )}

      {error && (
        <div className="card bg-red-900/20 border-red-800 text-red-400">
          <p>Error al cargar órdenes de compra</p>
          <p className="text-sm mt-2">
            {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      )}

      {data && data.data && (
        <>
          {/* Orders Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Proveedor</th>
                    <th>Fecha Esperada</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Items</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-8 text-gray-500"
                      >
                        No se encontraron órdenes de compra
                      </td>
                    </tr>
                  ) : (
                    data.data.map((order) => (
                      <tr key={order.id}>
                        <td className="font-mono font-semibold">
                          {order.code}
                        </td>
                        <td>
                          {order.supplier?.name || (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="text-sm">
                          {order.expectedDate
                            ? new Date(order.expectedDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${statusColors[order.status]}`}
                          >
                            {statusLabels[order.status]}
                          </span>
                        </td>
                        <td className="text-right font-semibold text-blue-400">
                          {order.total !== undefined
                            ? `$${order.total.toFixed(2)}`
                            : "-"}
                        </td>
                        <td className="text-center">
                          {order.items?.length || 0}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="btn-ghost text-sm"
                              title="Ver detalles"
                            >
                              Ver
                            </button>
                            {order.status === PurchaseOrderStatus.DRAFT && (
                              <>
                                <button
                                  onClick={() => handleEdit(order)}
                                  className="btn-ghost text-sm"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleConfirm(order.id)}
                                  className="btn-ghost text-sm text-blue-400"
                                  disabled={confirmMutation.isPending}
                                >
                                  Confirmar
                                </button>
                              </>
                            )}
                            {(order.status === PurchaseOrderStatus.DRAFT ||
                              order.status ===
                                PurchaseOrderStatus.CONFIRMED) && (
                              <button
                                onClick={() => handleCancel(order.id)}
                                className="btn-ghost text-sm text-red-400"
                                disabled={cancelMutation.isPending}
                              >
                                Cancelar
                              </button>
                            )}
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
                Mostrando {data.data.length} de {data.pagination.total} órdenes
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
          <div className="modal-content max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingOrder ? "Editar Orden" : "Nueva Orden de Compra"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <PurchaseOrderForm
              order={editingOrder || undefined}
              onSuccess={handleSuccess}
              onCancel={handleCloseModal}
            />
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Detalles de la Orden</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Código</label>
                  <p className="font-mono font-bold text-lg">
                    {selectedOrder.code}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Estado</label>
                  <p>
                    <span
                      className={`status-badge ${statusColors[selectedOrder.status]}`}
                    >
                      {statusLabels[selectedOrder.status]}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Proveedor</label>
                <p className="text-lg font-semibold">
                  {selectedOrder.supplier?.name || "-"}
                </p>
              </div>

              {selectedOrder.expectedDate && (
                <div>
                  <label className="text-sm text-gray-400">
                    Fecha Esperada
                  </label>
                  <p>
                    {new Date(selectedOrder.expectedDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <label className="text-sm text-gray-400 mb-3 block">
                    Items
                  </label>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-800/40 rounded p-3 grid grid-cols-12 gap-3 items-center"
                      >
                        <div className="col-span-5">
                          <p className="font-semibold">
                            {item.supply?.name || "Insumo"}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">
                            {item.supplyId}
                          </p>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className="text-sm text-gray-400">Cantidad</p>
                          <p>{item.quantity}</p>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className="text-sm text-gray-400">P. Unit</p>
                          <p>${item.unitPrice.toFixed(2)}</p>
                        </div>
                        <div className="col-span-3 text-right">
                          <p className="text-sm text-gray-400">Subtotal</p>
                          <p className="font-semibold text-blue-400">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-3 border-t border-gray-700 mt-3">
                    <div className="text-right">
                      <span className="text-gray-400 mr-3">Total:</span>
                      <span className="text-2xl font-bold text-blue-400">
                        ${selectedOrder.total?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedOrder.notes && (
                <div>
                  <label className="text-sm text-gray-400">Notas</label>
                  <p className="text-sm bg-gray-800/30 p-3 rounded">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-700">
                {selectedOrder.status === PurchaseOrderStatus.DRAFT && (
                  <>
                    <button
                      onClick={() => {
                        handleEdit(selectedOrder);
                        setSelectedOrder(null);
                      }}
                      className="btn-primary"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        handleConfirm(selectedOrder.id);
                        setSelectedOrder(null);
                      }}
                      className="btn-primary bg-blue-600 hover:bg-blue-700"
                    >
                      Confirmar
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
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
