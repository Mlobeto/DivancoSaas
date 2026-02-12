/**
 * TEMPLATE WIZARD STEPS
 * Componentes de pasos del wizard
 */

import { useState } from "react";
import type {
  CreateTemplateInput,
  CustomField,
} from "@/modules/machinery/services/asset-template.service";
import {
  FieldType,
  FieldTypeLabels,
  AssetCategory,
  AssetCategoryLabels,
} from "@/modules/machinery/services/asset-template.service";

// ============================================
// STEP 1: BASIC INFO
// ============================================

const COMMON_ICONS = [
  "🏗️",
  "🚜",
  "🚛",
  "🏢",
  "⚙️",
  "🔧",
  "📦",
  "🎯",
  "🏭",
  "🛠️",
];

export function BasicInfoStep({
  formData,
  setFormData,
}: {
  formData: CreateTemplateInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateTemplateInput>>;
}) {
  const [customIcon, setCustomIcon] = useState("");

  return (
    <div className="card space-y-6">
      <h2 className="text-xl font-semibold text-white border-b border-dark-700 pb-3">
        📋 Información Básica
      </h2>
     
      <div>
        <label className="label">Nombre de la Plantilla *</label>
        <input
          type="text"
          className="input"
          placeholder="Ej: Retroexcavadora"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      {/* Category */}
      <div>
        <label className="label">Categoría *</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.values(AssetCategory).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`p-4 rounded-lg border-2 transition ${
                formData.category === cat
                  ? "border-primary-500 bg-primary-900/20"
                  : "border-dark-700 hover:border-dark-600"
              }`}
              onClick={() => setFormData({ ...formData, category: cat })}
            >
              <div className="text-center">
                <div className="font-semibold">{AssetCategoryLabels[cat]}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Icon */}
      <div>
        <label className="label">Icono</label>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-3">
          {COMMON_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              className={`p-3 text-2xl rounded border-2 transition ${
                formData.icon === icon
                  ? "border-primary-500 bg-primary-900/20"
                  : "border-dark-700 hover:border-dark-600"
              }`}
              onClick={() => setFormData({ ...formData, icon })}
            >
              {icon}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="O escribe tu propio emoji..."
            value={customIcon}
            onChange={(e) => setCustomIcon(e.target.value)}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (customIcon.trim()) {
                setFormData({ ...formData, icon: customIcon.trim() });
                setCustomIcon("");
              }
            }}
          >
            Usar
          </button>
        </div>
      </div>

      {/* Requires Preventive Maintenance */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="requiresMaintenance"
          checked={formData.requiresPreventiveMaintenance}
          onChange={(e) =>
            setFormData({
              ...formData,
              requiresPreventiveMaintenance: e.target.checked,
            })
          }
        />
        <label htmlFor="requiresMaintenance" className="text-sm cursor-pointer">
          Requiere mantenimiento preventivo
        </label>
      </div>

      {/* Requires Documentation */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="requiresDocumentation"
          checked={formData.requiresDocumentation}
          onChange={(e) =>
            setFormData({
              ...formData,
              requiresDocumentation: e.target.checked,
            })
          }
        />
        <label
          htmlFor="requiresDocumentation"
          className="text-sm cursor-pointer"
        >
          Requiere documentación (SOAT, Seguro, Certificaciones, etc.)
        </label>
      </div>
    </div>
  );
}

// ============================================
// STEP 2: CUSTOM FIELDS
// ============================================

