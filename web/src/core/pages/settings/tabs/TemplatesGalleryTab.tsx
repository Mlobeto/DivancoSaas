/**
 * TemplatesGalleryTab
 * Tab for browsing and applying pre-made templates
 */

import { Sparkles, Download, Eye, Star } from "lucide-react";

interface TemplatesGalleryTabProps {
  businessUnitId: string;
}

export function TemplatesGalleryTab({
  businessUnitId: _businessUnitId,
}: TemplatesGalleryTabProps) {
  // TODO: Galería de plantillas prediseñadas
  // - Filtrar por categoría (moderno, clásico, minimalista, etc.)
  // - Preview de plantilla
  // - Aplicar plantilla (importa configuración)
  // - Rating de plantillas
  // - Compartir plantilla con comunidad

  const templateCategories = [
    { id: "modern", label: "Moderno", count: 12 },
    { id: "classic", label: "Clásico", count: 8 },
    { id: "minimal", label: "Minimalista", count: 6 },
    { id: "creative", label: "Creativo", count: 10 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Galería de Plantillas</h3>
          <p className="text-sm text-dark-400 mt-1">
            Explora plantillas prediseñadas y aplícalas con un clic
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input" disabled>
            <option>Todas las categorías</option>
            {templateCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label} ({cat.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="card bg-dark-800/50 border-dark-700 text-center py-12">
        <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary-400 opacity-50" />
        <h4 className="text-xl font-semibold mb-2 text-dark-300">
          Próximamente: Galería de Plantillas
        </h4>
        <p className="text-dark-400 mb-6 max-w-md mx-auto">
          Accede a una biblioteca de plantillas profesionales diseñadas por
          expertos. Aplica cualquier plantilla con un solo clic y personalízala
          a tu gusto.
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-dark-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>+50 plantillas</span>
          </div>
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>Import con 1 clic</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span>Comunidad</span>
          </div>
        </div>
      </div>

      {/* Ejemplo de galería */}
      <div className="opacity-50 pointer-events-none">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card overflow-hidden">
              {/* Preview Image Placeholder */}
              <div className="aspect-[4/3] bg-gradient-to-br from-primary-900/20 to-dark-800 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-primary-400/30" />
              </div>

              {/* Template Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium">Plantilla Moderna #{i}</h5>
                  <div className="flex items-center gap-1 text-xs text-amber-400">
                    <Star className="w-3 h-3 fill-current" />
                    <span>4.8</span>
                  </div>
                </div>
                <p className="text-sm text-dark-400 mb-3">
                  Diseño limpio y profesional para empresas modernas
                </p>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary-sm flex-1" disabled>
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button className="btn-primary-sm flex-1" disabled>
                    <Download className="w-4 h-4" />
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
