import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { templateService } from "../services/template.service";
import { useAuthStore } from "@/store/auth.store";
import { ArrowLeft, FileText } from "lucide-react";
import { TemplateType } from "../types/quotation.types";

// Datos de ejemplo por tipo de plantilla
const getSampleDataByType = (
  type: TemplateType,
  tenantName: string,
  logoUrl?: string,
) => {
  const baseData = {
    companyName: tenantName,
    companyAddress: "Av. Principal #123, Ciudad",
    companyPhone: "+1 (555) 123-4567",
    companyEmail: "contacto@empresa.com",
    logoUrl: logoUrl || "",
  };

  switch (type) {
    case "quotation":
      return {
        ...baseData,
        quotationCode: "COT-2026-001",
        clientName: "Cliente Ejemplo S.A.",
        clientEmail: "cliente@ejemplo.com",
        clientPhone: "+1 (555) 987-6543",
        date: "13 de Febrero, 2026",
        expirationDate: "28 de Febrero, 2026",
        estimatedDays: "30",
        subtotal: "$50,000.00",
        taxAmount: "$8,000.00",
        total: "$58,000.00",
        items: [
          {
            name: "Excavadora CAT 320",
            quantity: 2,
            days: 15,
            dailyRate: "$1,500",
            total: "$45,000",
          },
          {
            name: "Operador Certificado",
            quantity: 1,
            days: 15,
            dailyRate: "$200",
            total: "$3,000",
          },
        ],
      };
    case "contract":
      return {
        ...baseData,
        contractCode: "CONT-2026-001",
        clientName: "Cliente Ejemplo S.A.",
        startDate: "1 de Marzo, 2026",
        endDate: "31 de Marzo, 2026",
        duration: "30 días",
        totalAmount: "$58,000.00",
        deposit: "$15,000.00",
        monthlyPayment: "$43,000.00",
      };
    case "contract_report":
      return {
        ...baseData,
        contractCode: "CONT-2026-001",
        clientName: "Cliente Ejemplo S.A.",
        reportDate: "13 de Febrero, 2026",
        status: "Activo",
        activeAssets: "3",
        totalBilled: "$58,000.00",
        totalPaid: "$40,000.00",
        pendingBalance: "$18,000.00",
      };
    case "attachment":
      return {
        ...baseData,
        documentTitle: "Documento Personalizado",
        date: "13 de Febrero, 2026",
      };
    default:
      return baseData;
  }
};

