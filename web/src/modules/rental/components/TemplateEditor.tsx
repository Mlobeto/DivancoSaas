import { useState } from "react";
import {
  DollarSign,
  Calendar,
  Table,
  FileText,
  User,
  Hash,
  Code,
  Eye,
  Layout,
} from "lucide-react";

interface TemplateEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  styles: string;
  onStylesChange: (styles: string) => void;
  logoUrl?: string;
  headerHtml?: string;
  footerHtml?: string;
}

export function TemplateEditor({
  content,
  onContentChange,
  styles,
  onStylesChange,
  logoUrl,
  headerHtml,
  footerHtml,
}: TemplateEditorProps) {
  const [viewMode, setViewMode] = useState<"split" | "code" | "preview">(
    "split",
  );
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(
    null,
  );

  // Sample data for preview
  const sampleData = {
    quotationCode: "COT-2024-001",
    clientName: "Constructora ABC S.A.S.",
    createdAt: new Date().toISOString(),
    estimatedStartDate: "2024-03-01",
    estimatedEndDate: "2024-03-15",
    items: [
      {
        assetName: "Excavadora CAT 320D",
        quantity: 1,
        unitPrice: 450000,
        subtotal: 6750000,
        rentalDays: 15,
      },
      {
        assetName: "Volqueta 10m³",
        quantity: 2,
        unitPrice: 280000,
        subtotal: 8400000,
        rentalDays: 15,
      },
    ],
    subtotal: 15150000,
    taxRate: 19,
    taxAmount: 2878500,
    total: 18028500,
  };

  // Helper to insert text at cursor position
  const insertAtCursor = (text: string) => {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const newContent =
      content.substring(0, start) + text + content.substring(end);

    onContentChange(newContent);

    // Set cursor position after inserted text
    setTimeout(() => {
      textareaRef.selectionStart = textareaRef.selectionEnd =
        start + text.length;
      textareaRef.focus();
    }, 0);
  };

  const variableButtons = [
    { label: "Código", icon: Hash, value: "{{quotationCode}}" },
    { label: "Cliente", icon: User, value: "{{clientName}}" },
    { label: "Fecha", icon: Calendar, value: "{{formatDate createdAt}}" },
    {
      label: "Subtotal",
      icon: DollarSign,
      value: "{{formatCurrency subtotal}}",
    },
    { label: "Total", icon: DollarSign, value: "{{formatCurrency total}}" },
  ];

  const sectionTemplates = [
    {
      name: "Encabezado con Logo",
      icon: Layout,
      template: `<div style="text-align: center; margin-bottom: 30px;">
  ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 80px; margin-bottom: 20px;" />` : ""}
  <h1 style="color: #1e40af; margin: 0;">{{#if quotationCode}}Cotización {{quotationCode}}{{else}}Documento{{/if}}</h1>
  <p style="color: #6b7280; margin: 10px 0;">{{formatDate createdAt}}</p>
</div>`,
    },
    {
      name: "Información del Cliente",
      icon: User,
      template: `<div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-left: 4px solid #1e40af;">
  <h3 style="margin: 0 0 10px 0; color: #1e40af;">Información del Cliente</h3>
  <p style="margin: 5px 0;"><strong>Cliente:</strong> {{clientName}}</p>
  <p style="margin: 5px 0;"><strong>Fecha:</strong> {{formatDate createdAt}}</p>
  {{#if estimatedStartDate}}
  <p style="margin: 5px 0;"><strong>Inicio:</strong> {{formatDate estimatedStartDate}}</p>
  <p style="margin: 5px 0;"><strong>Fin:</strong> {{formatDate estimatedEndDate}}</p>
  {{/if}}
</div>`,
    },
    {
      name: "Tabla de Items",
      icon: Table,
      template: `<table style="width: 100%; border-collapse: collapse; margin: 30px 0;">
  <thead>
    <tr style="background-color: #1e40af; color: white;">
      <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left;">Descripción</th>
      <th style="border: 1px solid #d1d5db; padding: 12px; text-align: center;">Días</th>
      <th style="border: 1px solid #d1d5db; padding: 12px; text-align: right;">Precio Unit.</th>
      <th style="border: 1px solid #d1d5db; padding: 12px; text-align: right;">Subtotal</th>
    </tr>
  </thead>
  <tbody>
    {{#each items}}
    <tr style="{{#if @index}}{{#if (eq (mod @index 2) 0)}}background-color: #f9fafb;{{/if}}{{/if}}">
      <td style="border: 1px solid #d1d5db; padding: 12px;">{{assetName}}</td>
      <td style="border: 1px solid #d1d5db; padding: 12px; text-align: center;">{{rentalDays}}</td>
      <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right;">{{formatCurrency unitPrice}}</td>
      <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right;">{{formatCurrency subtotal}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>`,
    },
    {
      name: "Totales",
      icon: DollarSign,
      template: `<div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #d1d5db;">
  <div style="text-align: right;">
    <p style="font-size: 14px; margin: 10px 0; color: #4b5563;">
      <strong>Subtotal:</strong> {{formatCurrency subtotal}}
    </p>
    <p style="font-size: 14px; margin: 10px 0; color: #4b5563;">
      <strong>IVA ({{taxRate}}%):</strong> {{formatCurrency taxAmount}}
    </p>
    <p style="font-size: 24px; margin: 15px 0; color: #1e40af;">
      <strong>Total:</strong> {{formatCurrency total}}
    </p>
  </div>
</div>`,
    },
    {
      name: "Nota/Advertencia",
      icon: FileText,
      template: `<div style="margin: 20px 0; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b;">
  <p style="margin: 0; color: #92400e;"><strong>Nota importante:</strong> Escriba su texto aquí</p>
</div>`,
    },
  ];

  // Render preview with sample data
  const renderPreview = () => {
    try {
      // Simple Handlebars-like replacement for preview
      let html = content;

      // Replace #if blocks
      html = html.replace(
        /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
        (_match, prop, content) => {
          return sampleData[prop as keyof typeof sampleData] ? content : "";
        },
      );

      // Replace #each blocks
      html = html.replace(
        /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
        (_match, prop, itemHtml) => {
          const items = sampleData[prop as keyof typeof sampleData];
          if (Array.isArray(items)) {
            return items
              .map((item, index) => {
                let rendered = itemHtml;
                // Replace item properties
                Object.keys(item).forEach((key) => {
                  const value = item[key as keyof typeof item];
                  rendered = rendered.replace(
                    new RegExp(`\\{\\{${key}\\}\\}`, "g"),
                    String(value),
                  );
                });
                // Replace @index
                rendered = rendered.replace(/@index/g, String(index));
                return rendered;
              })
              .join("");
          }
          return "";
        },
      );

      // Replace helpers
      html = html.replace(/\{\{formatCurrency\s+(\w+)\}\}/g, (match, prop) => {
        const value = sampleData[prop as keyof typeof sampleData];
        return typeof value === "number"
          ? `$${value.toLocaleString("es-CO")}`
          : match;
      });

      html = html.replace(/\{\{formatDate\s+(\w+)\}\}/g, (match, prop) => {
        const value = sampleData[prop as keyof typeof sampleData];
        if (typeof value === "string") {
          return new Date(value).toLocaleDateString("es-CO", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        }
        return match;
      });

      // Replace simple variables
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
    } catch (error) {
      return '<p style="color: red;">Error en la sintaxis del template</p>';
    }
  };

  return (
    <div className="space-y-4">
      {/* View Mode Selector */}
      <div className="flex items-center justify-between bg-dark-800 p-3 rounded-lg border border-dark-600">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "split"
                ? "bg-primary-600 text-white"
                : "bg-dark-700 text-gray-300 hover:bg-dark-600"
            }`}
          >
            <Layout className="w-4 h-4 inline mr-2" />
            Dividido
          </button>
          <button
            type="button"
            onClick={() => setViewMode("code")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "code"
                ? "bg-primary-600 text-white"
                : "bg-dark-700 text-gray-300 hover:bg-dark-600"
            }`}
          >
            <Code className="w-4 h-4 inline mr-2" />
            Código
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "preview"
                ? "bg-primary-600 text-white"
                : "bg-dark-700 text-gray-300 hover:bg-dark-600"
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Vista Previa
          </button>
        </div>
        <div className="text-xs text-gray-400">
          Los datos mostrados son de ejemplo
        </div>
      </div>

      {/* Variable Buttons */}
      {(viewMode === "split" || viewMode === "code") && (
        <div className="bg-dark-800 p-4 rounded-lg border border-dark-600">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Variables rápidas:
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {variableButtons.map((btn) => (
              <button
                key={btn.value}
                type="button"
                onClick={() => insertAtCursor(btn.value)}
                className="px-3 py-2 bg-dark-700 hover:bg-dark-600 border border-dark-500 rounded-lg text-sm text-gray-300 flex items-center gap-2 transition-colors"
              >
                <btn.icon className="w-4 h-4 text-primary-400" />
                {btn.label}
              </button>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Secciones predefinidas:
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {sectionTemplates.map((section) => (
              <button
                key={section.name}
                type="button"
                onClick={() => insertAtCursor(section.template)}
                className="px-3 py-2 bg-dark-700 hover:bg-dark-600 border border-dark-500 rounded-lg text-sm text-gray-300 flex items-center gap-2 transition-colors text-left"
              >
                <section.icon className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span>{section.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor and Preview */}
      <div
        className={`grid gap-4 ${viewMode === "split" ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {/* Code Editor */}
        {(viewMode === "split" || viewMode === "code") && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Contenido HTML
            </label>
            <textarea
              ref={setTextareaRef}
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="form-input text-gray-900 font-mono text-sm placeholder:text-gray-400 min-h-[600px]"
              placeholder="Escribe HTML aquí o usa los botones de arriba..."
            />
          </div>
        )}

        {/* Live Preview */}
        {(viewMode === "split" || viewMode === "preview") && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Vista Previa (con datos de ejemplo)
            </label>
            <div className="bg-white rounded-lg border border-dark-600 p-8 min-h-[600px] overflow-auto">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="max-h-20 mb-4 object-contain"
                />
              )}
              {headerHtml && (
                <div
                  className="mb-4 border-b pb-4"
                  dangerouslySetInnerHTML={{ __html: headerHtml }}
                />
              )}
              <style>{styles}</style>
              <div
                className="text-gray-900"
                dangerouslySetInnerHTML={{ __html: renderPreview() }}
              />
              {footerHtml && (
                <div
                  className="mt-4 pt-4 border-t"
                  dangerouslySetInnerHTML={{ __html: footerHtml }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Styles Editor - Always below */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Estilos CSS (opcional)
        </label>
        <textarea
          value={styles}
          onChange={(e) => onStylesChange(e.target.value)}
          className="form-input text-gray-900 font-mono text-sm placeholder:text-gray-400"
          rows={8}
          placeholder="Estilos CSS para personalizar el diseño..."
        />
      </div>
    </div>
  );
}
