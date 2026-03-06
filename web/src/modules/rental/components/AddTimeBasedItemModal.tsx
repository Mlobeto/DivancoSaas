import { useState, useEffect } from "react";
import { X, Clock, User, Calculator } from "lucide-react";
import type { OperatorCostType } from "../types/quotation.types";
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
  rentalProfile?: AssetRentalProfile;
}

interface AddTimeBasedItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetSearchResult | null;
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
  standbyHours?: number;
  operatorIncluded: boolean;
  operatorCostType?: OperatorCostType;
  customUnitPrice?: number;
  customOperatorCost?: number;
  // Precios calculados automáticamente (para mostrar en la lista)
  calculatedUnitPrice: number;
  calculatedOperatorCost: number;
  // v5.0: Períodos seleccionados para cotizar
  selectedPeriods: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
  };
  // v5.0: Precios calculados por período
  pricePerDay: number;
  pricePerWeek: number;
  pricePerMonth: number;
  operatorCostPerDay: number;
  operatorCostPerWeek: number;
  operatorCostPerMonth: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface PriceBreakdown {
  months: number;
  weeks: number;
  days: number;
  monthlyPrice: number;
  weeklyPrice: number;
  dailyPrice: number;
  total: number;
  dominantPeriod: "daily" | "weekly" | "monthly";
}

/**
 * Precio escalonado para implementos/herramientas:
 *   ≥30 días → meses completos + semanas restantes + días restantes
 *   ≥7 días  → semanas completas + días restantes
 *   <7 días  → días × pricePerDay
 */
function calcTieredPrice(
  totalDays: number,
  pricePerDay: number,
  pricePerWeek: number | null,
  pricePerMonth: number | null,
): PriceBreakdown {
  let remaining = totalDays;

  let months = 0;
  if (pricePerMonth && remaining >= 30) {
    months = Math.floor(remaining / 30);
    remaining -= months * 30;
  }

  let weeks = 0;
  if (pricePerWeek && remaining >= 7) {
    weeks = Math.floor(remaining / 7);
    remaining -= weeks * 7;
  }

  const days = remaining;
  const total =
    months * (pricePerMonth ?? 0) +
    weeks * (pricePerWeek ?? 0) +
    days * pricePerDay;

  const dominantPeriod: PriceBreakdown["dominantPeriod"] =
    months > 0 ? "monthly" : weeks > 0 ? "weekly" : "daily";

  return {
    months,
    weeks,
    days,
    monthlyPrice: pricePerMonth ?? 0,
    weeklyPrice: pricePerWeek ?? 0,
    dailyPrice: pricePerDay,
    total,
    dominantPeriod,
  };
}

const fmt = (n: number) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 0 });

// ─── Component ───────────────────────────────────────────────────────────────

