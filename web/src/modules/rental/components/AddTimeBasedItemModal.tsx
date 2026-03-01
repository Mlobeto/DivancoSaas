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
  rentalPeriodType: "hourly" | "daily" | "weekly" | "monthly";
  standbyHours?: number;
  operatorIncluded: boolean;
  operatorCostType?: OperatorCostType;
  customUnitPrice?: number;
  customOperatorCost?: number;
  // Precios calculados automáticamente (para mostrar en la lista)
  calculatedUnitPrice: number;
  calculatedOperatorCost: number;
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
  estimatedStartDate,
  estimatedEndDate,
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
  const pricePerWeek = getVal("pricePerWeek") || null;
  const pricePerMonth = getVal("pricePerMonth") || null;
  const operatorRate = getVal("operatorCostRate");

  // ── Precio calculado automáticamente ────────────────────────────────────
  const machineryBasePrice =
    trackingType === "MACHINERY"
      ? estimatedDays * standbyHours * pricePerHour
      : 0;

  const tiered: PriceBreakdown | null =
    trackingType !== "MACHINERY" && pricePerDay > 0
      ? calcTieredPrice(estimatedDays, pricePerDay, pricePerWeek, pricePerMonth)
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
  }, [asset]);

  if (!isOpen || !asset) return null;

  const effectiveBase = customUnitPrice ?? calculatedBasePrice;
  const effectiveOp = customOperatorCost ?? calculatedOperatorCost;
  const totalItem = (effectiveBase + effectiveOp) * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rentalPeriodType: TimeBasedItemData["rentalPeriodType"] =
      trackingType === "MACHINERY"
        ? "hourly"
        : (tiered?.dominantPeriod ?? "daily");

    onAdd({
      assetId: asset.id,
      assetName: asset.name,
      assetCode: asset.code,
      trackingType,
      quantity,
      rentalDays: estimatedDays,
      startDate: estimatedStartDate,
      endDate: estimatedEndDate,
      rentalPeriodType,
      standbyHours: trackingType === "MACHINERY" ? standbyHours : undefined,
      operatorIncluded,
      operatorCostType: operatorIncluded ? operatorCostType : undefined,
      customUnitPrice,
      customOperatorCost,
      calculatedUnitPrice: calculatedBasePrice,
      calculatedOperatorCost: calculatedOperatorCost,
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
              {estimatedStartDate} → {estimatedEndDate} ·{" "}
              <strong>{estimatedDays} días</strong>
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

          {/* ── Desglose de precio calculado ── */}
          <div className="bg-dark-800 rounded-lg p-4 space-y-2 border border-dark-700">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-medium text-dark-200">
                Precio calculado automáticamente
              </span>
            </div>

            {trackingType === "MACHINERY" ? (
              <div className="flex justify-between text-sm text-dark-300">
                <span>
                  {estimatedDays} días × {standbyHours} hrs × $
                  {fmt(pricePerHour)}/hr
                </span>
                <span className="font-semibold text-primary-300">
                  ${fmt(machineryBasePrice)}
                </span>
              </div>
            ) : tiered ? (
              <div className="text-sm text-dark-300 space-y-1">
                {tiered.months > 0 && (
                  <div className="flex justify-between">
                    <span>
                      {tiered.months} {tiered.months === 1 ? "mes" : "meses"} ×
                      ${fmt(tiered.monthlyPrice)}
                    </span>
                    <span className="font-semibold">
                      ${fmt(tiered.months * tiered.monthlyPrice)}
                    </span>
                  </div>
                )}
                {tiered.weeks > 0 && (
                  <div className="flex justify-between">
                    <span>
                      {tiered.weeks} {tiered.weeks === 1 ? "semana" : "semanas"}{" "}
                      × ${fmt(tiered.weeklyPrice)}
                    </span>
                    <span className="font-semibold">
                      ${fmt(tiered.weeks * tiered.weeklyPrice)}
                    </span>
                  </div>
                )}
                {tiered.days > 0 && (
                  <div className="flex justify-between">
                    <span>
                      {tiered.days} {tiered.days === 1 ? "día" : "días"} × $
                      {fmt(tiered.dailyPrice)}
                    </span>
                    <span className="font-semibold">
                      ${fmt(tiered.days * tiered.dailyPrice)}
                    </span>
                  </div>
                )}
                <div className="border-t border-dark-600 pt-1 flex justify-between font-semibold text-primary-300">
                  <span>Subtotal implemento</span>
                  <span>${fmt(tiered.total)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-dark-400">
                Sin precio configurado en el perfil de alquiler
              </p>
            )}
          </div>

          {/* ── Precio personalizado ── */}
          <div className="form-group">
            <label className="form-label">
              Precio personalizado (opcional)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              className="form-input"
              value={customUnitPrice ?? ""}
              onChange={(e) =>
                setCustomUnitPrice(
                  e.target.value ? parseFloat(e.target.value) : undefined,
                )
              }
              placeholder={`Auto: $${fmt(calculatedBasePrice)}`}
            />
            <p className="text-xs text-dark-400 mt-1">
              Completar solo si desea sobreescribir el precio calculado
            </p>
          </div>

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
                Incluir operario
              </span>
            </label>

            {operatorIncluded && (
              <div className="space-y-3 pt-1">
                <div className="form-group">
                  <label className="form-label">Modalidad de cobro</label>
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

                <div className="text-sm text-dark-300 bg-dark-800 rounded p-3 space-y-1">
                  <div className="flex justify-between">
                    <span>
                      Tarifa: ${fmt(operatorRate)}/
                      {operatorCostType === "PER_HOUR" ? "hr" : "día"}
                    </span>
                    <span className="font-semibold text-primary-300">
                      ${fmt(calculatedOperatorCost)}
                    </span>
                  </div>
                  {operatorCostType === "PER_HOUR" && (
                    <p className="text-xs text-dark-400">
                      {estimatedDays} días × {standbyHours} hrs
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Costo operario personalizado (opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    className="form-input"
                    value={customOperatorCost ?? ""}
                    onChange={(e) =>
                      setCustomOperatorCost(
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                    placeholder={`Auto: $${fmt(calculatedOperatorCost)}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Total ── */}
          <div className="bg-primary-900/30 border border-primary-700/40 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-dark-200 font-medium">
                TOTAL ÍTEM
                {quantity > 1 && (
                  <span className="text-xs text-dark-400 ml-1">
                    ({quantity} × ${fmt(effectiveBase + effectiveOp)})
                  </span>
                )}
              </span>
              <span className="text-xl font-bold text-primary-300">
                ${fmt(totalItem)}
              </span>
            </div>
            {operatorIncluded && (
              <p className="text-xs text-dark-400 mt-1">
                Implemento: ${fmt(effectiveBase)} · Operario: $
                {fmt(effectiveOp * quantity)}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Agregar a cotización
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
