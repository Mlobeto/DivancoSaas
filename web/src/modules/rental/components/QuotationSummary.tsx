import { Calculator, DollarSign } from "lucide-react";
import type { QuotationItem } from "../hooks/useQuotationForm";

interface QuotationSummaryProps {
  items: QuotationItem[];
  taxRate: number;
  onTaxRateChange: (rate: number) => void;
}

export function QuotationSummary({
  items,
  taxRate,
  onTaxRateChange,
}: QuotationSummaryProps) {
  // Calcular totales por modalidad (v5.0)
  const calculateTotals = () => {
    let dailySubtotal = 0;
    let weeklySubtotal = 0;
    let monthlySubtotal = 0;

    items.forEach((item) => {
      if (item.selectedPeriods) {
        const qty = item.quantity;

        if (item.selectedPeriods.daily) {
          const dailyPrice =
            (item.pricePerDay || 0) +
            (item.operatorIncluded ? item.operatorCostPerDay || 0 : 0);
          dailySubtotal += dailyPrice * qty;
        }

        if (item.selectedPeriods.weekly) {
          const weeklyPrice =
            (item.pricePerWeek || 0) +
            (item.operatorIncluded ? item.operatorCostPerWeek || 0 : 0);
          weeklySubtotal += weeklyPrice * qty;
        }

        if (item.selectedPeriods.monthly) {
          const monthlyPrice =
            (item.pricePerMonth || 0) +
            (item.operatorIncluded ? item.operatorCostPerMonth || 0 : 0);
          monthlySubtotal += monthlyPrice * qty;
        }
      } else {
        // Fallback: usar precio legacy
        const legacyPrice =
          ((item.calculatedUnitPrice || 0) +
            (item.calculatedOperatorCost || 0)) *
          item.quantity;
        dailySubtotal += legacyPrice;
        weeklySubtotal += legacyPrice;
        monthlySubtotal += legacyPrice;
      }
    });

    const taxMultiplier = 1 + taxRate / 100;

    return {
      daily: {
        subtotal: dailySubtotal,
        tax: dailySubtotal * (taxRate / 100),
        total: dailySubtotal * taxMultiplier,
        hasItems: items.some((item) => item.selectedPeriods?.daily),
      },
      weekly: {
        subtotal: weeklySubtotal,
        tax: weeklySubtotal * (taxRate / 100),
        total: weeklySubtotal * taxMultiplier,
        hasItems: items.some((item) => item.selectedPeriods?.weekly),
      },
      monthly: {
        subtotal: monthlySubtotal,
        tax: monthlySubtotal * (taxRate / 100),
        total: monthlySubtotal * taxMultiplier,
        hasItems: items.some((item) => item.selectedPeriods?.monthly),
      },
    };
  };

  const totals = calculateTotals();
  const hasAnyTotal =
    totals.daily.hasItems || totals.weekly.hasItems || totals.monthly.hasItems;

  if (!hasAnyTotal) {
    return null; // No mostrar si no hay items
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200/50 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Resumen de Cotización - Opciones de Precios
        </h3>
      </div>

      {/* Configuración de IVA */}
      <div className="flex items-center gap-3 mb-6 p-3 bg-white rounded-lg border border-gray-200">
        <span className="text-sm font-medium text-gray-700">Tasa de IVA:</span>
        <input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={taxRate}
          onChange={(e) => onTaxRateChange(parseFloat(e.target.value) || 0)}
          className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        />
        <span className="text-sm text-gray-600">%</span>
      </div>

      {/* Grid de opciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Opción Diaria */}
        {totals.daily.hasItems && (
          <div className="bg-white rounded-lg border-2 border-blue-300 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📅</span>
              <h4 className="font-bold text-blue-700">Por Día</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-mono text-gray-900">
                  ${totals.daily.subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IVA ({taxRate}%):</span>
                <span className="font-mono text-gray-900">
                  ${totals.daily.tax.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-blue-200">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-gray-900">Total:</span>
                </div>
                <span className="font-mono text-xl font-bold text-blue-600">
                  ${totals.daily.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Opción Semanal */}
        {totals.weekly.hasItems && (
          <div className="bg-white rounded-lg border-2 border-green-300 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📆</span>
              <h4 className="font-bold text-green-700">Por Semana</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-mono text-gray-900">
                  ${totals.weekly.subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IVA ({taxRate}%):</span>
                <span className="font-mono text-gray-900">
                  ${totals.weekly.tax.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-green-200">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-bold text-gray-900">Total:</span>
                </div>
                <span className="font-mono text-xl font-bold text-green-600">
                  ${totals.weekly.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Opción Mensual */}
        {totals.monthly.hasItems && (
          <div className="bg-white rounded-lg border-2 border-purple-300 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📅</span>
              <h4 className="font-bold text-purple-700">Por Mes</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-mono text-gray-900">
                  ${totals.monthly.subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IVA ({taxRate}%):</span>
                <span className="font-mono text-gray-900">
                  ${totals.monthly.tax.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-purple-200">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-gray-900">Total:</span>
                </div>
                <span className="font-mono text-xl font-bold text-purple-600">
                  ${totals.monthly.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        El cliente verá estas opciones y podrá elegir la que mejor se ajuste a
        su presupuesto
      </p>
    </div>
  );
}
