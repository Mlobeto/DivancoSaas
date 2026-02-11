/**
 * ASSET DOCUMENTATION MODAL
 * Modal para cargar múltiples documentos con fechas de vencimiento
 */

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  X,
  Upload,
  FileText,
  Calendar,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  assetsService,
  type UploadAttachmentsData,
} from "@/modules/machinery/services/assets.service";
import { documentTypesService } from "@/modules/machinery/services/document-types.service";

interface AssetDocumentationModalProps {
  assetId: string;
  assetName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssetDocumentationModal({
  assetId,
  assetName,
  onClose,
  onSuccess,
}: AssetDocumentationModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    documentTypeId: "",
    issueDate: "",
    expiryDate: "",
    alertDays: 30,
    notes: "",
  });

  // Fetch document types
  const { data: documentTypes } = useQuery({
    queryKey: ["document-types"],
    queryFn: () => documentTypesService.list(),
  });

  // Get selected document type
  const selectedDocType = documentTypes?.find(
    (dt) => dt.id === formData.documentTypeId,
  );

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (data: UploadAttachmentsData) =>
      assetsService.uploadAttachments(assetId, data),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      alert("Debes seleccionar al menos un archivo");
      return;
    }

    const uploadData: UploadAttachmentsData = {
      files,
      source: "web",
    };

    // Add optional fields
    if (formData.documentTypeId) {
      uploadData.documentTypeId = formData.documentTypeId;
    }
    if (formData.issueDate) {
      uploadData.issueDate = formData.issueDate;
    }
    if (formData.expiryDate) {
      uploadData.expiryDate = formData.expiryDate;
    }
    if (formData.alertDays) {
      uploadData.alertDays = formData.alertDays;
    }
    if (formData.notes) {
      uploadData.notes = formData.notes;
    }

    uploadMutation.mutate(uploadData);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (file: File): string => {
    if (file.type.startsWith("image/")) return "🖼️";
    if (file.type === "application/pdf") return "📄";
    if (file.type.includes("word")) return "📝";
    if (file.type.includes("excel") || file.type.includes("spreadsheet"))
      return "📊";
    return "📎";
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] border border-[#555555] rounded-none w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#2b2b2b] border-b border-[#555555] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#e0e0e0]">
              Cargar Documentación
            </h2>
            <p className="text-sm text-[#9e9e9e] mt-1">{assetName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#9e9e9e] hover:text-[#0696d7] hover:bg-[#3f3f3f] rounded-none transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-[#e0e0e0] mb-2">
              Archivos *
            </label>
            <div className="border-2 border-dashed border-[#555555] rounded-none p-6 text-center hover:border-[#0696d7] transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-[#9e9e9e] mb-3" />
                <p className="text-[#e0e0e0] mb-1">
                  Haz clic para seleccionar archivos
                </p>
                <p className="text-sm text-[#9e9e9e]">
                  Imágenes, PDF, Word, Excel (máx 10MB cada uno)
                </p>
              </label>
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-[#2b2b2b] border border-[#555555] rounded-none"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl">{getFileIcon(file)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#e0e0e0] truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-[#9e9e9e]">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="p-2 text-[#9e9e9e] hover:text-[#e53935] hover:bg-[#3f3f3f] rounded-none transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#555555] pt-6">
            <h3 className="text-sm font-medium text-[#e0e0e0] mb-4">
              Información del Documento (Opcional)
            </h3>

            <div className="space-y-4">
              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-[#e0e0e0] mb-1">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Tipo de Documento
                </label>
                <select
                  value={formData.documentTypeId}
                  onChange={(e) =>
                    setFormData({ ...formData, documentTypeId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#2b2b2b] border border-[#555555] rounded-none text-[#e0e0e0] focus:outline-none focus:ring-1 focus:ring-[#0696d7]"
                >
                  <option value="">Sin especificar</option>
                  {documentTypes?.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.name} ({dt.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Issue Date */}
              <div>
                <label className="block text-sm font-medium text-[#e0e0e0] mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha de Emisión
                </label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, issueDate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#2b2b2b] border border-[#555555] rounded-none text-[#e0e0e0] focus:outline-none focus:ring-1 focus:ring-[#0696d7]"
                />
              </div>

              {/* Expiry Date */}
              {(!selectedDocType || selectedDocType.requiresExpiry) && (
                <>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-[#e0e0e0] mb-1">
                      <Calendar className="w-4 h-4" />
                      Fecha de Vencimiento
                      {selectedDocType?.requiresExpiry && (
                        <span className="text-[#e53935]">*</span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) =>
                        setFormData({ ...formData, expiryDate: e.target.value })
                      }
                      required={selectedDocType?.requiresExpiry}
                      className="w-full px-3 py-2 bg-[#2b2b2b] border border-[#555555] rounded-none text-[#e0e0e0] focus:outline-none focus:ring-1 focus:ring-[#0696d7]"
                    />
                  </div>

                  {formData.expiryDate && (
                    <div>
                      <label className="block text-sm font-medium text-[#e0e0e0] mb-1">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        Alertar con anticipación (días)
                      </label>
                      <input
                        type="number"
                        value={formData.alertDays}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            alertDays: parseInt(e.target.value),
                          })
                        }
                        min={1}
                        max={365}
                        placeholder={
                          selectedDocType?.defaultAlertDays?.toString() || "30"
                        }
                        className="w-full px-3 py-2 bg-[#2b2b2b] border border-[#555555] rounded-none text-[#e0e0e0] focus:outline-none focus:ring-1 focus:ring-[#0696d7]"
                      />
                      <p className="text-xs text-[#9e9e9e] mt-1">
                        Se enviará una alerta {formData.alertDays} días antes
                        del vencimiento
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[#e0e0e0] mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  placeholder="Notas adicionales sobre estos documentos..."
                  className="w-full px-3 py-2 bg-[#2b2b2b] border border-[#555555] rounded-none text-[#e0e0e0] placeholder-[#9e9e9e] focus:outline-none focus:ring-1 focus:ring-[#0696d7]"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#555555]">
            <button
              type="button"
              onClick={onClose}
              disabled={uploadMutation.isPending}
              className="flex-1 px-4 py-2 bg-[#3f3f3f] text-[#e0e0e0] rounded-none hover:bg-[#505050] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploadMutation.isPending || files.length === 0}
              className="flex-1 px-4 py-2 bg-[#0696d7] text-white rounded-none hover:bg-[#0582bd] transition-colors disabled:opacity-50"
            >
              {uploadMutation.isPending
                ? "Subiendo..."
                : `Subir ${files.length} archivo${files.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