export function AddTimeBasedItemModal({
  isOpen,
  onClose,
  asset,
  estimatedDays,
  onAdd,
}: AddTimeBasedItemModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [standbyHours, setStandbyHours] = useState(8);
  const [operatorIncluded, setOperatorIncluded] = useState(false);
  const [operatorCostType, setOperatorCostType] =
    useState<OperatorCostType>("PER_DAY");
  const [customUnitPrice, setCustomUnitPrice] = useState<number | undefined>();
  const [customOperatorCost, setCustomOperatorCost] = useState<
    number | undefined
  >();

  // v5.0: Períodos seleccionados para cotizar
  const [selectedPeriods, setSelectedPeriods] = useState({
    daily: true,
    weekly: true,
    monthly: true,
  });

  // ── Valores del perfil de alquiler ──────────────────────────────────────
  const getVal = (field: keyof AssetRentalProfile) => {
    const pv = asset?.rentalProfile?.[field];
    const lv = asset?.[field as keyof AssetSearchResult];
    return Number(pv ?? lv ?? 0) || 0;
  };

  const trackingType =
    asset?.rentalProfile?.trackingType ?? asset?.trackingType ?? null;

  const pricePerHour = getVal("pricePerHour");
  const pricePerDay = getVal("pricePerDay");
  const pricePerWeek = getVal("pricePerWeek");
  const pricePerMonth = getVal("pricePerMonth");
  const operatorRate = getVal("operatorCostRate");

  // ── Cálculo de precios por período (v5.0) ────────────────────────────────────
  // Para MACHINERY: precio por día = standbyHours × pricePerHour
  const dailyPrice =
    trackingType === "MACHINERY" ? standbyHours * pricePerHour : pricePerDay;

  // Semana y mes: multiplicar o usar precio configurado
  const weeklyPrice = pricePerWeek > 0 ? pricePerWeek : dailyPrice * 7;
  const monthlyPrice = pricePerMonth > 0 ? pricePerMonth : dailyPrice * 30;

  // Costos de operador por período
  const operatorDailyPrice =
    !operatorIncluded || !operatorRate
      ? 0
      : operatorCostType === "PER_HOUR"
        ? standbyHours * operatorRate
        : operatorRate;
  const operatorWeeklyPrice = operatorDailyPrice * 7;
  const operatorMonthlyPrice = operatorDailyPrice * 30;

  // Legacy: precio total para el período estimado
  const machineryBasePrice =
    trackingType === "MACHINERY"
      ? estimatedDays * standbyHours * pricePerHour
      : 0;

  const tiered: PriceBreakdown | null =
    trackingType !== "MACHINERY" && pricePerDay > 0
      ? calcTieredPrice(
          estimatedDays,
          pricePerDay,
          pricePerWeek > 0 ? pricePerWeek : null,
          pricePerMonth > 0 ? pricePerMonth : null,
        )
      : null;

  const calculatedBasePrice =
    trackingType === "MACHINERY" ? machineryBasePrice : (tiered?.total ?? 0);

  const calculatedOperatorCost = (() => {
    if (!operatorIncluded || !operatorRate) return 0;
    if (operatorCostType === "PER_HOUR")
      return estimatedDays * standbyHours * operatorRate;
    return estimatedDays * operatorRate;
  })();

  // ── Reset al cambiar asset ───────────────────────────────────────────────
  useEffect(() => {
    if (!asset) return;
    const mh = asset.rentalProfile?.minDailyHours ?? asset.minDailyHours;
    const oct = asset.rentalProfile?.operatorCostType ?? asset.operatorCostType;
    setQuantity(1);
    setStandbyHours(Number(mh) || 8);
    setOperatorIncluded(asset.requiresOperator ?? false);
    setOperatorCostType((oct as OperatorCostType) ?? "PER_DAY");
    setCustomUnitPrice(undefined);
    setCustomOperatorCost(undefined);
    setSelectedPeriods({ daily: true, weekly: true, monthly: true });
  }, [asset]);

  if (!isOpen || !asset) return null;

  // Validar que al menos un período esté seleccionado
  const hasSelectedPeriod =
    selectedPeriods.daily || selectedPeriods.weekly || selectedPeriods.monthly;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasSelectedPeriod) {
      alert("Debes seleccionar al menos un período para cotizar");
      return;
    }

    onAdd({
      assetId: asset.id,
      assetName: asset.name,
      assetCode: asset.code,
      trackingType,
      quantity,
      rentalDays: estimatedDays,
      standbyHours: trackingType === "MACHINERY" ? standbyHours : undefined,
      operatorIncluded,
      operatorCostType: operatorIncluded ? operatorCostType : undefined,
      customUnitPrice,
      customOperatorCost,
      calculatedUnitPrice: calculatedBasePrice,
      calculatedOperatorCost: calculatedOperatorCost,
      // v5.0: Períodos seleccionados y precios por período
      selectedPeriods,
      pricePerDay: dailyPrice,
      pricePerWeek: weeklyPrice,
      pricePerMonth: monthlyPrice,
      operatorCostPerDay: operatorDailyPrice,
      operatorCostPerWeek: operatorWeeklyPrice,
      operatorCostPerMonth: operatorMonthlyPrice,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto p-0 space-y-0">
        {/* ── Header ── */}
        <div className="flex items-start justify-between p-5 border-b border-dark-700">
          <div>
            <h2 className="font-semibold text-dark-100 text-base">
              {asset.name}
            </h2>
            <p className="text-xs text-dark-400 mt-0.5">
              {asset.code} ·{" "}
              {trackingType === "MACHINERY"
                ? "Maquinaria"
                : "Implemento / Herramienta"}
            </p>
            <p className="text-xs text-primary-400 mt-1">
              Duración: <strong>{estimatedDays} días</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-dark-400 hover:text-dark-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* ── Cantidad ── */}
          <div className="form-group">
            <label className="form-label">Cantidad</label>
            <input
              type="number"
              min="1"
              className="form-input w-24"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* ── Standby hours – solo MACHINERY ── */}
          {trackingType === "MACHINERY" && (
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary-400" />
                Horas standby garantizadas / día
              </label>
              <input
                type="number"
                min="1"
                max="24"
                className="form-input w-24"
                value={standbyHours}
                onChange={(e) => setStandbyHours(parseInt(e.target.value) || 8)}
              />
              <p className="text-xs text-dark-400 mt-1">
                Mínimo de horas/día que se facturan aunque la máquina esté
                parada
              </p>
            </div>
          )}

          {/* ── Operario ── */}
          <div className="border border-dark-700 rounded-lg p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={operatorIncluded}
                onChange={(e) => setOperatorIncluded(e.target.checked)}
                className="w-4 h-4 rounded accent-primary-500"
              />
              <span className="flex items-center gap-1.5 font-medium text-dark-200 text-sm">
                <User className="w-4 h-4 text-primary-400" />
                Incluir operario en la cotización
              </span>
            </label>

            {operatorIncluded && (
              <div className="space-y-3 pt-1">
                <div className="form-group">
                  <label className="form-label">
                    Modalidad de cobro del operario
                  </label>
                  <select
                    className="form-input"
                    value={operatorCostType}
                    onChange={(e) =>
                      setOperatorCostType(e.target.value as OperatorCostType)
                    }
                  >
                    <option value="PER_DAY">Por día (viáticos fijos)</option>
                    <option value="PER_HOUR">Por hora</option>
                  </select>
                </div>

                <div className="text-sm text-dark-300 bg-dark-800 rounded p-3">
                  <p className="text-xs text-dark-400 mb-1">
                    Tarifa configurada:
                  </p>
                  <div className="flex justify-between items-center">
                    <span>
                      ${fmt(operatorRate)}/
                      {operatorCostType === "PER_HOUR" ? "hora" : "día"}
                    </span>
                    <span className="font-semibold text-primary-300">
                      ${fmt(operatorDailyPrice)}/día
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Opciones de precio por período (v5.0) ── */}
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-medium text-dark-200">
                Selecciona las modalidades a cotizar
              </span>
            </div>

            <p className="text-xs text-dark-400 mb-4">
              Puedes seleccionar una o varias opciones. El cliente verá una
              tabla comparativa.
            </p>

            <div className="space-y-3">
              {/* Opción Diaria */}
              <label className="flex items-start gap-3 p-3 bg-dark-900 rounded-lg border border-dark-700 hover:border-primary-600 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPeriods.daily}
                  onChange={(e) =>
                    setSelectedPeriods((prev) => ({
                      ...prev,
                      daily: e.target.checked,
                    }))
                  }
                  className="mt-1 w-4 h-4 rounded accent-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-primary-300">
                      📅 Por Día
                    </span>
                    <span className="text-lg font-bold text-primary-300">
                      ${fmt(dailyPrice)}
                    </span>
                  </div>
                  {operatorIncluded && (
                    <p className="text-xs text-dark-400">
                      + Operario: ${fmt(operatorDailyPrice)}/día = $
                      {fmt(dailyPrice + operatorDailyPrice)}/día total
                    </p>
                  )}
                  {trackingType === "MACHINERY" && (
                    <p className="text-xs text-dark-400 mt-1">
                      {standbyHours} hrs × ${fmt(pricePerHour)}/hr
                    </p>
                  )}
                </div>
              </label>

              {/* Opción Semanal */}
              <label className="flex items-start gap-3 p-3 bg-dark-900 rounded-lg border border-dark-700 hover:border-primary-600 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPeriods.weekly}
                  onChange={(e) =>
                    setSelectedPeriods((prev) => ({
                      ...prev,
                      weekly: e.target.checked,
                    }))
                  }
                  className="mt-1 w-4 h-4 rounded accent-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-green-300">
                      📆 Por Semana
                    </span>
                    <span className="text-lg font-bold text-green-300">
                      ${fmt(weeklyPrice)}
                    </span>
                  </div>
                  {operatorIncluded && (
                    <p className="text-xs text-dark-400">
                      + Operario: ${fmt(operatorWeeklyPrice)}/sem = $
                      {fmt(weeklyPrice + operatorWeeklyPrice)}/sem total
                    </p>
                  )}
                  {pricePerWeek > 0 ? (
                    <p className="text-xs text-dark-400 mt-1">
                      Precio configurado
                    </p>
                  ) : (
                    <p className="text-xs text-dark-400 mt-1">Diario × 7</p>
                  )}
                </div>
              </label>

              {/* Opción Mensual */}
              <label className="flex items-start gap-3 p-3 bg-dark-900 rounded-lg border border-dark-700 hover:border-primary-600 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPeriods.monthly}
                  onChange={(e) =>
                    setSelectedPeriods((prev) => ({
                      ...prev,
                      monthly: e.target.checked,
                    }))
                  }
                  className="mt-1 w-4 h-4 rounded accent-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-purple-300">
                      📅 Por Mes
                    </span>
                    <span className="text-lg font-bold text-purple-300">
                      ${fmt(monthlyPrice)}
                    </span>
                  </div>
                  {operatorIncluded && (
                    <p className="text-xs text-dark-400">
                      + Operario: ${fmt(operatorMonthlyPrice)}/mes = $
                      {fmt(monthlyPrice + operatorMonthlyPrice)}/mes total
                    </p>
                  )}
                  {pricePerMonth > 0 ? (
                    <p className="text-xs text-dark-400 mt-1">
                      Precio configurado
                    </p>
                  ) : (
                    <p className="text-xs text-dark-400 mt-1">Diario × 30</p>
                  )}
                </div>
              </label>
            </div>

            {!hasSelectedPeriod && (
              <p className="text-xs text-red-400 mt-3">
                ⚠️ Debes seleccionar al menos una modalidad
              </p>
            )}
          </div>

          {/* ── Información de cantidad ── */}
          {quantity > 1 && (
            <div className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-3">
              <p className="text-sm text-blue-300">
                ℹ️ Se agregarán <strong>{quantity} unidades</strong> de este
                activo con las modalidades seleccionadas
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!hasSelectedPeriod}
            >
              Agregar a cotización
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
