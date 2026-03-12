import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import { useBranding } from "@/core/hooks/useBranding";
import { templateService } from "../services/template.service";
import { contractTemplateService } from "../services/contract-template.service";
import type { TemplateV2 } from "../services/contract-template.service";
import { CreateTemplateDTO, TemplateType } from "../types/quotation.types";
import { SimpleTemplateEditor } from "../components/SimpleTemplateEditor";
import { ContractTemplateEditorV2 } from "../components/ContractTemplateEditorV2";
import { Save, X, Info, FileText } from "lucide-react";

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
  const [type, setType] = useState<TemplateType>("quotation_rental");
  const [content, setContent] = useState(""); // For legacy templates (HTML string)
  const [contentV2, setContentV2] = useState<TemplateV2>({
    version: "2.0",
    sections: [],
  }); // For contract templates v2.0
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [requiresPaymentProof, setRequiresPaymentProof] = useState(false);
  const [allowLocalPayment, setAllowLocalPayment] = useState(true);

  // Check if current type uses v2.0 system
  const isV2Template = type === "contract";

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

      // Check if it's a v2.0 template (contract with JSON content)
      if (
        template.type === "contract" &&
        typeof template.content === "object"
      ) {
        // V2.0 template
        setContentV2(template.content as unknown as TemplateV2);
        setRequiresSignature((template as any).requiresSignature ?? false);
        setRequiresPaymentProof(
          (template as any).requiresPaymentProof ?? false,
        );
        setAllowLocalPayment((template as any).allowLocalPayment ?? true);
      } else {
        // Legacy template (HTML string)
        setContent(
          typeof template.content === "string"
            ? template.content
            : JSON.stringify(template.content),
        );
      }
    } else {
      // Reset for new templates
      setContent("");
      setContentV2({ version: "2.0", sections: [] });
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

  // Create v2.0 mutation (for contracts)
  const createV2Mutation = useMutation({
    mutationFn: (data: {
      name: string;
      businessUnitId?: string;
      template: TemplateV2;
      requiresSignature?: boolean;
      requiresPaymentProof?: boolean;
      allowLocalPayment?: boolean;
    }) => contractTemplateService.createTemplate(data),
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

    // Check if it's a v2.0 template (contract)
    if (isV2Template) {
      // Validate v2.0 content
      if (contentV2.sections.length === 0) {
        alert("Debes agregar al menos una sección al template");
        return;
      }

      const dataV2 = {
        name,
        businessUnitId: businessUnit.id,
        template: contentV2,
        requiresSignature,
        requiresPaymentProof,
        allowLocalPayment,
      };

      if (isEditing) {
        // For updates, use legacy service (it will handle v2.0 content)
        updateMutation.mutate({
          name,
          content: contentV2 as any,
        });
      } else {
        createV2Mutation.mutate(dataV2);
      }
    } else {
      // Legacy template (HTML string)
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
                    <option value="quotation_rental">
                      Cotización Alquiler
                    </option>
                    <option value="quotation_service">
                      Cotización Trabajo / Servicio
                    </option>
                    <option value="contract">Contrato</option>
                    <option value="contract_report">Informe de Contrato</option>
                    <option value="attachment">Adjunto Personalizable</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {type === "quotation_rental" &&
                      "🚜 Cotización de alquiler de implementos/maquinaria con período (día/semana/mes) y detalle de precios"}
                    {type === "quotation_service" &&
                      "🔨 Cotización de trabajo o servicio: descripción del trabajo, hitos de pago y precio total"}
                    {type === "quotation" && "📋 Cotización genérica (legado)"}
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

            {/* Contract Template v2.0 Info Card */}
            {isV2Template && (
              <div className="card bg-purple-900/10 border-purple-800">
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-purple-300 mb-2">
                      🎯 Plantilla de Contrato v2.0 - Sistema Modular
                    </h3>
                    <p className="text-sm text-gray-300 mb-2">
                      Esta plantilla usa el nuevo sistema modular de contratos
                      que permite:
                    </p>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li>
                        <strong>Heredar datos de cotización aprobada</strong>
                      </li>
                      <li>
                        <strong>Cláusulas dinámicas</strong> según tipo de
                        activo
                      </li>
                      <li>
                        <strong>Comprobantes de pago</strong> (carga o pago
                        local)
                      </li>
                      <li>
                        <strong>Firmas digitales</strong> integradas
                      </li>
                      <li>
                        <strong>Secciones reutilizables</strong> y ordenables
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Contract Template v2.0 Configuration */}
            {isV2Template && (
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">
                  ⚙️ Configuración de Contrato
                </h3>
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresSignature}
                      onChange={(e) => setRequiresSignature(e.target.checked)}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-white font-medium">
                        Requiere firmas digitales
                      </span>
                      <p className="text-sm text-gray-400">
                        El contrato debe ser firmado digitalmente antes de
                        activarse
                      </p>
                    </div>
                  </label>

                  <div className="border-t border-gray-700 pt-4">
                    <p className="text-sm font-medium text-gray-300 mb-3">
                      Opciones de Pago
                    </p>
                    <div className="space-y-3 pl-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={requiresPaymentProof}
                          onChange={(e) =>
                            setRequiresPaymentProof(e.target.checked)
                          }
                          className="mt-1"
                        />
                        <div>
                          <span className="text-white font-medium">
                            Requiere comprobante de pago
                          </span>
                          <p className="text-sm text-gray-400">
                            El cliente debe cargar un archivo con el comprobante
                            de pago
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowLocalPayment}
                          onChange={(e) =>
                            setAllowLocalPayment(e.target.checked)
                          }
                          className="mt-1"
                        />
                        <div>
                          <span className="text-white font-medium">
                            Permitir marcar como "pago local"
                          </span>
                          <p className="text-sm text-gray-400">
                            Permite indicar que el pago se realizó en
                            efectivo/local sin cargar comprobante
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Simple Editor or Contract Template Editor V2 */}
            {isV2Template ? (
              <ContractTemplateEditorV2
                value={contentV2}
                onChange={setContentV2}
              />
            ) : (
              <SimpleTemplateEditor
                content={content}
                onChange={setContent}
                templateType={type}
                fontFamily={brandingConfig.fontFamily}
              />
            )}

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
