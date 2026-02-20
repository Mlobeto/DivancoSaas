/**
 * TEMPLATE WIZARD STEPS
 * Componentes mejorados de pasos del wizard
 * - Categoría con iconos grandes
 * - Drag & Drop para archivos
 * - Adaptativo según categoría
 */

import { useState, useCallback } from "react";
import {
  FileText,
  Upload,
  X,
  Check,
  AlertTriangle,
  Truck,
  User,
  Shield,
  Trash2,
  FileIcon,
} from "lucide-react";
import type { CreateTemplateInput } from "@/modules/inventory/services/asset-template.service";
import {
  AssetCategory,
  AssetCategoryLabels,
} from "@/modules/inventory/services/asset-template.service";

// ============================================
// STEP 1: CATEGORY SELECTION
// ============================================

const CATEGORY_GROUPS = {
  equipos: {
    label: "Equipos",
    categories: [
      {
        value: AssetCategory.MACHINERY,
        icon: "🏗️",
        desc: "Maquinaria pesada (retroexcavadoras, excavadoras, etc.)",
      },
      {
        value: AssetCategory.IMPLEMENT,
        icon: "🔧",
        desc: "Implementos y andamios certificados",
      },
      {
        value: AssetCategory.VEHICLE,
        icon: "🚚",
        desc: "Vehículos de carga y transporte",
      },
      {
        value: AssetCategory.TOOL,
        icon: "🔨",
        desc: "Herramientas eléctricas y manuales",
      },
    ],
  },
  insumos: {
    label: "Insumos",
    categories: [
      {
        value: AssetCategory.SUPPLY_FUEL,
        icon: "⛽",
        desc: "Combustibles (diesel, gasolina, gas)",
      },
      {
        value: AssetCategory.SUPPLY_OIL,
        icon: "🛢️",
        desc: "Aceites y lubricantes (motor, hidráulico, etc.)",
      },
      {
        value: AssetCategory.SUPPLY_PAINT,
        icon: "🎨",
        desc: "Pinturas, solventes y adhesivos",
      },
      {
        value: AssetCategory.SUPPLY_SPARE_PART,
        icon: "⚙️",
        desc: "Repuestos y partes de equipos",
      },
      {
        value: AssetCategory.SUPPLY_CONSUMABLE,
        icon: "📦",
        desc: "Consumibles generales (guantes, trapos, etc.)",
      },
      {
        value: AssetCategory.SUPPLY_SAFETY,
        icon: "🦺",
        desc: "Equipos de seguridad (cascos, arneses, etc.)",
      },
    ],
  },
};

