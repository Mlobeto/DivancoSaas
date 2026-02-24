/**
 * BrandingForm Component
 * Main form for branding configuration with collapsible sections
 */

import {
  Save,
  Loader2,
  Upload,
  Palette,
  Type,
  Layout as LayoutIcon,
  Phone,
} from "lucide-react";
import { CollapsibleSection } from "./CollapsibleSection";
import { LogoSection } from "./LogoSection";
import { ColorSection } from "./ColorSection";
import { FontSection } from "./FontSection";
import { ContactSection } from "./ContactSection";
import { HeaderSection } from "./HeaderSection";
import { FooterSection } from "./FooterSection";
import type {
  UpdateBrandingDTO,
  HeaderConfig,
  FooterConfig,
  ContactInfo,
} from "@/core/types/branding.types";

interface BrandingFormProps {
  formData: UpdateBrandingDTO;
  saving: boolean;
  isDirty: boolean;
  onSave: () => Promise<void>;
  onFormChange: (updates: Partial<UpdateBrandingDTO>) => void;
  onHeaderChange: (updates: Partial<HeaderConfig>) => void;
  onFooterChange: (updates: Partial<FooterConfig>) => void;
  onContactChange: (contactInfo: ContactInfo) => void;
  onLogoUpload: (file: File) => Promise<void>;
}

export function BrandingForm({
  formData,
  saving,
  isDirty,
  onSave,
  onFormChange,
  onHeaderChange,
  onContactChange,
  onFooterChange,
  onLogoUpload,
}: BrandingFormProps) {
  const handleRemoveLogo = () => {
    onFormChange({ logoUrl: null });
  };

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <CollapsibleSection
        title="Logo"
        icon={<Upload className="w-5 h-5 text-primary-400" />}
        defaultOpen={false}
      >
        <LogoSection
          formData={formData}
          onUpload={onLogoUpload}
          onRemove={handleRemoveLogo}
        />
      </CollapsibleSection>

      {/* Color Section */}
      <CollapsibleSection
        title="Colores"
        icon={<Palette className="w-5 h-5 text-primary-400" />}
        defaultOpen={false}
      >
        <ColorSection formData={formData} onChange={onFormChange} />
      </CollapsibleSection>

      {/* Font Section */}
      <CollapsibleSection
        title="Fuente"
        icon={<Type className="w-5 h-5 text-primary-400" />}
        defaultOpen={false}
      >
        <FontSection formData={formData} onChange={onFormChange} />
      </CollapsibleSection>

      {/* Contact Information Section */}
      <CollapsibleSection
        title="Datos de Contacto"
        icon={<Phone className="w-5 h-5 text-primary-400" />}
        defaultOpen={false}
      >
        <ContactSection
          value={formData.contactInfo || {}}
          onChange={onContactChange}
        />
      </CollapsibleSection>

      {/* Header Section */}
      <CollapsibleSection
        title="Encabezado"
        icon={<LayoutIcon className="w-5 h-5 text-primary-400" />}
        defaultOpen={false}
      >
        {formData.headerConfig && (
          <HeaderSection
            config={formData.headerConfig}
            onChange={onHeaderChange}
          />
        )}
      </CollapsibleSection>

      {/* Footer Section */}
      <CollapsibleSection
        title="Pie de Página"
        icon={<LayoutIcon className="w-5 h-5 text-primary-400" />}
        defaultOpen={false}
      >
        {formData.footerConfig && (
          <FooterSection
            config={formData.footerConfig}
            onChange={onFooterChange}
          />
        )}
      </CollapsibleSection>

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={saving || !isDirty}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        title={!isDirty ? "No hay cambios para guardar" : ""}
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Guardar Configuración
          </>
        )}
      </button>

      {!isDirty && (
        <p className="text-xs text-dark-400 text-center">
          Todos los cambios están guardados
        </p>
      )}
    </div>
  );
}
