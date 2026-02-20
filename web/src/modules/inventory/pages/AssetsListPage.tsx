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
} from "@/modules/inventory/services/assets.service";
import { Settings, Plus } from "lucide-react";

export function AssetsListPage() {
  const navigate = useNavigate();
  const { tenant, businessUnit } = useAuthStore();
  const [search, setSearch] = useState("");

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
      title="Inventario"
      subtitle={
        filteredAssets.length > 0
          ? `${filteredAssets.length} ${filteredAssets.length === 1 ? "activo" : "activos"}`
          : "Gestiona tus equipos y maquinaria"
      }
      actions={
        <>
          <button
            onClick={() => navigate("/inventory/templates")}
            className="autocad-btn-secondary flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Plantillas
          </button>
          <button
            onClick={() => {
              console.log("Navegando a /inventory/new");
              navigate("/inventory/new");
            }}
            className="autocad-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Activo
          </button>
        </>
      }
    >
      <div className="p-8">
        {/* Search Bar - Only show if there are assets */}
        {filteredAssets.length > 0 && (
          <div className="mb-6">
            <input
              type="text"
              placeholder="Buscar por código, nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="autocad-input w-full"
            />
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0696d7]"></div>
            <p className="mt-4 autocad-text-secondary">Cargando activos...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredAssets.length === 0 && !search && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0696d7]/10 mb-4">
              <Plus className="w-8 h-8 text-[#0696d7]" />
            </div>
            <h3 className="text-xl font-semibold autocad-text-primary mb-2">
              No hay activos registrados
            </h3>
            <p className="autocad-text-secondary mb-6 max-w-md mx-auto">
              Comienza agregando tu primera máquina, equipo o herramienta al
              inventario
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate("/inventory/templates")}
                className="autocad-btn-secondary"
              >
                Ver Plantillas
              </button>
              <button
                onClick={() => {
                  console.log(
                    "Click en Crear primer activo - navegando a /inventory/new",
                  );
                  navigate("/inventory/new");
                }}
                className="autocad-btn-primary"
              >
                Crear primer activo
              </button>
            </div>
          </div>
        )}

        {/* No Results from Search */}
        {!isLoading && filteredAssets.length === 0 && search && (
          <div className="text-center py-16">
            <p className="autocad-text-secondary mb-4">
              No se encontraron activos que coincidan con "{search}"
            </p>
            <button
              onClick={() => setSearch("")}
              className="autocad-btn-secondary"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}

        {/* Assets List */}
        {!isLoading && filteredAssets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset: Asset) => (
              <div
                key={asset.id}
                className="autocad-card hover:border-[#0696d7] transition-all cursor-pointer group"
                onClick={() => {
                  console.log("Navegando a editar activo:", asset.id);
                  navigate(`/inventory/${asset.id}/edit`);
                }}
              >
                {/* Image */}
                {asset.imageUrl && (
                  <div className="mb-4 -mx-6 -mt-6 overflow-hidden rounded-t-lg">
                    <img
                      src={asset.imageUrl}
                      alt={asset.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}

                {/* Content */}
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg autocad-text-primary mb-1">
                        {asset.name}
                      </h3>
                      <p className="text-xs autocad-text-secondary font-mono">
                        {asset.code}
                      </p>
                    </div>
                  </div>

                  {/* Key Info */}
                  <div className="space-y-2">
                    {asset.currentLocation && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="autocad-text-secondary">📍</span>
                        <span className="autocad-text-primary">
                          {asset.currentLocation}
                        </span>
                      </div>
                    )}
                    {asset.acquisitionCost && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="autocad-text-secondary">💰</span>
                        <span className="autocad-accent font-medium">
                          ${asset.acquisitionCost.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
