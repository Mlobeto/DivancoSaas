/**
 * SUPPLY CATEGORY WIZARD STEPS
 * Componentes de pasos del wizard para crear/editar categorías de supplies
 */

import { useState } from "react";
import {
  SupplyCategoryType,
  type CreateSupplyCategoryDto,
} from "../types/supply-category.types";

// ============================================
// STEP 1: BASIC INFO
// ============================================

const COMMON_ICONS = [
  "🛢️", // Lubricante
  "🔧", // Herramienta
  "⚙️", // Repuesto
  "📦", // Producto terminado
  "🧪", // Químico
  "🪛", // Tornillería
  "🔩", // Piezas
  "🎨", // Pintura
  "⚡", // Eléctrico
  "🪵", // Madera
  "🧱", // Construcción
  "🍽️", // Alimentos
  "👕", // Textil
];

const CATEGORY_COLORS = [
  { value: "#3B82F6", label: "Azul" },
  { value: "#10B981", label: "Verde" },
  { value: "#F59E0B", label: "Naranja" },
  { value: "#EF4444", label: "Rojo" },
  { value: "#8B5CF6", label: "Violeta" },
  { value: "#EC4899", label: "Rosa" },
  { value: "#14B8A6", label: "Turquesa" },
  { value: "#6366F1", label: "Índigo" },
];

const CATEGORY_TYPE_INFO = {
  [SupplyCategoryType.CONSUMABLE]: {
    label: "Consumible",
    description: "Suministros que se consumen (lubricantes, filtros, tintas)",
    icon: "🛢️",
  },
  [SupplyCategoryType.SPARE_PART]: {
    label: "Repuesto",
    description: "Piezas de recambio para equipos",
    icon: "⚙️",
  },
  [SupplyCategoryType.RAW_MATERIAL]: {
    label: "Materia Prima",
    description: "Materiales para producción",
    icon: "🪵",
  },
  [SupplyCategoryType.FINISHED_PRODUCT]: {
    label: "Producto Terminado",
    description: "Productos listos para venta o entrega",
    icon: "📦",
  },
  [SupplyCategoryType.TOOL]: {
    label: "Herramienta",
    description: "Herramientas de uso múltiple",
    icon: "🔧",
  },
  [SupplyCategoryType.OTHER]: {
    label: "Otro",
    description: "Otros tipos de suministros",
    icon: "📋",
  },
};

