/**
 * Branding Configuration Page
 * Multi-tab system for complete branding management:
 * - General: Logo, colors, fonts, header/footer
 * - PDF Layout: Document templates
 * - Email Layout: Email templates
 * - Templates: Pre-made template gallery
 */

import { useAuthStore } from "@/store/auth.store";
import { Layout } from "@/core/components/Layout";
import { Tabs } from "@/core/components/common/Tabs";
import {
  GeneralBrandingTab,
  PdfLayoutTab,
  EmailLayoutTab,
  TemplatesGalleryTab,
} from "./tabs";
import { AlertCircle, Palette, FileText, Mail, Sparkles } from "lucide-react";
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

  const tabs = [
    {
      id: "general",
      label: "General",
      icon: <Palette className="w-5 h-5" />,
    },
    {
      id: "pdf",
      label: "PDF Layout",
      icon: <FileText className="w-5 h-5" />,
      badge: "Próximamente",
    },
    {
      id: "email",
      label: "Email Layout",
      icon: <Mail className="w-5 h-5" />,
      badge: "Próximamente",
    },
    {
      id: "templates",
      label: "Plantillas",
      icon: <Sparkles className="w-5 h-5" />,
      badge: "Próximamente",
    },
  ];

  return (
    <Layout
      title="Configuración de Branding"
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

        {/* Tabs System */}
        <Tabs tabs={tabs} defaultTab="general">
          {(activeTab) => {
            switch (activeTab) {
              case "general":
                return (
                  <GeneralBrandingTab
                    businessUnitId={businessUnit.id}
                    businessUnitName={businessUnit.name}
                  />
                );
              case "pdf":
                return <PdfLayoutTab businessUnitId={businessUnit.id} />;
              case "email":
                return <EmailLayoutTab businessUnitId={businessUnit.id} />;
              case "templates":
                return <TemplatesGalleryTab businessUnitId={businessUnit.id} />;
              default:
                return null;
            }
          }}
        </Tabs>
      </div>
    </Layout>
  );
}