export function CategorySelectionStep({
  formData,
  setFormData,
}: {
  formData: CreateTemplateInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateTemplateInput>>;
}) {
  return (
    <div className="card space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          ¿Qué tipo de producto vas a crear?
        </h2>
        <p className="text-dark-400">
          Selecciona la categoría que mejor describa el producto
        </p>
      </div>

      {Object.entries(CATEGORY_GROUPS).map(([groupKey, group]) => (
        <div key={groupKey}>
          <h3 className="text-lg font-medium text-white mb-4 border-b border-dark-700 pb-2">
            {group.label}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, category: cat.value })
                }
                className={`p-6 rounded-lg border-2 transition text-left hover:scale-105 ${
                  formData.category === cat.value
                    ? "border-primary-500 bg-primary-900/20"
                    : "border-dark-700 hover:border-dark-600"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{cat.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-lg mb-1">
                      {AssetCategoryLabels[cat.value]}
                    </div>
                    <div className="text-sm text-dark-400">{cat.desc}</div>
                  </div>
                  {formData.category === cat.value && (
                    <Check className="w-6 h-6 text-primary-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// STEP 2: BASIC INFO
// ============================================

export function BasicInfoStep({
  formData,
  setFormData,
}: {
  formData: CreateTemplateInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateTemplateInput>>;
}) {
  const isSupply = formData.category.startsWith("SUPPLY_");

  return (
    <div className="card space-y-6">
      <h2 className="text-xl font-semibold text-white border-b border-dark-700 pb-3 flex items-center gap-2">
        <FileText className="w-5 h-5" /> Información Básica
      </h2>

      <div>
        <label className="label">Nombre del Producto *</label>
        <input
          type="text"
          className="input"
          placeholder="Ej: Retroexcavadora CAT 416F"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="label">Descripción</label>
        <textarea
          className="input"
          rows={3}
          placeholder="Descripción breve del producto..."
          value={formData.description || ""}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      {/* Presentation for supplies */}
      {isSupply && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Unidad de Medida</label>
            <input
              type="text"
              className="input"
              placeholder="litro, galón, kg"
              value={formData.presentation?.unit || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  presentation: {
                    ...formData.presentation,
                    unit: e.target.value,
                  },
                })
              }
            />
          </div>
          <div>
            <label className="label">Tamaño de Contenedor</label>
            <input
              type="number"
              className="input"
              placeholder="20"
              value={formData.presentation?.containerSize || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  presentation: {
                    ...formData.presentation,
                    containerSize: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div>
            <label className="label">Tipo de Contenedor</label>
            <input
              type="text"
              className="input"
              placeholder="Caneca, Tambor"
              value={formData.presentation?.containerType || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  presentation: {
                    ...formData.presentation,
                    containerType: e.target.value,
                  },
                })
              }
            />
          </div>
        </div>
      )}

      {/* Safety info for supplies */}
      {isSupply && (
        <div className="bg-dark-800 p-4 rounded-lg space-y-3">
          <h3 className="font-medium text-white">Control de Insumos</h3>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="hasExpiryDate"
              checked={formData.hasExpiryDate}
              onChange={(e) =>
                setFormData({ ...formData, hasExpiryDate: e.target.checked })
              }
            />
            <label htmlFor="hasExpiryDate" className="text-sm cursor-pointer">
              Tiene fecha de vencimiento
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="requiresLotTracking"
              checked={formData.requiresLotTracking}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requiresLotTracking: e.target.checked,
                })
              }
            />
            <label
              htmlFor="requiresLotTracking"
              className="text-sm cursor-pointer"
            >
              Requiere control de lotes
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isDangerous"
              checked={formData.isDangerous}
              onChange={(e) =>
                setFormData({ ...formData, isDangerous: e.target.checked })
              }
            />
            <label htmlFor="isDangerous" className="text-sm cursor-pointer">
              Producto peligroso
            </label>
          </div>

          {formData.isDangerous && (
            <div>
              <label className="label">Clasificación de Peligrosidad</label>
              <select
                className="input"
                value={formData.hazardClass || ""}
                onChange={(e) =>
                  setFormData({ ...formData, hazardClass: e.target.value })
                }
              >
                <option value="">Seleccionar...</option>
                <option value="FLAMMABLE">Inflamable</option>
                <option value="CORROSIVE">Corrosivo</option>
                <option value="TOXIC">Tóxico</option>
                <option value="EXPLOSIVE">Explosivo</option>
                <option value="OXIDIZING">Oxidante</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Maintenance flags for equipment */}
      {!isSupply && (
        <div className="space-y-3">
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
            <label
              htmlFor="requiresMaintenance"
              className="text-sm cursor-pointer"
            >
              Requiere mantenimiento preventivo
            </label>
          </div>

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
              Requiere documentación (SOAT, Seguro, Certificaciones)
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// STEP 3: TECHNICAL SPECS
// ============================================

export function TechnicalSpecsStep({
  formData,
  setFormData,
}: {
  formData: CreateTemplateInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateTemplateInput>>;
}) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const specs = formData.technicalSpecs || {};

  const addSpec = () => {
    if (newKey && newValue) {
      setFormData({
        ...formData,
        technicalSpecs: {
          ...specs,
          [newKey]: newValue,
        },
      });
      setNewKey("");
      setNewValue("");
    }
  };

  const removeSpec = (key: string) => {
    const newSpecs = { ...specs };
    delete newSpecs[key];
    setFormData({ ...formData, technicalSpecs: newSpecs });
  };

  return (
    <div className="card space-y-6">
      <h2 className="text-xl font-semibold text-white border-b border-dark-700 pb-3">
        Especificaciones Técnicas
      </h2>

      <p className="text-dark-400 text-sm">
        Agrega las características técnicas del producto (potencia, capacidad,
        dimensiones, etc.)
      </p>

      {/* Existing specs */}
      {Object.keys(specs).length > 0 && (
        <div className="space-y-2">
          {Object.entries(specs).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-3 bg-dark-800 p-3 rounded-lg"
            >
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="text-sm font-medium text-dark-400">{key}</div>
                <div className="text-sm text-white">{value as string}</div>
              </div>
              <button
                onClick={() => removeSpec(key)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new spec */}
      <div className="flex gap-3">
        <input
          type="text"
          className="input flex-1"
          placeholder="Nombre (ej: Potencia)"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
        />
        <input
          type="text"
          className="input flex-1"
          placeholder="Valor (ej: 75 HP)"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
        />
        <button onClick={addSpec} className="btn-primary">
          Agregar
        </button>
      </div>
    </div>
  );
}

// ============================================
// STEP 4: BUSINESS RULES
// ============================================

export function BusinessRulesStep({
  formData,
  setFormData,
}: {
  formData: CreateTemplateInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateTemplateInput>>;
}) {
  const rules = formData.businessRules || {};

  const updateRule = (key: keyof typeof rules, value: boolean) => {
    setFormData({
      ...formData,
      businessRules: {
        ...rules,
        [key]: value,
      },
    });
  };

  return (
    <div className="card space-y-6">
      <h2 className="text-xl font-semibold text-white border-b border-dark-700 pb-3">
        Reglas de Negocio
      </h2>

      <p className="text-dark-400 text-sm">
        Define qué servicios o condiciones son necesarios cuando se cotiza este
        producto
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-primary-400" />
            <div>
              <div className="font-medium text-white">Requiere Transporte</div>
              <div className="text-sm text-dark-400">
                Se debe incluir costo de transporte en la cotización
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            className="toggle"
            checked={rules.requiresTransport || false}
            onChange={(e) => updateRule("requiresTransport", e.target.checked)}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-primary-400" />
            <div>
              <div className="font-medium text-white">Requiere Operario</div>
              <div className="text-sm text-dark-400">
                Se debe asignar operario calificado
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            className="toggle"
            checked={rules.requiresOperator || false}
            onChange={(e) => updateRule("requiresOperator", e.target.checked)}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary-400" />
            <div>
              <div className="font-medium text-white">Requiere Seguro</div>
              <div className="text-sm text-dark-400">
                Se debe incluir póliza de seguro en el contrato
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            className="toggle"
            checked={rules.requiresInsurance || false}
            onChange={(e) => updateRule("requiresInsurance", e.target.checked)}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// STEP 5: ATTACHMENTS (Drag & Drop)
// ============================================

export function AttachmentsStep({
  formData,
  
}: {
  formData: CreateTemplateInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateTemplateInput>>;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    console.log("Files dropped:", files);
    // TODO: Upload to Azure Blob Storage
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log("Files selected:", files);
    // TODO: Upload to Azure Blob Storage
  };

  const attachments = formData.attachments || {};

  return (
    <div className="card space-y-6">
      <h2 className="text-xl font-semibold text-white border-b border-dark-700 pb-3">
        Archivos y Documentación
      </h2>

      <p className="text-dark-400 text-sm">
        Sube manuales, imágenes, certificaciones o fichas de seguridad
      </p>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition ${
          isDragging
            ? "border-primary-500 bg-primary-900/20"
            : "border-dark-700 hover:border-dark-600"
        }`}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-dark-400" />
        <div className="text-white font-medium mb-2">
          Arrastra archivos aquí o haz clic para seleccionar
        </div>
        <div className="text-sm text-dark-400 mb-4">
          PDFs, imágenes, documentos (máx 10MB por archivo)
        </div>
        <input
          type="file"
          multiple
          className="hidden"
          id="file-upload"
          onChange={handleFileSelect}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        />
        <label
          htmlFor="file-upload"
          className="btn-primary cursor-pointer inline-block"
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Seleccionar Archivos
        </label>
      </div>

      {/* Uploaded Files List */}
      {attachments.manuals && attachments.manuals.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white mb-2">Manuales</h3>
          <div className="space-y-2">
            {attachments.manuals.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 bg-dark-800 p-3 rounded-lg"
              >
                <FileIcon className="w-5 h-5 text-blue-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">
                    {file.name}
                  </div>
                  <div className="text-xs text-dark-400">{file.type}</div>
                </div>
                <button className="text-red-400 hover:text-red-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {attachments.images && attachments.images.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white mb-2">Imágenes</h3>
          <div className="grid grid-cols-4 gap-3">
            {attachments.images.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img.url}
                  alt={img.description || ""}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 text-sm text-blue-300">
        <AlertTriangle className="w-4 h-4 inline mr-2" />
        Los archivos se subirán a Azure Blob Storage cuando guardes la plantilla
      </div>
    </div>
  );
}

// ============================================
// STEP 6: PREVIEW
// ============================================

export function PreviewStep({ formData }: { formData: CreateTemplateInput }) {
  return (
    <div className="card space-y-6">
      <h2 className="text-xl font-semibold text-white border-b border-dark-700 pb-3">
        Vista Previa
      </h2>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-sm text-dark-400 mb-1">Categoría</div>
          <div className="text-white font-medium">
            {AssetCategoryLabels[formData.category]}
          </div>
        </div>

        <div>
          <div className="text-sm text-dark-400 mb-1">Nombre</div>
          <div className="text-white font-medium">{formData.name}</div>
        </div>

        {formData.description && (
          <div className="col-span-2">
            <div className="text-sm text-dark-400 mb-1">Descripción</div>
            <div className="text-white">{formData.description}</div>
          </div>
        )}

        {formData.presentation && (
          <div className="col-span-2">
            <div className="text-sm text-dark-400 mb-1">Presentación</div>
            <div className="text-white">
              {formData.presentation.containerSize} {formData.presentation.unit}{" "}
              por {formData.presentation.containerType}
            </div>
          </div>
        )}

        {formData.technicalSpecs &&
          Object.keys(formData.technicalSpecs).length > 0 && (
            <div className="col-span-2">
              <div className="text-sm text-dark-400 mb-2">
                Especificaciones Técnicas
              </div>
              <div className="bg-dark-800 p-4 rounded-lg space-y-2">
                {Object.entries(formData.technicalSpecs).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-dark-400">{key}:</span>
                    <span className="text-white font-medium">
                      {value as string}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {formData.businessRules && (
          <div className="col-span-2">
            <div className="text-sm text-dark-400 mb-2">Reglas de Negocio</div>
            <div className="flex gap-2 flex-wrap">
              {formData.businessRules.requiresTransport && (
                <span className="badge badge-sm bg-primary-900/30 text-primary-300">
                  Requiere transporte
                </span>
              )}
              {formData.businessRules.requiresOperator && (
                <span className="badge badge-sm bg-primary-900/30 text-primary-300">
                  Requiere operario
                </span>
              )}
              {formData.businessRules.requiresInsurance && (
                <span className="badge badge-sm bg-primary-900/30 text-primary-300">
                  Requiere seguro
                </span>
              )}
            </div>
          </div>
        )}

        {formData.isDangerous && (
          <div className="col-span-2">
            <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <div>
                <div className="font-medium text-orange-300">
                  Producto Peligroso
                </div>
                {formData.hazardClass && (
                  <div className="text-sm text-orange-400">
                    {formData.hazardClass}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
