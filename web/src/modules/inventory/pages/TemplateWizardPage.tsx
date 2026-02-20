/**
 * TEMPLATE WIZARD PAGE
 * Wizard mejorado para crear/editar plantillas de activos
 * - Multi-paso adaptativo según categoría
 * - Drag & Drop para archivos
 * - Templates de ejemplo pre-cargados
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { X, Save, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import {
  assetTemplateService,
  type CreateTemplateInput,
  AssetCategory,
} from "@/modules/inventory/services/asset-template.service";
import {
  CategorySelectionStep,
  BasicInfoStep,
  TechnicalSpecsStep,
  RentalPricingStep,
  BusinessRulesStep,
  AttachmentsStep,
  PreviewStep,
} from "@/modules/inventory/components/TemplateWizardSteps";
import { EXAMPLE_TEMPLATES } from "@/modules/inventory/data/example-templates";

// Helper para saber si una categoría es alquilable
const isRentableCategory = (category: AssetCategory) => {
  return [
    AssetCategory.MACHINERY,
    AssetCategory.IMPLEMENT,
    AssetCategory.VEHICLE,
    AssetCategory.TOOL,
  ].includes(category);
};

// Pasos base (siempre visibles)
const BASE_STEPS = [
  { id: 1, name: "Categoría", component: CategorySelectionStep },
  { id: 2, name: "Información Básica", component: BasicInfoStep },
  { id: 3, name: "Especificaciones", component: TechnicalSpecsStep },
];

// Paso de pricing (solo para alquilables)
const PRICING_STEP = {
  id: 4,
  name: "Precios de Alquiler",
  component: RentalPricingStep,
};

// Pasos finales
const FINAL_STEPS = [
  { id: 5, name: "Reglas de Negocio", component: BusinessRulesStep },
  { id: 6, name: "Archivos", component: AttachmentsStep },
  { id: 7, name: "Vista Previa", component: PreviewStep },
];

export function TemplateWizardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState<CreateTemplateInput>({
    name: "",
    category: AssetCategory.MACHINERY,
    description: "",
    icon: "",
    requiresPreventiveMaintenance: false,
    requiresDocumentation: false,
    customFields: [],
    hasExpiryDate: false,
    requiresLotTracking: false,
    isDangerous: false,
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
        description: existingTemplate.description,
        icon: existingTemplate.icon || "",
        requiresPreventiveMaintenance:
          existingTemplate.requiresPreventiveMaintenance,
        requiresDocumentation: existingTemplate.requiresDocumentation || false,
        customFields: existingTemplate.customFields,
        attachments: existingTemplate.attachments,
        presentation: existingTemplate.presentation,
        technicalSpecs: existingTemplate.technicalSpecs,
        compatibleWith: existingTemplate.compatibleWith,
        businessRules: existingTemplate.businessRules,
        rentalPricing: existingTemplate.rentalPricing,
        hasExpiryDate: existingTemplate.hasExpiryDate,
        requiresLotTracking: existingTemplate.requiresLotTracking,
        isDangerous: existingTemplate.isDangerous,
        hazardClass: existingTemplate.hazardClass,
      });
    }
  }, [existingTemplate]);

  // Construir pasos dinámicamente según la categoría
  const STEPS = isRentableCategory(formData.category)
    ? [...BASE_STEPS, PRICING_STEP, ...FINAL_STEPS]
    : [...BASE_STEPS, ...FINAL_STEPS];

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data: CreateTemplateInput) =>
      id
        ? assetTemplateService.update(id, data)
        : assetTemplateService.create(data),
    onSuccess: () => {
      navigate("/inventory/templates");
    },
  });

  const handleSubmit = () => {
    saveMutation.mutate(formData);
  };

  const loadExample = () => {
    const example = EXAMPLE_TEMPLATES[formData.category];
    if (example) {
      setFormData({
        ...example,
        name: formData.name || example.name, // Keep current name if exists
      });
    }
  };

  const canGoNext = () => {
    if (currentStep === 1) return formData.category !== undefined;
    if (currentStep === 2) return formData.name.trim() !== "";
    return true;
  };

  const canSave = formData.name && formData.category;

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <Layout
      title={id ? "Editar Plantilla" : "Nueva Plantilla"}
      subtitle="Define la estructura para crear activos de este tipo"
      actions={
        <div className="flex gap-2 md:gap-3">
          <button
            onClick={() => navigate("/inventory/templates")}
            className="btn-ghost flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Cancelar</span>
          </button>

          {!id && currentStep === 2 && (
            <button
              onClick={loadExample}
              className="btn-secondary flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden md:inline">Cargar Ejemplo</span>
            </button>
          )}

          {currentStep === STEPS.length && (
            <button
              onClick={handleSubmit}
              className="btn-primary flex items-center gap-2"
              disabled={saveMutation.isPending || !canSave}
            >
              {saveMutation.isPending ? (
                "..."
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {id ? "Actualizar" : "Crear Plantilla"}
                  </span>
                  <span className="sm:hidden">
                    {id ? "Actualizar" : "Crear"}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Progress Steps - Responsive */}
        <div className="mb-6 md:mb-8">
          {/* Mobile: Compact Step Indicator */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-dark-400">
                Paso {currentStep} de {STEPS.length}
              </div>
              <div className="text-sm text-dark-400">
                {Math.round((currentStep / STEPS.length) * 100)}%
              </div>
            </div>
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              />
            </div>
            <div className="mt-3 text-center">
              <div className="text-lg font-semibold text-white">
                {STEPS[currentStep - 1].name}
              </div>
            </div>
          </div>

          {/* Desktop: Full Stepper */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between">
              {STEPS.map((step, idx) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                        currentStep === step.id
                          ? "bg-primary-500 text-white"
                          : currentStep > step.id
                            ? "bg-green-500 text-white"
                            : "bg-dark-700 text-dark-400"
                      }`}
                    >
                      {step.id}
                    </div>
                    <div
                      className={`mt-2 text-xs lg:text-sm font-medium text-center ${
                        currentStep === step.id ? "text-white" : "text-dark-400"
                      }`}
                    >
                      {step.name}
                    </div>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 ${
                        currentStep > step.id ? "bg-green-500" : "bg-dark-700"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Current Step Content */}
        <div className="space-y-6">
          <CurrentStepComponent formData={formData} setFormData={setFormData} />
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-3 mt-6 md:mt-8 pt-4 md:pt-6 border-t border-dark-700">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="btn-ghost flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          {currentStep < STEPS.length && (
            <button
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={!canGoNext()}
              className="btn-primary flex items-center gap-2"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Error Message */}
        {saveMutation.error && (
          <div className="card bg-red-900/20 border-red-800 text-red-400 mt-6">
            {saveMutation.error instanceof Error
              ? saveMutation.error.message
              : "Error al guardar"}
          </div>
        )}
      </div>
    </Layout>
  );
}
