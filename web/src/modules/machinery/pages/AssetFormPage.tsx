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
} from "@/modules/machinery/services/assets.service";
import { assetTemplateService } from "@/modules/machinery/services/asset-template.service";
import { ArrowLeft, X, Image as ImageIcon } from "lucide-react";
import { AssetDocumentationModal } from "@/modules/machinery/components/AssetDocumentationModal";

export function AssetFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { tenant, businessUnit } = useAuthStore();
  const isEditMode = !!id;

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [showDocModal, setShowDocModal] = useState(false);
  const [createdAssetId, setCreatedAssetId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateAssetData>({
    code: "",
    name: "",
    assetType: "",
    templateId: "",
    acquisitionCost: undefined,
    origin: "",
    currentLocation: "",
    customData: {},
    requiresOperator: false,
    requiresTracking: false,
    requiresClinic: false,
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
      });

      if (asset.imageUrl) {
        setImagePreview(asset.imageUrl);
      }
    }
  }, [asset]);

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
          navigate("/machinery");
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
        navigate("/machinery");
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
          navigate("/machinery");
        }
      } else {
        navigate("/machinery");
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
            onClick={() => navigate("/machinery")}
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
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-[#e0e0e0] mb-1">
                  Código <span className="text-[#e53935]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="EXC-001"
                  required
                  className="w-full px-3 py-2 bg-[#2b2b2b] border border-[#555555] rounded-none text-[#e0e0e0] placeholder-[#9e9e9e] focus:outline-none focus:ring-1 focus:ring-[#0696d7]"
                />
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
                  Tipo de Activo
                </label>
                <input
                  type="text"
                  value={formData.assetType}
                  onChange={(e) =>
                    setFormData({ ...formData, assetType: e.target.value })
                  }
                  placeholder="excavator"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
            </div>
          </div>

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
              onClick={() => navigate("/machinery")}
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
            navigate("/machinery");
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["assets"] });
          }}
        />
      )}
    </Layout>
  );
}
