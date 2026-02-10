/**
 * QUOTE FORM COMPONENT
 * Formulario para crear/editar cotizaciones de insumos
 */

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { quoteService } from "../services/quote.service";
import { supplierService } from "../services/supplier.service";
import {
  SupplyQuote,
  CreateSupplyQuoteDTO,
  UpdateSupplyQuoteDTO,
  SupplierStatus,
} from "../types/purchases.types";

interface QuoteFormProps {
  quote?: SupplyQuote;
  preselectedSupplyId?: string;
  preselectedSupplierId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function QuoteForm({
  quote,
  preselectedSupplyId,
  preselectedSupplierId,
  onSuccess,
  onCancel,
}: QuoteFormProps) {
  const isEditing = !!quote;

  const [formData, setFormData] = useState<CreateSupplyQuoteDTO>({
    supplierId: quote?.supplierId || preselectedSupplierId || "",
    supplyId: quote?.supplyId || preselectedSupplyId || "",
    unitPrice: quote?.unitPrice || 0,
    quantity: quote?.quantity || undefined,
    currency: quote?.currency || "USD",
    validFrom: quote?.validFrom
      ? new Date(quote.validFrom).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    validUntil: quote?.validUntil
      ? new Date(quote.validUntil).toISOString().split("T")[0]
      : "",
    notes: quote?.notes || "",
  });

  const [isActive, setIsActive] = useState(quote?.isActive ?? true);

  // Fetch suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers", "active"],
    queryFn: () =>
      supplierService.list({ status: SupplierStatus.ACTIVE, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: quoteService.create,
    onSuccess,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplyQuoteDTO }) =>
      quoteService.update(id, data),
    onSuccess,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      validUntil: formData.validUntil || undefined,
      quantity: formData.quantity || undefined,
    };

    if (isEditing && quote) {
      updateMutation.mutate({
        id: quote.id,
        data: { ...dataToSubmit, isActive },
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
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "unitPrice" || name === "quantity"
          ? value
            ? parseFloat(value)
            : undefined
          : value,
    }));
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

      {/* Supplier & Supply Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-200">
          Proveedor e Insumo
        </h3>

        <div className="grid grid-cols-2 gap-4">
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
              disabled={isLoading || !!preselectedSupplierId}
            >
              <option value="">Seleccionar proveedor</option>
              {suppliersData?.data.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} ({supplier.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">
              ID del Insumo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="supplyId"
              value={formData.supplyId}
              onChange={handleChange}
              className="form-input"
              required
              disabled={isLoading || !!preselectedSupplyId}
              placeholder="ID del insumo"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-200">Precio</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="form-label">
              Precio Unitario <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="unitPrice"
              value={formData.unitPrice}
              onChange={handleChange}
              className="form-input"
              required
              disabled={isLoading}
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="form-label">Cantidad Mínima</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity || ""}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="form-label">Moneda</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="COP">COP</option>
              <option value="MXN">MXN</option>
              <option value="ARS">ARS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Validity Period */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-200">Vigencia</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">
              Válido Desde <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="validFrom"
              value={formData.validFrom}
              onChange={handleChange}
              className="form-input"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="form-label">Válido Hasta</label>
            <input
              type="date"
              name="validUntil"
              value={formData.validUntil}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            />
          </div>
        </div>

        {isEditing && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              disabled={isLoading}
            />
            <label htmlFor="isActive" className="text-sm text-gray-300">
              Cotización Activa
            </label>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="form-label">Notas</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="form-input"
          disabled={isLoading}
          rows={3}
        />
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
              ? "Actualizar Cotización"
              : "Crear Cotización"}
        </button>
      </div>
    </form>
  );
}
