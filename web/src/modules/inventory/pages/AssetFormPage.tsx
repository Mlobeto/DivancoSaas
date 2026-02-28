/**
 * CREATE/EDIT ASSET PAGE
 * Formulario para crear o editar activos con imagen principal y documentación
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import {
  assetsService,
  type CreateAssetData,
} from "@/modules/inventory/services/assets.service";
import {
  assetTemplateService,
  type MachinePart,
  isSupplyCategory,
} from "@/modules/inventory/services/asset-template.service";
import {
  ArrowLeft,
  X,
  Image as ImageIcon,
  Trash2,
  Plus,
  FileText,
} from "lucide-react";
import { AssetDocumentationModal } from "@/modules/inventory/components/AssetDocumentationModal";

export function AssetFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { tenant, businessUnit } = useAuthStore();
  const isEditMode = !!id;

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);
  const [pdfDocuments, setPdfDocuments] = useState<File[]>([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [createdAssetId, setCreatedAssetId] = useState<string | null>(null);
  const [suggestedCode, setSuggestedCode] = useState<string>("");
  const [manuallyEditedCode, setManuallyEditedCode] = useState(false);

  const [formData, setFormData] = useState<CreateAssetData>({
    code: "",
    name: "",
    assetType: "IMPLEMENTO",
    templateId: "",
    acquisitionCost: undefined,
    origin: "",
    currentLocation: "",
    customData: {},
    requiresOperator: false,
    requiresTracking: false,
    requiresClinic: false,

    // Rental pricing
    trackingType: null,
    pricePerHour: undefined,
    minDailyHours: undefined,
    pricePerKm: undefined,
    pricePerDay: undefined,
    pricePerWeek: undefined,
    pricePerMonth: undefined,
    operatorCostType: null,
    operatorCostRate: undefined,
    machineParts: [],
  });

  // Fetch asset templates
  const { data: templates } = useQuery({
    queryKey: ["asset-templates", businessUnit?.id],
    queryFn: () => assetTemplateService.list(),
    enabled: !!tenant?.id && !!businessUnit?.id,
  });

  // Fetch asset if editing
  const { data: asset, isLoading: loadingAsset } = useQuery({
    queryKey: ["asset", id],
    queryFn: () => assetsService.getById(id!),
    enabled: isEditMode && !!id,
  });

  // Get selected template
  const selectedTemplate = templates?.data?.find(
    (t) => t.id === formData.templateId,
  );

  // Load asset data when editing
  useEffect(() => {
    if (asset) {
      setFormData({
        code: asset.code,
        name: asset.name,
        assetType: asset.assetType,
        templateId: asset.templateId || "",
        acquisitionCost: asset.acquisitionCost || undefined,
        origin: asset.origin || "",
        currentLocation: asset.currentLocation || "",
        customData: asset.customData || {},
        requiresOperator: asset.requiresOperator,
        requiresTracking: asset.requiresTracking,
        requiresClinic: asset.requiresClinic,

        // Load rental pricing (with fallback to legacy fields for backward compatibility)
        trackingType:
          asset.rentalProfile?.trackingType ||
          (asset as any).trackingType ||
          null,
        pricePerHour:
          asset.rentalProfile?.pricePerHour || (asset as any).pricePerHour
            ? Number(
                asset.rentalProfile?.pricePerHour ||
                  (asset as any).pricePerHour,
              )
            : undefined,
        minDailyHours:
          asset.rentalProfile?.minDailyHours || (asset as any).minDailyHours
            ? Number(
                asset.rentalProfile?.minDailyHours ||
                  (asset as any).minDailyHours,
              )
            : undefined,
        pricePerKm:
          asset.rentalProfile?.pricePerKm || (asset as any).pricePerKm
            ? Number(
                asset.rentalProfile?.pricePerKm || (asset as any).pricePerKm,
              )
            : undefined,
        pricePerDay:
          asset.rentalProfile?.pricePerDay || (asset as any).pricePerDay
            ? Number(
                asset.rentalProfile?.pricePerDay || (asset as any).pricePerDay,
              )
            : undefined,
        pricePerWeek:
          asset.rentalProfile?.pricePerWeek || (asset as any).pricePerWeek
            ? Number(
                asset.rentalProfile?.pricePerWeek ||
                  (asset as any).pricePerWeek,
              )
            : undefined,
        pricePerMonth:
          asset.rentalProfile?.pricePerMonth || (asset as any).pricePerMonth
            ? Number(
                asset.rentalProfile?.pricePerMonth ||
                  (asset as any).pricePerMonth,
              )
            : undefined,
        operatorCostType:
          asset.rentalProfile?.operatorCostType ||
          (asset as any).operatorCostType ||
          null,
        operatorCostRate:
          asset.rentalProfile?.operatorCostRate ||
          (asset as any).operatorCostRate
            ? Number(
                asset.rentalProfile?.operatorCostRate ||
                  (asset as any).operatorCostRate,
              )
            : undefined,
        machineParts: (asset.machineParts as any[]) || [],
      });
      setManuallyEditedCode(true); // In edit mode, code is already set

      if (asset.imageUrl) {
        setImagePreview(asset.imageUrl);
      }
    }
  }, [asset]);

  // Auto-configure fields based on selected template
  useEffect(() => {
    if (selectedTemplate && !isEditMode) {
      // Mapear categoria del template al assetType del activo
      const categoryToType: Record<string, string> = {
        MACHINERY: "MAQUINARIA",
        IMPLEMENT: "IMPLEMENTO",
        VEHICLE: "VEHICULO",
        TOOL: "HERRAMIENTA",
        SUPPLY_FUEL: "INSUMO",
        SUPPLY_OIL: "INSUMO",
        SUPPLY_PAINT: "INSUMO",
        SUPPLY_SPARE_PART: "INSUMO",
        SUPPLY_CONSUMABLE: "INSUMO",
        SUPPLY_SAFETY: "INSUMO",
      };
      setFormData((prev) => ({
        ...prev,
        assetType: categoryToType[selectedTemplate.category] ?? prev.assetType,
        requiresClinic: selectedTemplate.requiresPreventiveMaintenance,
        // Auto-setear trackingType según categoría
        trackingType: ["MACHINERY", "VEHICLE"].includes(
          selectedTemplate.category,
        )
          ? "MACHINERY"
          : ["IMPLEMENT", "TOOL"].includes(selectedTemplate.category)
            ? "TOOL"
            : prev.trackingType,
      }));
    }
  }, [selectedTemplate, isEditMode]);

  // Fetch suggested code when assetType changes
  useEffect(() => {
    if (!isEditMode && formData.assetType && !manuallyEditedCode) {
      assetsService
        .getNextCode(formData.assetType)
        .then((code) => {
          setSuggestedCode(code);
          setFormData((prev) => ({ ...prev, code }));
        })
        .catch((error) => {
          console.error("Failed to fetch next code:", error);
        });
    }
  }, [formData.assetType, isEditMode, manuallyEditedCode]);

  const createMutation = useMutation({
    mutationFn: assetsService.create,
    onSuccess: async (newAsset) => {
      setCreatedAssetId(newAsset.id);
      queryClient.invalidateQueries({ queryKey: ["assets"] });

      // Upload main image
      if (selectedImage) {
        await assetsService.uploadMainImage(newAsset.id, selectedImage);
      }

      // Upload additional images
      if (additionalImages.length > 0) {
        await assetsService.uploadAttachments(newAsset.id, {
          files: additionalImages,
        });
      }

      // Upload PDF documents
      if (pdfDocuments.length > 0) {
        await assetsService.uploadAttachments(newAsset.id, {
          files: pdfDocuments,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["assets"] });

      if (
        confirm(
          "¿Deseas agregar documentación al activo ahora (SOAT, seguro, etc.)?",
        )
      ) {
        setShowDocModal(true);
      } else {
        navigate("/inventory");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateAssetData }) =>
      assetsService.update(id, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset", id] });

      if (selectedImage) {
        await assetsService.uploadMainImage(id!, selectedImage);
      }
      if (additionalImages.length > 0) {
        await assetsService.uploadAttachments(id!, { files: additionalImages });
      }
      if (pdfDocuments.length > 0) {
        await assetsService.uploadAttachments(id!, { files: pdfDocuments });
      }

      navigate("/inventory");
    },
  });

  // kept for compatibility but no longer needed as standalone
  const uploadImageMutation = useMutation({
    mutationFn: ({ assetId, file }: { assetId: string; file: File }) =>
      assetsService.uploadMainImage(assetId, file),
    onSuccess: () => {},
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview("");
  };

  const handleAdditionalImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setAdditionalImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setAdditionalPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleRemoveAdditional = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
    setAdditionalPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePdfFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(
      (f) => f.type === "application/pdf",
    );
    setPdfDocuments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const handleRemovePdf = (index: number) => {
    setPdfDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode && id) {
      updateMutation.mutate({ id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCustomFieldChange = (fieldCode: string, value: any) => {
    setFormData({
      ...formData,
      customData: {
        ...formData.customData,
        [fieldCode]: value,
      },
    });
  };

  if (!tenant || !businessUnit) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-400">
            Selecciona un tenant y unidad de negocio
          </p>
        </div>
      </Layout>
    );
  }

  if (isEditMode && loadingAsset) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-[#9e9e9e]">Cargando...</p>
        </div>
      </Layout>
    );
  }

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadImageMutation.isPending;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/inventory")}
            className="p-2 text-[#9e9e9e] hover:text-[#0696d7] hover:bg-[#3f3f3f] rounded-none transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#e0e0e0]">
              {isEditMode ? "Editar Activo" : "Nuevo Activo"}
            </h1>
            <p className="text-[#9e9e9e] text-sm mt-1">
              {isEditMode
                ? "Actualiza la información del activo"
                : "Crea un nuevo activo usando una plantilla"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Info Card */}
          <div className="bg-[#1e1e1e] border border-[#555555] rounded-none p-6">
            <h2 className="text-lg font-semibold text-[#e0e0e0] mb-4">
              Información Básica
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Template Select */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#e0e0e0] mb-1">
                  Plantilla{" "}
                  {!isEditMode && <span className="text-[#e53935]">*</span>}
                </label>
                <select
                  value={formData.templateId}
                  onChange={(e) =>
                    setFormData({ ...formData, templateId: e.target.value })
                  }
                  disabled={isEditMode}
                  required={!isEditMode}
                  className="w-full px-3 py-2 bg-[#2b2b2b] border border-[#555555] rounded-none text-[#e0e0e0] focus:outline-none focus:ring-1 focus:ring-[#0696d7] disabled:opacity-50"
                >
                  <option value="">Seleccionar plantilla...</option>
                  {templates?.data?.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
                {isEditMode && (
                  <p className="text-xs text-[#9e9e9e] mt-1">
                    La plantilla no se puede cambiar
                  </p>
                )}
                {selectedTemplate && (
                  <div className="mt-3 p-3 bg-[#2b2b2b] border border-[#0696d7]/30 rounded space-y-1">
                    <div className="flex items-center gap-2 text-xs text-[#e0e0e0]">
                      <span className="text-2xl">
                        {selectedTemplate.icon || "🏗️"}
                      </span>
                      <div>
                        <p className="font-semibold text-[#0696d7]">
                          {selectedTemplate.name}
                        </p>
                        {selectedTemplate.description && (
                          <p className="text-[#9e9e9e]">
                            {selectedTemplate.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {(selectedTemplate.requiresPreventiveMaintenance ||
                      selectedTemplate.requiresDocumentation) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedTemplate.requiresPreventiveMaintenance && (
                          <span className="px-2 py-0.5 bg-blue-900/40 border border-blue-700/40 text-blue-300 text-[11px] rounded-full">
                            📋 Requiere historial de mantenimiento
                          </span>
                        )}
                        {selectedTemplate.requiresDocumentation && (
                          <span className="px-2 py-0.5 bg-green-900/40 border border-green-700/40 text-green-300 text-[11px] rounded-full">
                            📄 Requiere documentación
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-[#e0e0e0] mb-1">
                  Código <span className="text-[#e53935]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    });
                    setManuallyEditedCode(true);
                  }}
                  placeholder={suggestedCode || "EXC-001"}
                  required
                  className="w-full px-3 py-2 bg-[#2b2b2b] border border-[#555555] rounded-none text-[#e0e0e0] placeholder-[#9e9e9e] focus:outline-none focus:ring-1 focus:ring-[#0696d7]"
                />
                {suggestedCode && !manuallyEditedCode && (
                  <p className="text-xs text-[#4caf50] mt-1">
                    Sugerido: {suggestedCode}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Excavadora CAT 320"
                  required
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Asset Type — solo si no hay plantilla seleccionada */}
              {!formData.templateId && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tipo de Activo <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.assetType}
                    onChange={(e) =>
                      setFormData({ ...formData, assetType: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="IMPLEMENTO">Implemento</option>
                    <option value="HERRAMIENTA">Herramienta</option>
                    <option value="VEHICULO">Vehículo</option>
                    <option value="MAQUINARIA">Maquinaria</option>
                  </select>
                </div>
              )}

              {/* Acquisition Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Costo de Adquisición
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.acquisitionCost || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      acquisitionCost: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="150000"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Origin */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Origen
                </label>
                <input
                  type="text"
                  value={formData.origin || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, origin: e.target.value })
                  }
                  placeholder="Comprado nuevo de distribuidor"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Current Location */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Ubicación Actual
                </label>
                <input
                  type="text"
                  value={formData.currentLocation || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      currentLocation: e.target.value,
                    })
                  }
                  placeholder="Bodega Central"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Flags — solo si no hay plantilla (la plantilla los hereda automáticamente) */}
              {!formData.templateId && (
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="requiresOperator"
                      checked={formData.requiresOperator}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requiresOperator: e.target.checked,
                        })
                      }
                      className="w-4 h-4 bg-gray-900 border-gray-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="requiresOperator"
                      className="text-sm text-gray-300 cursor-pointer"
                    >
                      Requiere operador
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="requiresTracking"
                      checked={formData.requiresTracking}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requiresTracking: e.target.checked,
                        })
                      }
                      className="w-4 h-4 bg-gray-900 border-gray-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="requiresTracking"
                      className="text-sm text-gray-300 cursor-pointer"
                    >
                      Requiere seguimiento
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="requiresClinic"
                      checked={formData.requiresClinic}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requiresClinic: e.target.checked,
                        })
                      }
                      className="w-4 h-4 bg-gray-900 border-gray-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="requiresClinic"
                      className="text-sm text-gray-300 cursor-pointer"
                    >
                      Requiere historia clínica de mantenimiento
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rental Configuration Card */}
          {selectedTemplate ? (
            /* ── Plantilla seleccionada: solo pedir precios habilitados ── */
            (() => {
              const rules = selectedTemplate.rentalRules;
              if (!rules) return null;
              return (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      💰 Precios de Alquiler
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Ingresá los precios para las modalidades habilitadas en la
                      plantilla
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rules.allowsHourly && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Precio por Hora ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.pricePerHour || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pricePerHour: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder="625.00"
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {rules.allowsHourly &&
                      rules.minDailyHours !== undefined && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Horas Mínimas / Día
                            <span className="ml-1 text-xs text-gray-500">
                              (mín. {rules.minDailyHours}h según plantilla)
                            </span>
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={formData.minDailyHours || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                minDailyHours: e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              })
                            }
                            placeholder={String(rules.minDailyHours)}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}

                    {rules.chargesKm && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Precio por Km ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.pricePerKm || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pricePerKm: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder="5.00"
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {rules.allowsDaily && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Precio por Día ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.pricePerDay || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pricePerDay: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder="200.00"
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {rules.allowsWeekly && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Precio por Semana ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.pricePerWeek || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pricePerWeek: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder="1200.00"
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {rules.allowsMonthly && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Precio por Mes ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.pricePerMonth || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pricePerMonth: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder="4500.00"
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Costo de operario si la plantilla lo requiere */}
                  {rules.requiresOperator && (
                    <div className="pt-4 border-t border-gray-700">
                      <h3 className="text-sm font-semibold text-yellow-300 mb-3">
                        👷 Costo de Operario
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Tipo de cobro
                          </label>
                          <select
                            value={
                              formData.operatorCostType ||
                              rules.operatorBillingType ||
                              ""
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                operatorCostType: e.target.value
                                  ? (e.target.value as "PER_HOUR" | "PER_DAY")
                                  : null,
                              })
                            }
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          >
                            <option value="">Seleccionar…</option>
                            <option value="PER_HOUR">Por Hora</option>
                            <option value="PER_DAY">Por Día</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Tarifa del Operario ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.operatorCostRate || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                operatorCostRate: e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              })
                            }
                            placeholder="3000.00"
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {!rules.allowsHourly &&
                    !rules.allowsDaily &&
                    !rules.allowsWeekly &&
                    !rules.allowsMonthly && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        La plantilla no tiene modalidades de alquiler
                        configuradas.
                      </p>
                    )}
                </div>
              );
            })()
          ) : (
            /* ── Sin plantilla: formulario genérico ── */
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                ⚙️ Configuración de Alquiler (Rental)
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Configura los precios y opciones de alquiler para este activo
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Seguimiento
                </label>
                <select
                  value={formData.trackingType || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      trackingType: e.target.value
                        ? (e.target.value as "MACHINERY" | "TOOL")
                        : null,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin configuración de alquiler</option>
                  <option value="MACHINERY">
                    MAQUINARIA (Cobro por hora + km)
                  </option>
                  <option value="TOOL">
                    HERRAMIENTA (Cobro por día/semana/mes)
                  </option>
                </select>
              </div>

              {formData.trackingType === "MACHINERY" && (
                <div className="space-y-4 p-4 bg-blue-900/10 border border-blue-800 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-300">
                    Precios para MAQUINARIA
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Precio por Hora ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.pricePerHour || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pricePerHour: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="625.00"
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Horas Mínimas por Día
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.minDailyHours || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minDailyHours: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="8"
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Precio por Km ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.pricePerKm || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pricePerKm: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="5.00"
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.trackingType === "TOOL" && (
                <div className="space-y-4 p-4 bg-green-900/10 border border-green-800 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-300">
                    Precios para HERRAMIENTA
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Precio por Día ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.pricePerDay || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pricePerDay: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="200.00"
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Precio por Semana ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.pricePerWeek || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pricePerWeek: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="1200.00"
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Precio por Mes ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.pricePerMonth || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pricePerMonth: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="4500.00"
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.requiresOperator && formData.trackingType && (
                <div className="mt-4 p-4 bg-yellow-900/10 border border-yellow-800 rounded-lg">
                  <h3 className="text-sm font-semibold text-yellow-300 mb-3">
                    Costo de Operario
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Tipo de Costo
                      </label>
                      <select
                        value={formData.operatorCostType || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            operatorCostType: e.target.value
                              ? (e.target.value as "PER_HOUR" | "PER_DAY")
                              : null,
                          })
                        }
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="">Sin costo de operario</option>
                        <option value="PER_HOUR">Por Hora</option>
                        <option value="PER_DAY">Por Día</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Tarifa del Operario ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.operatorCostRate || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            operatorCostRate: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="3000.00"
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!formData.trackingType && (
                <div className="text-center py-8 text-gray-500">
                  Seleccioná un tipo de seguimiento para configurar precios de
                  alquiler
                </div>
              )}
            </div>
          )}

          {/* Media & Documents Card */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white">
              📎 Fotos y Documentos
            </h2>

            {/* Foto principal */}
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">
                Foto principal
              </p>
              {imagePreview ? (
                <div className="relative w-full h-52">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg h-40 hover:border-blue-500 transition-colors"
                >
                  <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-300">
                    Clic para seleccionar
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    JPG, PNG, WebP (máx 5MB)
                  </span>
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Fotos adicionales */}
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">
                Fotos adicionales
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {additionalPreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square">
                    <img
                      src={src}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAdditional(i)}
                      className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label
                  htmlFor="additional-images"
                  className="cursor-pointer aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg hover:border-blue-500 transition-colors"
                >
                  <Plus className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Agregar</span>
                  <input
                    type="file"
                    id="additional-images"
                    accept="image/*"
                    multiple
                    onChange={handleAdditionalImages}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* PDFs */}
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">
                Documentos PDF
              </p>
              <div className="space-y-2">
                {pdfDocuments.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg"
                  >
                    <FileText className="w-5 h-5 text-red-400 shrink-0" />
                    <span className="text-sm text-gray-300 flex-1 truncate">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePdf(i)}
                      className="p-1 hover:text-red-400 text-gray-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <label
                  htmlFor="pdf-upload"
                  className="cursor-pointer flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-600 rounded-lg hover:border-blue-500 transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Agregar PDF</span>
                  <input
                    type="file"
                    id="pdf-upload"
                    accept="application/pdf"
                    multiple
                    onChange={handlePdfFiles}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Technical Specs from Template */}
          {selectedTemplate &&
            selectedTemplate.technicalSpecs &&
            Object.keys(selectedTemplate.technicalSpecs as Record<string, any>)
              .length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-1">
                  🔧 Especificaciones Técnicas
                </h2>
                <p className="text-sm text-gray-400 mb-4">
                  Campos definidos en la plantilla — ingresá los valores reales
                  de este activo
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.keys(
                    selectedTemplate.technicalSpecs as Record<string, any>,
                  ).map((specKey) => (
                    <div key={specKey}>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        {specKey}
                      </label>
                      <input
                        type="text"
                        value={formData.customData?.[specKey] || ""}
                        onChange={(e) =>
                          handleCustomFieldChange(specKey, e.target.value)
                        }
                        placeholder={`Ej: ${(selectedTemplate.technicalSpecs as any)[specKey] || specKey}`}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                  {selectedTemplate.requiresWeight && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.customData?.["peso_kg"] || ""}
                        onChange={(e) =>
                          handleCustomFieldChange("peso_kg", e.target.value)
                        }
                        placeholder="Ej: 3500"
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Custom Fields Card */}
          {selectedTemplate &&
            selectedTemplate.customFields &&
            selectedTemplate.customFields.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Campos Personalizados
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedTemplate.customFields as any[]).map(
                    (field: any) => {
                      // Support both key/label (interface) and code/name (legacy)
                      const fieldKey = field.key ?? field.code;
                      const fieldLabel = field.label ?? field.name;
                      return (
                        <div key={fieldKey}>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            {fieldLabel}
                            {field.required && (
                              <span className="text-red-400"> *</span>
                            )}
                          </label>

                          {(field.type === "text" || field.type === "TEXT") && (
                            <input
                              type="text"
                              value={formData.customData?.[fieldKey] || ""}
                              onChange={(e) =>
                                handleCustomFieldChange(
                                  fieldKey,
                                  e.target.value,
                                )
                              }
                              required={field.required}
                              placeholder={field.placeholder}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}

                          {(field.type === "number" ||
                            field.type === "NUMBER") && (
                            <input
                              type="number"
                              step="0.01"
                              value={formData.customData?.[fieldKey] || ""}
                              onChange={(e) =>
                                handleCustomFieldChange(
                                  fieldKey,
                                  parseFloat(e.target.value),
                                )
                              }
                              required={field.required}
                              placeholder={field.placeholder}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}

                          {(field.type === "select" ||
                            field.type === "SELECT") &&
                            (field.options || field.validations?.options) && (
                              <select
                                value={formData.customData?.[fieldKey] || ""}
                                onChange={(e) =>
                                  handleCustomFieldChange(
                                    fieldKey,
                                    e.target.value,
                                  )
                                }
                                required={field.required}
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Seleccionar...</option>
                                {(
                                  field.options ??
                                  field.validations?.options ??
                                  []
                                ).map((opt: string) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}

                          {(field.type === "boolean" ||
                            field.type === "BOOLEAN") && (
                            <div className="flex items-center gap-3 pt-2">
                              <input
                                type="checkbox"
                                id={`custom-${fieldKey}`}
                                checked={
                                  formData.customData?.[fieldKey] || false
                                }
                                onChange={(e) =>
                                  handleCustomFieldChange(
                                    fieldKey,
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 bg-gray-900 border-gray-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`custom-${fieldKey}`}
                                className="text-sm text-gray-300 cursor-pointer"
                              >
                                {field.placeholder || "Sí/No"}
                              </label>
                            </div>
                          )}

                          {(field.type === "textarea" ||
                            field.type === "TEXTAREA") && (
                            <textarea
                              rows={3}
                              value={formData.customData?.[fieldKey] || ""}
                              onChange={(e) =>
                                handleCustomFieldChange(
                                  fieldKey,
                                  e.target.value,
                                )
                              }
                              placeholder={field.placeholder}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}

          {/* Parts List Card — only for non-supply individual assets */}
          {selectedTemplate && !isSupplyCategory(selectedTemplate.category) && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    🔩 Relación de Partes
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Listado de componentes clave de este activo (motor, llantas,
                    estibadores…)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      machineParts: [
                        ...((prev.machineParts as MachinePart[]) || []),
                        { description: "", quantity: 1, observations: "" },
                      ],
                    }))
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-sm rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar parte
                </button>
              </div>

              {(!formData.machineParts ||
                (formData.machineParts as MachinePart[]).length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Sin partes registradas. Haz clic en “Agregar parte” para
                  comenzar.
                </p>
              )}

              {(formData.machineParts as MachinePart[])?.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-xs text-left border-b border-gray-700">
                        <th className="pb-2 pr-3">Descripción</th>
                        <th className="pb-2 pr-3 w-24">Cantidad</th>
                        <th className="pb-2 pr-3">Observación</th>
                        <th className="pb-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.machineParts as MachinePart[]).map(
                        (part, idx) => (
                          <tr key={idx} className="align-top">
                            <td className="pr-3 pt-2">
                              <input
                                type="text"
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="Ej: Motor principal"
                                value={part.description}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    machineParts: (
                                      prev.machineParts as MachinePart[]
                                    ).map((p, i) =>
                                      i === idx
                                        ? { ...p, description: e.target.value }
                                        : p,
                                    ),
                                  }))
                                }
                              />
                            </td>
                            <td className="pr-3 pt-2">
                              <input
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                value={part.quantity}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    machineParts: (
                                      prev.machineParts as MachinePart[]
                                    ).map((p, i) =>
                                      i === idx
                                        ? {
                                            ...p,
                                            quantity:
                                              parseInt(e.target.value) || 0,
                                          }
                                        : p,
                                    ),
                                  }))
                                }
                              />
                            </td>
                            <td className="pr-3 pt-2">
                              <input
                                type="text"
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="Opcional"
                                value={part.observations || ""}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    machineParts: (
                                      prev.machineParts as MachinePart[]
                                    ).map((p, i) =>
                                      i === idx
                                        ? { ...p, observations: e.target.value }
                                        : p,
                                    ),
                                  }))
                                }
                              />
                            </td>
                            <td className="pt-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    machineParts: (
                                      prev.machineParts as MachinePart[]
                                    ).filter((_, i) => i !== idx),
                                  }))
                                }
                                className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/inventory")}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading
                ? "Guardando..."
                : isEditMode
                  ? "Actualizar Activo"
                  : "Crear Activo"}
            </button>
          </div>
        </form>
      </div>

      {/* Documentation Modal */}
      {showDocModal && (createdAssetId || id) && (
        <AssetDocumentationModal
          assetId={createdAssetId || id!}
          assetName={formData.name}
          onClose={() => {
            setShowDocModal(false);
            navigate("/inventory");
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["assets"] });
          }}
        />
      )}
    </Layout>
  );
}
