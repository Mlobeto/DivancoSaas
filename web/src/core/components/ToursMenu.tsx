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
  ];

  // Check which tours have been completed
  const completedTours = tours.filter((tour) =>
    localStorage.getItem(`tour-completed-${tour.name}`),
  );

  if (completedTours.length === 0) {
    return null; // Don't show menu if no tours completed yet
  }

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
              Revisa los tours que ya completaste
            </p>
          </div>

          <div className="p-2 max-h-80 overflow-y-auto">
            {completedTours.map((tour) => {
              const isCurrentPage = location.pathname.startsWith(
                tour.path.split("/").slice(0, -1).join("/"),
              );

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
                    <div className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded border border-green-800">
                      ✓ Visto
                    </div>
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
                    {isCurrentPage ? "🔄 Ver de nuevo" : "▶️ Ir y ver tour"}
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
