/**
 * LogoSection Component
 * Handles logo upload and display
 */

import { useState } from "react";
import { ImageOff } from "lucide-react";
import type { UpdateBrandingDTO } from "@/core/types/branding.types";

interface LogoSectionProps {
  formData: UpdateBrandingDTO;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
}

export function LogoSection({
  formData,
  onUpload,
  onRemove,
}: LogoSectionProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      // Clear the input so the same file can be uploaded again
      e.target.value = "";
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <div className="space-y-3">
      {formData.logoUrl && (
        <div className="p-4 bg-dark-900/30 rounded-lg">
          {imageError ? (
            <div className="flex flex-col items-center justify-center h-16 text-red-400">
              <ImageOff className="w-8 h-8 mb-2" />
              <p className="text-xs">Error al cargar la imagen</p>
              <p className="text-xs text-dark-500 mt-1 break-all">
                {formData.logoUrl}
              </p>
            </div>
          ) : (
            <>
              {imageLoading && (
                <div className="flex items-center justify-center h-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
                </div>
              )}
              <img
                src={formData.logoUrl}
                alt="Logo actual"
                className={`h-16 object-contain mx-auto ${imageLoading ? "hidden" : ""}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </>
          )}
        </div>
      )}

      <input
        type="file"
        accept="image/jpeg,image/png,image/svg+xml,image/webp"
        onChange={handleFileChange}
        className="input w-full"
      />

      <p className="text-xs text-dark-400">
        Formatos: JPG, PNG, SVG, WebP. Tamaño máximo: 2MB
      </p>

      {formData.logoUrl && (
        <button onClick={onRemove} className="btn-secondary w-full text-sm">
          Eliminar Logo
        </button>
      )}
    </div>
  );
}
