/**
 * TEMPLATE WIZARD PAGE
 * Wizard para crear/editar plantillas de activos
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import {
  assetTemplateService,
  type CreateTemplateInput,
  AssetCategory,
} from "@/modules/machinery/services/asset-template.service";
import {
  BasicInfoStep,
  CustomFieldsStep,
  PreviewStep,
} from "@/modules/machinery/components/TemplateWizardSteps";
type WizardStep = "basic" | "fields" | "preview";

export function TemplateWizardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>("basic");

  // Form state
  const [formData, setFormData] = useState<CreateTemplateInput>({
    name: "",
    category: AssetCategory.MACHINERY,
    description: "",
    icon: "",
    requiresPreventiveMaintenance: false,
    customFields: [],
  });

  // Load existing template if editing
  const { data: existingTemplate } = useQuery({
    queryKey: ["asset-template", id],
    queryFn: () => assetTemplateService.getById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (existingTemplate) {
      setFormData({
        name: existingTemplate.name,
        category: existingTemplate.category,
        description: existingTemplate.description || "",
        icon: existingTemplate.icon || "",
        requiresPreventiveMaintenance:
          existingTemplate.requiresPreventiveMaintenance,
        customFields: existingTemplate.customFields,
      });
    }
  }, [existingTemplate]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data: CreateTemplateInput) =>
      id
        ? assetTemplateService.update(id, data)
        : assetTemplateService.create(data),
    onSuccess: () => {
      navigate("/machinery/templates");
    },
  });

  const handleSubmit = () => {
    // Validar que haya al menos un campo
    if (formData.customFields.length === 0) {
      alert("Debe agregar al menos un campo personalizado");
      return;
    }

    saveMutation.mutate(formData);
  };

  const renderStep = () => {
    switch (step) {
      case "basic":
        return <BasicInfoStep formData={formData} setFormData={setFormData} />;
      case "fields":
        return (
          <CustomFieldsStep formData={formData} setFormData={setFormData} />
        );
      case "preview":
        return <PreviewStep formData={formData} />;
    }
  };

  return (
    <Layout
      title={id ? "Editar Plantilla" : "Nueva Plantilla"}
      subtitle={`Paso ${step === "basic" ? "1" : step === "fields" ? "2" : "3"} de 3`}
      actions={
        <button
          onClick={() => navigate("/machinery/templates")}
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
              completed={step === "fields" || step === "preview"}
              onClick={() => setStep("basic")}
            />
            <div className="flex-1 h-0.5 bg-dark-700" />
            <StepIndicator
              number={2}
              title="Campos Personalizados"
              active={step === "fields"}
              completed={step === "preview"}
              onClick={() => setStep("fields")}
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
            onClick={() => navigate("/machinery/templates")}
            className="btn-ghost"
          >
            Cancelar
          </button>

          <div className="flex gap-3">
            {step !== "basic" && (
              <button
                onClick={() => setStep(step === "fields" ? "basic" : "fields")}
                className="btn-secondary"
              >
                ← Anterior
              </button>
            )}

            {step !== "preview" && (
              <button
                onClick={() => setStep(step === "basic" ? "fields" : "preview")}
                className="btn-primary"
                disabled={
                  step === "basic" && (!formData.name || !formData.category)
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
                    ? "Actualizar Plantilla"
                    : "Crear Plantilla"}
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
// STEP COMPONENTS
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
      className="flex flex-col items-center gap-2 group"
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
          active
            ? "bg-primary-600 text-white"
            : completed
              ? "bg-green-600 text-white"
              : "bg-dark-700 text-dark-400 group-hover:bg-dark-600"
        }`}
      >
        {completed ? "✓" : number}
      </div>
      <span
        className={`text-sm ${active ? "text-white font-semibold" : "text-dark-400"}`}
      >
        {title}
      </span>
    </button>
  );
}
