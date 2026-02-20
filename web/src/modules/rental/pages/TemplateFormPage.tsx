import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import { templateService } from "../services/template.service";
import { CreateTemplateDTO, TemplateType } from "../types/quotation.types";
import { RichTemplateEditor } from "../components/RichTemplateEditor";
import { Save, X, Info } from "lucide-react";

export function TemplateFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenant, businessUnit } = useAuthStore();
  const isEditing = !!id;

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
    } else if (tenant) {
      // Set default content with tenant name for new templates
      const defaultContent = `<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="color: #1e40af; margin: 0;">${tenant.name}</h1>
  <p style="color: #6b7280; margin: 5px 0;">{{companyAddress}}</p>
  <p style="color: #6b7280;">{{companyPhone}} | {{companyEmail}}</p>
</div>

<p>Escribe aquí el contenido de tu plantilla...</p>`;
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
                    Logo, Colores y Estilos por Business Unit
                  </h3>
                  <p className="text-sm text-gray-300 mb-3">
                    Las plantillas utilizan automáticamente la configuración de{" "}
                    <strong>Branding</strong> de tu Business Unit, que incluye:
                    logo, colores, fuentes, header y footer personalizados.
                  </p>
                  <p className="text-sm text-gray-300 mb-3">
                    Todos los PDFs generados (cotizaciones, contratos, reportes)
                    tendrán un aspecto consistente y profesional basado en tu
                    configuración de marca.
                  </p>
                  <Link
                    to="/settings/branding"
                    className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium"
                  >
                    → Configurar Branding de {businessUnit.name}
                  </Link>
                </div>
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-primary-400">
                📝 Editor de Contenido
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Usa el editor para crear tu plantilla. Inserta variables
                dinámicas y bloques predefinidos según el tipo de documento.
              </p>
              <RichTemplateEditor
                content={content}
                onChange={setContent}
                templateType={type}
              />
            </div>

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
