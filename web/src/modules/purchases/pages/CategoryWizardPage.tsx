/**
 * SUPPLY CATEGORY WIZARD PAGE
 * Wizard para crear/editar categorías de supplies configurables
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { supplyCategoryService } from "../services/supply-category.service";
import {
  SupplyCategoryType,
  type CreateSupplyCategoryDto,
} from "../types/supply-category.types";
import {
  BasicInfoStep,
  ConfigurationStep,
  PreviewStep,
} from "../components/CategoryWizardSteps";

type WizardStep = "basic" | "config" | "preview";

export function CategoryWizardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>("basic");

  // Form state
  const [formData, setFormData] = useState<CreateSupplyCategoryDto>({
    code: "",
    name: "",
    type: SupplyCategoryType.CONSUMABLE,
    description: "",
    icon: "📦",
    color: "#3B82F6",
    requiresSerialTracking: false,
    requiresExpiryDate: false,
    allowsNegativeStock: false,
  });

  // Load existing category if editing
  const { data: existingCategory } = useQuery({
    queryKey: ["supply-category", id],
    queryFn: () => supplyCategoryService.getById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (existingCategory) {
      setFormData({
        code: existingCategory.code,
        name: existingCategory.name,
        type: existingCategory.type,
        description: existingCategory.description || "",
        icon: existingCategory.icon || "📦",
        color: existingCategory.color || "#3B82F6",
        requiresSerialTracking: existingCategory.requiresSerialTracking,
        requiresExpiryDate: existingCategory.requiresExpiryDate,
        allowsNegativeStock: existingCategory.allowsNegativeStock,
        defaultReorderPoint: existingCategory.defaultReorderPoint || undefined,
      });
    }
  }, [existingCategory]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data: CreateSupplyCategoryDto) =>
      id
        ? supplyCategoryService.update(id, data)
        : supplyCategoryService.create(data),
    onSuccess: () => {
      navigate("/purchases/categories");
    },
  });

  const handleSubmit = () => {
    saveMutation.mutate(formData);
  };

  const renderStep = () => {
    switch (step) {
      case "basic":
        return <BasicInfoStep formData={formData} setFormData={setFormData} />;
      case "config":
        return (
          <ConfigurationStep formData={formData} setFormData={setFormData} />
        );
      case "preview":
        return <PreviewStep formData={formData} />;
    }
  };

  return (
    <Layout
      title={
        id ? "Editar Categoría de Suministro" : "Nueva Categoría de Suministro"
      }
      subtitle={`Paso ${step === "basic" ? "1" : step === "config" ? "2" : "3"} de 3 · Define cómo gestionar implementos, insumos, repuestos y más`}
      actions={
        <button
          onClick={() => navigate("/purchases/categories")}
          className="btn-ghost"
        >
          ✕ Cancelar
        </button>
      }
    >
      <div className="p-8 max-w-5xl mx-auto">
        {/* Progress Bar */}
        <div className="card mb-6">
          <div className="flex items-center justify-between gap-4">
            <StepIndicator
              number={1}
              title="Información Básica"
              active={step === "basic"}
              completed={step === "config" || step === "preview"}
              onClick={() => setStep("basic")}
            />
            <div className="flex-1 h-0.5 bg-dark-700" />
            <StepIndicator
              number={2}
              title="Configuración"
              active={step === "config"}
              completed={step === "preview"}
              onClick={() => setStep("config")}
            />
            <div className="flex-1 h-0.5 bg-dark-700" />
            <StepIndicator
              number={3}
              title="Vista Previa"
              active={step === "preview"}
              completed={false}
              onClick={() => setStep("preview")}
            />
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4 mt-8">
          <button
            onClick={() => navigate("/purchases/categories")}
            className="btn-ghost"
          >
            Cancelar
          </button>

          <div className="flex gap-3">
            {step !== "basic" && (
              <button
                onClick={() => setStep(step === "config" ? "basic" : "config")}
                className="btn-secondary"
              >
                ← Anterior
              </button>
            )}

            {step !== "preview" && (
              <button
                onClick={() => setStep(step === "basic" ? "config" : "preview")}
                className="btn-primary"
                disabled={
                  step === "basic" &&
                  (!formData.code || !formData.name || !formData.type)
                }
              >
                Siguiente →
              </button>
            )}

            {step === "preview" && (
              <button
                onClick={handleSubmit}
                className="btn-primary"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? "Guardando..."
                  : id
                    ? "Actualizar Categoría"
                    : "Crear Categoría"}
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {saveMutation.error && (
          <div className="card bg-red-900/20 border-red-800 text-red-400 mt-4">
            {saveMutation.error instanceof Error
              ? saveMutation.error.message
              : "Error al guardar"}
          </div>
        )}
      </div>
    </Layout>
  );
}

// ============================================
// STEP INDICATOR COMPONENT
// ============================================

function StepIndicator({
  number,
  title,
  active,
  completed,
  onClick,
}: {
  number: number;
  title: string;
  active: boolean;
  completed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 group transition-all"
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
          active
            ? "bg-primary-500 text-white scale-110"
            : completed
              ? "bg-primary-900/40 text-primary-400 border-2 border-primary-500"
              : "bg-dark-800 text-dark-400 border-2 border-dark-700"
        }`}
      >
        {completed ? "✓" : number}
      </div>
      <span
        className={`text-sm font-semibold hidden md:block ${
          active
            ? "text-white"
            : completed
              ? "text-primary-400"
              : "text-dark-400"
        }`}
      >
        {title}
      </span>
    </button>
  );
}
