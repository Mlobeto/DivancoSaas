/**
 * PURCHASE ORDER FORM COMPONENT
 * Formulario para crear/editar órdenes de compra
 */

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { purchaseOrderService } from "../services/purchase-order.service";
import { supplierService } from "../services/supplier.service";
import { assetTemplateService } from "@/modules/machinery/services/asset-template.service";
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
  createsAsset?: boolean;
  assetTemplateId?: string;
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
      createsAsset: item.createsAsset ?? false,
      assetTemplateId: item.assetTemplateId,
    })) || [],
  );

  const [newItem, setNewItem] = useState<OrderItem>({
    supplyId: "",
    quantity: 0,
    unitPrice: 0,
    createsAsset: false,
    assetTemplateId: "",
  });

  // Fetch suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers", "active"],
    queryFn: () =>
      supplierService.list({ status: SupplierStatus.ACTIVE, limit: 100 }),
  });

  // Fetch asset templates (para el selector)
  const { data: templatesData } = useQuery({
    queryKey: ["asset-templates"],
    queryFn: () => assetTemplateService.list(),
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
      items: items.map((item) => ({
        supplyId: item.supplyId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        createsAsset: item.createsAsset,
        assetTemplateId: item.assetTemplateId,
      })),
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

    if (newItem.createsAsset && !newItem.assetTemplateId) {
      alert("Por favor seleccione una plantilla de activo");
      return;
    }

    setItems((prev) => [...prev, { ...newItem, tempId: `temp-${Date.now()}` }]);
    setNewItem({
      supplyId: "",
      quantity: 0,
      unitPrice: 0,
      createsAsset: false,
      assetTemplateId: "",
    });
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
              <div className="col-span-4">Insumo ID</div>
              <div className="col-span-2 text-right">Cantidad</div>
              <div className="col-span-2 text-right">Precio Unit.</div>
              <div className="col-span-2 text-right">Subtotal</div>
              <div className="col-span-1 text-center">Activo</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((item, index) => (
              <div
                key={item.tempId || index}
                className="grid grid-cols-12 gap-2 items-center bg-gray-800/40 rounded p-3"
              >
                <div className="col-span-4 text-sm text-gray-300">
                  <span className="font-mono">{item.supplyId}</span>
                  {item.createsAsset && (
                    <span className="ml-2 text-xs bg-primary-900/30 text-primary-400 px-2 py-0.5 rounded">
                      \u2728 Crea activo
                    </span>
                  )}
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
                <div className="col-span-1 text-center">
                  {item.createsAsset && (
                    <span
                      className="text-primary-400 text-lg"
                      title="Crea activo al recibir"
                    >
                      \u2705
                    </span>
                  )}
                </div>
                <div className="col-span-1 text-right">
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-400 hover:text-red-300 text-sm"
                      disabled={isLoading}
                    >
                      \u2715
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
            <div className="space-y-3">
              {/* Primera fila: Insumo, Cantidad, Precio, Botón */}
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

              {/* Segunda fila: Checkbox de crear activo */}
              <div className="flex items-start gap-3 pt-2 border-t border-gray-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItem.createsAsset}
                    onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        createsAsset: e.target.checked,
                        assetTemplateId: e.target.checked
                          ? prev.assetTemplateId
                          : "",
                      }))
                    }
                    className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-300">
                    ✨ Crear activo autom\u00e1ticamente al recibir
                  </span>
                </label>
              </div>

              {/* Selector de template (solo si checkbox est\u00e1 marcado) */}
              {newItem.createsAsset && (
                <div className="pl-7">
                  <label className="form-label">
                    Plantilla del Activo <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={newItem.assetTemplateId}
                    onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        assetTemplateId: e.target.value,
                      }))
                    }
                    className="form-input"
                    disabled={isLoading}
                    required={newItem.createsAsset}
                  >
                    <option value="">Seleccionar plantilla...</option>
                    {templatesData?.data?.map((template: any) => (
                      <option key={template.id} value={template.id}>
                        {template.icon} {template.name} ({template.category})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    \ud83d\udca1 Se crear\u00e1n {newItem.quantity} activo(s)
                    usando esta plantilla
                  </p>
                </div>
              )}
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
