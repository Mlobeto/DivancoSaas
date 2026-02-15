/**
 * DOCUMENT TYPES PAGE
 * Gestión de tipos de documentos configurables por Business Unit
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import {
  documentTypesService,
  type AssetDocumentType,
  type CreateDocumentTypeData,
} from "@/modules/inventory/services/document-types.service";
import { Plus, Pencil, Trash2, FileText, AlertCircle } from "lucide-react";

export function DocumentTypesPage() {
  const queryClient = useQueryClient();
  const { tenant, businessUnit } = useAuthStore();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDocType, setEditingDocType] =
    useState<AssetDocumentType | null>(null);

  // Fetch document types with stats
  const { data: documentTypes, isLoading } = useQuery({
    queryKey: ["document-types", businessUnit?.id, search],
    queryFn: () =>
      documentTypesService.list({
        search: search || undefined,
        stats: true,
      }),
    enabled: !!tenant?.id && !!businessUnit?.id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: documentTypesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-types"] });
    },
  });

  const handleDelete = async (docType: AssetDocumentType) => {
    if (docType.attachmentCount && docType.attachmentCount > 0) {
      alert(
        `No se puede eliminar este tipo de documento porque tiene ${docType.attachmentCount} documentos asociados.`,
      );
      return;
    }

    if (
      confirm(
        `¿Estás seguro de eliminar el tipo de documento "${docType.name}"? Esta acción no se puede deshacer.`,
      )
    ) {
      deleteMutation.mutate(docType.id);
    }
  };

  const handleEdit = (docType: AssetDocumentType) => {
    setEditingDocType(docType);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingDocType(null);
    setShowModal(true);
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

  const filteredDocTypes = documentTypes?.filter((dt) =>
    search
      ? dt.name.toLowerCase().includes(search.toLowerCase()) ||
        dt.code.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Tipos de Documentos
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Configura los tipos de documentos para tus activos (SOAT, Seguros,
              Certificados, etc.)
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Tipo de Documento
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Total de Tipos</p>
                <p className="text-2xl font-bold text-white">
                  {documentTypes?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-gray-400 text-sm">Con Vencimiento</p>
                <p className="text-2xl font-bold text-white">
                  {documentTypes?.filter((dt) => dt.requiresExpiry).length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">Documentos Activos</p>
                <p className="text-2xl font-bold text-white">
                  {documentTypes?.reduce(
                    (sum, dt) => sum + (dt.attachmentCount || 0),
                    0,
                  ) || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Types List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400">Cargando...</p>
          </div>
        ) : filteredDocTypes && filteredDocTypes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocTypes.map((docType) => (
              <div
                key={docType.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: docType.color || "#4B5563",
                        opacity: 0.3,
                      }}
                    >
                      <FileText
                        className="w-5 h-5"
                        style={{ color: docType.color || "#9CA3AF" }}
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">
                        {docType.name}
                      </h3>
                      <p className="text-sm text-gray-400">{docType.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(docType)}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(docType)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {docType.description && (
                  <p className="text-sm text-gray-400 mb-4">
                    {docType.description}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Requiere Vencimiento</span>
                    <span className="text-white font-medium">
                      {docType.requiresExpiry ? "Sí" : "No"}
                    </span>
                  </div>

                  {docType.requiresExpiry && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Alerta Anticipada</span>
                      <span className="text-white font-medium">
                        {docType.defaultAlertDays} días
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Documentos Asociados</span>
                    <span className="text-white font-medium">
                      {docType.attachmentCount || 0}
                    </span>
                  </div>

                  {docType.expiringCount && docType.expiringCount > 0 && (
                    <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-yellow-900/30 border border-yellow-800 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-yellow-400">
                        {docType.expiringCount} por vencer
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-800 border border-gray-700 rounded-lg">
            <FileText className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400 mb-2">No hay tipos de documentos</p>
            <p className="text-gray-500 text-sm mb-4">
              Crea tu primer tipo de documento para comenzar
            </p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear Tipo de Documento
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <DocumentTypeModal
          documentType={editingDocType}
          onClose={() => {
            setShowModal(false);
            setEditingDocType(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["document-types"] });
            setShowModal(false);
            setEditingDocType(null);
          }}
        />
      )}
    </Layout>
  );
}

// Modal Component
interface DocumentTypeModalProps {
  documentType: AssetDocumentType | null;
  onClose: () => void;
  onSuccess: () => void;
}

function DocumentTypeModal({
  documentType,
  onClose,
  onSuccess,
}: DocumentTypeModalProps) {
  const [formData, setFormData] = useState<CreateDocumentTypeData>({
    code: documentType?.code || "",
    name: documentType?.name || "",
    description: documentType?.description || "",
    requiresExpiry: documentType?.requiresExpiry ?? true,
    defaultAlertDays: documentType?.defaultAlertDays || 30,
    color: documentType?.color || "#3B82F6",
    icon: documentType?.icon || "file",
  });

  const createMutation = useMutation({
    mutationFn: documentTypesService.create,
    onSuccess,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      documentTypesService.update(id, data),
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (documentType) {
      // Update
      const { code, ...updateData } = formData;
      updateMutation.mutate({ id: documentType.id, data: updateData });
    } else {
      // Create
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-white mb-4">
          {documentType ? "Editar" : "Nuevo"} Tipo de Documento
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Código *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              disabled={!!documentType}
              placeholder="SOAT"
              required
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            {documentType && (
              <p className="text-xs text-gray-400 mt-1">
                El código no se puede modificar
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Seguro Obligatorio"
              required
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descripción del tipo de documento..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="requiresExpiry"
              checked={formData.requiresExpiry}
              onChange={(e) =>
                setFormData({ ...formData, requiresExpiry: e.target.checked })
              }
              className="w-4 h-4 bg-gray-900 border-gray-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label
              htmlFor="requiresExpiry"
              className="text-sm text-gray-300 cursor-pointer"
            >
              Requiere fecha de vencimiento
            </label>
          </div>

          {formData.requiresExpiry && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Alertar con anticipación (días)
              </label>
              <input
                type="number"
                value={formData.defaultAlertDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultAlertDays: parseInt(e.target.value),
                  })
                }
                min={1}
                max={365}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Color
            </label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value })
              }
              className="w-full h-10 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading
                ? "Guardando..."
                : documentType
                  ? "Actualizar"
                  : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
