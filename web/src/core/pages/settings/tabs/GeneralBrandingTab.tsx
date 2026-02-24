/**
 * GeneralBrandingTab
 * Tab for general branding configuration (logo, colors, fonts, header/footer)
 */

import { useBranding } from "@/core/hooks/useBranding";
import { BrandingPreview, BrandingForm } from "@/core/components/branding";
import { Loader2 } from "lucide-react";

interface GeneralBrandingTabProps {
  businessUnitId: string;
  businessUnitName: string;
}

export function GeneralBrandingTab({
  businessUnitId,
  businessUnitName,
}: GeneralBrandingTabProps) {
  const {
    formData,
    loading,
    saving,
    generating,
    isDirty,
    setFormData,
    updateHeaderConfig,
    updateFooterConfig,
    updateContactInfo,
    save,
    uploadLogo,
    generatePreview,
  } = useBranding(businessUnitId);

  // Handle form changes (for ColorSection and FontSection)
  const handleFormChange = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  if (loading) {
    return (
      <div className="card text-center py-12">
        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary-400" />
        <p className="text-dark-400">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Preview */}
      <div className="space-y-6">
        <BrandingPreview
          formData={formData}
          businessUnitName={businessUnitName}
          businessUnitId={businessUnitId}
          generating={generating}
          isDirty={isDirty}
          onGeneratePreview={generatePreview}
        />
      </div>

      {/* Right Column: Configuration */}
      <div className="space-y-6">
        <BrandingForm
          formData={formData}
          saving={saving}
          isDirty={isDirty}
          onSave={save}
          onFormChange={handleFormChange}
          onHeaderChange={updateHeaderConfig}
          onFooterChange={updateFooterConfig}
          onContactChange={updateContactInfo}
          onLogoUpload={uploadLogo}
        />
      </div>
    </div>
  );
}
