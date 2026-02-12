/**
 * SUPPLY FORM COMPONENT
 * Formulario para crear/editar suministros
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { supplyService } from "../services/supply.service";
import { supplyCategoryService } from "../services/supply-category.service";
import { Package2, ArrowLeft, Save } from "lucide-react";
import type { CreateSupplyDTO, UpdateSupplyDTO } from "../types/supply.types";

const COMMON_UNITS = [
  "unidades",
  "litros",
  "kilogramos",
  "metros",
  "metros cuadrados",
  "metros cúbicos",
  "toneladas",
  "cajas",
  "paquetes",
  "bolsas",
];

export function SupplyFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState<CreateSupplyDTO>({
    code: "",
    name: "",
    unit: "unidades",
    categoryId: "",
    costPerUnit: undefined,
    minStock: undefined,
    maxStock: undefined,
    sku: "",
    barcode: "",
    notes: "",
  });

  // Load existing supply if editing
  const { data: existingSupply, isLoading: loadingSupply } = useQuery({
    queryKey: ["supply", id],
    queryFn: () => supplyService.getById(id!),
    enabled: !!id,
  });

  // Load categories
  const { data: categories = [] } = useQuery({
    queryKey: ["supply-categories"],
    queryFn: supplyCategoryService.getAll,
  });

  useEffect(() => {
    if (existingSupply) {
      setFormData({
        code: existingSupply.code || "",
        name: existingSupply.name,
        unit: existingSupply.unit,
        categoryId: existingSupply.categoryId || "",
        costPerUnit: existingSupply.costPerUnit
          ? Number(existingSupply.costPerUnit)
          : undefined,
        minStock: existingSupply.minStock
          ? Number(existingSupply.minStock)
          : undefined,
        maxStock: existingSupply.maxStock
          ? Number(existingSupply.maxStock)
          : undefined,
        sku: existingSupply.sku || "",
        barcode: existingSupply.barcode || "",
        notes: existingSupply.notes || "",
      });
    }
  }, [existingSupply]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: supplyService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      navigate("/supplies");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateSupplyDTO) => supplyService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      queryClient.invalidateQueries({ queryKey: ["supply", id] });
      navigate("/supplies");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.name.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    if (!formData.unit.trim()) {
      alert("La unidad de medida es obligatoria");
      return;
    }

    const dataToSubmit = {
      ...formData,
      code: formData.code?.trim() || undefined,
      categoryId: formData.categoryId || undefined,
      sku: formData.sku?.trim() || undefined,
      barcode: formData.barcode?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
    };

    if (isEditing) {
      updateMutation.mutate(dataToSubmit);
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? value === ""
            ? undefined
            : parseFloat(value)
          : value,
    }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  if (loadingSupply) {
    return (
      <Layout title={isEditing ? "Editar Suministro" : "Nuevo Suministro"}>
        <div className="p-8 text-center">
          <Package2 className="w-12 h-12 text-dark-500 mx-auto mb-4 animate-pulse" />
          <p className="text-dark-400">Cargando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={isEditing ? "Editar Suministro" : "Nuevo Suministro"}
      subtitle={
        isEditing
          ? `Modificar ${existingSupply?.name}`
          : "Crear nuevo producto comprable"
      }
      actions={
        <button
          onClick={() => navigate("/supplies")}
          className="btn-ghost flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      }
    >
      <div className="p-8 max-w-4xl mx-auto">
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
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Code */}
              <div>
                <label className="label">
                  Código{" "}
                  <span className="text-xs text-dark-400">
                    (Opcional, se genera automático)
                  </span>
                </label>
                <input
                  type="text"
                  name="code"
                  className="input"
                  placeholder="SUM-0001"
                  value={formData.code}
                  onChange={handleChange}
                />
              </div>

              {/* Name */}
              <div>
                <label className="label">Nombre *</label>
                <input
                  type="text"
                  name="name"
                  className="input"
                  placeholder="Ej: Andamio Tubular, Aceite Motor 15W40"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Unit */}
              <div>
                <label className="label">Unidad de Medida *</label>
                <select
                  name="unit"
                  className="input"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                >
                  {COMMON_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="label">Categoría</label>
                <select
                  name="categoryId"
                  className="input"
                  value={formData.categoryId}
                  onChange={handleChange}
                >
                  <option value="">Sin categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-dark-400 mt-1">
                    No hay categorías.{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/purchases/categories/new")}
                      className="text-primary-400 hover:underline"
                    >
                      Crear una
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Precios e Inventario</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cost Per Unit */}
              <div>
                <label className="label">Costo por Unidad</label>
                <input
                  type="number"
                  name="costPerUnit"
                  className="input"
                  placeholder="0"
                  step="0.01"
                  min="0"
                  value={formData.costPerUnit || ""}
                  onChange={handleChange}
                />
                <p className="text-xs text-dark-400 mt-1">
                  Costo promedio de compra
                </p>
              </div>

              {/* Min Stock */}
              <div>
                <label className="label">Stock Mínimo</label>
                <input
                  type="number"
                  name="minStock"
                  className="input"
                  placeholder="0"
                  min="0"
                  value={formData.minStock || ""}
                  onChange={handleChange}
                />
                <p className="text-xs text-dark-400 mt-1">Alerta de reorden</p>
              </div>

              {/* Max Stock */}
              <div>
                <label className="label">Stock Máximo</label>
                <input
                  type="number"
                  name="maxStock"
                  className="input"
                  placeholder="0"
                  min="0"
                  value={formData.maxStock || ""}
                  onChange={handleChange}
                />
                <p className="text-xs text-dark-400 mt-1">Nivel óptimo</p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Información Adicional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SKU */}
              <div>
                <label className="label">SKU</label>
                <input
                  type="text"
                  name="sku"
                  className="input"
                  placeholder="Código de producto"
                  value={formData.sku}
                  onChange={handleChange}
                />
              </div>

              {/* Barcode */}
              <div>
                <label className="label">Código de Barras</label>
                <input
                  type="text"
                  name="barcode"
                  className="input"
                  placeholder="EAN13, UPC, etc."
                  value={formData.barcode}
                  onChange={handleChange}
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="label">Notas</label>
                <textarea
                  name="notes"
                  className="input"
                  rows={3}
                  placeholder="Información adicional sobre el suministro..."
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/supplies")}
              className="btn-ghost"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={isLoading}
            >
              <Save className="w-4 h-4" />
              {isLoading
                ? "Guardando..."
                : isEditing
                  ? "Actualizar"
                  : "Crear Suministro"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
