import { useState, useEffect } from "react";
import { X, Clock, Calendar, User, Settings } from "lucide-react";
import type {
  RentalPeriodType,
  OperatorCostType,
} from "../types/quotation.types";
import type { AssetRentalProfile } from "@/modules/inventory/services/assets.service";

interface AssetSearchResult {
  id: string;
  code: string;
  name: string;
  trackingType: "MACHINERY" | "TOOL" | null;
  imageUrl: string | null;
  pricePerHour: number | null;
  minDailyHours: number | null;
  pricePerDay: number | null;
  pricePerWeek: number | null;
  pricePerMonth: number | null;
  operatorCostType: "PER_HOUR" | "PER_DAY" | null;
  operatorCostRate: number | null;
  requiresOperator: boolean;
  rentalProfile?: AssetRentalProfile; // Multi-vertical extension
}

interface AddTimeBasedItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetSearchResult | null;
  estimatedStartDate: string;
  estimatedEndDate: string;
  estimatedDays: number;
  onAdd: (itemData: TimeBasedItemData) => void;
}

export interface TimeBasedItemData {
  assetId: string;
  assetName: string;
  assetCode: string;
  trackingType: "MACHINERY" | "TOOL" | null;
  quantity: number;
  rentalDays: number;
  startDate: string;
  endDate: string;
  rentalPeriodType: RentalPeriodType;
  standbyHours?: number;
  operatorIncluded: boolean;
  operatorCostType?: OperatorCostType;
  customUnitPrice?: number;
  customOperatorCost?: number;
}

