/**
 * PURCHASE ORDER FORM COMPONENT
 * Formulario para crear/editar órdenes de compra
 */

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { purchaseOrderService } from "../services/purchase-order.service";
import { supplierService } from "../services/supplier.service";
import {
  PurchaseOrder,
  CreatePurchaseOrderDTO,
  UpdatePurchaseOrderDTO,
  PurchaseOrderStatus,
  SupplierStatus,
} from "../types/purchases.types";

interface PurchaseOrderFormProps {
  order?: PurchaseOrder;
  onSuccess: () => void;
  onCancel: () => void;
}

interface OrderItem {
  supplyId: string;
  quantity: number;
  unitPrice: number;
  tempId?: string;
}

export function PurchaseOrderForm({
  order,
  onSuccess,
  onCancel,
}: PurchaseOrderFormProps) {
  const isEditing = !!order;

  const [formData, setFormData] = useState({
    code: order?.code || "",
    supplierId: order?.supplierId || "",
    expectedDate: order?.expectedDate
      ? new Date(order.expectedDate).toISOString().split("T")[0]
      : "",
    notes: order?.notes || "",
  });

  const [status, setStatus] = useState<PurchaseOrderStatus>(
    order?.status || PurchaseOrderStatus.DRAFT,
  );

  const [items, setItems] = useState<OrderItem[]>(
    order?.items?.map((item) => ({
      supplyId: item.supplyId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })) || [],
  );

  const [newItem, setNewItem] = useState<OrderItem>({
    supplyId: "",
    quantity: 0,
    unitPrice: 0,
  });

  // Fetch suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers", "active"],
    queryFn: () =>
      supplierService.list({ status: SupplierStatus.ACTIVE, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: purchaseOrderService.create,
    onSuccess,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePurchaseOrderDTO }) =>
      purchaseOrderService.update(id, data),
    onSuccess,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert("Debe agregar al menos un item a la orden de compra");
      return;
    }

    const dataToSubmit: CreatePurchaseOrderDTO = {
      ...formData,
      expectedDate: formData.expectedDate || undefined,
      items,
    };

    if (isEditing && order) {
      updateMutation.mutate({
        id: order.id,
        data: {
          expectedDate: formData.expectedDate || undefined,
          notes: formData.notes,
          status,
        },
      });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    if (!newItem.supplyId || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      alert("Por favor complete todos los campos del item");
      return;
    }

    setItems((prev) => [...prev, { ...newItem, tempId: `temp-${Date.now()}` }]);
    setNewItem({ supplyId: "", quantity: 0, unitPrice: 0 });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error display */}
      {error && (
        <div className="card bg-red-900/20 border-red-800 text-red-400">
          <p className="text-sm">
            Error:{" "}
            {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-200">
          Información Básica
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">
              Código <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="form-input"
              required
              disabled={isLoading || isEditing}
            />
          </div>

          <div>
            <label className="form-label">
              Proveedor <span className="text-red-400">*</span>
            </label>
            <select
              name="supplierId"
              value={formData.supplierId}
              onChange={handleChange}
              className="form-input"
              required
              disabled={isLoading || isEditing}
            >
              <option value="">Seleccionar proveedor</option>
              {suppliersData?.data.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} ({supplier.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Fecha Esperada</label>
            <input
              type="date"
              name="expectedDate"
              value={formData.expectedDate}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            />
          </div>

          {isEditing && (
            <div>
              <label className="form-label">Estado</label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as PurchaseOrderStatus)
                }
                className="form-input"
                disabled={isLoading}
              >
                <option value={PurchaseOrderStatus.DRAFT}>Borrador</option>
                <option value={PurchaseOrderStatus.CONFIRMED}>
                  Confirmada
                </option>
                <option value={PurchaseOrderStatus.CANCELLED}>Cancelada</option>
                <option value={PurchaseOrderStatus.PARTIALLY_RECEIVED}>
                  Parcialmente Recibida
                </option>
                <option value={PurchaseOrderStatus.COMPLETED}>
                  Completada
                </option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="form-label">Notas</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="form-input"
            disabled={isLoading}
            rows={2}
          />
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-200">Items</h3>

        {/* Items List */}
        {items.length > 0 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-sm font-semibold text-gray-400 px-3">
              <div className="col-span-5">Insumo ID</div>
              <div className="col-span-2 text-right">Cantidad</div>
              <div className="col-span-2 text-right">Precio Unit.</div>
              <div className="col-span-2 text-right">Subtotal</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((item, index) => (
              <div
                key={item.tempId || index}
                className="grid grid-cols-12 gap-2 items-center bg-gray-800/40 rounded p-3"
              >
                <div className="col-span-5 text-sm text-gray-300 font-mono">
                  {item.supplyId}
                </div>
                <div className="col-span-2 text-right text-gray-300">
                  {item.quantity.toFixed(2)}
                </div>
                <div className="col-span-2 text-right text-gray-300">
                  ${item.unitPrice.toFixed(2)}
                </div>
                <div className="col-span-2 text-right text-blue-400 font-semibold">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </div>
                <div className="col-span-1 text-right">
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-400 hover:text-red-300 text-sm"
                      disabled={isLoading}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2 border-t border-gray-700">
              <div className="text-right">
                <span className="text-gray-400 mr-3">Total:</span>
                <span className="text-xl font-bold text-blue-400">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-gray-800/20 rounded">
            No hay items agregados
          </div>
        )}

        {/* Add New Item */}
        {!isEditing && (
          <div className="card bg-gray-800/30">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">
              Agregar Item
            </h4>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-5">
                <input
                  type="text"
                  placeholder="ID del Insumo"
                  value={newItem.supplyId}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      supplyId: e.target.value,
                    }))
                  }
                  className="form-input"
                  disabled={isLoading}
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  placeholder="Cantidad"
                  value={newItem.quantity || ""}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      quantity: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="form-input"
                  disabled={isLoading}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  placeholder="Precio Unitario"
                  value={newItem.unitPrice || ""}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      unitPrice: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="form-input"
                  disabled={isLoading}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-span-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="btn-primary w-full"
                  disabled={isLoading}
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading
            ? "Guardando..."
            : isEditing
              ? "Actualizar Orden"
              : "Crear Orden de Compra"}
        </button>
      </div>
    </form>
  );
}
