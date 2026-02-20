import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { templateService } from "../services/template.service";
import { FileText } from "lucide-react";

interface TemplateSelectorProps {
  templateId: string | undefined;
  onTemplateChange: (templateId: string | undefined) => void;
}

export function TemplateSelector({
  templateId,
  onTemplateChange,
}: TemplateSelectorProps) {
  const { businessUnit } = useAuthStore();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates", businessUnit?.id, "quotation"],
    queryFn: () => templateService.list({ type: "quotation" }),
    enabled: !!businessUnit?.id,
  });

  // Filter only active templates
  const activeTemplates = templates?.filter((t) => t.isActive) || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600" />
        Plantilla PDF
      </h2>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccione plantilla para generar PDF
          </label>
          <select
            value={templateId || ""}
            onChange={(e) => onTemplateChange(e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            disabled={isLoading}
          >
            <option value="">Sin plantilla (no generará PDF automático)</option>
            {activeTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        {/* Info box */}
        {activeTemplates.length === 0 && !isLoading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              No hay plantillas activas. Puedes crear una desde{" "}
              <a
                href="/rental/quotations/templates"
                className="text-blue-600 underline hover:text-blue-700"
              >
                Gestión de Plantillas
              </a>
              .
            </p>
          </div>
        )}

        {templateId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✅ Se generará un PDF automáticamente usando esta plantilla
            </p>
          </div>
        )}

        {!templateId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              ℹ️ Sin plantilla seleccionada, la cotización se guardará pero no
              se generará PDF. Podrás generar el PDF después si configuras una
              plantilla.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
