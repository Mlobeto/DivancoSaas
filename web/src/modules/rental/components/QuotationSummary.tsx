import { Calculator, DollarSign } from "lucide-react";

interface QuotationSummaryProps {
  subtotal: number;
  taxRate: number;
  onTaxRateChange: (rate: number) => void;
  taxAmount: number;
  total: number;
}

export function QuotationSummary({
  subtotal,
  taxRate,
  onTaxRateChange,
  taxAmount,
  total,
}: QuotationSummaryProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200/50 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Resumen de Cotización
        </h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Subtotal:</span>
          <span className="font-mono text-lg font-medium text-gray-900">
            ${subtotal.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-700">IVA:</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={taxRate}
              onChange={(e) => onTaxRateChange(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
            <span className="text-gray-600 text-sm">%</span>
          </div>
          <span className="font-mono text-lg font-medium text-gray-900">
            ${taxAmount.toLocaleString()}
          </span>
        </div>

        <div className="pt-3 border-t-2 border-blue-300 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Total:</span>
          </div>
          <span className="font-mono text-2xl font-bold text-blue-600">
            ${total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
