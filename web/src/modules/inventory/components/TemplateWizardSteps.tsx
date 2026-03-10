/**
 * TEMPLATE WIZARD STEPS
 * Componentes mejorados de pasos del wizard
 * - Categoría con iconos grandes
 * - Drag & Drop para archivos
 * - Adaptativo según categoría
 */

import { useState } from "react";
import {
  FileText,
  Check,
  AlertTriangle,
  Truck,
  User,
  Shield,
  Trash2,
} from "lucide-react";
import type {
  CreateTemplateInput,
  MaintenanceScheduleItem,
} from "@/modules/inventory/services/asset-template.service";
import {
  AssetCategory,
  AssetCategoryLabels,
  isSupplyCategory,
} from "@/modules/inventory/services/asset-template.service";

// ============================================
// STEP 1: CATEGORY SELECTION (2-level)
// ============================================

type AssetGroup = "equipment" | "vehicle" | "supply" | null;

const GROUP_DEFS: {
  key: AssetGroup;
  icon: string;
  label: string;
  desc: string;
}[] = [
  {
    key: "equipment",
    icon: "🏗️",
    label: "Equipo o Herramienta",
    desc: "Maquinaria pesada, implementos o herramientas que se alquilan",
  },
  {
    key: "vehicle",
    icon: "🚛",
    label: "Vehículo",
    desc: "Camiones, camionetas, montacargas y motos para transporte o alquiler",
  },
  {
    key: "supply",
    icon: "📦",
    label: "Insumo",
    desc: "Combustible, aceites, repuestos y consumibles para mantenimiento",
  },
];

const EQUIPMENT_SUB: { value: AssetCategory; icon: string; desc: string }[] = [
  {
    value: AssetCategory.MACHINERY,
    icon: "🏗️",
    desc: "Retroexcavadoras, miniexcavadoras, vibradores, mezcladoras…",
  },
  {
    value: AssetCategory.IMPLEMENT,
    icon: "🔧",
    desc: "Andamios, hidrolavadoras, compresores, plantas eléctricas…",
  },
  {
    value: AssetCategory.TOOL,
    icon: "🔨",
    desc: "Taladros, pulidoras, tronzadoras, demoledores, pistolas de calor…",
  },
];

const SUPPLY_SUB: { value: AssetCategory; icon: string; desc: string }[] = [
  {
    value: AssetCategory.SUPPLY_FUEL,
    icon: "⛽",
    desc: "Diesel, gasolina, gas",
  },
  {
    value: AssetCategory.SUPPLY_OIL,
    icon: "🛢️",
    desc: "Aceites de motor, hidráulico, transmisión",
  },
  {
    value: AssetCategory.SUPPLY_SPARE_PART,
    icon: "⚙️",
    desc: "Filtros, mangueras, sellos, partes",
  },
  {
    value: AssetCategory.SUPPLY_CONSUMABLE,
    icon: "🧤",
    desc: "Guantes, trapos, EPP desechable",
  },
  {
    value: AssetCategory.SUPPLY_SAFETY,
    icon: "🦺",
    desc: "Cascos, arneses, gafas reutilizables",
  },
  {
    value: AssetCategory.SUPPLY_PAINT,
    icon: "🎨",
    desc: "Pinturas, solventes, adhesivos",
  },
];

function groupForCategory(cat: AssetCategory): AssetGroup {
  if (cat === AssetCategory.VEHICLE) return "vehicle";
  if (cat.startsWith("SUPPLY_")) return "supply";
  return "equipment";
}

