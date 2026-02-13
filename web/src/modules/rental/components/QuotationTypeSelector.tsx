import { Calendar, Briefcase } from "lucide-react";
import type { QuotationType } from "../types/quotation.types";

interface QuotationTypeSelectorProps {
  quotationType: QuotationType;
  onTypeChange: (type: QuotationType) => void;
  estimatedStartDate: string;
  onStartDateChange: (date: string) => void;
  estimatedEndDate: string;
  onEndDateChange: (date: string) => void;
  estimatedDays: number;
  serviceDescription: string;
  onServiceDescriptionChange: (desc: string) => void;
}

export function QuotationTypeSelector({
  quotationType,
  onTypeChange,
  estimatedStartDate,
  onStartDateChange,
  estimatedEndDate,
  onEndDateChange,
  estimatedDays,
  serviceDescription,
  onServiceDescriptionChange,
}: QuotationTypeSelectorProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Tipo de Cotización
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => onTypeChange("time_based")}
          className={`
            p-4 rounded-lg border-2 transition-all
            ${
              quotationType === "time_based"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300 bg-white"
            }
          `}
        >
          <div className="flex items-center gap-3 mb-2">
            <Calendar
              className={`w-5 h-5 ${quotationType === "time_based" ? "text-blue-600" : "text-gray-400"}`}
            />
            <span
              className={`font-medium ${quotationType === "time_based" ? "text-blue-900" : "text-gray-700"}`}
            >
              Por Tiempo Estimado
            </span>
          </div>
          <p className="text-sm text-gray-600 text-left">
            Proyecto con fechas de inicio y fin definidas
          </p>
        </button>

        <button
          type="button"
          onClick={() => onTypeChange("service_based")}
          className={`
            p-4 rounded-lg border-2 transition-all
            ${
              quotationType === "service_based"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300 bg-white"
            }
          `}
        >
          <div className="flex items-center gap-3 mb-2">
            <Briefcase
              className={`w-5 h-5 ${quotationType === "service_based" ? "text-blue-600" : "text-gray-400"}`}
            />
            <span
              className={`font-medium ${quotationType === "service_based" ? "text-blue-900" : "text-gray-700"}`}
            >
              Por Servicio/Trabajo
            </span>
          </div>
          <p className="text-sm text-gray-600 text-left">
            Servicio sin fechas específicas, a demanda
          </p>
        </button>
      </div>

      {/* Conditional fields based on quotation type */}
      {quotationType === "time_based" && (
        <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={estimatedStartDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={estimatedEndDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Días Estimados
              </label>
              <input
                type="number"
                value={estimatedDays}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
          </div>
        </div>
      )}

      {quotationType === "service_based" && (
        <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción del Servicio/Trabajo{" "}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            value={serviceDescription}
            onChange={(e) => onServiceDescriptionChange(e.target.value)}
            placeholder="Describa el servicio o trabajo a realizar, condiciones, lugar, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 placeholder:text-gray-400"
            rows={4}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Mínimo 10 caracteres para cotizaciones por servicio
          </p>
        </div>
      )}
    </div>
  );
}
