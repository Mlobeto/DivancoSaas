/**
 * PdfLayoutTab
 * Tab for managing PDF document templates
 */

import { FileText, Plus, Copy, Eye } from "lucide-react";

interface PdfLayoutTabProps {
  businessUnitId: string;
}

export function PdfLayoutTab({
  businessUnitId: _businessUnitId,
}: PdfLayoutTabProps) {
  // TODO: Implementar CRUD de DocumentTemplate
  // - Lista de plantillas
  // - Crear nueva plantilla
  // - Editar plantilla existente
  // - Clonar plantilla
  // - Eliminar plantilla
  // - Preview de plantilla

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            Plantillas de Documentos PDF
          </h3>
          <p className="text-sm text-dark-400 mt-1">
            Personaliza el diseño de cotizaciones, contratos y otros documentos
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" disabled>
          <Plus className="w-4 h-4" />
          Nueva Plantilla
        </button>
      </div>

      {/* Coming Soon Card */}
      <div className="card bg-dark-800/50 border-dark-700 text-center py-12">
        <FileText className="w-16 h-16 mx-auto mb-4 text-primary-400 opacity-50" />
        <h4 className="text-xl font-semibold mb-2 text-dark-300">
          Próximamente: Sistema de Plantillas PDF
        </h4>
        <p className="text-dark-400 mb-6 max-w-md mx-auto">
          Pronto podrás crear plantillas personalizadas para tus documentos con
          secciones modulares, variables dinámicas y estilos CSS personalizados.
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-dark-500">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Editor visual</span>
          </div>
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            <span>Clonar plantillas</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>Preview en tiempo real</span>
          </div>
        </div>
      </div>

      {/* Ejemplo de cómo se verá la lista */}
      <div className="opacity-50 pointer-events-none">
        <div className="card">
          <div className="flex items-center justify-between p-4 border-b border-dark-700">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary-400" />
              <div>
                <h4 className="font-medium">Cotización Estándar</h4>
                <p className="text-sm text-dark-400">Plantilla por defecto</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs rounded bg-green-900/20 text-green-400">
                Predeterminada
              </span>
              <button className="btn-secondary-sm" disabled>
                <Eye className="w-4 h-4" />
              </button>
              <button className="btn-secondary-sm" disabled>
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