export function AddTimeBasedItemModal({
  isOpen,
  onClose,
  asset,
  estimatedStartDate,
  estimatedEndDate,
  estimatedDays,
  onAdd,
}: AddTimeBasedItemModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [rentalPeriodType, setRentalPeriodType] =
    useState<RentalPeriodType>("daily");
  const [standbyHours, setStandbyHours] = useState(8);
  const [operatorIncluded, setOperatorIncluded] = useState(false);
  const [operatorCostType, setOperatorCostType] =
    useState<OperatorCostType>("PER_DAY");
  const [customUnitPrice, setCustomUnitPrice] = useState<number | undefined>(
    undefined,
  );
  const [customOperatorCost, setCustomOperatorCost] = useState<
    number | undefined
  >(undefined);

  // Calcular precio automático
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [calculatedOperatorCost, setCalculatedOperatorCost] = useState(0);

  useEffect(() => {
    if (!asset) return;

    // Helper: Obtener valor con fallback desde rentalProfile (multi-vertical)
    const getPrice = (field: keyof AssetRentalProfile) => {
      const profileValue = asset.rentalProfile?.[field];
      const legacyValue = asset[field as keyof AssetSearchResult];
      return profileValue ?? legacyValue ?? 0;
    };

    // Calcular precio base según tipo de activo
    let basePrice = 0;
    const trackingType =
      asset.rentalProfile?.trackingType || asset.trackingType;

    if (trackingType === "MACHINERY") {
      const hourlyRate = Number(getPrice("pricePerHour"));
      basePrice = estimatedDays * standbyHours * hourlyRate;
    } else if (trackingType === "TOOL") {
      const pricePerMonth = Number(getPrice("pricePerMonth"));
      const pricePerWeek = Number(getPrice("pricePerWeek"));
      const pricePerDay = Number(getPrice("pricePerDay"));

      if (estimatedDays >= 30 && pricePerMonth) {
        basePrice = pricePerMonth;
      } else if (estimatedDays >= 7 && pricePerWeek) {
        basePrice = pricePerWeek;
      } else {
        basePrice = pricePerDay * estimatedDays;
      }
    }
    setCalculatedPrice(basePrice);

    // Calcular costo de operario
    let operCost = 0;
    const operatorRate = Number(getPrice("operatorCostRate"));
    if (operatorIncluded && operatorRate) {
      if (operatorCostType === "PER_HOUR") {
        operCost = estimatedDays * standbyHours * operatorRate;
      } else {
        operCost = estimatedDays * operatorRate;
      }
    }
    setCalculatedOperatorCost(operCost);
  }, [
    asset,
    estimatedDays,
    standbyHours,
    operatorIncluded,
    operatorCostType,
    rentalPeriodType,
  ]);

  // Reset form when asset changes
  useEffect(() => {
    if (asset) {
      const trackingType = asset.rentalProfile?.trackingType || asset.trackingType;
      const minDailyHours = asset.rentalProfile?.minDailyHours || asset.minDailyHours;
      const operatorCostType = asset.rentalProfile?.operatorCostType || asset.operatorCostType;
      
      setQuantity(1);
      setRentalPeriodType(
        trackingType === "MACHINERY" ? "hourly" : "daily",
      );
      setStandbyHours(minDailyHours || 8);
      setOperatorIncluded(asset.requiresOperator);
      setOperatorCostType(operatorCostType || "PER_DAY");
      setCustomUnitPrice(undefined);
      setCustomOperatorCost(undefined);
    }
  }, [asset]);

  if (!isOpen || !asset) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trackingType = asset.rentalProfile?.trackingType || asset.trackingType;

    const itemData: TimeBasedItemData = {
      assetId: asset.id,
      assetName: asset.name,
      assetCode: asset.code,
      trackingType: trackingType,
      quantity,
      rentalDays: estimatedDays,
      startDate: estimatedStartDate,
      endDate: estimatedEndDate,
      rentalPeriodType,
      standbyHours:
        trackingType === "MACHINERY" ? standbyHours : undefined,
      operatorIncluded,
      operatorCostType: operatorIncluded ? operatorCostType : undefined,
      customUnitPrice,
      customOperatorCost,
    };

    onAdd(itemData);
    onClose();
  };

  const totalPrice =
    (customUnitPrice || calculatedPrice) +
    (customOperatorCost || calculatedOperatorCost);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Agregar Item - Alquiler por Tiempo
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {asset.name} ({asset.code})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Período de Alquiler */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-gray-900">Período de Alquiler</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inicio
                </label>
                <input
                  type="date"
                  value={estimatedStartDate}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fin
                </label>
                <input
                  type="date"
                  value={estimatedEndDate}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Días
                </label>
                <input
                  type="number"
                  value={estimatedDays}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Configuración del Item */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">Configuración</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Período
                </label>
                <select
                  value={rentalPeriodType}
                  onChange={(e) =>
                    setRentalPeriodType(e.target.value as RentalPeriodType)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="hourly">Por Hora</option>
                  <option value="daily">Por Día</option>
                  <option value="weekly">Por Semana</option>
                  <option value="monthly">Por Mes</option>
                </select>
              </div>
            </div>

            {/* Standby Hours (solo para MACHINERY) */}
            {(() => {
              const trackingType = asset.rentalProfile?.trackingType || asset.trackingType;
              return trackingType === "MACHINERY" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Horas Standby (mínimo garantizado/día)
                    </div>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={standbyHours}
                    onChange={(e) =>
                      setStandbyHours(parseInt(e.target.value) || 8)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Horas mínimas garantizadas de uso por día (afecta cálculo de
                    precio)
                  </p>
              </div>
            )}
          </div>

          {/* Operario */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Operario</h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={operatorIncluded}
                  onChange={(e) => setOperatorIncluded(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Incluir Operario
                </span>
              </label>
            </div>

            {operatorIncluded && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Costo
                  </label>
                  <select
                    value={operatorCostType}
                    onChange={(e) =>
                      setOperatorCostType(e.target.value as OperatorCostType)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="PER_DAY">Por Día</option>
                    <option value="PER_HOUR">Por Hora</option>
                  </select>
                </div>

                <div className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200">
                  <div className="flex justify-between">
                    <span>Tarifa operario:</span>
                    <span className="font-semibold">
                      ${(asset.rentalProfile?.operatorCostRate || asset.operatorCostRate)?.toLocaleString() || 0}/
                      {operatorCostType === "PER_HOUR" ? "hora" : "día"}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Costo calculado ({estimatedDays} días):</span>
                    <span className="font-semibold text-blue-600">
                      ${calculatedOperatorCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Override operador */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo Operario Custom (opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customOperatorCost || ""}
                    onChange={(e) =>
                      setCustomOperatorCost(
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                    placeholder={`Auto: $${calculatedOperatorCost.toLocaleString()}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Precio Base */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-gray-900 mb-3">Precio Base</h3>

            <div className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200 mb-3">
              <div className="flex justify-between">
                <span>Precio calculado automático:</span>
                <span className="font-semibold text-green-600">
                  ${calculatedPrice.toLocaleString()}
                </span>
              </div>
              {(() => {
                const trackingType = asset.rentalProfile?.trackingType || asset.trackingType;
                const pricePerHour = asset.rentalProfile?.pricePerHour || asset.pricePerHour;
                
                return trackingType === "MACHINERY" && (
                  <p className="text-xs text-gray-500 mt-1">
                    {estimatedDays} días × {standbyHours} hrs/día × $
                    {pricePerHour}/hr
                  </p>
                );
              })()}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Custom (opcional)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={customUnitPrice || ""}
                onChange={(e) =>
                  setCustomUnitPrice(
                    e.target.value ? parseFloat(e.target.value) : undefined,
                  )
                }
                placeholder={`Auto: $${calculatedPrice.toLocaleString()}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
          </div>

          {/* Total */}
          <div className="p-4 bg-blue-600 text-white rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">TOTAL ITEM:</span>
              <span className="text-2xl font-bold">
                ${totalPrice.toLocaleString()}
              </span>
            </div>
            {operatorIncluded && (
              <p className="text-sm text-blue-100 mt-1">
                Base: ${(customUnitPrice || calculatedPrice).toLocaleString()} +
                Operario: $
                {(
                  customOperatorCost || calculatedOperatorCost
                ).toLocaleString()}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Agregar Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
