/**
 * useBranding Hook
 * Encapsulates all branding logic: loading, saving, uploading, and preview generation
 */

import { useState, useEffect } from "react";
import { brandingApi } from "@/core/services/branding.api";
import { useAuthStore } from "@/store/auth.store";
import type {
  BusinessUnitBranding,
  UpdateBrandingDTO,
  DocumentType,
  DocumentFormat,
  HeaderConfig,
  FooterConfig,
  ContactInfo,
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
  updateContactInfo: (contactInfo: ContactInfo) => void;
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
  contactInfo: {},
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
    textAlign: "center",
    height: 60,
  },
};

export function useBranding(
  businessUnitId: string | undefined,
): UseBrandingReturn {
  const { tenant } = useAuthStore();
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
      contactInfo: branding?.contactInfo,
      headerConfig: branding?.headerConfig,
      footerConfig: branding?.footerConfig,
    });

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  // Load branding data from API
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
        if (data) {
          setBranding(data);
        }
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

  // Build formData whenever branding or tenant changes (handles async auth load)
  useEffect(() => {
    if (!branding) return;

    // Pre-fill contact info with tenant data if fields are empty
    const contactInfo: ContactInfo = { ...(branding.contactInfo || {}) };
    if (!contactInfo.email && tenant?.contactEmail) {
      contactInfo.email = tenant.contactEmail;
    }
    if (!contactInfo.phone && tenant?.contactPhone) {
      contactInfo.phone = tenant.contactPhone;
    }

    setFormData({
      logoUrl: branding.logoUrl,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      fontFamily: branding.fontFamily,
      contactInfo,
      headerConfig: branding.headerConfig,
      footerConfig: branding.footerConfig,
    });
  }, [branding, tenant]);

  // Save configuration
  const save = async () => {
    if (!businessUnitId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      console.log("[useBranding] Saving branding:", formData);

      const updated = await brandingApi.update(businessUnitId, formData);

      console.log("[useBranding] Branding saved successfully:", updated);

      // Update both branding state and form data to sync them
      setBranding(updated);
      setFormData({
        logoUrl: updated.logoUrl,
        primaryColor: updated.primaryColor,
        secondaryColor: updated.secondaryColor,
        fontFamily: updated.fontFamily,
        contactInfo: updated.contactInfo,
        headerConfig: updated.headerConfig,
        footerConfig: updated.footerConfig,
      });

      setSuccess("Configuración guardada exitosamente");
    } catch (err: any) {
      console.error("[useBranding] Error saving branding:", err);
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

      console.log("[useBranding] Generating preview:", {
        docType,
        format,
        businessUnitId,
      });

      const blob = await brandingApi.preview(businessUnitId, {
        documentType: docType,
        format,
      });

      console.log("[useBranding] Blob received:", {
        size: blob.size,
        type: blob.type,
      });

      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error("El PDF generado está vacío");
      }

      // Check if it's actually a PDF (not an error response)
      if (blob.type && !blob.type.includes("pdf")) {
        console.warn("[useBranding] Blob type is not PDF:", blob.type);

        // Try to read as text to see if it's an error message
        const text = await blob.text();
        console.error("[useBranding] Response text:", text);

        throw new Error(`Respuesta inválida: ${text.substring(0, 200)}`);
      }

      // Create blob URL directly from the received blob
      const url = URL.createObjectURL(blob);

      console.log("[useBranding] Opening PDF in new tab:", url);

      // Open PDF in new tab
      const newTab = window.open(url, "_blank");

      if (!newTab) {
        console.warn("[useBranding] Failed to open new tab (popup blocker?)");
        // Fallback: download the file
        const link = document.createElement("a");
        link.href = url;
        link.download = `preview-${docType}.pdf`;
        link.click();
      }

      // Clean up after 5 seconds (give time for browser to load the PDF)
      setTimeout(() => {
        URL.revokeObjectURL(url);
        console.log("[useBranding] Blob URL revoked");
      }, 5000);

      setSuccess("Vista previa generada correctamente");
    } catch (err: any) {
      console.error("[useBranding] Error generating preview:", err);
      setError(
        err.message ||
          err.response?.data?.message ||
          "Error al generar la vista previa",
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

  // Update contact info
  const updateContactInfo = (contactInfo: ContactInfo) => {
    setFormData((prev) => ({
      ...prev,
      contactInfo,
    }));
  };

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(null);

  return {
    branding,
    formData,
    loading,
    updateContactInfo,
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
