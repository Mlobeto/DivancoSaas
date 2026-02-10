/**
 * SUPPLIER FORM COMPONENT
 * Formulario para crear/editar proveedores
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supplierService } from "../services/supplier.service";
import {
  Supplier,
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierStatus,
} from "../types/purchases.types";

interface SupplierFormProps {
  supplier?: Supplier;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SupplierForm({
  supplier,
  onSuccess,
  onCancel,
}: SupplierFormProps) {
  const isEditing = !!supplier;

  const [formData, setFormData] = useState<CreateSupplierDTO>({
    code: supplier?.code || "",
    name: supplier?.name || "",
    tradeName: supplier?.tradeName || "",
    taxId: supplier?.taxId || "",
    email: supplier?.email || "",
    phone: supplier?.phone || "",
    website: supplier?.website || "",
    address: supplier?.address || "",
    city: supplier?.city || "",
    state: supplier?.state || "",
    country: supplier?.country || "",
    zipCode: supplier?.zipCode || "",
    paymentTerms: supplier?.paymentTerms || "",
    currency: supplier?.currency || "USD",
    creditLimit: supplier?.creditLimit || undefined,
    notes: supplier?.notes || "",
  });

  const [status, setStatus] = useState<SupplierStatus>(
    supplier?.status || SupplierStatus.ACTIVE,
  );

  const createMutation = useMutation({
    mutationFn: supplierService.create,
    onSuccess,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierDTO }) =>
      supplierService.update(id, data),
    onSuccess,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && supplier) {
      updateMutation.mutate({
        id: supplier.id,
        data: { ...formData, status },
      });
    } else {
      createMutation.mutate(formData);
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
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="form-label">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Nombre Comercial</label>
            <input
              type="text"
              name="tradeName"
              value={formData.tradeName}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="form-label">RUC/NIT/Tax ID</label>
            <input
              type="text"
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            />
          </div>
        </div>

        {isEditing && (
          <div>
            <label className="form-label">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SupplierStatus)}
              className="form-input"
              disabled={isLoading}
            >
              <option value={SupplierStatus.ACTIVE}>Activo</option>
              <option value={SupplierStatus.INACTIVE}>Inactivo</option>
              <option value={SupplierStatus.BLOCKED}>Bloqueado</option>
            </select>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-200">Contacto</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="form-label">Teléfono</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Sitio Web</label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className="form-input"
            disabled={isLoading}
            placeholder="https://"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-200">Dirección</h3>

        <div>
          <label className="form-label">Dirección</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="form-input"
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="form-label">Ciudad</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="form-label">Estado/Provincia</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="form-label">País</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Código Postal</label>
          <input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            className="form-input"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Financial Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-200">
          Información Financiera
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Términos de Pago</label>
            <input
              type="text"
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
              placeholder="Ej: 30 días"
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

        <div>
          <label className="form-label">Límite de Crédito</label>
          <input
            type="number"
            name="creditLimit"
            value={formData.creditLimit || ""}
            onChange={handleChange}
            className="form-input"
            disabled={isLoading}
            min="0"
            step="0.01"
          />
        </div>
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
              ? "Actualizar Proveedor"
              : "Crear Proveedor"}
        </button>
      </div>
    </form>
  );
}
