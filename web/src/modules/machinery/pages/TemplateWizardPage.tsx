/**
 * TEMPLATE WIZARD PAGE
 * Wizard para crear/editar plantillas de activos
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { X, Save } from "lucide-react";
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

export function TemplateWizardPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState<CreateTemplateInput>({
    name: "",
    category: AssetCategory.MACHINERY,
    description: "",
    icon: "",
    requiresPreventiveMaintenance: false,
    requiresDocumentation: false,
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
        description: "", // No longer used
        icon: existingTemplate.icon || "",
        requiresPreventiveMaintenance:
          existingTemplate.requiresPreventiveMaintenance,
        requiresDocumentation: existingTemplate.requiresDocumentation || false,
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

  const canSave =
    formData.name && formData.category && formData.customFields.length > 0;

  return (
    <Layout
      title={id ? "Editar Plantilla" : "Nueva Plantilla"}
      subtitle="Define la estructura para crear activos de este tipo"
      actions={
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/machinery/templates")}
            className="btn-ghost flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary flex items-center gap-2"
            disabled={saveMutation.isPending || !canSave}
          >
            {saveMutation.isPending ? (
              "Guardando..."
            ) : (
              <>
                <Save className="w-4 h-4" />
                {id ? "Actualizar" : "Crear Plantilla"}
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        {/* Basic Info Section */}
        <BasicInfoStep formData={formData} setFormData={setFormData} />

        {/* Custom Fields Section */}
        <CustomFieldsStep formData={formData} setFormData={setFormData} />

        {/* Preview Section */}
        {formData.customFields.length > 0 && (
          <PreviewStep formData={formData} />
        )}

        {/* Error Message */}
        {saveMutation.error && (
          <div className="card bg-red-900/20 border-red-800 text-red-400">
            {saveMutation.error instanceof Error
              ? saveMutation.error.message
              : "Error al guardar"}
          </div>
        )}
      </div>
    </Layout>
  );
}
