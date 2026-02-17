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
  { value: "Inter", label: "Inter (Modern)" },
  { value: "Roboto", label: "Roboto (Clean)" },
  { value: "Open Sans", label: "Open Sans (Friendly)" },
  { value: "Arial", label: "Arial (Classic)" },
  { value: "Georgia", label: "Georgia (Elegant)" },
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
