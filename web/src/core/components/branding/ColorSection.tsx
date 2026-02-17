/**
 * ColorSection Component
 * Handles primary and secondary color selection
 */

import type { UpdateBrandingDTO } from "@/core/types/branding.types";

interface ColorSectionProps {
  formData: UpdateBrandingDTO;
  onChange: (updates: Partial<UpdateBrandingDTO>) => void;
}

export function ColorSection({ formData, onChange }: ColorSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Color Principal
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={formData.primaryColor}
            onChange={(e) => onChange({ primaryColor: e.target.value })}
            className="h-10 w-20 rounded cursor-pointer"
          />
          <input
            type="text"
            value={formData.primaryColor}
            onChange={(e) => onChange({ primaryColor: e.target.value })}
            className="input flex-1 font-mono text-sm"
            placeholder="#1E40AF"
            pattern="^#[0-9A-Fa-f]{6}$"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Color Secundario
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={formData.secondaryColor}
            onChange={(e) => onChange({ secondaryColor: e.target.value })}
            className="h-10 w-20 rounded cursor-pointer"
          />
          <input
            type="text"
            value={formData.secondaryColor}
            onChange={(e) => onChange({ secondaryColor: e.target.value })}
            className="input flex-1 font-mono text-sm"
            placeholder="#64748B"
            pattern="^#[0-9A-Fa-f]{6}$"
          />
        </div>
      </div>
    </div>
  );
}
