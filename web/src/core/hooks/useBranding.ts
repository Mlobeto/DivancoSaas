/**
 * useBranding Hook
 * Encapsulates all branding logic: loading, saving, uploading, and preview generation
 */

import { useState, useEffect } from "react";
import { brandingApi } from "@/core/services/branding.api";
import type {
  BusinessUnitBranding,
  UpdateBrandingDTO,
  DocumentType,
  DocumentFormat,
  HeaderConfig,
  FooterConfig,
} from "@/core/types/branding.types";

export interface UseBrandingReturn {
  // State
  branding: BusinessUnitBranding | null;
  formData: UpdateBrandingDTO;
  loading: boolean;
  saving: boolean;
  generating: boolean;
  error: string | null;
  success: string | null;
  isDirty: boolean;

  // Actions
  setFormData: React.Dispatch<React.SetStateAction<UpdateBrandingDTO>>;
  updateHeaderConfig: (updates: Partial<HeaderConfig>) => void;
  updateFooterConfig: (updates: Partial<FooterConfig>) => void;
  save: () => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
  generatePreview: (
    docType: DocumentType,
    format: DocumentFormat,
  ) => Promise<void>;
  clearError: () => void;
  clearSuccess: () => void;
}

const DEFAULT_FORM_DATA: UpdateBrandingDTO = {
  logoUrl: null,
  primaryColor: "#1E40AF",
  secondaryColor: "#64748B",
  fontFamily: "Inter",
  headerConfig: {
    showLogo: true,
    logoAlign: "left",
    showBusinessName: true,
    showTaxInfo: false,
    height: 80,
  },
  footerConfig: {
    showContactInfo: true,
    showDisclaimer: false,
    disclaimerText: "",
    height: 60,
  },
};

export function useBranding(
  businessUnitId: string | undefined,
): UseBrandingReturn {
  const [branding, setBranding] = useState<BusinessUnitBranding | null>(null);
  const [formData, setFormData] =
    useState<UpdateBrandingDTO>(DEFAULT_FORM_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calculate isDirty state
  const isDirty =
    JSON.stringify(formData) !==
    JSON.stringify({
      logoUrl: branding?.logoUrl,
      primaryColor: branding?.primaryColor,
      secondaryColor: branding?.secondaryColor,
      fontFamily: branding?.fontFamily,
      headerConfig: branding?.headerConfig,
      footerConfig: branding?.footerConfig,
    });

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  // Load branding data
  useEffect(() => {
    if (!businessUnitId) {
      setLoading(false);
      return;
    }

    const loadBranding = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await brandingApi.get(businessUnitId);
        setBranding(data);

        // Update form data
        setFormData({
          logoUrl: data.logoUrl,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          fontFamily: data.fontFamily,
          headerConfig: data.headerConfig,
          footerConfig: data.footerConfig,
        });
      } catch (err: any) {
        console.error("Error loading branding:", err);
        setError(
          err.response?.data?.message || "Error al cargar la configuración",
        );
      } finally {
        setLoading(false);
      }
    };

    loadBranding();
  }, [businessUnitId]);

  // Save configuration
  const save = async () => {
    if (!businessUnitId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updated = await brandingApi.update(businessUnitId, formData);
      setBranding(updated);
      setSuccess("Configuración guardada exitosamente");
    } catch (err: any) {
      console.error("Error saving branding:", err);
      setError(
        err.response?.data?.message || "Error al guardar la configuración",
      );
    } finally {
      setSaving(false);
    }
  };

  // Upload logo
  const uploadLogo = async (file: File) => {
    if (!file || !businessUnitId) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/svg+xml",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Solo se permiten imágenes JPG, PNG, SVG o WebP");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("El archivo debe ser menor a 2MB");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setSaving(true);

      // Upload to Azure Blob Storage
      const result = await brandingApi.uploadLogo(businessUnitId, file);

      // Update form data with new logo URL
      setFormData((prev) => ({ ...prev, logoUrl: result.logoUrl }));

      // Refresh branding data
      const updatedBranding = await brandingApi.get(businessUnitId);
      setBranding(updatedBranding);

      setSuccess(
        `Logo cargado exitosamente (${(result.size / 1024).toFixed(1)} KB)`,
      );
    } catch (err: any) {
      console.error("Error uploading logo:", err);
      setError(err.response?.data?.message || "Error al cargar el logo");
    } finally {
      setSaving(false);
    }
  };

  // Generate preview
  const generatePreview = async (
    docType: DocumentType,
    format: DocumentFormat,
  ) => {
    if (!businessUnitId) return;

    try {
      setGenerating(true);
      setError(null);

      const blob = await brandingApi.preview(businessUnitId, {
        documentType: docType,
        format,
      });

      // Open PDF in new tab
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err: any) {
      console.error("Error generating preview:", err);
      setError(
        err.response?.data?.message || "Error al generar la vista previa",
      );
    } finally {
      setGenerating(false);
    }
  };

  // Update header config
  const updateHeaderConfig = (updates: Partial<HeaderConfig>) => {
    setFormData((prev) => ({
      ...prev,
      headerConfig: { ...prev.headerConfig!, ...updates },
    }));
  };

  // Update footer config
  const updateFooterConfig = (updates: Partial<FooterConfig>) => {
    setFormData((prev) => ({
      ...prev,
      footerConfig: { ...prev.footerConfig!, ...updates },
    }));
  };

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(null);

  return {
    branding,
    formData,
    loading,
    saving,
    generating,
    error,
    success,
    isDirty,
    setFormData,
    updateHeaderConfig,
    updateFooterConfig,
    save,
    uploadLogo,
    generatePreview,
    clearError,
    clearSuccess,
  };
}
