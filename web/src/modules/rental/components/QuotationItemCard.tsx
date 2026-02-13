import { Trash2, User, AlertCircle } from "lucide-react";
import type { QuotationItem } from "../hooks/useQuotationForm";

interface QuotationItemCardProps {
  item: QuotationItem;
  index: number;
  onUpdate: (index: number, field: keyof QuotationItem, value: any) => void;
  onRemove: (index: number) => void;
}

export function QuotationItemCard({
  item,
  index,
  onUpdate,
  onRemove,
}: QuotationItemCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-semibold text-gray-900">{item.assetName}</h4>
          <p className="text-sm text-gray-500">
            {item.assetCode} • {item.trackingType}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Basic Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad
          </label>
          <input
            type="number"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            value={item.quantity}
            onChange={(e) =>
              onUpdate(index, "quantity", parseInt(e.target.value) || 1)
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Días Renta
          </label>
          <input
            type="number"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            value={item.rentalDays}
            onChange={(e) =>
              onUpdate(index, "rentalDays", parseInt(e.target.value) || 1)
            }
          />
        </div>

        {/* STANDBY for MACHINERY */}
        {item.trackingType === "MACHINERY" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              STANDBY (hrs/día)
              <span
                className="text-blue-500 ml-1 cursor-help"
                title="Horas mínimas garantizadas por día. Si el operario trabaja menos, se facturan estas."
              >
                ℹ️
              </span>
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              value={item.standbyHours || 0}
              onChange={(e) =>
                onUpdate(index, "standbyHours", parseFloat(e.target.value) || 0)
              }
            />
          </div>
        )}

        {/* Rental Period Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Período
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            value={item.rentalPeriodType}
            onChange={(e) =>
              onUpdate(index, "rentalPeriodType", e.target.value)
            }
          >
            {item.trackingType === "MACHINERY" && (
              <option value="hourly">Por Hora</option>
            )}
            <option value="daily">Por Día</option>
            <option value="weekly">Por Semana</option>
            <option value="monthly">Por Mes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Inicio
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            value={item.startDate}
            onChange={(e) => onUpdate(index, "startDate", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Fin
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            value={item.endDate}
            readOnly
            disabled
          />
        </div>
      </div>

      {/* Operator Section */}
      <div className="p-4 bg-gray-50 rounded-lg mb-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id={`operator-${index}`}
            checked={item.operatorIncluded}
            onChange={(e) =>
              onUpdate(index, "operatorIncluded", e.target.checked)
            }
            className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
          <label
            htmlFor={`operator-${index}`}
            className="font-medium text-gray-900 flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Incluir Operador
          </label>
        </div>

        {item.operatorIncluded && (
          <div className="grid grid-cols-2 gap-3 ml-6">
            <button
              type="button"
              className={`
                p-3 rounded-lg border-2 transition-all text-left
                ${
                  item.operatorCostType === "PER_DAY"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 bg-white"
                }
              `}
              onClick={() => onUpdate(index, "operatorCostType", "PER_DAY")}
            >
              <div className="font-semibold text-gray-900 mb-1">💰 POR DÍA</div>
              <div className="text-xs text-gray-600">
                Obra lejos (viático fijo diario)
              </div>
            </button>
            <button
              type="button"
              className={`
                p-3 rounded-lg border-2 transition-all text-left
                ${
                  item.operatorCostType === "PER_HOUR"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 bg-white"
                }
              `}
              onClick={() => onUpdate(index, "operatorCostType", "PER_HOUR")}
            >
              <div className="font-semibold text-gray-900 mb-1">
                ⏱️ POR HORA
              </div>
              <div className="text-xs text-gray-600">
                Obra cerca (costo por hora trabajada)
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Price Preview & Manual Override */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
        {/* Calculated Preview */}
        <div>
          <h5 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Precio Calculado
          </h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Precio Unitario:</span>
              <span className="font-mono font-medium text-gray-900">
                ${(item.calculatedUnitPrice || 0).toLocaleString()}
              </span>
            </div>
            {item.operatorIncluded && (
              <div className="flex justify-between">
                <span className="text-gray-600">Costo Operador:</span>
                <span className="font-mono font-medium text-gray-900">
                  ${(item.calculatedOperatorCost || 0).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
              <span className="text-gray-900">
                Subtotal (x{item.quantity}):
              </span>
              <span className="font-mono text-blue-600">
                $
                {(
                  ((item.calculatedUnitPrice || 0) +
                    (item.calculatedOperatorCost || 0)) *
                  item.quantity
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Manual Override */}
        <div>
          <h5 className="text-sm font-semibold text-amber-600 mb-3">
            Override Manual (Opcional)
          </h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Precio Unitario Personalizado
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Dejar vacío para usar calculado"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 placeholder:text-gray-400"
                value={item.customUnitPrice || ""}
                onChange={(e) =>
                  onUpdate(
                    index,
                    "customUnitPrice",
                    e.target.value ? parseFloat(e.target.value) : undefined,
                  )
                }
              />
            </div>

            {item.operatorIncluded && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Costo Operador Personalizado
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Dejar vacío para usar calculado"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm text-gray-900 placeholder:text-gray-400"
                  value={item.customOperatorCost || ""}
                  onChange={(e) =>
                    onUpdate(
                      index,
                      "customOperatorCost",
                      e.target.value ? parseFloat(e.target.value) : undefined,
                    )
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
