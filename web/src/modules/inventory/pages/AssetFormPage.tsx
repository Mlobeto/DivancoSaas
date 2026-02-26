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
import { assetTemplateService } from "@/modules/inventory/services/asset-template.service";
import { ArrowLeft, X, Image as ImageIcon } from "lucide-react";
import { AssetDocumentationModal } from "@/modules/inventory/components/AssetDocumentationModal";

export function AssetFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { tenant, businessUnit } = useAuthStore();
  const isEditMode = !!id;

  // Check if Rental vertical is enabled
  const hasRentalEnabled =
    tenant?.enabledModules?.includes("rental") ||
    businessUnit?.enabledModules?.includes("rental") ||
    false;

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
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
      setFormData((prev) => ({
        ...prev,
        // Si el template requiere mantenimiento preventivo, automáticamente requiere historia clínica
        requiresClinic: selectedTemplate.requiresPreventiveMaintenance,
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

  // Create/Update mutations
  const createMutation = useMutation({
    mutationFn: assetsService.create,
    onSuccess: (newAsset) => {
      setCreatedAssetId(newAsset.id);
      queryClient.invalidateQueries({ queryKey: ["assets"] });

      // If there's an image, upload it
      if (selectedImage) {
        uploadImageMutation.mutate({
          assetId: newAsset.id,
          file: selectedImage,
        });
      } else {
        // Otherwise, prompt for documentation
        if (
          confirm(
            "¿Deseas agregar documentación al activo ahora (SOAT, seguro, etc.)?",
          )
        ) {
          setShowDocModal(true);
        } else {
          navigate("/inventory");
        }
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateAssetData }) =>
      assetsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset", id] });

      // If there's a new image, upload it
      if (selectedImage) {
        uploadImageMutation.mutate({ assetId: id!, file: selectedImage });
      } else {
        navigate("/inventory");
      }
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ assetId, file }: { assetId: string; file: File }) =>
      assetsService.uploadMainImage(assetId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });

      // After uploading image, ask for documentation
      if (!isEditMode && createdAssetId) {
        if (
          confirm(
            "¿Deseas agregar documentación al activo ahora (SOAT, seguro, etc.)?",
          )
        ) {
          setShowDocModal(true);
        } else {
          navigate("/inventory");
        }
      } else {
        navigate("/inventory");
      }
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview("");
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
                {selectedTemplate && !isEditMode && (
                  <div className="mt-3 p-3 bg-[#2b2b2b] border border-[#0696d7]/30 rounded">
                    <p className="text-xs text-[#9e9e9e] mb-2 font-semibold">
                      Configuraciones heredadas del template:
                    </p>
                    <ul className="space-y-1 text-xs text-[#e0e0e0]">
                      {selectedTemplate.requiresPreventiveMaintenance && (
                        <li className="flex items-center gap-2">
                          <span className="text-[#4caf50]">✓</span>
                          Requiere historia clínica de mantenimiento
                        </li>
                      )}
                      {selectedTemplate.requiresDocumentation && (
                        <li className="flex items-center gap-2">
                          <span className="text-[#4caf50]">✓</span>
                          Requiere documentación (SOAT, Seguro, Certificaciones)
                        </li>
                      )}
                      {!selectedTemplate.requiresPreventiveMaintenance &&
                        !selectedTemplate.requiresDocumentation && (
                          <li className="text-[#9e9e9e]">
                            Sin configuraciones especiales
                          </li>
                        )}
                    </ul>
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

              {/* Asset Type */}
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

              {/* Boolean Flags */}
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
                    disabled={selectedTemplate?.requiresPreventiveMaintenance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requiresClinic: e.target.checked,
                      })
                    }
                    className="w-4 h-4 bg-gray-900 border-gray-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label
                    htmlFor="requiresClinic"
                    className={`text-sm cursor-pointer ${
                      selectedTemplate?.requiresPreventiveMaintenance
                        ? "text-gray-400"
                        : "text-gray-300"
                    }`}
                  >
                    Requiere historia clínica de mantenimiento
                    {selectedTemplate?.requiresPreventiveMaintenance && (
                      <span className="ml-2 text-xs text-primary-400">
                        (configurado por template)
                      </span>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Rental Configuration Card - Only show if Rental vertical is enabled */}
          {hasRentalEnabled && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                ⚙️ Configuración de Alquiler (Rental)
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Configura los precios y opciones de alquiler para este activo
              </p>

              {/* Tracking Type */}
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
                <p className="text-xs text-gray-500 mt-1">
                  Selecciona cómo se realizará el seguimiento y cobro del
                  alquiler
                </p>
              </div>

              {/* Pricing fields según trackingType */}
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

              {/* Operator Cost (si requiresOperator=true) */}
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
                  Selecciona un tipo de seguimiento para configurar precios de
                  alquiler
                </div>
              )}
            </div>
          )}

          {/* Image Upload Card */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Imagen Principal
            </h2>

            <div className="space-y-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <ImageIcon className="w-16 h-16 text-gray-400 mb-3" />
                    <p className="text-gray-300 mb-1">
                      Haz clic para seleccionar una imagen
                    </p>
                    <p className="text-sm text-gray-500">
                      JPG, PNG, WebP (máx 5MB)
                    </p>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Custom Fields Card */}
          {selectedTemplate && selectedTemplate.customFields && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Campos Personalizados
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(selectedTemplate.customFields as any[]).map((field: any) => (
                  <div key={field.code}>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {field.name}
                      {field.required && (
                        <span className="text-red-400"> *</span>
                      )}
                    </label>

                    {field.type === "text" && (
                      <input
                        type="text"
                        value={formData.customData?.[field.code] || ""}
                        onChange={(e) =>
                          handleCustomFieldChange(field.code, e.target.value)
                        }
                        required={field.required}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}

                    {field.type === "number" && (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.customData?.[field.code] || ""}
                        onChange={(e) =>
                          handleCustomFieldChange(
                            field.code,
                            parseFloat(e.target.value),
                          )
                        }
                        required={field.required}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}

                    {field.type === "select" && field.options && (
                      <select
                        value={formData.customData?.[field.code] || ""}
                        onChange={(e) =>
                          handleCustomFieldChange(field.code, e.target.value)
                        }
                        required={field.required}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar...</option>
                        {field.options.map((opt: string) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === "boolean" && (
                      <div className="flex items-center gap-3 pt-2">
                        <input
                          type="checkbox"
                          id={`custom-${field.code}`}
                          checked={formData.customData?.[field.code] || false}
                          onChange={(e) =>
                            handleCustomFieldChange(
                              field.code,
                              e.target.checked,
                            )
                          }
                          className="w-4 h-4 bg-gray-900 border-gray-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`custom-${field.code}`}
                          className="text-sm text-gray-300 cursor-pointer"
                        >
                          {field.placeholder || "Sí/No"}
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
