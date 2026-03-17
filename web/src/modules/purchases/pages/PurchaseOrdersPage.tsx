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
  const { tenant, businessUnit, permissions } = useAuthStore();
  const [filters, setFilters] = useState<PurchaseOrderFilters>({
    page: 1,
    limit: 20,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [rejectModal, setRejectModal] = useState<{ orderId: string } | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");
  const [approveModal, setApproveModal] = useState<{ orderId: string } | null>(
    null,
  );
  const [approveNotes, setApproveNotes] = useState("");

  const canCreate = permissions.includes("purchase-orders:create");
  const canApprove = permissions.includes("purchase-orders:approve");

  // Fetch purchase orders list
  const { data, isLoading, error } = useQuery({
    queryKey: ["purchase-orders", tenant?.id, businessUnit?.id, filters],
    queryFn: () => purchaseOrderService.list(filters),
    enabled: !!tenant?.id && !!businessUnit?.id,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });

  const submitMutation = useMutation({
    mutationFn: purchaseOrderService.submitForApproval,
    onSuccess: invalidate,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      purchaseOrderService.approve(id, notes),
    onSuccess: () => {
      invalidate();
      setApproveModal(null);
      setApproveNotes("");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      purchaseOrderService.reject(id, reason),
    onSuccess: () => {
      invalidate();
      setRejectModal(null);
      setRejectReason("");
    },
  });

  const confirmMutation = useMutation({
    mutationFn: purchaseOrderService.confirm,
    onSuccess: invalidate,
  });

  const cancelMutation = useMutation({
    mutationFn: purchaseOrderService.cancel,
    onSuccess: invalidate,
  });

  const handleEdit = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOrder(null);
  };

  const handleSuccess = () => {
    invalidate();
    handleCloseModal();
  };

  const statusConfig: Record<
    PurchaseOrderStatus,
    { label: string; className: string }
  > = {
    DRAFT: {
      label: "Borrador",
      className: "bg-gray-700/30 text-gray-400 border-gray-600",
    },
    PENDING_APPROVAL: {
      label: "Pendiente Aprobación",
      className: "bg-orange-900/30 text-orange-400 border-orange-800",
    },
    REJECTED: {
      label: "Rechazada",
      className: "bg-red-900/30 text-red-400 border-red-800",
    },
    APPROVED: {
      label: "Aprobada",
      className: "bg-teal-900/30 text-teal-400 border-teal-800",
    },
    SENT: {
      label: "Enviada",
      className: "bg-blue-900/30 text-blue-400 border-blue-800",
    },
    CONFIRMED: {
      label: "Confirmada",
      className: "bg-indigo-900/30 text-indigo-400 border-indigo-800",
    },
    PARTIALLY_RECEIVED: {
      label: "Parcial",
      className: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
    },
    RECEIVED: {
      label: "Recibida",
      className: "bg-green-900/30 text-green-400 border-green-800",
    },
    CANCELLED: {
      label: "Cancelada",
      className: "bg-gray-900/30 text-gray-500 border-gray-700",
    },
  };

  const editableStatuses: PurchaseOrderStatus[] = [
    PurchaseOrderStatus.DRAFT,
    PurchaseOrderStatus.REJECTED,
  ];

  const cancellableStatuses: PurchaseOrderStatus[] = [
    PurchaseOrderStatus.DRAFT,
    PurchaseOrderStatus.PENDING_APPROVAL,
    PurchaseOrderStatus.REJECTED,
    PurchaseOrderStatus.APPROVED,
  ];

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
      title="Órdenes de Compra"
      subtitle={`Gestión de órdenes de compra - ${businessUnit.name}`}
      actions={
        <>
          <a href="/dashboard" className="btn-ghost">
            ← Dashboard
          </a>
          {canCreate && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              + Nueva Orden
            </button>
          )}
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
                status: (e.target.value as PurchaseOrderStatus) || undefined,
                page: 1,
              })
            }
            className="form-input"
          >
            <option value="">Todos los estados</option>
            <option value={PurchaseOrderStatus.DRAFT}>Borrador</option>
            <option value={PurchaseOrderStatus.PENDING_APPROVAL}>
              Pendiente Aprobación
            </option>
            <option value={PurchaseOrderStatus.REJECTED}>Rechazada</option>
            <option value={PurchaseOrderStatus.APPROVED}>Aprobada</option>
            <option value={PurchaseOrderStatus.SENT}>Enviada</option>
            <option value={PurchaseOrderStatus.CONFIRMED}>Confirmada</option>
            <option value={PurchaseOrderStatus.PARTIALLY_RECEIVED}>
              Parcialmente Recibida
            </option>
            <option value={PurchaseOrderStatus.RECEIVED}>Recibida</option>
            <option value={PurchaseOrderStatus.CANCELLED}>Cancelada</option>
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
                            className={`status-badge ${statusConfig[order.status].className}`}
                          >
                            {statusConfig[order.status].label}
                          </span>
                        </td>
                        <td className="text-right font-semibold text-blue-400">
                          {order.total !== undefined
                            ? `$${Number(order.total).toFixed(2)}`
                            : "-"}
                        </td>
                        <td className="text-center">
                          {(order as any)._count?.items ??
                            order.items?.length ??
                            0}
                        </td>
                        <td>
                          <div className="flex gap-1 flex-wrap">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="btn-ghost text-xs"
                            >
                              Ver
                            </button>

                            {/* Creador: editar en DRAFT o REJECTED */}
                            {canCreate &&
                              editableStatuses.includes(order.status) && (
                                <button
                                  onClick={() => handleEdit(order)}
                                  className="btn-ghost text-xs"
                                >
                                  Editar
                                </button>
                              )}

                            {/* Creador: enviar a aprobación */}
                            {canCreate &&
                              editableStatuses.includes(order.status) && (
                                <button
                                  onClick={() =>
                                    submitMutation.mutate(order.id)
                                  }
                                  className="btn-ghost text-xs text-orange-400"
                                  disabled={submitMutation.isPending}
                                >
                                  Enviar
                                </button>
                              )}

                            {/* Aprobador: aprobar */}
                            {canApprove &&
                              order.status ===
                                PurchaseOrderStatus.PENDING_APPROVAL && (
                                <button
                                  onClick={() =>
                                    setApproveModal({ orderId: order.id })
                                  }
                                  className="btn-ghost text-xs text-teal-400"
                                >
                                  Aprobar
                                </button>
                              )}

                            {/* Aprobador: rechazar */}
                            {canApprove &&
                              order.status ===
                                PurchaseOrderStatus.PENDING_APPROVAL && (
                                <button
                                  onClick={() =>
                                    setRejectModal({ orderId: order.id })
                                  }
                                  className="btn-ghost text-xs text-red-400"
                                >
                                  Rechazar
                                </button>
                              )}

                            {/* Enviar al proveedor (tras aprobación) */}
                            {canCreate &&
                              order.status === PurchaseOrderStatus.APPROVED && (
                                <button
                                  onClick={() => {
                                    if (
                                      confirm("¿Enviar esta OC al proveedor?")
                                    )
                                      confirmMutation.mutate(order.id);
                                  }}
                                  className="btn-ghost text-xs text-blue-400"
                                  disabled={confirmMutation.isPending}
                                >
                                  Enviar OC
                                </button>
                              )}

                            {/* Cancelar */}
                            {canCreate &&
                              cancellableStatuses.includes(order.status) && (
                                <button
                                  onClick={() => {
                                    if (
                                      confirm("¿Cancelar esta orden de compra?")
                                    )
                                      cancelMutation.mutate(order.id);
                                  }}
                                  className="btn-ghost text-xs text-red-400"
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

      {/* Approve Modal */}
      {approveModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <h2 className="text-xl font-bold mb-4">Aprobar Orden de Compra</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">
                  Notas de aprobación (opcional)
                </label>
                <textarea
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  className="form-input w-full"
                  rows={3}
                  placeholder="Ej: Aprobada según presupuesto trimestral"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setApproveModal(null);
                    setApproveNotes("");
                  }}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  onClick={() =>
                    approveMutation.mutate({
                      id: approveModal.orderId,
                      notes: approveNotes || undefined,
                    })
                  }
                  className="btn-primary bg-teal-600 hover:bg-teal-700"
                  disabled={approveMutation.isPending}
                >
                  Confirmar Aprobación
                </button>
              </div>
              {approveMutation.isError && (
                <p className="text-red-400 text-sm">
                  {approveMutation.error instanceof Error
                    ? approveMutation.error.message
                    : "Error al aprobar"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <h2 className="text-xl font-bold mb-4">Rechazar Orden de Compra</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Motivo del rechazo <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="form-input w-full"
                  rows={3}
                  placeholder="Ej: El precio supera el límite autorizado. Requiere nueva cotización."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setRejectModal(null);
                    setRejectReason("");
                  }}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  onClick={() =>
                    rejectMutation.mutate({
                      id: rejectModal.orderId,
                      reason: rejectReason,
                    })
                  }
                  className="btn-primary bg-red-600 hover:bg-red-700"
                  disabled={rejectMutation.isPending || !rejectReason.trim()}
                >
                  Rechazar Orden
                </button>
              </div>
              {rejectMutation.isError && (
                <p className="text-red-400 text-sm">
                  {rejectMutation.error instanceof Error
                    ? rejectMutation.error.message
                    : "Error al rechazar"}
                </p>
              )}
            </div>
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
                      className={`status-badge ${statusConfig[selectedOrder.status].className}`}
                    >
                      {statusConfig[selectedOrder.status].label}
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

              {/* Info de aprobación */}
              {selectedOrder.requestedBy && (
                <div className="bg-gray-800/30 rounded p-3">
                  <p className="text-xs text-gray-400 mb-1">
                    Enviada a aprobación por
                  </p>
                  <p className="text-sm">
                    {selectedOrder.requestedBy.firstName}{" "}
                    {selectedOrder.requestedBy.lastName}
                  </p>
                </div>
              )}
              {selectedOrder.approvedBy && (
                <div className="bg-teal-900/20 border border-teal-800 rounded p-3">
                  <p className="text-xs text-teal-400 mb-1">
                    ✓ Aprobada por {selectedOrder.approvedBy.firstName}{" "}
                    {selectedOrder.approvedBy.lastName}
                  </p>
                  {selectedOrder.approvedAt && (
                    <p className="text-xs text-gray-400">
                      {new Date(selectedOrder.approvedAt).toLocaleString()}
                    </p>
                  )}
                  {selectedOrder.approvalNotes && (
                    <p className="text-sm mt-1 text-gray-300">
                      {selectedOrder.approvalNotes}
                    </p>
                  )}
                </div>
              )}
              {selectedOrder.rejectedBy && (
                <div className="bg-red-900/20 border border-red-800 rounded p-3">
                  <p className="text-xs text-red-400 mb-1">
                    ✗ Rechazada por {selectedOrder.rejectedBy.firstName}{" "}
                    {selectedOrder.rejectedBy.lastName}
                  </p>
                  {selectedOrder.rejectionReason && (
                    <p className="text-sm mt-1 text-red-300">
                      Motivo: {selectedOrder.rejectionReason}
                    </p>
                  )}
                </div>
              )}

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
                        className="bg-gray-800/40 rounded p-3 space-y-2"
                      >
                        <div className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-5">
                            <p className="font-semibold">
                              {item.supply?.name || "Insumo"}
                            </p>
                            {item.createsAsset && item.assetTemplate && (
                              <p className="text-xs text-teal-400">
                                → Crear activo: {item.assetTemplate.name}
                              </p>
                            )}
                          </div>
                          <div className="col-span-2 text-right">
                            <p className="text-sm text-gray-400">Cantidad</p>
                            <p>{item.quantity}</p>
                          </div>
                          <div className="col-span-2 text-right">
                            <p className="text-sm text-gray-400">P. Unit</p>
                            <p>${Number(item.unitPrice).toFixed(2)}</p>
                          </div>
                          <div className="col-span-3 text-right">
                            <p className="text-sm text-gray-400">Subtotal</p>
                            <p className="font-semibold text-blue-400">
                              $
                              {(
                                Number(item.quantity) * Number(item.unitPrice)
                              ).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {/* Preview specs del template de activo */}
                        {item.createsAsset &&
                          item.assetTemplate?.technicalSpecs && (
                            <div className="text-xs text-gray-400 bg-gray-900/40 rounded p-2">
                              <span className="font-medium">
                                Specs técnicas:{" "}
                              </span>
                              {Object.entries(
                                item.assetTemplate.technicalSpecs as Record<
                                  string,
                                  string
                                >,
                              )
                                .slice(0, 4)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" · ")}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-3 border-t border-gray-700 mt-3">
                    <div className="text-right">
                      <span className="text-gray-400 mr-3">Total:</span>
                      <span className="text-2xl font-bold text-blue-400">
                        ${Number(selectedOrder.total ?? 0).toFixed(2)}
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
                {canCreate &&
                  editableStatuses.includes(selectedOrder.status) && (
                    <button
                      onClick={() => {
                        handleEdit(selectedOrder);
                        setSelectedOrder(null);
                      }}
                      className="btn-primary"
                    >
                      Editar
                    </button>
                  )}
                {canCreate &&
                  editableStatuses.includes(selectedOrder.status) && (
                    <button
                      onClick={() => {
                        submitMutation.mutate(selectedOrder.id);
                        setSelectedOrder(null);
                      }}
                      className="btn-primary bg-orange-600 hover:bg-orange-700"
                      disabled={submitMutation.isPending}
                    >
                      Enviar a Aprobación
                    </button>
                  )}
                {canApprove &&
                  selectedOrder.status ===
                    PurchaseOrderStatus.PENDING_APPROVAL && (
                    <button
                      onClick={() => {
                        setSelectedOrder(null);
                        setApproveModal({ orderId: selectedOrder.id });
                      }}
                      className="btn-primary bg-teal-600 hover:bg-teal-700"
                    >
                      Aprobar
                    </button>
                  )}
                {canApprove &&
                  selectedOrder.status ===
                    PurchaseOrderStatus.PENDING_APPROVAL && (
                    <button
                      onClick={() => {
                        setSelectedOrder(null);
                        setRejectModal({ orderId: selectedOrder.id });
                      }}
                      className="btn-primary bg-red-600 hover:bg-red-700"
                    >
                      Rechazar
                    </button>
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
