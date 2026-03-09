/**
 * TOURS MENU COMPONENT
 *
 * Dropdown menu in navbar to restart product tours
 */

import { useState } from "react";
import { useLocation } from "react-router-dom";
import { HelpCircle, BookOpen } from "lucide-react";

export function ToursMenu() {
  const [showToursMenu, setShowToursMenu] = useState(false);
  const location = useLocation();

  const restartTour = (tourName: string) => {
    // Remove the completed flag from localStorage
    localStorage.removeItem(`tour-completed-${tourName}`);
    setShowToursMenu(false);

    // Reload page to trigger tour auto-start
    window.location.reload();
  };

  const tours = [
    {
      name: "asset-templates-list",
      label: "📋 Plantillas de Activos",
      description: "Ver introducción a las plantillas",
      path: "/inventory/templates",
    },
    {
      name: "asset-create",
      label: "🚜 Crear Activo",
      description: "Guía para crear un activo nuevo",
      path: "/inventory/assets/new",
    },
    {
      name: "branding-setup",
      label: "🎨 Configuración de Marca",
      description: "Guía para configurar logo y colores",
      path: "/settings/branding",
    },
    {
      name: "email-templates",
      label: "📧 Plantillas de Email",
      description: "Guía para crear plantillas de correo",
      path: "/settings/branding",
    },
  ];

  // Check which tours have been completed
  const isTourCompleted = (tourName: string) =>
    !!localStorage.getItem(`tour-completed-${tourName}`);

  return (
    <div className="relative">
      <button
        onClick={() => setShowToursMenu(!showToursMenu)}
        className="p-2 rounded-lg hover:bg-dark-700 transition-colors text-dark-400 hover:text-primary-400"
        title="Ayuda y Tours"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* Tours Dropdown */}
      {showToursMenu && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50">
          <div className="p-3 border-b border-dark-700">
            <div className="flex items-center gap-2 text-white font-medium">
              <BookOpen className="w-4 h-4 text-primary-400" />
              <span>Tours Guiados</span>
            </div>
            <p className="text-xs text-dark-400 mt-1">
              Explora las guías interactivas del sistema
            </p>
          </div>

          <div className="p-2 max-h-80 overflow-y-auto">
            {tours.map((tour) => {
              const isCurrentPage = location.pathname.startsWith(
                tour.path.split("/").slice(0, -1).join("/"),
              );
              const isCompleted = isTourCompleted(tour.name);

              return (
                <div
                  key={tour.name}
                  className="mb-2 p-3 rounded-lg bg-dark-900/50 border border-dark-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white mb-1">
                        {tour.label}
                      </div>
                      <div className="text-xs text-dark-400">
                        {tour.description}
                      </div>
                    </div>
                    {isCompleted && (
                      <div className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded border border-green-800">
                        ✓ Visto
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (!isCurrentPage) {
                        // Navigate to the tour page and restart
                        window.location.href = tour.path;
                        restartTour(tour.name);
                      } else {
                        // Already on the page, just restart
                        restartTour(tour.name);
                      }
                    }}
                    className="w-full px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded transition-colors"
                  >
                    {isCurrentPage
                      ? isCompleted
                        ? "🔄 Ver de nuevo"
                        : "▶️ Ver tour"
                      : "▶️ Ir y ver tour"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-dark-700">
            <p className="text-xs text-dark-500 text-center">
              💡 Los tours se muestran automáticamente la primera vez que
              accedes a cada sección
            </p>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showToursMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowToursMenu(false)}
        />
      )}
    </div>
  );
}
