/**
 * ASSETS LIST PAGE
 * Página principal del módulo de maquinaria - Lista de activos
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import {
  assetsService,
  type Asset,
} from "@/modules/machinery/services/assets.service";
import { AlertCircle, FileText, Settings, Plus, Upload } from "lucide-react";
import { CSVImportUpload } from "@/shared/components/CSVImportUpload";

export function AssetsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenant, businessUnit } = useAuthStore();
  const [search, setSearch] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  // Fetch assets
  const { data: assets, isLoading } = useQuery({
    queryKey: ["assets", businessUnit?.id, search],
    queryFn: () => assetsService.list(),
    enabled: !!tenant?.id && !!businessUnit?.id,
  });

  // Filter locally if search is active
  const filteredAssets =
    assets?.filter((asset) =>
      search
        ? asset.code.toLowerCase().includes(search.toLowerCase()) ||
          asset.name.toLowerCase().includes(search.toLowerCase())
        : true,
    ) || [];

  const handleImport = async (file: File) => {
    const result = await assetsService.importCSV(file);
    // Invalidar query para refrescar la lista
    queryClient.invalidateQueries({ queryKey: ["assets"] });
    return result;
  };

  if (!tenant || !businessUnit) {
    return (
      <Layout>
        <div className="p-8">
          <div className="autocad-card-alt">
            <p className="autocad-warning">
              No se ha seleccionado un tenant o business unit. Por favor,
              configura tu contexto.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Gestión de Activos"
      subtitle={`Maquinaria, equipos e implementos - ${businessUnit.name}`}
      actions={
        <>
          <button
            onClick={() => setShowImportModal(true)}
            className="autocad-btn-secondary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Importar CSV
          </button>
          <button
            onClick={() => navigate("/machinery/alerts")}
            className="autocad-btn-secondary flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Alertas
          </button>
          <button
            onClick={() => navigate("/machinery/document-types")}
            className="autocad-btn-secondary flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Tipos de Docs
          </button>
          <button
            onClick={() => navigate("/machinery/templates")}
            className="autocad-btn-secondary flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Plantillas
          </button>
          <button
            onClick={() => navigate("/machinery/assets/new")}
            className="autocad-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Activo
          </button>
        </>
      }
    >
      <div className="p-8 space-y-6">
        {/* Search Bar */}
        <div className="autocad-card">
          <input
            type="text"
            placeholder="Buscar por código, nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="autocad-input w-full"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="autocad-card-alt">
            <div className="autocad-text-secondary text-sm mb-1">
              Total Activos
            </div>
            <div className="text-3xl font-bold autocad-text-primary">
              {filteredAssets.length || 0}
            </div>
          </div>
          <div className="autocad-card-alt">
            <div className="autocad-text-secondary text-sm mb-1">
              Disponibles
            </div>
            <div className="text-3xl font-bold autocad-accent">
              {filteredAssets.filter(
                (a: Asset) => !a.currentLocation?.includes("Rentado"),
              ).length || 0}
            </div>
          </div>
          <div className="autocad-card-alt">
            <div className="autocad-text-secondary text-sm mb-1">
              Con Operador
            </div>
            <div className="text-3xl font-bold autocad-text-primary">
              {filteredAssets.filter((a: Asset) => a.requiresOperator).length ||
                0}
            </div>
          </div>
          <div className="autocad-card-alt">
            <div className="autocad-text-secondary text-sm mb-1">
              Con Seguimiento
            </div>
            <div className="text-3xl font-bold autocad-text-primary">
              {filteredAssets.filter((a: Asset) => a.requiresTracking).length ||
                0}
            </div>
          </div>
        </div>

        {/* Assets Grid */}
        {isLoading && (
          <div className="text-center py-12 autocad-text-secondary">
            Cargando activos...
          </div>
        )}

        {!isLoading && filteredAssets.length === 0 && (
          <div className="autocad-card text-center py-12">
            <p className="autocad-text-secondary mb-4">
              No hay activos registrados
            </p>
            <button
              onClick={() => navigate("/machinery/assets/new")}
              className="autocad-btn-primary"
            >
              Crear primer activo
            </button>
          </div>
        )}

        {!isLoading && filteredAssets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset: Asset) => (
              <div
                key={asset.id}
                className="autocad-card hover:border-[#0696d7] transition-colors cursor-pointer"
                onClick={() => navigate(`/machinery/assets/${asset.id}/edit`)}
              >
                {/* Image */}
                {asset.imageUrl && (
                  <div className="mb-4 -mx-6 -mt-6">
                    <img
                      src={asset.imageUrl}
                      alt={asset.name}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                {/* Header */}
                <div className="mb-3">
                  <h3 className="font-semibold text-lg autocad-text-primary">
                    {asset.name}
                  </h3>
                  <p className="autocad-text-secondary text-sm">{asset.code}</p>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {asset.assetType && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="autocad-text-secondary">Tipo:</span>
                      <span className="autocad-text-primary">
                        {asset.assetType}
                      </span>
                    </div>
                  )}
                  {asset.currentLocation && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="autocad-text-secondary">Ubicación:</span>
                      <span className="autocad-text-primary">
                        {asset.currentLocation}
                      </span>
                    </div>
                  )}
                  {asset.acquisitionCost && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="autocad-text-secondary">Costo:</span>
                      <span className="autocad-accent font-medium">
                        ${asset.acquisitionCost.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 pt-3 border-t autocad-border">
                  {asset.requiresOperator && (
                    <span className="autocad-badge-info text-xs">
                      Requiere Operador
                    </span>
                  )}
                  {asset.requiresTracking && (
                    <span className="autocad-badge-info text-xs">
                      Con Seguimiento
                    </span>
                  )}
                  {asset.requiresClinic && (
                    <span className="autocad-badge-info text-xs">
                      Historia Clínica
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CSV Import Modal */}
      {showImportModal && (
        <CSVImportUpload
          title="Importar Assets desde CSV"
          description="Sube un archivo CSV con tus implementos y maquinaria. Descarga la plantilla para ver el formato requerido."
          templateName="import_assets_initial.csv"
          templateUrl="/templates/import_assets_initial.csv"
          onImport={handleImport}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </Layout>
  );
}
