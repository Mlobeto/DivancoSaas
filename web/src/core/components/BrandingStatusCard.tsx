/**
 * Branding Status Card
 * Shows current branding configuration in the dashboard
 */

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { brandingApi } from "@/core/services/branding.api";
import {
  Palette,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export function BrandingStatusCard() {
  const { businessUnit } = useAuthStore();

  const { data: branding, isLoading } = useQuery({
    queryKey: ["branding", businessUnit?.id],
    queryFn: () => brandingApi.get(businessUnit!.id),
    enabled: !!businessUnit?.id,
  });

  if (!businessUnit) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary-400" />
          <h4 className="font-medium">Estado del Branding</h4>
        </div>
        <Link
          to="/settings/branding"
          className="btn-secondary text-xs px-3 py-1 flex items-center gap-1"
        >
          <Settings className="w-3 h-3" />
          Configurar
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
        </div>
      ) : branding ? (
        <div className="space-y-3">
          {/* Logo Status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-400">Logo</span>
            <div className="flex items-center gap-2">
              {branding.logoUrl ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Configurado</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400">Sin logo</span>
                </>
              )}
            </div>
          </div>

          {/* Logo Preview */}
          {branding.logoUrl && (
            <div className="p-3 bg-dark-900/30 rounded-lg flex items-center justify-center">
              <img
                src={branding.logoUrl}
                alt="Logo"
                className="h-12 object-contain"
              />
            </div>
          )}

          {/* Color Scheme */}
          <div className="space-y-2">
            <p className="text-xs text-dark-400 font-medium">Colores</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <div
                  className="h-8 rounded border border-dark-600"
                  style={{ backgroundColor: branding.primaryColor }}
                />
                <p className="text-xs text-dark-400 text-center mt-1">
                  Principal
                </p>
              </div>
              <div className="flex-1">
                <div
                  className="h-8 rounded border border-dark-600"
                  style={{ backgroundColor: branding.secondaryColor }}
                />
                <p className="text-xs text-dark-400 text-center mt-1">
                  Secundario
                </p>
              </div>
            </div>
          </div>

          {/* Font */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-400">Fuente</span>
            <span
              className="font-medium"
              style={{ fontFamily: branding.fontFamily }}
            >
              {branding.fontFamily}
            </span>
          </div>

          {/* Configuration Summary */}
          <div className="pt-3 border-t border-dark-700 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-dark-400">Header configurado</span>
              <CheckCircle className="w-3 h-3 text-green-400" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-dark-400">Footer configurado</span>
              <CheckCircle className="w-3 h-3 text-green-400" />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-dark-400 mb-3">
            No hay branding configurado
          </p>
          <Link to="/settings/branding" className="btn-primary text-sm">
            Configurar Ahora
          </Link>
        </div>
      )}
    </div>
  );
}