export function CategorySelectionStep({
  formData,
  setFormData,
}: {
  formData: CreateTemplateInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateTemplateInput>>;
}) {
  // Detect initial group from already-selected category (editing mode)
  const [selectedGroup, setSelectedGroup] = useState<AssetGroup>(
    groupForCategory(formData.category),
  );

  const handleGroupSelect = (group: AssetGroup) => {
    setSelectedGroup(group);
    // VEHICLE has no sub-type — set immediately
    if (group === "vehicle") {
      setFormData({
        ...formData,
        category: AssetCategory.VEHICLE,
        managementType: "UNIT",
        // Vehículos siempre requieren operario
        rentalRules: {
          ...(formData.rentalRules || {}),
          requiresOperator: true,
        },
      });
    }
  };

  const subCategories =
    selectedGroup === "equipment"
      ? EQUIPMENT_SUB
      : selectedGroup === "supply"
        ? SUPPLY_SUB
        : [];

  return (
    <div className="card space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">
          ¿Qué tipo de activo vas a crear?
        </h2>
        <p className="text-dark-400">
          Primero elegí el grupo, luego el subtipo exacto
        </p>
      </div>

      {/* LEVEL 1: 3 groups */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {GROUP_DEFS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => handleGroupSelect(g.key)}
            className={`p-6 rounded-lg border-2 transition text-left hover:scale-105 ${
              selectedGroup === g.key
                ? "border-primary-500 bg-primary-900/20"
                : "border-dark-700 hover:border-dark-600"
            }`}
          >
            <div className="text-4xl mb-3">{g.icon}</div>
            <div className="font-semibold text-white text-lg mb-1">
              {g.label}
            </div>
            <div className="text-sm text-dark-400">{g.desc}</div>
            {selectedGroup === g.key && (
              <div className="mt-3 flex items-center gap-1 text-primary-400 text-sm font-medium">
                <Check className="w-4 h-4" /> Seleccionado
              </div>
            )}
          </button>
        ))}
      </div>

      {/* LEVEL 2: sub-categories (equipment & supply) */}
      {selectedGroup && selectedGroup !== "vehicle" && (
        <div>
          <h3 className="text-base font-medium text-white mb-3 border-b border-dark-700 pb-2">
            {selectedGroup === "equipment"
              ? "¿Qué tipo de equipo?"
              : "¿Qué tipo de insumo?"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {subCategories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  const isSupply = cat.value.startsWith("SUPPLY_");
                  const mgmt = isSupply
                    ? "BULK"
                    : cat.value === AssetCategory.IMPLEMENT
                      ? "BULK"
                      : "UNIT";
                  setFormData({
                    ...formData,
                    category: cat.value,
                    managementType: mgmt,
                  });
                }}
                className={`p-4 rounded-lg border-2 transition text-left ${
                  formData.category === cat.value
                    ? "border-primary-500 bg-primary-900/20"
                    : "border-dark-700 hover:border-dark-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-white mb-0.5">
                      {AssetCategoryLabels[cat.value]}
                    </div>
                    <div className="text-xs text-dark-400">{cat.desc}</div>
                  </div>
                  {formData.category === cat.value && (
                    <Check className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation pill */}
      {formData.category && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-green-300">
            Categoría seleccionada:{" "}
            <strong>{AssetCategoryLabels[formData.category]}</strong>
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================
// STEP 2: BASIC INFO
// ============================================

// Categories where managementType is fixed (not selectable by user)
function getFixedManagementType(
  category: AssetCategory,
): "UNIT" | "BULK" | undefined {
  if (category === AssetCategory.MACHINERY) return "UNIT";
  if (category === AssetCategory.VEHICLE) return "UNIT";
  if (isSupplyCategory(category)) return "BULK";
  return undefined; // IMPLEMENT + TOOL are user-selectable
}

// Default managementType for categories that allow choice
function getDefaultManagementType(category: AssetCategory): "UNIT" | "BULK" {
  if (category === AssetCategory.IMPLEMENT) return "BULK";
  return "UNIT"; // TOOL defaults to UNIT
}

// ── Capability tag definitions ───────────────────────────────────────────────
interface CapTag {
  key: string;
  icon: string;
  label: string;
  desc: string;
  /** Apply this tag: sets the given field to `on`, removing sets it to `off` */
  field: keyof CreateTemplateInput;
  on: any;
  off: any;
}

// Tag especial para operario (usa rentalRules.requiresOperator)
const OPERATOR_TAG_KEY = "operator";

const EQUIPMENT_TAGS: CapTag[] = [
  {
    key: "maintenance",
    icon: "🔧",
    label: "Mantenimiento preventivo",
    desc: "Lleva plan de mantenimientos programados",
    field: "requiresPreventiveMaintenance",
    on: true,
    off: false,
  },
  {
    key: "documentation",
    icon: "📋",
    label: "Documentación legal",
    desc: "SOAT, seguro técnico, certificaciones",
    field: "requiresDocumentation",
    on: true,
    off: false,
  },
  {
    key: OPERATOR_TAG_KEY,
    icon: "👷",
    label: "Requiere operario",
    desc: "El equipo se alquila con operador incluido",
    field: "requiresDocumentation", // dummy — se maneja especialmente
    on: true,
    off: false,
  },
];

const SUPPLY_TAGS: CapTag[] = [
  {
    key: "expiry",
    icon: "📅",
    label: "Fecha de vencimiento",
    desc: "El producto tiene fecha de caducidad",
    field: "hasExpiryDate",
    on: true,
    off: false,
  },
  {
    key: "lot",
    icon: "🔢",
    label: "Control de lotes",
    desc: "Requiere seguimiento por lote / batch",
    field: "requiresLotTracking",
    on: true,
    off: false,
  },
  {
    key: "dangerous",
    icon: "⚠️",
    label: "Producto peligroso",
    desc: "Material peligroso — requiere clasificación",
    field: "isDangerous",
    on: true,
    off: false,
  },
];

export function BasicInfoStep({
  formData,
  setFormData,
}: {
  formData: CreateTemplateInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateTemplateInput>>;
}) {
  const isSupply = isSupplyCategory(formData.category);
  const fixedMgmt = getFixedManagementType(formData.category);
  const currentMgmt =
    formData.managementType ??
    fixedMgmt ??
    getDefaultManagementType(formData.category);
  const isBulk = currentMgmt === "BULK";

  // Vehículos siempre tienen operario, no mostrar en tags
  const isVehicle = formData.category === AssetCategory.VEHICLE;

  const ALL_TAGS = isSupply
    ? SUPPLY_TAGS
    : isVehicle
      ? EQUIPMENT_TAGS.filter((t) => t.key !== OPERATOR_TAG_KEY)
      : EQUIPMENT_TAGS;

  // Helper: check if a tag is active
  const isTagActive = (tag: CapTag): boolean => {
    if (tag.key === OPERATOR_TAG_KEY) {
      return formData.rentalRules?.requiresOperator === true;
    }
    return formData[tag.field] === tag.on;
  };

  // Which tags are currently active
  const activeTags = ALL_TAGS.filter((t) => isTagActive(t));
  const availableTags = ALL_TAGS.filter((t) => !isTagActive(t));

  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dropOver, setDropOver] = useState<"active" | "available" | null>(null);

  const activateTag = (tag: CapTag) => {
    if (tag.key === OPERATOR_TAG_KEY) {
      setFormData({
        ...formData,
        rentalRules: {
          ...formData.rentalRules,
          requiresOperator: true,
        },
      });
    } else {
      setFormData({ ...formData, [tag.field]: tag.on });
    }
  };

  const deactivateTag = (tag: CapTag) => {
    if (tag.key === OPERATOR_TAG_KEY) {
      setFormData({
        ...formData,
        rentalRules: {
          ...formData.rentalRules,
          requiresOperator: false,
        },
      });
    } else {
      setFormData({ ...formData, [tag.field]: tag.off });
    }
  };

  // Drag handlers
  const onDragStart = (key: string) => setDraggingKey(key);
  const onDragEnd = () => {
    setDraggingKey(null);
    setDropOver(null);
  };

  const onDropActivate = () => {
    if (!draggingKey) return;
    const tag = ALL_TAGS.find((t) => t.key === draggingKey);
    if (tag) activateTag(tag);
    setDraggingKey(null);
    setDropOver(null);
  };

  const onDropDeactivate = () => {
    if (!draggingKey) return;
    const tag = ALL_TAGS.find((t) => t.key === draggingKey);
    if (tag) deactivateTag(tag);
    setDraggingKey(null);
    setDropOver(null);
  };

  return (
    <div className="card space-y-6">
      <h2 className="text-xl font-semibold text-white border-b border-dark-700 pb-3 flex items-center gap-2">
        <FileText className="w-5 h-5" /> Información Básica
      </h2>

      {/* Info box: stock mínimo */}
      {(formData.category === AssetCategory.IMPLEMENT ||
        formData.category === AssetCategory.VEHICLE) && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm space-y-1">
          {formData.category === AssetCategory.IMPLEMENT && (
            <p className="text-blue-300">
              <span className="font-semibold">📦 Stock mínimo:</span> Los
              implementos deben especificar stock mínimo de alerta.
            </p>
          )}
          {formData.category === AssetCategory.VEHICLE && (
            <p className="text-blue-300">
              <span className="font-semibold">🚗 Vehículos:</span> Requieren
              patente/placa única, kilometraje, SOAT, tecnomecánica.
            </p>
          )}
        </div>
      )}

      {/* Name + Description */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="label">Nombre *</label>
          <input
            type="text"
            className="input"
            placeholder="Ej: Montacarga Hyundai 3.5T"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea
            className="input"
            rows={2}
            placeholder="Descripción de la plantilla..."
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>
      </div>

      {/* Tipo de Gestión */}
      <div className="bg-dark-800 p-4 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Tipo de Gestión</h3>
            <p className="text-xs text-dark-400 mt-0.5">
              {fixedMgmt === "UNIT"
                ? "Seguimiento individual — cada unidad tiene serial y hoja de vida"
                : fixedMgmt === "BULK"
                  ? "Seguimiento por cantidad — stock total con alertas de reposición"
                  : "Elegí cómo se rastrea este producto"}
            </p>
          </div>
          {fixedMgmt ? (
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {fixedMgmt === "UNIT" ? "🔖 Por Unidad" : "📦 Por Cantidad"}
            </span>
          ) : (
            <div className="flex gap-2">
              {(["UNIT", "BULK"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, managementType: m })
                  }
                  className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                    currentMgmt === m
                      ? "bg-primary-600 border-primary-500 text-white"
                      : "bg-dark-700 border-dark-600 text-dark-300 hover:border-dark-500"
                  }`}
                >
                  {m === "UNIT" ? "🔖 Por Unidad" : "📦 Por Cantidad"}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-dark-500 flex items-start gap-1.5">
          <span className="text-yellow-400 mt-0.5">ℹ️</span>
          {isBulk ? (
            <span>
              <strong className="text-dark-300">Por Cantidad:</strong> stock
              total compartido. Sin hoja de vida individual por unidad.
            </span>
          ) : (
            <span>
              <strong className="text-dark-300">Por Unidad:</strong> cada activo
              tiene serial único, hoja de vida y mantenimiento individual.
            </span>
          )}
        </p>
      </div>

      {/* Stock mínimo — BULK e IMPLEMENT */}
      {(isBulk || formData.category === AssetCategory.IMPLEMENT) && (
        <div className="flex items-end gap-3">
          <div>
            <label className="label">
              Stock Mínimo de Alerta
              <span className="ml-1 text-dark-500 font-normal">
                {formData.category === AssetCategory.IMPLEMENT
                  ? "(recomendado)"
                  : "(opcional)"}
              </span>
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                className="input w-32"
                placeholder="50"
                value={formData.minStockLevel ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minStockLevel: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  })
                }
              />
              <span className="text-dark-400 text-sm">uds.</span>
            </div>
          </div>
          <p className="text-xs text-dark-500 pb-0.5">
            Alerta de compra cuando el stock baje de este nivel.
          </p>
        </div>
      )}

      {/* Presentación – solo insumos */}
      {isSupply && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Unidad de medida",
              key: "unit",
              placeholder: "litro, galón, kg",
            },
            {
              label: "Tamaño de contenedor",
              key: "containerSize",
              placeholder: "20",
            },
            {
              label: "Tipo de contenedor",
              key: "containerType",
              placeholder: "Caneca, Tambor",
            },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input
                type={key === "containerSize" ? "number" : "text"}
                className="input"
                placeholder={placeholder}
                value={(formData.presentation as any)?.[key] || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    presentation: {
                      ...formData.presentation,
                      [key]:
                        key === "containerSize"
                          ? Number(e.target.value)
                          : e.target.value,
                    },
                  })
                }
              />
            </div>
          ))}
        </div>
      )}

      {/* Clasificación peligroso — solo si isDangerous activo */}
      {isSupply && formData.isDangerous && (
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

      {/* ── Drag-and-drop capabilities ───────────────────────────────── */}
      <div>
        <p className="text-xs text-dark-400 mb-3">
          <span className="font-semibold text-dark-300">Capacidades</span> —
          arrastrá las etiquetas al panel derecho para activarlas en este tipo
          de activo.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* LEFT: available pool */}
          <div
            className={`min-h-[140px] rounded-xl border-2 border-dashed p-3 space-y-2 transition-colors ${
              dropOver === "available"
                ? "border-dark-500 bg-dark-700/60"
                : "border-dark-700 bg-dark-800/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDropOver("available");
            }}
            onDragLeave={() => setDropOver(null)}
            onDrop={onDropDeactivate}
          >
            <p className="text-xs text-dark-500 font-medium uppercase tracking-wide mb-2">
              Disponibles
            </p>
            {availableTags.length === 0 && (
              <p className="text-xs text-dark-600 italic">
                Todas las capacidades están activas ✓
              </p>
            )}
            {availableTags.map((tag) => (
              <div
                key={tag.key}
                draggable
                onDragStart={() => onDragStart(tag.key)}
                onDragEnd={onDragEnd}
                onClick={() => activateTag(tag)}
                className={`flex items-start gap-2 p-2.5 rounded-lg border border-dark-600 bg-dark-800 cursor-grab active:cursor-grabbing select-none transition-all hover:border-dark-500 hover:bg-dark-700 ${
                  draggingKey === tag.key ? "opacity-40" : ""
                }`}
              >
                <span className="text-base leading-none mt-0.5">
                  {tag.icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-dark-300">
                    {tag.label}
                  </p>
                  <p className="text-xs text-dark-500">{tag.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: active */}
          <div
            className={`min-h-[140px] rounded-xl border-2 border-dashed p-3 space-y-2 transition-colors ${
              dropOver === "active"
                ? "border-primary-500 bg-primary-900/20"
                : "border-primary-700/40 bg-primary-900/10"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDropOver("active");
            }}
            onDragLeave={() => setDropOver(null)}
            onDrop={onDropActivate}
          >
            <p className="text-xs text-primary-400 font-medium uppercase tracking-wide mb-2">
              Activas en esta plantilla
            </p>
            {activeTags.length === 0 && (
              <p className="text-xs text-dark-600 italic">
                Arrastrá etiquetas aquí para activarlas
              </p>
            )}
            {activeTags.map((tag) => (
              <div
                key={tag.key}
                draggable
                onDragStart={() => onDragStart(tag.key)}
                onDragEnd={onDragEnd}
                onClick={() => deactivateTag(tag)}
                className={`flex items-start gap-2 p-2.5 rounded-lg border border-primary-700/50 bg-primary-900/30 cursor-grab active:cursor-grabbing select-none transition-all hover:border-primary-600 ${
                  draggingKey === tag.key ? "opacity-40" : ""
                }`}
              >
                <span className="text-base leading-none mt-0.5">
                  {tag.icon}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-300">
                    {tag.label}
                  </p>
                  <p className="text-xs text-primary-500/70">{tag.desc}</p>
                </div>
                <Check className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-dark-600 mt-2">
          También podés hacer clic en una etiqueta para moverla.
        </p>
      </div>
    </div>
  );
}

// ============================================
// STEP 3: TECHNICAL SPECS
// ============================================

interface SpecPoolItem {
  key: string;
  icon: string;
  label?: string;
  isWeightFlag?: true;
}

const SPEC_POOL_EQUIPMENT: SpecPoolItem[] = [
  // ═══ IDENTIFICACIÓN ═══
  { key: "Placa/Patente", icon: "🚗", label: "Placa/Patente" },
  { key: "VIN/Chasis", icon: "🔢", label: "VIN/Chasis" },
  { key: "Número de serie", icon: "🏷️", label: "Número de serie" },
  { key: "Marca", icon: "🏭", label: "Marca" },
  { key: "Modelo", icon: "📋", label: "Modelo" },
  { key: "Año de fabricación", icon: "📅", label: "Año de fabricación" },
  { key: "Color", icon: "🎨", label: "Color" },

  // ═══ MOTOR Y MECÁNICA ═══
  { key: "Motor", icon: "⚙️", label: "Motor" },
  { key: "Cilindraje", icon: "🔧", label: "Cilindraje" },
  { key: "Potencia", icon: "⚡", label: "Potencia (HP/KW)" },
  { key: "Tipo de transmisión", icon: "⚙️", label: "Tipo de transmisión" },
  { key: "Número de ejes", icon: "🛞", label: "Número de ejes" },
  { key: "Combustible", icon: "⛽", label: "Tipo de combustible" },
  {
    key: "Capacidad del tanque",
    icon: "⛽",
    label: "Capacidad del tanque (L)",
  },

  // ═══ TRACKING INICIAL ═══
  { key: "Horómetro inicial", icon: "⏱️", label: "Horómetro inicial (hrs)" },
  { key: "Kilometraje inicial", icon: "🛣️", label: "Kilometraje inicial (km)" },

  // ═══ DOCUMENTACIÓN - FECHAS VENCIMIENTO ═══
  {
    key: "Fecha tarjeta propiedad",
    icon: "📄",
    label: "Vence tarjeta propiedad",
  },
  { key: "Fecha SOAT", icon: "🛡️", label: "Vence SOAT" },
  { key: "Fecha tecnomecánica", icon: "🔍", label: "Vence tecnomecánica" },
  { key: "Fecha cert. gases", icon: "💨", label: "Vence cert. gases" },
  {
    key: "Fecha licencia conductor",
    icon: "🪪",
    label: "Vence licencia conductor",
  },

  // ═══ ELEMENTOS DE SEGURIDAD ═══
  { key: "Fecha venc. extintor", icon: "🧯", label: "Vence extintor" },
  { key: "Fecha venc. botiquín", icon: "🩹", label: "Vence botiquín" },
  {
    key: "Fecha garantía batería",
    icon: "🔋",
    label: "Vence garantía batería",
  },

  // ═══ DIMENSIONES Y CAPACIDADES ═══
  { key: "Capacidad de carga", icon: "🏗️", label: "Capacidad de carga (ton)" },
  { key: "Altura de elevación", icon: "📏", label: "Altura de elevación (m)" },
  { key: "Longitud", icon: "↔️", label: "Longitud (m)" },
  { key: "Ancho", icon: "↕️", label: "Ancho (m)" },
  { key: "Altura", icon: "⬆️", label: "Altura (m)" },
  { key: "Número de pasajeros", icon: "👥", label: "Número de pasajeros" },

  // ═══ SISTEMAS HIDRÁULICOS ═══
  {
    key: "Capacidad hidráulica",
    icon: "💧",
    label: "Capacidad hidráulica (L)",
  },
  { key: "Presión hidráulica", icon: "💪", label: "Presión hidráulica (PSI)" },

  // ═══ OTROS ═══
  { key: "Velocidad máxima", icon: "🏎️", label: "Velocidad máxima (km/h)" },
  { key: "Tipo de llantas", icon: "🛞", label: "Tipo de llantas" },
  { key: "Observaciones", icon: "📝", label: "Observaciones generales" },
];

export function TechnicalSpecsStep({
  formData,
  setFormData,
}: {
  formData: CreateTemplateInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateTemplateInput>>;
}) {
  const isEquipOrVehicle = !isSupplyCategory(formData.category);
  const specs: Record<string, string> =
    (formData.technicalSpecs as Record<string, string>) || {};

  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dropZone, setDropZone] = useState<"pool" | "active" | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  // Pool: items not yet active
  const poolItems = SPEC_POOL_EQUIPMENT.filter((item) => {
    return !(item.key in specs);
  });

  // Active items: only specs (no weight flag needed)
  const activeItems: SpecPoolItem[] = [
    ...Object.keys(specs).map((k) => {
      const def = SPEC_POOL_EQUIPMENT.find((p) => p.key === k);
      return { key: k, icon: def?.icon ?? "📋" };
    }),
  ];

  const addToActive = (item: SpecPoolItem) => {
    setFormData({
      ...formData,
      technicalSpecs: { ...specs, [item.key]: "" },
    });
  };

  const removeFromActive = (key: string) => {
    const next = { ...specs };
    delete next[key];
    setFormData({ ...formData, technicalSpecs: next });
  };

  const handleDropActive = () => {
    if (!dragKey) return;
    const item = SPEC_POOL_EQUIPMENT.find((p) => p.key === dragKey);
    if (item) addToActive(item);
    setDragKey(null);
    setDropZone(null);
  };

  const handleDropPool = () => {
    if (!dragKey) return;
    removeFromActive(dragKey);
    setDragKey(null);
    setDropZone(null);
  };

  const addSupplySpec = () => {
    if (newKey && newValue) {
      setFormData({
        ...formData,
        technicalSpecs: { ...specs, [newKey]: newValue },
      });
      setNewKey("");
      setNewValue("");
    }
  };

  return (
    <div className="card space-y-6">
      <h2 className="text-xl font-semibold text-white border-b border-dark-700 pb-3">
        Especificaciones Técnicas
      </h2>

      {isEquipOrVehicle ? (
        /* ── Drag-and-drop two columns ──────────────────────────────── */
        <div>
          <p className="text-xs text-dark-400 mb-4">
            Arrastrá las etiquetas de la columna izquierda a la derecha para
            definir qué especificaciones registra este tipo de activo. También
            podés hacer clic para moverlas.
          </p>
          <div className="grid grid-cols-2 gap-4 items-start">
            {/* LEFT: available pool */}
            <div
              className={`rounded-xl border-2 border-dashed p-3 min-h-[320px] transition-colors ${
                dropZone === "pool"
                  ? "border-dark-500 bg-dark-700/60"
                  : "border-dark-700 bg-dark-800/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDropZone("pool");
              }}
              onDragLeave={() => setDropZone(null)}
              onDrop={handleDropPool}
            >
              <p className="text-xs text-dark-500 font-semibold uppercase tracking-wide mb-3">
                Etiquetas disponibles
              </p>
              {poolItems.length === 0 && (
                <p className="text-xs text-dark-600 italic">
                  Todas las especificaciones están activas ✓
                </p>
              )}
              <div className="space-y-1.5">
                {poolItems.map((item) => (
                  <div
                    key={item.key}
                    draggable
                    onDragStart={() => setDragKey(item.key)}
                    onDragEnd={() => {
                      setDragKey(null);
                      setDropZone(null);
                    }}
                    onClick={() => addToActive(item)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-dark-600 bg-dark-800 cursor-grab active:cursor-grabbing select-none hover:border-dark-500 hover:bg-dark-700 transition-all ${
                      dragKey === item.key ? "opacity-40" : ""
                    }`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-sm text-dark-300 font-medium">
                      {item.label ?? item.key}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: active specs with value inputs */}
            <div
              className={`rounded-xl border-2 border-dashed p-3 min-h-[320px] transition-colors ${
                dropZone === "active"
                  ? "border-primary-500 bg-primary-900/20"
                  : "border-primary-700/40 bg-primary-900/10"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDropZone("active");
              }}
              onDragLeave={() => setDropZone(null)}
              onDrop={handleDropActive}
            >
              <p className="text-xs text-primary-400 font-semibold uppercase tracking-wide mb-3">
                Especificaciones de esta plantilla
              </p>
              {activeItems.length === 0 && (
                <p className="text-xs text-dark-600 italic">
                  Arrastrá etiquetas aquí para agregarlas
                </p>
              )}
              <div className="space-y-1.5">
                {activeItems.map((item) => (
                  <div
                    key={item.key}
                    className="group flex items-center gap-2 rounded-lg border border-primary-700/40 bg-dark-800 px-2 py-1.5"
                  >
                    <span
                      draggable
                      onDragStart={() => setDragKey(item.key)}
                      onDragEnd={() => {
                        setDragKey(null);
                        setDropZone(null);
                      }}
                      className="text-sm cursor-grab shrink-0"
                    >
                      {item.icon}
                    </span>
                    <span className="text-xs text-primary-300 font-medium w-32 shrink-0 truncate">
                      {item.label ?? item.key}
                    </span>
                    <button
                      onClick={() => removeFromActive(item.key)}
                      className="opacity-0 group-hover:opacity-100 text-dark-500 hover:text-red-400 transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Simple key-value for supplies ─────────────────────────── */
        <div className="space-y-4">
          {Object.keys(specs).length > 0 && (
            <div className="space-y-2">
              {Object.entries(specs).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-3 bg-dark-800 p-3 rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="text-sm font-medium text-dark-400">
                      {key}
                    </div>
                    <div className="text-sm text-white">{value}</div>
                  </div>
                  <button
                    onClick={() => removeFromActive(key)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <input
              type="text"
              className="input flex-1"
              placeholder="Nombre (ej: Viscosidad)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSupplySpec()}
            />
            <input
              type="text"
              className="input flex-1"
              placeholder="Valor (ej: SAE 15W-40)"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSupplySpec()}
            />
            <button onClick={addSupplySpec} className="btn-primary">
              Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// STEP 4: PREVENTIVE MAINTENANCE SCHEDULE
// ============================================

export function PreventiveMaintenanceStep({
  formData,
  setFormData,
}: {
  formData: CreateTemplateInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateTemplateInput>>;
}) {
  const items: MaintenanceScheduleItem[] =
    (formData.maintenanceSchedule as MaintenanceScheduleItem[]) || [];

  const PERIODICITY_PRESETS = [
    "50 horas",
    "250 horas",
    "500 horas",
    "1000 horas",
    "Semanal",
    "Mensual",
    "Trimestral",
    "Semestral",
    "Anual",
  ];

  const addItem = () => {
    setFormData({
      ...formData,
      maintenanceSchedule: [
        ...items,
        { periodicity: "", description: "", requiredItems: "" },
      ],
    });
  };

  const updateItem = (idx: number, patch: Partial<MaintenanceScheduleItem>) => {
    const updated = items.map((it, i) =>
      i === idx ? { ...it, ...patch } : it,
    );
    setFormData({ ...formData, maintenanceSchedule: updated });
  };

  const removeItem = (idx: number) => {
    setFormData({
      ...formData,
      maintenanceSchedule: items.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="card space-y-6">
      <div className="flex items-center justify-between border-b border-dark-700 pb-3">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Plan de Mantenimiento Preventivo
          </h2>
          <p className="text-sm text-dark-400 mt-1">
            Define los procedimientos y periodicidades de mantenimiento para
            este tipo de activo.
          </p>
        </div>
        <button type="button" onClick={addItem} className="btn-primary">
          + Agregar
        </button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-10 text-dark-500">
          <div className="text-4xl mb-3">🔧</div>
          <p className="text-sm">Sin procedimientos registrados todavía.</p>
          <p className="text-xs mt-1">
            Agrega los mantenimientos preventivos (cada 250 h, anual, etc.) que
            aplican a este tipo de maquinaria.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-dark-800 rounded-lg p-4 border border-dark-700 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-dark-400 uppercase tracking-wide">
                  Procedimiento #{idx + 1}
                </span>
                <button
                  onClick={() => removeItem(idx)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Periodicidad */}
              <div>
                <label className="label">Periodicidad</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {PERIODICITY_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateItem(idx, { periodicity: p })}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        item.periodicity === p
                          ? "border-primary-500 text-primary-300 bg-primary-900/30"
                          : "border-dark-600 text-dark-400 hover:border-primary-600"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="O escribe uno personalizado (ej: Cada 8 semanas)"
                  value={item.periodicity}
                  onChange={(e) =>
                    updateItem(idx, { periodicity: e.target.value })
                  }
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="label">Descripción del mantenimiento</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Ej: Cambio de aceite y filtros, revisión de frenos"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(idx, { description: e.target.value })
                  }
                />
              </div>

              {/* Elementos requeridos */}
              <div>
                <label className="label">
                  Elementos / Repuestos Requeridos
                  <span className="ml-1 text-dark-500 font-normal">
                    (opcional)
                  </span>
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Ej: Aceite 15W-40, Filtro de motor, Filtro de aire"
                  value={item.requiredItems || ""}
                  onChange={(e) =>
                    updateItem(idx, { requiredItems: e.target.value })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// STEP 5: RENTAL PRICING (Solo para activos alquilables)
// ============================================

export function RentalPricingStep({
  formData,
  setFormData,
}: {
  formData: CreateTemplateInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateTemplateInput>>;
}) {
  const rules = formData.rentalRules ?? {
    allowsHourly: false,
    allowsDaily: false,
    allowsWeekly: false,
    allowsMonthly: false,
    requiresOperator: false,
    chargesKm: false,
  };

  const updateRule = (field: string, value: unknown) => {
    setFormData({
      ...formData,
      rentalRules: { ...rules, [field]: value },
    });
  };

  const anyModality =
    rules.allowsHourly ||
    rules.allowsDaily ||
    rules.allowsWeekly ||
    rules.allowsMonthly;

  return (
    <div className="card space-y-6">
      <h2 className="text-xl font-semibold text-white border-b border-dark-700 pb-3">
        Modalidades de Alquiler
      </h2>

      <p className="text-dark-400 text-sm">
        Definí qué modalidades están habilitadas para este tipo de activo. Los
        precios se configuran en cada activo individual.
      </p>

      {/* ── Períodos habilitados ─────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="font-medium text-white">Períodos de alquiler</h3>
        <p className="text-xs text-dark-500">
          Podés habilitar más de uno. El precio de cada período se carga al
          crear el activo.
        </p>

        {/* Por hora */}
        <div className="border border-dark-700 rounded-lg overflow-hidden">
          <label className="flex items-center gap-3 p-4 cursor-pointer hover:bg-dark-800 transition">
            <input
              type="checkbox"
              className="w-4 h-4 accent-primary-500"
              checked={rules.allowsHourly}
              onChange={(e) => {
                updateRule("allowsHourly", e.target.checked);
                if (!e.target.checked) updateRule("minDailyHours", undefined);
              }}
            />
            <div>
              <span className="text-white font-medium">Por hora</span>
              <p className="text-xs text-dark-500 mt-0.5">
                Permite cotizar por hora trabajada
              </p>
            </div>
          </label>

          {rules.allowsHourly && (
            <div className="px-4 pb-4 bg-dark-800/50 space-y-3">
              <div>
                <label className="block text-sm text-dark-400 mb-1">
                  Standby — horas mínimas garantizadas / día
                  <span className="ml-1 text-dark-500 font-normal">
                    (opcional)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    className="input w-28"
                    placeholder="0"
                    value={rules.minDailyHours ?? ""}
                    onChange={(e) =>
                      updateRule(
                        "minDailyHours",
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                  />
                  <span className="text-dark-400 text-sm">hrs / día</span>
                </div>
                <p className="text-xs text-dark-500 mt-1">
                  Se cobra aunque el equipo no trabaje. Al facturar por semana
                  se multiplica automáticamente por los días del contrato.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Por día */}
        <label className="flex items-center gap-3 p-4 border border-dark-700 rounded-lg cursor-pointer hover:bg-dark-800 transition">
          <input
            type="checkbox"
            className="w-4 h-4 accent-primary-500"
            checked={rules.allowsDaily}
            onChange={(e) => updateRule("allowsDaily", e.target.checked)}
          />
          <div>
            <span className="text-white font-medium">Por día</span>
            <p className="text-xs text-dark-500 mt-0.5">
              Jornada completa de trabajo
            </p>
          </div>
        </label>

        {/* Por semana */}
        <label className="flex items-center gap-3 p-4 border border-dark-700 rounded-lg cursor-pointer hover:bg-dark-800 transition">
          <input
            type="checkbox"
            className="w-4 h-4 accent-primary-500"
            checked={rules.allowsWeekly}
            onChange={(e) => updateRule("allowsWeekly", e.target.checked)}
          />
          <div>
            <span className="text-white font-medium">Por semana</span>
            <p className="text-xs text-dark-500 mt-0.5">
              {rules.allowsHourly && rules.minDailyHours
                ? `Incluye standby: ${rules.minDailyHours} hrs/día × días del contrato`
                : "Tarifa semanal fija"}
            </p>
          </div>
        </label>

        {/* Por mes */}
        <label className="flex items-center gap-3 p-4 border border-dark-700 rounded-lg cursor-pointer hover:bg-dark-800 transition">
          <input
            type="checkbox"
            className="w-4 h-4 accent-primary-500"
            checked={rules.allowsMonthly}
            onChange={(e) => updateRule("allowsMonthly", e.target.checked)}
          />
          <div>
            <span className="text-white font-medium">Por mes</span>
            <p className="text-xs text-dark-500 mt-0.5">
              Contrato mensual con tarifa fija
            </p>
          </div>
        </label>
      </div>

      {/* ── Operario ─────────────────────────────────────────────────── */}
      <div className="p-4 bg-dark-800 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary-400" />
          <h3 className="font-medium text-white">Operario</h3>
        </div>

        {formData.category === AssetCategory.VEHICLE ? (
          /* Vehículos SIEMPRE requieren operario */
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-300 font-medium">
                  Operario siempre incluido
                </p>
                <p className="text-xs text-green-400/70 mt-0.5">
                  Los vehículos (camiones, montacargas, etc.) siempre se
                  alquilan con operario.
                </p>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm text-dark-400 mb-1">
                ¿Cómo se cobra el operario?
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateRule("operatorBillingType", "PER_DAY")}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                    rules.operatorBillingType === "PER_DAY"
                      ? "bg-primary-600 border-primary-500 text-white"
                      : "bg-dark-700 border-dark-600 text-dark-300 hover:border-dark-500"
                  }`}
                >
                  Por día
                </button>
                <button
                  type="button"
                  onClick={() => updateRule("operatorBillingType", "PER_HOUR")}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                    rules.operatorBillingType === "PER_HOUR"
                      ? "bg-primary-600 border-primary-500 text-white"
                      : "bg-dark-700 border-dark-600 text-dark-300 hover:border-dark-500"
                  }`}
                >
                  Por hora
                </button>
              </div>
              <p className="text-xs text-dark-500 mt-1">
                El precio del operario se define en cada activo.
              </p>
            </div>
          </div>
        ) : (
          /* Otros activos: operario opcional */
          <>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-primary-500"
                checked={rules.requiresOperator}
                onChange={(e) => {
                  updateRule("requiresOperator", e.target.checked);
                  if (!e.target.checked)
                    updateRule("operatorBillingType", undefined);
                }}
              />
              <span className="text-sm text-white">
                Este tipo de activo puede incluir operario
              </span>
            </label>

            {rules.requiresOperator && (
              <div className="pl-7">
                <label className="block text-sm text-dark-400 mb-1">
                  ¿Cómo se cobra el operario?
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateRule("operatorBillingType", "PER_DAY")}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                      rules.operatorBillingType === "PER_DAY"
                        ? "bg-primary-600 border-primary-500 text-white"
                        : "bg-dark-700 border-dark-600 text-dark-300 hover:border-dark-500"
                    }`}
                  >
                    Por día
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateRule("operatorBillingType", "PER_HOUR")
                    }
                    className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                      rules.operatorBillingType === "PER_HOUR"
                        ? "bg-primary-600 border-primary-500 text-white"
                        : "bg-dark-700 border-dark-600 text-dark-300 hover:border-dark-500"
                    }`}
                  >
                    Por hora
                  </button>
                </div>
                <p className="text-xs text-dark-500 mt-1">
                  El precio del operario se define en cada activo.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Transporte ───────────────────────────────────────────────── */}
      <div className="p-4 bg-dark-800 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="w-5 h-5 text-primary-400" />
          <h3 className="font-medium text-white">Transporte</h3>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 accent-primary-500"
            checked={rules.chargesKm}
            onChange={(e) => updateRule("chargesKm", e.target.checked)}
          />
          <div>
            <span className="text-sm text-white">
              Cobra transporte por kilómetro
            </span>
            <p className="text-xs text-dark-500 mt-0.5">
              El precio por km se configura en cada activo y se calcula según km
              reales al momento de la entrega.
            </p>
          </div>
        </label>
      </div>

      {/* ── Resumen ──────────────────────────────────────────────────── */}
      {anyModality && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <h4 className="font-medium text-green-400 mb-2">
            ✅ Modalidades habilitadas
          </h4>
          <div className="text-sm text-dark-400 space-y-1">
            {rules.allowsHourly && (
              <p>
                • Por hora
                {rules.minDailyHours
                  ? ` — standby ${rules.minDailyHours} hrs/día`
                  : ""}
              </p>
            )}
            {rules.allowsDaily && <p>• Por día</p>}
            {rules.allowsWeekly && (
              <p>
                • Por semana
                {rules.allowsHourly && rules.minDailyHours
                  ? ` (standby incluido)`
                  : ""}
              </p>
            )}
            {rules.allowsMonthly && <p>• Por mes</p>}
            {rules.requiresOperator && (
              <p>
                • Operario:{" "}
                {rules.operatorBillingType === "PER_DAY"
                  ? "por día"
                  : rules.operatorBillingType === "PER_HOUR"
                    ? "por hora"
                    : "sin tipo definido"}
              </p>
            )}
            {rules.chargesKm && <p>• Transporte por km</p>}
          </div>
        </div>
      )}
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
// STEP 5: PREVIEW
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
