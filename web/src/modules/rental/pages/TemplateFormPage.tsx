import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import { useBranding } from "@/core/hooks/useBranding";
import { templateService } from "../services/template.service";
import { CreateTemplateDTO, TemplateType } from "../types/quotation.types";
import { SimpleTemplateEditor } from "../components/SimpleTemplateEditor";
import { Save, X, Info } from "lucide-react";

export function TemplateFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenant, businessUnit } = useAuthStore();
  const isEditing = !!id;

  // Get branding configuration for font preview
  const { formData: brandingConfig } = useBranding(businessUnit?.id);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<TemplateType>("quotation");
  const [content, setContent] = useState("");

  // Load template if editing
  const { data: template, isLoading } = useQuery({
    queryKey: ["template", id],
    queryFn: () => templateService.getById(id!),
    enabled: isEditing && !!id,
    retry: 1,
    staleTime: 30000,
  });

  useEffect(() => {
    if (template) {
      setName(template.name);
      setType(template.type);
      setContent(template.content);
    } else {
      // Set default content for new templates (se verá renderizado en el preview)
      const defaultContent = `<div style="text-align: center; padding: 40px; background: #f3f4f6; border-radius: 8px; margin: 20px 0;">
  <h2 style="color: #1e40af; margin: 0 0 12px 0;">👈 Empieza insertando bloques</h2>
  <p style="color: #6b7280; margin: 0;">Haz click en los bloques del panel izquierdo para construir tu plantilla de cotización</p>
</div>`;
      setContent(defaultContent);
    }
  }, [template, tenant]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTemplateDTO) => templateService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      navigate("/rental/templates");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateTemplateDTO>) =>
      templateService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["template", id] });
      navigate("/rental/templates");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tenant || !businessUnit) {
      alert("No se ha seleccionado un tenant o business unit");
      return;
    }

    const data: CreateTemplateDTO = {
      businessUnitId: businessUnit.id,
      name,
      type,
      content,
      variables: [], // Auto-extracted from content in backend
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    navigate("/rental/templates");
  };

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

  if (isEditing && isLoading) {
    return (
      <Layout>
        <div className="p-8 text-center text-gray-400">
          Cargando plantilla...
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={isEditing ? "Editar Plantilla" : "Nueva Plantilla"}
      subtitle="Diseña plantillas HTML con Handlebars para generar PDFs profesionales"
      actions={
        <button onClick={handleCancel} className="btn-ghost">
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </button>
      }
    >
      <div className="max-w-7xl mx-auto">
        {/* Form */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Card */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-primary-400">
                Información Básica
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre de la plantilla *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input text-gray-900"
                    placeholder="Ej: Cotización Profesional"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo de documento *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TemplateType)}
                    className="form-input text-gray-900"
                    required
                  >
                    <option value="quotation">Cotización</option>
                    <option value="contract">Contrato</option>
                    <option value="contract_report">Informe de Contrato</option>
                    <option value="attachment">Adjunto Personalizable</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {type === "quotation" &&
                      "📋 Plantilla para generar cotizaciones con precios y condiciones"}
                    {type === "contract" &&
                      "📄 Plantilla para contratos de arrendamiento con cláusulas legales"}
                    {type === "contract_report" &&
                      "📊 Informe del estado de cuenta y resumen del contrato"}
                    {type === "attachment" &&
                      "📎 Plantilla libre para documentos personalizados"}
                  </p>
                </div>
              </div>
            </div>

            {/* Branding Info Card */}
            <div className="card bg-blue-900/10 border-blue-800">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-300 mb-2">
                    ✨ Branding Automático
                  </h3>
                  <p className="text-sm text-gray-300 mb-2">
                    Esta plantilla usará automáticamente tu configuración de
                    branding:
                    <strong>
                      {" "}
                      logo, colores, fuente, header y footer con datos de
                      contacto
                    </strong>
                    .
                  </p>
                  <p className="text-sm text-gray-300 mb-3">
                    Solo necesitas definir el <strong>contenido central</strong>
                    : datos del cliente, items cotizados, totales, cláusulas y
                    forma de pago.
                  </p>
                  <Link
                    to="/settings/branding"
                    className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium"
                  >
                    → Ver/Editar Branding de {businessUnit.name}
                  </Link>
                </div>
              </div>
            </div>

            {/* Simple Editor */}
            <SimpleTemplateEditor
              content={content}
              onChange={setContent}
              templateType={type}
              fontFamily={brandingConfig.fontFamily}
            />

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {createMutation.isPending || updateMutation.isPending
                  ? "Guardando..."
                  : isEditing
                    ? "Actualizar Plantilla"
                    : "Crear Plantilla"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
