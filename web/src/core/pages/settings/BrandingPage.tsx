/**
 * Branding Configuration Page
 *
 * Configuración única del branding para la Business Unit.
 * Este branding se aplicará automáticamente a TODAS las plantillas:
 * - Cotizaciones
 * - Contratos
 * - Notas
 * - Reportes
 * - Recibos
 * - Documentación
 *
 * El usuario configura UNA SOLA VEZ el look & feel (logo, colores, fuentes, header, footer)
 * y todas las plantillas lo heredan automáticamente.
 */

import { useAuthStore } from "@/store/auth.store";
import { Layout } from "@/core/components/Layout";
import { GeneralBrandingTab } from "./tabs";
import { AlertCircle } from "lucide-react";
import { useBranding } from "@/core/hooks/useBranding";

export function BrandingPage() {
  const { businessUnit } = useAuthStore();

  // Use branding hook for messages (error/success)
  const { error, success } = useBranding(businessUnit?.id);

  if (!businessUnit) {
    return (
      <Layout title="Branding">
        <div className="p-8">
          <div className="card bg-red-900/20 border-red-800 text-red-400">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <p>No hay unidad de negocio seleccionada</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Simple: solo configuración general de branding
  // Este branding se aplicará automáticamente a todas las plantillas
  // (cotizaciones, contratos, notas, reportes, etc.)

  return (
    <Layout
      title="Configuración de Marca"
      subtitle={`Personaliza la identidad visual de ${businessUnit.name}`}
    >
      <div className="p-8">
        {/* Global Messages */}
        {error && (
          <div className="card bg-red-900/20 border-red-800 text-red-400 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="card bg-green-900/20 border-green-800 text-green-400 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* Direct rendering - no tabs needed */}
        <GeneralBrandingTab
          businessUnitId={businessUnit.id}
          businessUnitName={businessUnit.name}
        />
      </div>
    </Layout>
  );
}
