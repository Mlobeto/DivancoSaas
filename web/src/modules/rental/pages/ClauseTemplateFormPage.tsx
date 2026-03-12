import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import { Save, X, FileText, AlertCircle, Info } from "lucide-react";
import {
  clauseTemplateService,
  CLAUSE_CATEGORIES,
  COMMON_ASSET_TYPES,
  type CreateClauseTemplateDTO,
} from "../services/clause-template.service";

const CONTRACT_TYPES = [
  { value: "master", label: "Contratos Maestros" },
  { value: "specific", label: "Contratos Específicos" },
];

export function ClauseTemplateFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenant, businessUnit } = useAuthStore();

  const isEdit = !!id;

  // Form state
  const [formData, setFormData] = useState<CreateClauseTemplateDTO>({
    name: "",
    category: "general",
    content: "",
    applicableAssetTypes: [],
    applicableContractTypes: ["specific"],
    isDefault: false,
    displayOrder: 0,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Query existing clause (for edit mode)
  const { data: clause, isLoading } = useQuery({
    queryKey: ["clauseTemplate", id],
    queryFn: () => clauseTemplateService.getById(id!),
    enabled: isEdit,
  });

  // Populate form when editing
  useEffect(() => {
    if (clause) {
      setFormData({
        name: clause.name,
        category: clause.category,
        content: clause.content,
        applicableAssetTypes: clause.applicableAssetTypes,
        applicableContractTypes: clause.applicableContractTypes,
        isDefault: clause.isDefault,
        displayOrder: clause.displayOrder,
        isActive: clause.isActive,
      });
    }
  }, [clause]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateClauseTemplateDTO) =>
      clauseTemplateService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clauseTemplates"] });
      navigate("/rental/clause-templates");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: CreateClauseTemplateDTO) =>
      clauseTemplateService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clauseTemplates"] });
      queryClient.invalidateQueries({ queryKey: ["clauseTemplate", id] });
      navigate("/rental/clause-templates");
    },
  });

  const handleChange = (field: keyof CreateClauseTemplateDTO, value: any) => {
    setFormData((prev: CreateClauseTemplateDTO) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleAssetType = (assetType: string) => {
    const current = formData.applicableAssetTypes || [];
    if (current.includes(assetType)) {
      handleChange(
        "applicableAssetTypes",
        current.filter((t: string) => t !== assetType),
      );
    } else {
      handleChange("applicableAssetTypes", [...current, assetType]);
    }
  };

  const toggleContractType = (contractType: string) => {
    const current = formData.applicableContractTypes || [];
    if (current.includes(contractType)) {
      handleChange(
        "applicableContractTypes",
        current.filter((t: string) => t !== contractType),
      );
    } else {
      handleChange("applicableContractTypes", [...current, contractType]);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!formData.content?.trim()) {
      newErrors.content = "El contenido es requerido";
    }

    if (
      !formData.applicableContractTypes ||
      formData.applicableContractTypes.length === 0
    ) {
      newErrors.applicableContractTypes =
        "Selecciona al menos un tipo de contrato";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (isEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!tenant || !businessUnit) {
    return (
      <Layout>
        <div className="card bg-yellow-900/20 border-yellow-800 text-yellow-400">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          No se ha seleccionado un tenant o business unit
        </div>
      </Layout>
    );
  }

  if (isEdit && isLoading) {
    return (
      <Layout>
        <div className="text-center py-8 text-dark-400">
          Cargando cláusula...
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={isEdit ? "Editar Cláusula" : "Nueva Cláusula"}
      subtitle={
        isEdit
          ? "Modifica la plantilla de cláusula"
          : "Crea una nueva plantilla de cláusula reutilizable"
      }
    >
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-200 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Información Básica
          </h3>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="form-label">
                Nombre de la cláusula <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={`form-input ${errors.name ? "border-red-500" : ""}`}
                placeholder="Ej: Responsabilidad del Operador"
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="form-label">
                Categoría <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="form-input"
              >
                {CLAUSE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} - {cat.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Display Order */}
            <div>
              <label className="form-label">Orden de visualización</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  handleChange("displayOrder", parseInt(e.target.value) || 0)
                }
                className="form-input"
                placeholder="0"
              />
              <p className="text-xs text-dark-400 mt-1">
                Orden en el que aparecerá la cláusula en el contrato (menor
                primero)
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-200 mb-4">
            Contenido
          </h3>

          <div>
            <label className="form-label">
              Texto de la cláusula <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleChange("content", e.target.value)}
              className={`form-input min-h-[200px] font-mono text-sm ${
                errors.content ? "border-red-500" : ""
              }`}
              placeholder="Escribe el contenido de la cláusula..."
            />
            {errors.content && (
              <p className="text-red-400 text-sm mt-1">{errors.content}</p>
            )}
            <div className="mt-2 p-3 bg-blue-900/20 border border-blue-800 rounded text-xs text-blue-300">
              <Info className="w-4 h-4 inline mr-1" />
              <strong>Variables disponibles:</strong> Puedes usar{" "}
              {"{{clientName}}"}, {"{{assetName}}"}, {"{{startDate}}"},{" "}
              {"{{endDate}}"}, {"{{rate}}"}, {"{{quotationId}}"},{" "}
              {"{{contractId}}"} en el contenido. Serán reemplazadas
              automáticamente al generar contratos.
            </div>
          </div>
        </div>

        {/* Applicability */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-200 mb-4">
            Aplicabilidad
          </h3>

          <div className="space-y-4">
            {/* Contract Types */}
            <div>
              <label className="form-label">
                Tipos de contrato <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {CONTRACT_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(
                        formData.applicableContractTypes || []
                      ).includes(type.value)}
                      onChange={() => toggleContractType(type.value)}
                      className="rounded border-dark-600 bg-dark-800 text-primary-600"
                    />
                    <span className="text-sm text-dark-300">{type.label}</span>
                  </label>
                ))}
              </div>
              {errors.applicableContractTypes && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.applicableContractTypes}
                </p>
              )}
            </div>

            {/* Asset Types */}
            <div>
              <label className="form-label">Tipos de activo (opcional)</label>
              <p className="text-xs text-dark-400 mb-2">
                Si no seleccionas ninguno, la cláusula se aplicará a todos los
                activos
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {COMMON_ASSET_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(formData.applicableAssetTypes || []).includes(
                        type.value,
                      )}
                      onChange={() => toggleAssetType(type.value)}
                      className="rounded border-dark-600 bg-dark-800 text-primary-600"
                    />
                    <span className="text-sm text-dark-300">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-200 mb-4">Opciones</h3>

          <div className="space-y-3">
            {/* Is Default */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => handleChange("isDefault", e.target.checked)}
                className="mt-0.5 rounded border-dark-600 bg-dark-800 text-primary-600"
              />
              <div>
                <div className="text-sm text-dark-300 font-medium">
                  Incluir por defecto
                </div>
                <p className="text-xs text-dark-400">
                  Esta cláusula se incluirá automáticamente en nuevos contratos
                </p>
              </div>
            </label>

            {/* Is Active */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
                className="mt-0.5 rounded border-dark-600 bg-dark-800 text-primary-600"
              />
              <div>
                <div className="text-sm text-dark-300 font-medium">Activa</div>
                <p className="text-xs text-dark-400">
                  Solo las cláusulas activas están disponibles para usar
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/rental/clause-templates")}
            className="btn-ghost"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="btn-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            {createMutation.isPending || updateMutation.isPending
              ? "Guardando..."
              : isEdit
                ? "Guardar Cambios"
                : "Crear Cláusula"}
          </button>
        </div>
      </form>
    </Layout>
  );
}