export function CustomFieldsStep({
  formData,
  setFormData,
}: {
  formData: CreateTemplateInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateTemplateInput>>;
}) {
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [showFieldModal, setShowFieldModal] = useState(false);

  if (!formData.name) {
    return (
      <div className="card">
        <div className="text-center py-12 text-dark-400">
          <p>Primero completa el nombre de la plantilla arriba ↑</p>
        </div>
      </div>
    );
  }

  // Agrupar campos por sección
  const sections = formData.customFields.reduce(
    (acc, field) => {
      if (!acc[field.section]) {
        acc[field.section] = [];
      }
      acc[field.section].push(field);
      return acc;
    },
    {} as Record<string, CustomField[]>,
  );

  // Ordenar campos por order
  Object.keys(sections).forEach((section) => {
    sections[section].sort((a, b) => a.order - b.order);
  });

  const handleAddField = () => {
    setEditingField(null);
    setShowFieldModal(true);
  };

  const handleEditField = (field: CustomField) => {
    setEditingField(field);
    setShowFieldModal(true);
  };

  const handleDeleteField = (key: string) => {
    if (confirm("¿Eliminar este campo?")) {
      setFormData({
        ...formData,
        customFields: formData.customFields.filter((f) => f.key !== key),
      });
    }
  };

  const handleSaveField = (field: CustomField) => {
    if (editingField) {
      // Actualizar campo existente
      setFormData({
        ...formData,
        customFields: formData.customFields.map((f) =>
          f.key === editingField.key ? field : f,
        ),
      });
    } else {
      // Agregar nuevo campo
      setFormData({
        ...formData,
        customFields: [...formData.customFields, field],
      });
    }
    setShowFieldModal(false);
  };

  const moveField = (key: string, direction: "up" | "down") => {
    const fields = [...formData.customFields];
    const index = fields.findIndex((f) => f.key === key);
    if (index === -1) return;

    const field = fields[index];
    const sectionFields = fields.filter((f) => f.section === field.section);
    const sectionIndex = sectionFields.indexOf(field);

    if (direction === "up" && sectionIndex > 0) {
      const prevField = sectionFields[sectionIndex - 1];
      const temp = field.order;
      field.order = prevField.order;
      prevField.order = temp;
    } else if (
      direction === "down" &&
      sectionIndex < sectionFields.length - 1
    ) {
      const nextField = sectionFields[sectionIndex + 1];
      const temp = field.order;
      field.order = nextField.order;
      nextField.order = temp;
    }

    setFormData({ ...formData, customFields: fields });
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold text-white border-b border-dark-700 pb-3 mb-6">
          ⚙️ Campos Personalizados
        </h2>
        <div className="flex items-center justify-between mb-6">
          <p className="text-dark-400 text-sm">
            Define los campos que se solicitarán al crear este tipo de activo
          </p>
          <button onClick={handleAddField} className="btn-primary">
            + Agregar Campo
          </button>
        </div>

        {formData.customFields.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-dark-400 mb-4">
              No hay campos configurados todavía
            </p>
            <button onClick={handleAddField} className="btn-secondary">
              Agregar primer campo
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(sections).map(([sectionName, fields]) => (
              <div
                key={sectionName}
                className="border border-dark-700 rounded-lg p-4"
              >
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="text-primary-400">📋</span>
                  {sectionName}
                </h3>

                <div className="space-y-2">
                  {fields.map((field) => (
                    <div
                      key={field.key}
                      className="flex items-center gap-3 p-3 rounded bg-dark-800 hover:bg-dark-750 transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveField(field.key, "up")}
                          className="text-dark-500 hover:text-dark-300 text-xs"
                          disabled={field.order === 0}
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveField(field.key, "down")}
                          className="text-dark-500 hover:text-dark-300 text-xs"
                        >
                          ▼
                        </button>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{field.label}</span>
                          {field.required && (
                            <span className="text-red-400 text-xs">*</span>
                          )}
                          <span className="text-xs px-2 py-0.5 rounded bg-primary-900/30 text-primary-400 border border-primary-800">
                            {FieldTypeLabels[field.type]}
                          </span>
                        </div>
                        <div className="text-sm text-dark-400 mt-1">
                          key: {field.key}
                          {field.placeholder && ` • ${field.placeholder}`}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditField(field)}
                          className="btn-ghost text-sm px-3"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteField(field.key)}
                          className="btn-ghost text-red-400 hover:bg-red-900/20 text-sm px-3"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Field Modal */}
      {showFieldModal && (
        <FieldEditorModal
          field={editingField}
          existingKeys={formData.customFields
            .filter((f) => f.key !== editingField?.key)
            .map((f) => f.key)}
          onSave={handleSaveField}
          onClose={() => setShowFieldModal(false)}
        />
      )}
    </div>
  );
}

// ============================================
// FIELD EDITOR MODAL
// ============================================

function FieldEditorModal({
  field,
  existingKeys,
  onSave,
  onClose,
}: {
  field: CustomField | null;
  existingKeys: string[];
  onSave: (field: CustomField) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<CustomField>(
    field || {
      key: "",
      label: "",
      type: FieldType.TEXT,
      section: "Información General",
      order: 0,
      required: false,
    },
  );

  const [showValidations, setShowValidations] = useState(
    !!field?.validations && Object.keys(field.validations).length > 0,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar key único
    if (!field && existingKeys.includes(formData.key)) {
      alert("Ya existe un campo con ese key");
      return;
    }

    // Validar que SELECT tenga opciones
    if (
      (formData.type === FieldType.SELECT ||
        formData.type === FieldType.MULTISELECT) &&
      (!formData.validations?.options ||
        formData.validations.options.length === 0)
    ) {
      alert("Los campos de selección deben tener al menos una opción");
      return;
    }

    onSave(formData);
  };

  const generateKey = (label: string) => {
    return label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 border border-dark-700 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-dark-700 flex items-center justify-between sticky top-0 bg-dark-800">
          <h2 className="text-xl font-bold">
            {field ? "Editar Campo" : "Nuevo Campo"}
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium mb-2">Etiqueta *</label>
            <input
              type="text"
              className="input"
              placeholder="Ej: Marca, Año de fabricación..."
              value={formData.label}
              onChange={(e) => {
                const label = e.target.value;
                setFormData({
                  ...formData,
                  label,
                  key: !field ? generateKey(label) : formData.key,
                });
              }}
              required
            />
          </div>

          {/* Key - Hidden from UI but auto-generated from label */}
          <input type="hidden" value={formData.key} name="key" />

          {/* Type & Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tipo de campo *
                <span className="text-xs text-dark-400 ml-2 font-normal">
                  (tipo de dato a capturar)
                </span>
              </label>
              <select
                className="input"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as FieldType,
                  })
                }
              >
                <option value={FieldType.TEXT}>📝 Texto corto</option>
                <option value={FieldType.TEXTAREA}>
                  📄 Texto largo (párrafo)
                </option>
                <option value={FieldType.NUMBER}>🔢 Número</option>
                <option value={FieldType.DATE}>📅 Fecha</option>
                <option value={FieldType.SELECT}>
                  ✅ Selección (una opción)
                </option>
                <option value={FieldType.MULTISELECT}>
                  ☑️ Selección múltiple
                </option>
                <option value={FieldType.BOOLEAN}>🔘 Sí/No (checkbox)</option>
              </select>
              <p className="text-xs text-dark-500 mt-1">
                {formData.type === FieldType.TEXT && "Ej: Marca, Modelo, Serie"}
                {formData.type === FieldType.TEXTAREA &&
                  "Ej: Observaciones, Descripción"}
                {formData.type === FieldType.NUMBER &&
                  "Ej: Potencia, Peso, Capacidad"}
                {formData.type === FieldType.DATE &&
                  "Ej: Fecha de compra, Último mantenimiento"}
                {formData.type === FieldType.SELECT &&
                  "Ej: Estado (Nuevo/Usado), Color"}
                {formData.type === FieldType.MULTISELECT &&
                  "Ej: Accesorios incluidos"}
                {formData.type === FieldType.BOOLEAN &&
                  "Ej: Tiene garantía, Requiere calibración"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Sección *
                <span className="text-xs text-dark-400 ml-2 font-normal">
                  (agrupa campos visualmente)
                </span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="Ej: Información Técnica"
                value={formData.section}
                onChange={(e) =>
                  setFormData({ ...formData, section: e.target.value })
                }
                list="section-suggestions"
                required
              />
              <datalist id="section-suggestions">
                <option value="Información General" />
                <option value="Datos Técnicos" />
                <option value="Características" />
                <option value="Documentación" />
                <option value="Mantenimiento" />
              </datalist>
              <p className="text-xs text-dark-500 mt-1">
                Los campos de la misma sección se mostrarán juntos
              </p>
            </div>
          </div>

          {/* Preview Box */}
          {formData.label && (
            <div className="bg-primary-900/10 border border-primary-800 rounded-lg p-4">
              <p className="text-xs text-primary-400 font-semibold mb-2">
                👁️ VISTA PREVIA - Así se verá en el formulario:
              </p>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {formData.label}
                  {formData.required && (
                    <span className="text-red-400"> *</span>
                  )}
                </label>
                {formData.type === FieldType.TEXT && (
                  <input
                    type="text"
                    className="input"
                    placeholder="Escribe aquí..."
                    disabled
                  />
                )}
                {formData.type === FieldType.TEXTAREA && (
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Escribe aquí..."
                    disabled
                  />
                )}
                {formData.type === FieldType.NUMBER && (
                  <input
                    type="number"
                    className="input"
                    placeholder="0"
                    disabled
                  />
                )}
                {formData.type === FieldType.DATE && (
                  <input type="date" className="input" disabled />
                )}
                {formData.type === FieldType.SELECT && (
                  <select className="input" disabled>
                    <option>Seleccionar...</option>
                    {formData.validations?.options?.slice(0, 3).map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                {formData.type === FieldType.MULTISELECT && (
                  <div className="space-y-2">
                    {(
                      formData.validations?.options?.slice(0, 3) || [
                        "Opción 1",
                        "Opción 2",
                      ]
                    ).map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <input type="checkbox" disabled />
                        <span className="text-sm">{opt}</span>
                      </div>
                    ))}
                  </div>
                )}
                {formData.type === FieldType.BOOLEAN && (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" disabled />
                    <span className="text-sm">Sí/No</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Required */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="field-required"
              checked={formData.required}
              onChange={(e) =>
                setFormData({ ...formData, required: e.target.checked })
              }
            />
            <label htmlFor="field-required">Campo obligatorio</label>
          </div>

          {/* Validations */}
          <div>
            <button
              type="button"
              onClick={() => setShowValidations(!showValidations)}
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              {showValidations ? "▼" : "▶"} Validaciones avanzadas
            </button>
          </div>

          {showValidations && (
            <div className="space-y-4 p-4 bg-dark-700/50 rounded-lg border border-dark-600">
              {/* Options for SELECT */}
              {(formData.type === FieldType.SELECT ||
                formData.type === FieldType.MULTISELECT) && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Opciones disponibles (una por línea) *
                  </label>
                  <textarea
                    className="input font-mono"
                    rows={5}
                    placeholder="Aluminio&#10;Acero inoxidable&#10;Fibra de vidrio&#10;Madera tratada"
                    value={formData.validations?.options?.join("\n") || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        validations: {
                          ...formData.validations,
                          options: e.target.value
                            .split("\n")
                            .filter((o) => o.trim() !== ""),
                        },
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                      }
                    }}
                  />
                  <p className="text-xs text-dark-400 mt-1">
                    💡 Presiona Enter para agregar una nueva opción
                  </p>
                </div>
              )}

              {/* Min/Max for NUMBER */}
              {formData.type === FieldType.NUMBER && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Valor mínimo
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={formData.validations?.min || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          validations: {
                            ...formData.validations,
                            min: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Valor máximo
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={formData.validations?.max || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          validations: {
                            ...formData.validations,
                            max: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Pattern for TEXT */}
              {formData.type === FieldType.TEXT && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Patrón (regex)
                  </label>
                  <input
                    type="text"
                    className="input font-mono"
                    placeholder="^[A-Z0-9-]+$"
                    value={formData.validations?.pattern || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        validations: {
                          ...formData.validations,
                          pattern: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1">
              {field ? "Actualizar" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// STEP 3: PREVIEW
// ============================================

export function PreviewStep({ formData }: { formData: CreateTemplateInput }) {
  const sections = formData.customFields.reduce(
    (acc, field) => {
      if (!acc[field.section]) {
        acc[field.section] = [];
      }
      acc[field.section].push(field);
      return acc;
    },
    {} as Record<string, CustomField[]>,
  );

  Object.keys(sections).forEach((section) => {
    sections[section].sort((a, b) => a.order - b.order);
  });

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-white border-b border-dark-700 pb-3 mb-6">
        👁️ Vista Previa
      </h2>
      <div className="space-y-6">
        <div className="bg-primary-900/10 border border-primary-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">{formData.icon || "📋"}</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">
                {formData.name || "Sin nombre"}
              </h3>
              <div className="flex gap-4 mt-4 text-sm">
                <div>
                  <span className="text-dark-400">Categoría: </span>
                  <span className="font-semibold">
                    {AssetCategoryLabels[formData.category] ||
                      formData.category}
                  </span>
                </div>
                {formData.requiresPreventiveMaintenance && (
                  <div className="text-green-400">
                    ✓ Requiere mantenimiento preventivo
                  </div>
                )}
                {formData.requiresDocumentation && (
                  <div className="text-blue-400">📄 Requiere documentación</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg p-6">
          <h4 className="text-md font-semibold mb-4 text-dark-300">
            Así se verá el formulario al crear un activo:
          </h4>

          <div className="space-y-6">
            {/* Código (siempre presente) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Código interno *
              </label>
              <input
                type="text"
                className="input"
                placeholder="Ej: RET-001, AND-045..."
                disabled
              />
            </div>

            {/* Custom Fields por sección */}
            {Object.entries(sections).map(([sectionName, fields]) => (
              <div key={sectionName}>
                <h4 className="font-semibold text-md mb-3 text-primary-400">
                  {sectionName}
                </h4>
                <div className="space-y-4">
                  {fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium mb-2">
                        {field.label}{" "}
                        {field.required && (
                          <span className="text-red-400">*</span>
                        )}
                      </label>
                      {renderFieldPreview(field)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderFieldPreview(field: CustomField) {
  switch (field.type) {
    case FieldType.TEXT:
      return (
        <input
          type="text"
          className="input"
          placeholder={field.placeholder}
          disabled
        />
      );
    case FieldType.NUMBER:
      return (
        <input
          type="number"
          className="input"
          placeholder={field.placeholder}
          disabled
        />
      );
    case FieldType.DATE:
      return <input type="date" className="input" disabled />;
    case FieldType.TEXTAREA:
      return (
        <textarea
          className="input"
          rows={3}
          placeholder={field.placeholder}
          disabled
        />
      );
    case FieldType.BOOLEAN:
      return (
        <div className="flex items-center gap-2">
          <input type="checkbox" disabled />
          <span className="text-sm text-dark-400">Sí</span>
        </div>
      );
    case FieldType.SELECT:
      return (
        <select className="input" disabled>
          <option>Seleccionar...</option>
          {field.validations?.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case FieldType.MULTISELECT:
      return (
        <div className="space-y-2">
          {field.validations?.options?.slice(0, 3).map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <input type="checkbox" disabled />
              <span className="text-sm">{opt}</span>
            </div>
          ))}
        </div>
      );
    default:
      return <input type="text" className="input" disabled />;
  }
}
