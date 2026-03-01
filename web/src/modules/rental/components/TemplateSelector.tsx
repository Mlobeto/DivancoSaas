import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { templateService } from "../services/template.service";
import { FileText } from "lucide-react";
import type { QuotationType } from "../types/quotation.types";

interface TemplateSelectorProps {
  templateId: string | undefined;
  onTemplateChange: (templateId: string | undefined) => void;
  quotationType?: QuotationType;
}

/** Map quotation type to the matching template document type */
const toTemplateType = (qt: QuotationType) =>
  qt === "service_based" ? "quotation_service" : "quotation_rental";

export function TemplateSelector({
  templateId,
  onTemplateChange,
  quotationType,
}: TemplateSelectorProps) {
  const { businessUnit } = useAuthStore();

  const templateType = quotationType
    ? toTemplateType(quotationType)
    : "quotation_rental";

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates", businessUnit?.id, templateType],
    queryFn: () => templateService.list({ type: templateType }),
    enabled: !!businessUnit?.id,
  });

  const activeTemplates = templates?.filter((t) => t.isActive) || [];

  const typeLabel =
    quotationType === "service_based"
      ? "Cotización Trabajo/Servicio"
      : "Cotización Alquiler";

  return (
    <div className="card space-y-3">
      <h2 className="font-semibold text-dark-100 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary-400" />
        Plantilla PDF
        <span className="text-xs font-normal text-dark-400">({typeLabel})</span>
      </h2>

      <select
        value={templateId || ""}
        onChange={(e) => onTemplateChange(e.target.value || undefined)}
        className="input"
        disabled={isLoading}
      >
        <option value="">Sin plantilla (no generará PDF automático)</option>
        {activeTemplates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>

      {activeTemplates.length === 0 && !isLoading && (
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-lg p-3">
          <p className="text-sm text-amber-400">
            No hay plantillas activas para este tipo.{" "}
            <a
              href="/rental/templates"
              className="underline hover:text-amber-300"
            >
              Crear plantilla
            </a>
          </p>
        </div>
      )}

      {templateId && (
        <p className="text-xs text-green-400">
          ✓ Se generará PDF automáticamente con esta plantilla
        </p>
      )}
    </div>
  );
}
