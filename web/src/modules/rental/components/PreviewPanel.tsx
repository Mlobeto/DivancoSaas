import { FileText, Calendar, User, DollarSign } from "lucide-react";
import type { QuotationType } from "../types/quotation.types";

interface PreviewPanelProps {
  quotationType: QuotationType;
  clientName?: string;
  estimatedStartDate?: string;
  estimatedEndDate?: string;
  estimatedDays?: number;
  serviceDescription?: string;
  items: any[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  businessUnitName?: string;
}

export function PreviewPanel({
  quotationType,
  clientName,
  estimatedStartDate,
  estimatedEndDate,
  estimatedDays,
  serviceDescription,
  items,
  subtotal,
  taxRate,
  taxAmount,
  total,
  businessUnitName = "DivancoSaas",
}: PreviewPanelProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "---";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="sticky top-4 bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">COTIZACIÓN</h2>
            <p className="text-sm text-blue-100">Preview en Tiempo Real</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
        {/* Business Unit */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {businessUnitName}
          </h3>
          <p className="text-sm text-gray-500">Sistema de Cotizaciones v4.0</p>
        </div>

        {/* Client */}
        {clientName && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <User className="w-4 h-4" />
              <span>Cliente</span>
            </div>
            <p className="font-semibold text-gray-900">{clientName}</p>
          </div>
        )}

        {/* Quotation Type Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                quotationType === "time_based"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {quotationType === "time_based"
                ? "⏱️ Por Tiempo"
                : "🛠️ Por Trabajo"}
            </div>
          </div>

          {quotationType === "time_based" &&
            estimatedStartDate &&
            estimatedEndDate && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Período Estimado</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-gray-500">Inicio</span>
                    <p className="font-medium text-gray-900">
                      {formatDate(estimatedStartDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Fin</span>
                    <p className="font-medium text-gray-900">
                      {formatDate(estimatedEndDate)}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Duración</span>
                  <p className="font-bold text-lg text-blue-600">
                    {estimatedDays || 0} días
                  </p>
                </div>
              </div>
            )}

          {quotationType === "service_based" && serviceDescription && (
            <div className="text-sm">
              <span className="text-xs text-gray-500">
                Descripción del Servicio
              </span>
              <p className="mt-1 text-gray-900">{serviceDescription}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            Items ({items.length})
          </h3>

          {items.length === 0 ? (
            <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">
                No hay items agregados aún
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Agrega items para ver el preview
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {item.assetName || item.description}
                      </h4>
                      {item.assetCode && (
                        <p className="text-xs text-gray-500">
                          {item.assetCode}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        $
                        {(
                          (item.customUnitPrice ||
                            item.calculatedUnitPrice ||
                            0) +
                          (item.customOperatorCost ||
                            item.calculatedOperatorCost ||
                            0)
                        ).toLocaleString()}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-gray-500">
                          × {item.quantity}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Item details */}
                  <div className="text-xs text-gray-600 space-y-1">
                    {quotationType === "time_based" && item.rentalDays > 0 && (
                      <p>📅 {item.rentalDays} días</p>
                    )}
                    {item.standbyHours && (
                      <p>⏰ Standby: {item.standbyHours} hrs/día</p>
                    )}
                    {item.operatorIncluded && <p>👤 Incluye operario</p>}
                    {item.detailedDescription && (
                      <p className="text-gray-700 mt-2 italic">
                        {item.detailedDescription}
                      </p>
                    )}
                    {item.milestones && item.milestones.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="font-semibold text-gray-700">
                          Hitos de Pago:
                        </p>
                        {item.milestones.map((m: any, i: number) => (
                          <p key={i} className="pl-2">
                            • {m.name}: {m.percentage}% ($
                            {m.amount.toLocaleString()})
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        {items.length > 0 && (
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-medium">
                  ${subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>IVA ({taxRate}%):</span>
                <span className="font-medium">
                  ${taxAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-lg font-bold text-gray-900">
                    TOTAL:
                  </span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  ${total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 text-center">
        <p className="text-xs text-gray-500">
          Preview generado automáticamente • No es el PDF final
        </p>
      </div>
    </div>
  );
}