export function BasicInfoStep({
  formData,
  setFormData,
}: {
  formData: CreateSupplyCategoryDto;
  setFormData: React.Dispatch<React.SetStateAction<CreateSupplyCategoryDto>>;
}) {
  const [customIcon, setCustomIcon] = useState("");

  return (
    <div className="card space-y-6">
      {/* Code */}
      <div>
        <label className="label">Código *</label>
        <input
          type="text"
          className="input font-mono uppercase"
          placeholder="Ej: LUB_MOTOR, FILT_AIRE"
          value={formData.code}
          onChange={(e) =>
            setFormData({ ...formData, code: e.target.value.toUpperCase() })
          }
          required
          maxLength={50}
        />
        <p className="text-xs text-dark-400 mt-1">
          Identificador único para esta categoría
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="label">Nombre de la Categoría *</label>
        <input
          type="text"
          className="input"
          placeholder="Ej: Lubricantes para Motor"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      {/* Type */}
      <div>
        <label className="label">
          Tipo de Categoría *
          <span className="text-xs text-dark-400 ml-2">
            (Define cómo se comporta en el sistema)
          </span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.values(SupplyCategoryType).map((type) => (
            <button
              key={type}
              type="button"
              className={`p-4 rounded-lg border-2 transition text-left ${
                formData.type === type
                  ? "border-primary-500 bg-primary-900/20"
                  : "border-dark-700 hover:border-dark-600"
              }`}
              onClick={() => setFormData({ ...formData, type })}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">
                  {CATEGORY_TYPE_INFO[type].icon}
                </span>
                <div>
                  <div className="font-semibold">
                    {CATEGORY_TYPE_INFO[type].label}
                  </div>
                  <div className="text-xs text-dark-400 mt-1">
                    {CATEGORY_TYPE_INFO[type].description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Icon */}
      <div>
        <label className="label">Icono</label>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-3">
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

      {/* Color */}
      <div>
        <label className="label">Color</label>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {CATEGORY_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              className={`p-4 rounded-lg border-2 transition relative ${
                formData.color === color.value
                  ? "border-white"
                  : "border-dark-700 hover:border-dark-600"
              }`}
              style={{ backgroundColor: color.value }}
              onClick={() => setFormData({ ...formData, color: color.value })}
              title={color.label}
            >
              {formData.color === color.value && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-2xl">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="label">Descripción</label>
        <textarea
          className="input"
          rows={3}
          placeholder="Describe esta categoría (por ejemplo: tipos de suministros que incluye)..."
          value={formData.description || ""}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>
    </div>
  );
}

// ============================================
// STEP 2: CONFIGURATION
// ============================================

export function ConfigurationStep({
  formData,
  setFormData,
}: {
  formData: CreateSupplyCategoryDto;
  setFormData: React.Dispatch<React.SetStateAction<CreateSupplyCategoryDto>>;
}) {
  return (
    <div className="card space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Configuración de Inventario</h2>
        <p className="text-dark-400 text-sm">
          Define cómo se controlará el inventario para esta categoría
        </p>
      </div>

      {/* Serial Tracking */}
      <div className="p-4 rounded-lg border border-dark-700">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="requiresSerialTracking"
            checked={formData.requiresSerialTracking || false}
            onChange={(e) =>
              setFormData({
                ...formData,
                requiresSerialTracking: e.target.checked,
              })
            }
            className="mt-1"
          />
          <div className="flex-1">
            <label
              htmlFor="requiresSerialTracking"
              className="font-semibold cursor-pointer block"
            >
              Rastreo por Número de Serie
            </label>
            <p className="text-sm text-dark-400 mt-1">
              Cada unidad tendrá un número de serie único para trazabilidad
              individual
            </p>
          </div>
          <span className="text-2xl">🔢</span>
        </div>
      </div>

      {/* Expiry Date */}
      <div className="p-4 rounded-lg border border-dark-700">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="requiresExpiryDate"
            checked={formData.requiresExpiryDate || false}
            onChange={(e) =>
              setFormData({
                ...formData,
                requiresExpiryDate: e.target.checked,
              })
            }
            className="mt-1"
          />
          <div className="flex-1">
            <label
              htmlFor="requiresExpiryDate"
              className="font-semibold cursor-pointer block"
            >
              Control de Fecha de Vencimiento
            </label>
            <p className="text-sm text-dark-400 mt-1">
              Alertas y control de productos con fecha de caducidad
            </p>
          </div>
          <span className="text-2xl">📅</span>
        </div>
      </div>

      {/* Negative Stock */}
      <div className="p-4 rounded-lg border border-dark-700">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="allowsNegativeStock"
            checked={formData.allowsNegativeStock || false}
            onChange={(e) =>
              setFormData({
                ...formData,
                allowsNegativeStock: e.target.checked,
              })
            }
            className="mt-1"
          />
          <div className="flex-1">
            <label
              htmlFor="allowsNegativeStock"
              className="font-semibold cursor-pointer block"
            >
              Permitir Stock Negativo
            </label>
            <p className="text-sm text-dark-400 mt-1">
              Permite registrar consumos aunque no haya stock disponible
              (pendiente de compra)
            </p>
          </div>
          <span className="text-2xl">⚠️</span>
        </div>
      </div>

      {/* Reorder Point */}
      <div className="p-4 rounded-lg border border-dark-700">
        <label className="label">Punto de Reorden Predeterminado</label>
        <input
          type="number"
          className="input"
          placeholder="Ej: 10"
          min="0"
          value={formData.defaultReorderPoint || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              defaultReorderPoint: e.target.value
                ? parseInt(e.target.value)
                : undefined,
            })
          }
        />
        <p className="text-sm text-dark-400 mt-2">
          Cantidad mínima antes de activar alerta de reabastecimiento
        </p>
      </div>

      {/* Recommendations */}
      <div className="bg-dark-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <span>💡</span>
          Recomendaciones por tipo
        </h3>
        <ul className="text-sm text-dark-400 space-y-1">
          {formData.type === SupplyCategoryType.CONSUMABLE && (
            <>
              <li>• Activa fecha de vencimiento para lubricantes y químicos</li>
              <li>• Define un punto de reorden apropiado</li>
            </>
          )}
          {formData.type === SupplyCategoryType.SPARE_PART && (
            <>
              <li>
                • Considera activar rastreo por serie para piezas críticas
              </li>
              <li>• Stock negativo útil para órdenes urgentes</li>
            </>
          )}
          {formData.type === SupplyCategoryType.RAW_MATERIAL && (
            <>
              <li>• Punto de reorden crítico para no detener producción</li>
              <li>• Fecha de caducidad si aplica (alimentos, químicos)</li>
            </>
          )}
          {formData.type === SupplyCategoryType.FINISHED_PRODUCT && (
            <>
              <li>• Rastreo por serie recomendado para garantías</li>
              <li>• Control de vencimiento para productos perecederos</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}

// ============================================
// STEP 3: PREVIEW
// ============================================

export function PreviewStep({
  formData,
}: {
  formData: CreateSupplyCategoryDto;
}) {
  return (
    <div className="card space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Vista Previa</h2>
        <p className="text-dark-400 text-sm">
          Revisa la configuración antes de guardar
        </p>
      </div>

      {/* Category Preview Card */}
      <div
        className="p-6 rounded-lg border-2"
        style={{
          borderColor: formData.color || "#4B5563",
          backgroundColor: `${formData.color || "#4B5563"}15`,
        }}
      >
        <div className="flex items-start gap-4">
          <div className="text-5xl">{formData.icon || "📦"}</div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold">{formData.name}</h3>
              <span
                className="px-3 py-1 rounded text-xs font-mono"
                style={{
                  backgroundColor: formData.color || "#4B5563",
                  color: "white",
                }}
              >
                {formData.code}
              </span>
            </div>
            <p className="text-dark-400">
              {formData.description || "Sin descripción"}
            </p>
            <div className="mt-3">
              <span className="px-2 py-1 rounded bg-dark-800 text-xs">
                {CATEGORY_TYPE_INFO[formData.type].label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-dark-800">
          <h4 className="font-semibold mb-3">Controles Activados</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span>{formData.requiresSerialTracking ? "✅" : "❌"}</span>
              <span>Rastreo por Serie</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{formData.requiresExpiryDate ? "✅" : "❌"}</span>
              <span>Control de Vencimiento</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{formData.allowsNegativeStock ? "✅" : "❌"}</span>
              <span>Stock Negativo</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-dark-800">
          <h4 className="font-semibold mb-3">Configuración de Stock</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-dark-400">Punto de Reorden:</span>{" "}
              <span className="font-semibold">
                {formData.defaultReorderPoint
                  ? `${formData.defaultReorderPoint} unidades`
                  : "No definido"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info  Box */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-300 mb-2">
          ℹ️ <strong>Tipos vs Categorías:</strong>
        </p>
        <ul className="text-xs text-blue-200/80 space-y-1 ml-4">
          <li>
            • <strong>Tipo</strong> (6 fijos): Define cómo se comporta en el
            sistema (inventario, tracking, etc.)
          </li>
          <li>
            • <strong>Categoría</strong> (ilimitadas): Etiquetas personalizadas
            para organizar TU negocio
          </li>
          <li>
            • Ejemplo: Tipo "Consumible" puede tener categorías "Lubricantes",
            "Filtros", "Tintas"
          </li>
        </ul>
      </div>
    </div>
  );
}
