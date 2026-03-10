/**
 * DELIVERY AVAILABILITY CHECK
 * Componente visual para mostrar validación de disponibilidad antes de entregas
 */

import {
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  FileSignature,
  CreditCard,
} from "lucide-react";

export interface AvailabilityResult {
  canDeliver: boolean;
  currentBalance: number;
  estimatedCost: number;
  estimatedDays?: number;
  remainingBalance: number;
  creditLimit?: number;
  currentActiveDays?: number;
  remainingDays?: number;
  timeLimit?: number;
  error?: string;
  errorCode?: string;
  shortfall?: number;
  options?: string[];
  // UI-specific (passed from parent)
  currency?: string;
  // Contract validation states (NEW)
  contractSigned?: boolean;
  paymentVerified?: boolean;
  signatureStatus?: string;
}

interface DeliveryAvailabilityCheckProps {
  result: AvailabilityResult;
  onReloadBalance?: () => void;
  onRequestLimitIncrease?: () => void;
}

export function DeliveryAvailabilityCheck({
  result,
  onReloadBalance,
  onRequestLimitIncrease,
}: DeliveryAvailabilityCheckProps) {
  const {
    canDeliver,
    currentBalance,
    estimatedCost,
    remainingBalance,
    currentActiveDays,
    timeLimit,
    remainingDays,
    errorCode,
    error: errorMessage,
    currency = "USD",
    contractSigned = false,
    paymentVerified = false,
    signatureStatus,
  } = result;

  const formatCurrency = (value: number) => {
    return `${currency} $${value.toLocaleString("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getBalanceColor = () => {
    if (!canDeliver) return "text-red-400";
    const percentage = (remainingBalance / currentBalance) * 100;
    if (percentage < 20) return "text-orange-400";
    if (percentage < 50) return "text-yellow-400";
    return "text-green-400";
  };

  const getDaysColor = () => {
    if (!timeLimit || !remainingDays) return "text-dark-400";
    const percentage = (remainingDays / timeLimit) * 100;
    if (percentage < 20) return "text-red-400";
    if (percentage < 50) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      <div className="flex items-center justify-center">
        {canDeliver ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-900/30 border border-green-700 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Disponibilidad Confirmada</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-900/30 border border-red-700 text-red-400">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Entrega No Disponible</span>
          </div>
        )}
      </div>

      {/* Contract Requirements Status */}
      <div className="card bg-dark-800">
        <h4 className="font-medium mb-3 text-dark-300">
          Requisitos del Contrato
        </h4>
        <div className="space-y-3">
          {/* Firma Digital */}
          <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
            <div className="flex items-center gap-3">
              <FileSignature
                className={`w-5 h-5 ${contractSigned ? "text-green-400" : "text-orange-400"}`}
              />
              <div>
                <div className="font-medium text-sm">Firma Digital</div>
                <div className="text-xs text-dark-400">
                  {contractSigned
                    ? "Contrato firmado"
                    : `Estado: ${signatureStatus || "pendiente"}`}
                </div>
              </div>
            </div>
            {contractSigned ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-orange-400" />
            )}
          </div>

          {/* Pago Verificado */}
          <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard
                className={`w-5 h-5 ${paymentVerified ? "text-green-400" : "text-orange-400"}`}
              />
              <div>
                <div className="font-medium text-sm">Pago Certificado</div>
                <div className="text-xs text-dark-400">
                  {paymentVerified
                    ? "Verificado por staff"
                    : "Pendiente de verificación"}
                </div>
              </div>
            </div>
            {paymentVerified ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-orange-400" />
            )}
          </div>
        </div>

        {/* Warning if requirements not met */}
        {(!contractSigned || !paymentVerified) && (
          <div className="mt-3 p-3 bg-orange-900/20 border border-orange-700 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5" />
              <div className="text-xs text-orange-300">
                {!contractSigned && !paymentVerified && (
                  <span>
                    El contrato debe estar <strong>firmado</strong> y el pago{" "}
                    <strong>verificado</strong> antes de crear entregas.
                  </span>
                )}
                {!contractSigned && paymentVerified && (
                  <span>
                    El contrato debe estar <strong>firmado</strong> antes de
                    crear entregas.
                  </span>
                )}
                {contractSigned && !paymentVerified && (
                  <span>
                    El pago debe ser <strong>verificado por staff</strong> antes
                    de crear entregas.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {!canDeliver && errorMessage && (
        <div className="p-4 rounded-lg bg-red-900/20 border border-red-700 text-red-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <div className="font-medium mb-1">Error de Validación</div>
              <div className="text-sm text-red-400">{errorMessage}</div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Information */}
      <div className="card bg-dark-800">
        <div className="space-y-4">
          {/* Current Balance */}
          <div className="flex justify-between items-center">
            <span className="text-dark-400">Saldo Actual:</span>
            <span className="font-bold text-lg">
              {formatCurrency(currentBalance)}
            </span>
          </div>

          {/* Estimated Cost */}
          <div className="flex justify-between items-center">
            <span className="text-dark-400">Costo Estimado:</span>
            <span className="font-bold text-lg text-orange-400">
              - {formatCurrency(estimatedCost)}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-dark-700"></div>

          {/* Remaining Balance */}
          <div className="flex justify-between items-center">
            <span className="text-dark-400 font-medium">Saldo Restante:</span>
            <span className={`font-bold text-xl ${getBalanceColor()}`}>
              {formatCurrency(remainingBalance)}
            </span>
          </div>

          {/* Balance Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-dark-500">
              <span>Balance consumido</span>
              <span>
                {currentBalance > 0
                  ? Math.round(
                      ((currentBalance - remainingBalance) / currentBalance) *
                        100,
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  remainingBalance < 0
                    ? "bg-red-500"
                    : remainingBalance < currentBalance * 0.2
                      ? "bg-orange-500"
                      : "bg-primary-500"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      ((currentBalance - remainingBalance) / currentBalance) *
                        100,
                    ),
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Days Information (if applicable) */}
      {timeLimit && (
        <div className="card bg-dark-800">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-dark-400">Días Usados:</span>
              <span className="font-bold">{currentActiveDays ?? 0} días</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-dark-400">Límite de Días:</span>
              <span className="font-bold">{timeLimit} días</span>
            </div>

            <div className="border-t border-dark-700"></div>

            <div className="flex justify-between items-center">
              <span className="text-dark-400 font-medium">
                Días Disponibles:
              </span>
              <span className={`font-bold text-xl ${getDaysColor()}`}>
                {remainingDays ?? 0} días
              </span>
            </div>

            {/* Days Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-dark-500">
                <span>Días consumidos</span>
                <span>
                  {timeLimit > 0
                    ? Math.round(((currentActiveDays ?? 0) / timeLimit) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    (remainingDays ?? 0) <= 0
                      ? "bg-red-500"
                      : (remainingDays ?? 0) < timeLimit * 0.2
                        ? "bg-orange-500"
                        : "bg-cyan-500"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(0, ((currentActiveDays ?? 0) / timeLimit) * 100))}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!canDeliver &&
        (errorCode === "INSUFFICIENT_BALANCE" ||
          errorCode === "TIME_LIMIT_EXCEEDED") && (
          <div className="flex gap-3">
            {errorCode === "INSUFFICIENT_BALANCE" && onReloadBalance && (
              <button
                onClick={onReloadBalance}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Recargar Saldo
              </button>
            )}
            {onRequestLimitIncrease && (
              <button
                onClick={onRequestLimitIncrease}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Solicitar Aumento
              </button>
            )}
          </div>
        )}
    </div>
  );
}
