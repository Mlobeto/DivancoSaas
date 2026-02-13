import { useState, useEffect } from "react";
import { Wand2, Eye, Code } from "lucide-react";

interface SimpleTemplateBuilderProps {
  onGenerate: (html: string, css: string) => void;
  logoUrl?: string;
}

interface BuilderFields {
  companyName: string;
  documentTitle: string;
  showLogo: boolean;
  logoWidth: number; // Width in pixels
  logoPosition: "left" | "center" | "right";
  showClientInfo: boolean;
  showProjectDates: boolean;
  showItemsTable: boolean;
  tableColumns: string[];
  showTotals: boolean;
  footerText: string;
  primaryColor: string;
  accentColor: string;
}

export function SimpleTemplateBuilder({
  onGenerate,
  logoUrl,
}: SimpleTemplateBuilderProps) {
  const [fields, setFields] = useState<BuilderFields>({
    companyName: "Mi Empresa",
    documentTitle: "Cotización",
    showLogo: true,
    logoWidth: 150, // Default 150px
    logoPosition: "center",
    showClientInfo: true,
    showProjectDates: true,
    showItemsTable: true,
    tableColumns: ["Descripción", "Días", "Precio", "Subtotal"],
    showTotals: true,
    footerText: "Gracias por su confianza",
    primaryColor: "#1e40af",
    accentColor: "#3b82f6",
  });

  const [previewHtml, setPreviewHtml] = useState("");
  const [previewCss, setPreviewCss] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Generate HTML and CSS from fields
  const generateTemplate = () => {
    // Generate HTML
    let html = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1f2937;">
`;

    // Header with Logo
    if (fields.showLogo || fields.companyName) {
      const textAlign = fields.logoPosition;
      html += `  <div style="text-align: ${textAlign}; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid ${fields.primaryColor};">
`;
      if (fields.showLogo && logoUrl) {
        html += `    <img src="${logoUrl}" alt="Logo" style="width: ${fields.logoWidth}px; height: auto; margin-bottom: 15px;" />
`;
      }
      if (fields.companyName) {
        html += `    <h1 style="margin: 0; color: ${fields.primaryColor}; font-size: 28px;">${fields.companyName}</h1>
`;
      }
      html += `  </div>
`;
    }

    // Document Title
    if (fields.documentTitle) {
      html += `  <div style="margin-bottom: 30px;">
    <h2 style="color: ${fields.primaryColor}; font-size: 24px; margin: 0;">
      ${fields.documentTitle} {{#if quotationCode}}{{quotationCode}}{{/if}}
    </h2>
    <p style="color: #6b7280; margin: 5px 0 0 0;">Fecha: {{formatDate createdAt}}</p>
  </div>
`;
    }

    // Client Information
    if (fields.showClientInfo) {
      html += `  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid ${fields.primaryColor};">
    <h3 style="color: ${fields.primaryColor}; font-size: 18px; margin: 0 0 15px 0;">Información del Cliente</h3>
    <p style="margin: 8px 0; line-height: 1.6;"><strong style="color: #4b5563;">Cliente:</strong> {{clientName}}</p>
    <p style="margin: 8px 0; line-height: 1.6;"><strong style="color: #4b5563;">Email:</strong> {{clientEmail}}</p>
    <p style="margin: 8px 0; line-height: 1.6;"><strong style="color: #4b5563;">Teléfono:</strong> {{clientPhone}}</p>
  </div>
`;
    }

    // Project Dates
    if (fields.showProjectDates) {
      html += `  {{#if estimatedStartDate}}
  <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid ${fields.accentColor};">
    <h3 style="color: ${fields.accentColor}; font-size: 16px; margin: 0 0 10px 0;">Periodo del Proyecto</h3>
    <p style="margin: 5px 0; line-height: 1.6;"><strong style="color: #4b5563;">Inicio:</strong> {{formatDate estimatedStartDate}}</p>
    <p style="margin: 5px 0; line-height: 1.6;"><strong style="color: #4b5563;">Fin:</strong> {{formatDate estimatedEndDate}}</p>
    <p style="margin: 5px 0; line-height: 1.6;"><strong style="color: #4b5563;">Duración:</strong> {{estimatedDays}} días</p>
  </div>
  {{/if}}
`;
    }

    // Items Table
    if (fields.showItemsTable) {
      html += `  <div style="margin: 30px 0;">
    <h3 style="color: ${fields.primaryColor}; font-size: 18px; margin: 0 0 15px 0;">Detalle de Items</h3>
    <table style="width: 100%; border-collapse: collapse; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <thead>
        <tr style="background-color: ${fields.primaryColor}; color: white;">
`;
      fields.tableColumns.forEach((col) => {
        const align = col === "Descripción" ? "left" : "right";
        html += `          <th style="padding: 12px; text-align: ${align}; font-weight: 600;">${col}</th>
`;
      });
      html += `        </tr>
      </thead>
      <tbody>
        {{#each items}}
        <tr style="background-color: {{#if (eq (mod @index 2) 0)}}#f9fafb{{else}}white{{/if}}; border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; color: #1f2937;">{{assetName}}</td>
          <td style="padding: 12px; text-align: right; color: #1f2937;">{{rentalDays}}</td>
          <td style="padding: 12px; text-align: right; color: #1f2937;">{{formatCurrency unitPrice}}</td>
          <td style="padding: 12px; text-align: right; font-weight: 600; color: ${fields.primaryColor};">{{formatCurrency subtotal}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
`;
    }

    // Totals Section
    if (fields.showTotals) {
      html += `  <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
    <div style="text-align: right;">
      <p style="font-size: 16px; margin: 10px 0; color: #6b7280;">
        <span style="display: inline-block; min-width: 120px; text-align: left;">Subtotal:</span>
        <strong style="color: #1f2937;">{{formatCurrency subtotal}}</strong>
      </p>
      <p style="font-size: 16px; margin: 10px 0; color: #6b7280;">
        <span style="display: inline-block; min-width: 120px; text-align: left;">IVA ({{taxRate}}%):</span>
        <strong style="color: #1f2937;">{{formatCurrency taxAmount}}</strong>
      </p>
      <p style="font-size: 24px; margin: 20px 0 0 0; padding-top: 15px; border-top: 2px solid ${fields.primaryColor};">
        <span style="display: inline-block; min-width: 120px; text-align: left; color: ${fields.primaryColor}; font-weight: 600;">TOTAL:</span>
        <strong style="color: ${fields.primaryColor};">{{formatCurrency total}}</strong>
      </p>
    </div>
  </div>
`;
    }

    // Footer
    if (fields.footerText) {
      html += `  <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
    <p style="margin: 0;">${fields.footerText}</p>
  </div>
`;
    }

    html += `</div>`;

    // Generate minimal CSS
    const css = `body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #ffffff;
}

@media print {
  body {
    margin: 0;
  }
}`;

    setPreviewHtml(html);
    setPreviewCss(css);
    return { html, css };
  };

  // Auto-generate preview when fields change
  useEffect(() => {
    generateTemplate();
  }, [fields, logoUrl]);

  const handleGenerate = () => {
    const { html, css } = generateTemplate();
    onGenerate(html, css);
  };

  const updateField = <K extends keyof BuilderFields>(
    key: K,
    value: BuilderFields[K],
  ) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  // Sample data for preview
  const sampleData = {
    quotationCode: "COT-2024-001",
    clientName: "Constructora ABC S.A.S.",
    clientEmail: "contacto@constructoraabc.com",
    clientPhone: "+57 300 123 4567",
    createdAt: new Date().toISOString(),
    estimatedStartDate: "2024-03-01",
    estimatedEndDate: "2024-03-15",
    estimatedDays: 15,
    items: [
      {
        assetName: "Excavadora CAT 320D",
        rentalDays: 15,
        unitPrice: 450000,
        subtotal: 6750000,
      },
      {
        assetName: "Volqueta 10m³",
        rentalDays: 15,
        unitPrice: 280000,
        subtotal: 4200000,
      },
    ],
    subtotal: 10950000,
    taxRate: 19,
    taxAmount: 2080500,
    total: 13030500,
  };

  const renderPreviewWithData = () => {
    let html = previewHtml;

    // Simple replacements for preview
    html = html.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (_m, prop, content) => {
        return sampleData[prop as keyof typeof sampleData] ? content : "";
      },
    );

    html = html.replace(
      /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (_m, prop, itemHtml) => {
        const items = sampleData[prop as keyof typeof sampleData];
        if (Array.isArray(items)) {
          return items
            .map((item, index) => {
              let rendered = itemHtml;
              Object.keys(item).forEach((key) => {
                const value = item[key as keyof typeof item];
                rendered = rendered.replace(
                  new RegExp(`\\{\\{${key}\\}\\}`, "g"),
                  String(value),
                );
              });
              rendered = rendered.replace(/@index/g, String(index));
              return rendered;
            })
            .join("");
        }
        return "";
      },
    );

    html = html.replace(/\{\{formatCurrency\s+(\w+)\}\}/g, (_m, prop) => {
      const value = sampleData[prop as keyof typeof sampleData];
      return typeof value === "number"
        ? `$${value.toLocaleString("es-CO")}`
        : _m;
    });

    html = html.replace(/\{\{formatDate\s+(\w+)\}\}/g, (_m, prop) => {
      const value = sampleData[prop as keyof typeof sampleData];
      if (typeof value === "string") {
        return new Date(value).toLocaleDateString("es-CO", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
      return _m;
    });

    Object.keys(sampleData).forEach((key) => {
      const value = sampleData[key as keyof typeof sampleData];
      if (typeof value === "string" || typeof value === "number") {
        html = html.replace(
          new RegExp(`\\{\\{${key}\\}\\}`, "g"),
          String(value),
        );
      }
    });

    return html;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 rounded-lg text-white">
        <div className="flex items-center gap-3 mb-2">
          <Wand2 className="w-6 h-6" />
          <h2 className="text-xl font-bold">
            Constructor Simple de Plantillas
          </h2>
        </div>
        <p className="text-primary-100 text-sm">
          Rellena los campos y genera tu plantilla profesional sin escribir
          código
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Builder Form */}
        <div className="space-y-4">
          <div className="card bg-dark-800">
            <h3 className="text-lg font-semibold text-primary-400 mb-4">
              ⚙️ Configuración del Documento
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre de tu Empresa
                </label>
                <input
                  type="text"
                  value={fields.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  className="form-input text-gray-900 placeholder:text-gray-400"
                  placeholder="Ej: Construcciones XYZ S.A.S."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título del Documento
                </label>
                <input
                  type="text"
                  value={fields.documentTitle}
                  onChange={(e) => updateField("documentTitle", e.target.value)}
                  className="form-input text-gray-900 placeholder:text-gray-400"
                  placeholder="Ej: Cotización, Propuesta, Presupuesto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Texto del Footer (opcional)
                </label>
                <input
                  type="text"
                  value={fields.footerText}
                  onChange={(e) => updateField("footerText", e.target.value)}
                  className="form-input text-gray-900 placeholder:text-gray-400"
                  placeholder="Ej: Gracias por su confianza"
                />
              </div>
            </div>
          </div>

          <div className="card bg-dark-800">
            <h3 className="text-lg font-semibold text-primary-400 mb-4">
              🎨 Colores
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Color Principal
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={fields.primaryColor}
                    onChange={(e) =>
                      updateField("primaryColor", e.target.value)
                    }
                    className="h-10 w-16 rounded border border-dark-600"
                  />
                  <input
                    type="text"
                    value={fields.primaryColor}
                    onChange={(e) =>
                      updateField("primaryColor", e.target.value)
                    }
                    className="form-input text-gray-900 flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Color Secundario
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={fields.accentColor}
                    onChange={(e) => updateField("accentColor", e.target.value)}
                    className="h-10 w-16 rounded border border-dark-600"
                  />
                  <input
                    type="text"
                    value={fields.accentColor}
                    onChange={(e) => updateField("accentColor", e.target.value)}
                    className="form-input text-gray-900 flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-dark-800">
            <h3 className="text-lg font-semibold text-primary-400 mb-4">
              📋 Secciones a Incluir
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fields.showLogo}
                  onChange={(e) => updateField("showLogo", e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600"
                />
                <span className="text-gray-300">
                  Mostrar Logo de la Empresa
                </span>
              </label>

              {/* Logo Controls - Only show if logo is enabled */}
              {fields.showLogo && logoUrl && (
                <div className="ml-8 space-y-3 p-4 bg-dark-700 rounded-lg border border-dark-600">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tamaño del Logo: {fields.logoWidth}px
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="400"
                      step="10"
                      value={fields.logoWidth}
                      onChange={(e) =>
                        updateField("logoWidth", parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer accent-primary-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Pequeño (50px)</span>
                      <span>Grande (400px)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Posición del Logo
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateField("logoPosition", "left")}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                          fields.logoPosition === "left"
                            ? "bg-primary-600 border-primary-500 text-white"
                            : "bg-dark-600 border-dark-500 text-gray-400 hover:bg-dark-500"
                        }`}
                      >
                        ← Izquierda
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("logoPosition", "center")}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                          fields.logoPosition === "center"
                            ? "bg-primary-600 border-primary-500 text-white"
                            : "bg-dark-600 border-dark-500 text-gray-400 hover:bg-dark-500"
                        }`}
                      >
                        ↔ Centro
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("logoPosition", "right")}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                          fields.logoPosition === "right"
                            ? "bg-primary-600 border-primary-500 text-white"
                            : "bg-dark-600 border-dark-500 text-gray-400 hover:bg-dark-500"
                        }`}
                      >
                        Derecha →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fields.showClientInfo}
                  onChange={(e) =>
                    updateField("showClientInfo", e.target.checked)
                  }
                  className="w-5 h-5 rounded border-gray-600"
                />
                <span className="text-gray-300">
                  Mostrar Información del Cliente
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fields.showProjectDates}
                  onChange={(e) =>
                    updateField("showProjectDates", e.target.checked)
                  }
                  className="w-5 h-5 rounded border-gray-600"
                />
                <span className="text-gray-300">
                  Mostrar Fechas del Proyecto
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fields.showItemsTable}
                  onChange={(e) =>
                    updateField("showItemsTable", e.target.checked)
                  }
                  className="w-5 h-5 rounded border-gray-600"
                />
                <span className="text-gray-300">Mostrar Tabla de Items</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fields.showTotals}
                  onChange={(e) => updateField("showTotals", e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600"
                />
                <span className="text-gray-300">Mostrar Totales</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              className="btn-primary flex-1"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Generar Plantilla
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="btn-secondary"
            >
              {showPreview ? (
                <Code className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="card bg-dark-800 sticky top-6">
            <h3 className="text-lg font-semibold text-primary-400 mb-4">
              👁️ Vista Previa
            </h3>

            {showPreview ? (
              <div className="bg-dark-700 p-4 rounded-lg">
                <pre className="text-xs text-gray-300 overflow-auto max-h-[600px] font-mono">
                  {previewHtml}
                </pre>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8 overflow-auto max-h-[600px]">
                <style>{previewCss}</style>
                <div
                  className="text-gray-900"
                  dangerouslySetInnerHTML={{ __html: renderPreviewWithData() }}
                />
              </div>
            )}

            <p className="text-xs text-gray-500 mt-3">
              Los datos mostrados son de ejemplo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
