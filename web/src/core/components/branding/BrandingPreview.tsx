/**
 * BrandingPreview Component
 * Displays a visual preview of branding configuration
 */

import { useState } from "react";
import { Eye, FileText, Loader2, AlertTriangle } from "lucide-react";
import type {
  UpdateBrandingDTO,
  DocumentType,
  DocumentFormat,
} from "@/core/types/branding.types";

interface BrandingPreviewProps {
  formData: UpdateBrandingDTO;
  businessUnitName: string;
  generating: boolean;
  isDirty: boolean;
  onGeneratePreview: (
    docType: DocumentType,
    format: DocumentFormat,
  ) => Promise<void>;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "quotation", label: "Cotización" },
  { value: "contract", label: "Contrato" },
  { value: "receipt", label: "Recibo" },
  { value: "note", label: "Nota" },
  { value: "report", label: "Reporte" },
];

export function BrandingPreview({
  formData,
  businessUnitName,
  generating,
  isDirty,
  onGeneratePreview,
}: BrandingPreviewProps) {
  const [previewDocType, setPreviewDocType] =
    useState<DocumentType>("quotation");
  const [previewFormat, setPreviewFormat] = useState<DocumentFormat>("A4");

  const handleGeneratePreview = () => {
    onGeneratePreview(previewDocType, previewFormat);
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-primary-400" />
        <h3 className="font-semibold text-lg">Vista Previa</h3>
      </div>

      {/* Unsaved changes warning */}
      {isDirty && (
        <div className="mb-4 p-3 bg-amber-900/20 border border-amber-800 rounded-lg flex items-center gap-2 text-amber-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <p>Tienes cambios sin guardar</p>
        </div>
      )}

      {/* A4 Preview Simulation */}
      <div
        className={`border-2 border-dark-700 rounded-lg overflow-auto bg-white ${
          previewFormat === "A4" ? "aspect-[1/1.414]" : "w-80 h-96"
        }`}
      >
        <div
          className="h-full flex flex-col text-gray-900"
          style={{ fontFamily: formData.fontFamily }}
        >
          {/* Header Preview */}
          <div
            className="border-b-2 p-4"
            style={{
              borderColor: formData.primaryColor,
              minHeight: `${formData.headerConfig?.height}px`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems:
                formData.headerConfig?.logoAlign === "center"
                  ? "center"
                  : formData.headerConfig?.logoAlign === "right"
                    ? "flex-end"
                    : "flex-start",
            }}
          >
            {formData.headerConfig?.showLogo && formData.logoUrl && (
              <img
                src={formData.logoUrl}
                alt="Logo"
                className="h-12 mb-2 object-contain"
              />
            )}
            {formData.headerConfig?.showBusinessName && (
              <h1
                className="text-xl font-bold"
                style={{ color: formData.primaryColor }}
              >
                {businessUnitName}
              </h1>
            )}
            {formData.headerConfig?.showTaxInfo && (
              <p className="text-sm text-gray-600">NIT: 900.123.456-7</p>
            )}
          </div>

          {/* Content Preview */}
          <div className="flex-1 p-6">
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: formData.primaryColor }}
            >
              {previewDocType === "quotation"
                ? "Cotización #001"
                : previewDocType === "contract"
                  ? "Contrato #001"
                  : "Documento de Ejemplo"}
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">
                Este es un ejemplo de cómo se verá el documento con tu
                configuración de branding.
              </p>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <p className="text-gray-600">
                  Fecha: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Preview */}
          <div
            className="border-t p-4 text-xs"
            style={{
              borderColor: formData.secondaryColor,
              minHeight: `${formData.footerConfig?.height}px`,
            }}
          >
            {formData.footerConfig?.showContactInfo && (
              <div className="text-gray-600 mb-2">
                <p>Email: contacto@empresa.com | Tel: +57 300 123 4567</p>
                <p>Dirección: Calle 123 #45-67, Ciudad</p>
              </div>
            )}
            {formData.footerConfig?.showDisclaimer &&
              formData.footerConfig.disclaimerText && (
                <p className="text-gray-500 italic text-xs">
                  {formData.footerConfig.disclaimerText}
                </p>
              )}
          </div>
        </div>
      </div>

      {/* Preview Controls */}
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Tipo de Documento
            </label>
            <select
              value={previewDocType}
              onChange={(e) =>
                setPreviewDocType(e.target.value as DocumentType)
              }
              className="input w-full"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Formato</label>
            <select
              value={previewFormat}
              onChange={(e) =>
                setPreviewFormat(e.target.value as DocumentFormat)
              }
              className="input w-full"
            >
              <option value="A4">A4 (Documento)</option>
              <option value="ticket">Ticket (Recibo)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGeneratePreview}
          disabled={generating || isDirty}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title={isDirty ? "Guarda los cambios antes de generar el PDF" : ""}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generando PDF...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generar PDF de Prueba
            </>
          )}
        </button>
        {isDirty && (
          <p className="text-xs text-amber-400 text-center">
            Guarda los cambios antes de generar el PDF
          </p>
        )}
      </div>
    </div>
  );
}