// Función para reemplazar variables Handlebars con datos de ejemplo
const replaceHandlebarsVariables = (content: string, data: any): string => {
  let result = content;

  // Reemplazar variables simples {{variable}}
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, data[key] || "");
  });

  // Reemplazar helpers de formato
  result = result.replace(
    /{{formatCurrency\s+(\w+)}}/g,
    (_match, key) => data[key] || "$0.00",
  );
  result = result.replace(
    /{{formatDate\s+(\w+)}}/g,
    (_match, key) => data[key] || "Fecha",
  );
  result = result.replace(
    /{{formatNumber\s+(\w+)}}/g,
    (_match, key) => data[key] || "0",
  );

  // Reemplazar loops {{#each items}}...{{/each}} con datos de ejemplo
  if (data.items) {
    const itemsMatch = result.match(/{{#each items}}([\s\S]*?){{\/each}}/);
    if (itemsMatch) {
      const itemTemplate = itemsMatch[1];
      const itemsHtml = data.items
        .map((item: any) => {
          let itemHtml = itemTemplate;
          Object.keys(item).forEach((key) => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
            itemHtml = itemHtml.replace(regex, item[key] || "");
          });
          return itemHtml;
        })
        .join("");
      result = result.replace(itemsMatch[0], itemsHtml);
    }
  }

  return result;
};

export function TemplatePreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tenant } = useAuthStore();

  const { data: template, isLoading } = useQuery({
    queryKey: ["template", id],
    queryFn: () => templateService.getById(id!),
    enabled: !!id,
    retry: 1,
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <Layout title="Cargando...">
        <div className="flex items-center justify-center h-64">
          <div className="text-dark-400">Cargando plantilla...</div>
        </div>
      </Layout>
    );
  }

  if (!template) {
    return (
      <Layout title="Plantilla no encontrada">
        <div className="card">
          <p className="text-red-400">No se encontró la plantilla</p>
          <button
            onClick={() => navigate("/quotations/templates")}
            className="btn-ghost mt-4"
          >
            ← Volver a plantillas
          </button>
        </div>
      </Layout>
    );
  }

  // Generar datos de ejemplo y reemplazar variables
  const sampleData = getSampleDataByType(
    template.type,
    tenant?.name || "Mi Empresa",
    template.logoUrl,
  );
  const previewContent = replaceHandlebarsVariables(
    template.content,
    sampleData,
  );

  return (
    <Layout
      title={`Preview: ${template.name}`}
      subtitle={`Tipo: ${template.type}`}
      actions={
        <>
          <button
            onClick={() => navigate(`/quotations/templates/${id}/edit`)}
            className="btn-ghost"
          >
            ✏️ Editar
          </button>
          <button
            onClick={() => navigate("/quotations/templates")}
            className="btn-ghost"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar with info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-dark-300 mb-3">
              📋 Información
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-dark-400">Nombre:</span>
                <p className="text-white">{template.name}</p>
              </div>
              <div>
                <span className="text-dark-400">Tipo:</span>
                <p className="text-primary-400 uppercase">{template.type}</p>
              </div>
              <div>
                <span className="text-dark-400">Estado:</span>
                <p
                  className={
                    template.isActive ? "text-green-400" : "text-yellow-400"
                  }
                >
                  {template.isActive ? "Activa" : "Inactiva"}
                </p>
              </div>
            </div>
          </div>

          {template.logoUrl && (
            <div className="card">
              <h3 className="text-sm font-semibold text-dark-300 mb-3">
                🖼️ Logo Cargado
              </h3>
              <img
                src={template.logoUrl}
                alt="Logo"
                className="w-full h-auto rounded border border-dark-600 mb-2"
                onError={() => {
                  console.error("Error loading logo:", template.logoUrl);
                }}
              />
              <p className="text-xs text-dark-400 mt-2">
                El logo se mostrará en la parte superior del documento generado.
              </p>
            </div>
          )}

          {!template.logoUrl && (
            <div className="card bg-yellow-900/20 border-yellow-800">
              <h3 className="text-sm font-semibold text-yellow-400 mb-2">
                ⚠️ Sin Logo
              </h3>
              <p className="text-xs text-yellow-400/80">
                No se ha cargado un logo para esta plantilla. Puedes agregarlo
                desde el editor.
              </p>
            </div>
          )}

          <div className="card">
            <h3 className="text-sm font-semibold text-dark-300 mb-3">
              💡 Vista Previa con Datos de Ejemplo
            </h3>
            <p className="text-xs text-dark-400 mb-3">
              Esta vista muestra la plantilla con{" "}
              <strong className="text-green-400">datos de ejemplo</strong>. Las
              variables como{" "}
              <code className="text-primary-400">{`{{quotationCode}}`}</code> ya
              están reemplazadas para que puedas ver cómo quedaría el documento
              final.
            </p>
            <div className="text-xs bg-dark-800 p-2 rounded">
              <p className="text-dark-400 mb-1">
                <strong>Datos de ejemplo:</strong>
              </p>
              <ul className="list-disc list-inside text-dark-400 space-y-1">
                <li>Empresa: {sampleData.companyName}</li>
                {(sampleData as any).quotationCode && (
                  <li>Código: {(sampleData as any).quotationCode}</li>
                )}
                {(sampleData as any).contractCode && (
                  <li>Código: {(sampleData as any).contractCode}</li>
                )}
                <li>Cliente: {(sampleData as any).clientName || "N/A"}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-dark-300 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Vista Previa
              </h3>
              <span className="text-xs text-dark-400">
                Vista previa con datos de ejemplo
              </span>
            </div>

            {/* Logo en el preview si existe */}
            {template.logoUrl && (
              <div className="mb-6 text-center">
                <img
                  src={template.logoUrl}
                  alt="Logo"
                  className="mx-auto max-w-[200px] h-auto"
                  onError={(e) => {
                    console.error("Error loading logo:", template.logoUrl);
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}

            {/* HTML Preview */}
            <div className="bg-white rounded-lg p-8 min-h-[600px] shadow-inner">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            </div>
          </div>

          {/* Variables info */}
          {template.variables && template.variables.length > 0 && (
            <div className="card mt-6">
              <h3 className="text-sm font-semibold text-dark-300 mb-3">
                🔤 Variables disponibles
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {template.variables.map((variable: any, index: number) => (
                  <div
                    key={index}
                    className="text-xs bg-dark-800 p-2 rounded border border-dark-600"
                  >
                    <code className="text-primary-400">{`{{${variable.name}}}`}</code>
                    <p className="text-dark-400 mt-1">{variable.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
