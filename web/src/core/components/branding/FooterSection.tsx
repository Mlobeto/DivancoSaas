/**
 * FooterSection Component
 * Handles document footer configuration
 */

import type { FooterConfig } from "@/core/types/branding.types";

interface FooterSectionProps {
  config: Partial<FooterConfig>;
  onChange: (updates: Partial<FooterConfig>) => void;
}

export function FooterSection({ config, onChange }: FooterSectionProps) {
  const handleHeightChange = (value: string) => {
    const parsed = parseInt(value, 10);
    // Only update if it's a valid number
    if (!isNaN(parsed) && parsed >= 40 && parsed <= 200) {
      onChange({ height: parsed });
    }
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={config.showContactInfo ?? true}
          onChange={(e) => onChange({ showContactInfo: e.target.checked })}
          className="rounded"
        />
        <span className="text-sm">Mostrar información de contacto</span>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={config.showDisclaimer ?? false}
          onChange={(e) => onChange({ showDisclaimer: e.target.checked })}
          className="rounded"
        />
        <span className="text-sm">Mostrar disclaimer</span>
      </label>

      {config.showDisclaimer && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Texto del disclaimer
          </label>
          <textarea
            value={config.disclaimerText || ""}
            onChange={(e) => onChange({ disclaimerText: e.target.value })}
            className="input w-full"
            rows={3}
            placeholder="Texto legal o disclaimers..."
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Altura (px)</label>
        <input
          type="number"
          value={config.height ?? 60}
          onChange={(e) => handleHeightChange(e.target.value)}
          className="input w-full"
          min="40"
          max="200"
          step="10"
        />
        <p className="text-xs text-dark-400 mt-1">Entre 40 y 200 píxeles</p>
      </div>
    </div>
  );
}
