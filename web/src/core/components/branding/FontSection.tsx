/**
 * FontSection Component
 * Handles font family selection
 */

import type { UpdateBrandingDTO } from "@/core/types/branding.types";

interface FontSectionProps {
  formData: UpdateBrandingDTO;
  onChange: (updates: Partial<UpdateBrandingDTO>) => void;
}

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter (Moderna y limpia)" },
  { value: "Roboto", label: "Roboto (Versátil)" },
  { value: "Open Sans", label: "Open Sans (Amigable)" },
  { value: "Lato", label: "Lato (Profesional)" },
  { value: "Montserrat", label: "Montserrat (Elegante)" },
  { value: "Poppins", label: "Poppins (Contemporánea)" },
  { value: "Raleway", label: "Raleway (Sofisticada)" },
  { value: "Source Sans Pro", label: "Source Sans Pro (Legible)" },
  { value: "Nunito", label: "Nunito (Redondeada)" },
  { value: "PT Sans", label: "PT Sans (Técnica)" },
  { value: "Arial", label: "Arial (Clásica)" },
  { value: "Georgia", label: "Georgia (Serif elegante)" },
  { value: "Times New Roman", label: "Times New Roman (Formal)" },
];

export function FontSection({ formData, onChange }: FontSectionProps) {
  return (
    <div className="space-y-2">
      <select
        value={formData.fontFamily}
        onChange={(e) => onChange({ fontFamily: e.target.value })}
        className="input w-full"
      >
        {FONT_OPTIONS.map((font) => (
          <option key={font.value} value={font.value}>
            {font.label}
          </option>
        ))}
      </select>

      <p className="text-xs text-dark-400">
        La fuente se aplicará a todos los documentos generados
      </p>
    </div>
  );
}
