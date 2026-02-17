/**
 * HeaderSection Component
 * Handles document header configuration
 */

import type { HeaderConfig } from "@/core/types/branding.types";

interface HeaderSectionProps {
  config: Partial<HeaderConfig>;
  onChange: (updates: Partial<HeaderConfig>) => void;
}

export function HeaderSection({ config, onChange }: HeaderSectionProps) {
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
          checked={config.showLogo ?? true}
          onChange={(e) => onChange({ showLogo: e.target.checked })}
          className="rounded"
        />
        <span className="text-sm">Mostrar logo</span>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={config.showBusinessName ?? true}
          onChange={(e) => onChange({ showBusinessName: e.target.checked })}
          className="rounded"
        />
        <span className="text-sm">Mostrar nombre de la empresa</span>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={config.showTaxInfo ?? false}
          onChange={(e) => onChange({ showTaxInfo: e.target.checked })}
          className="rounded"
        />
        <span className="text-sm">Mostrar información tributaria</span>
      </label>

      <div>
        <label className="block text-sm font-medium mb-1">
          Alineación del logo
        </label>
        <select
          value={config.logoAlign ?? "left"}
          onChange={(e) =>
            onChange({
              logoAlign: e.target.value as "left" | "center" | "right",
            })
          }
          className="input w-full"
        >
          <option value="left">Izquierda</option>
          <option value="center">Centro</option>
          <option value="right">Derecha</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Altura (px)</label>
        <input
          type="number"
          value={config.height ?? 80}
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
