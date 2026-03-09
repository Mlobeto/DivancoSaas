/**
 * LIMIT INCREASE REQUEST MODAL
 * Modal para solicitar aumento de límite de crédito
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  X,
  TrendingUp,
  DollarSign,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { limitRequestService } from "../services/limit-request.service";
import type { CreateLimitRequestDTO } from "../services/limit-request.service";

interface LimitIncreaseRequestModalProps {
  clientId: string;
  clientName: string;
  currentBalanceLimit: number;
  currentTimeLimit: number;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function LimitIncreaseRequestModal({
  clientId,
  clientName,
  currentBalanceLimit,
  currentTimeLimit,
  currency,
  onClose,
  onSuccess,
}: LimitIncreaseRequestModalProps) {
  const [requestedBalanceLimit, setRequestedBalanceLimit] = useState(
    currentBalanceLimit * 1.5,
  );
  const [requestedTimeLimit, setRequestedTimeLimit] = useState(
    currentTimeLimit + 15,
  );
  const [reason, setReason] = useState("");

  const createMutation = useMutation({
    mutationFn: (data: CreateLimitRequestDTO) =>
      limitRequestService.create(data),
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      alert(
        `Error creando solicitud: ${error.response?.data?.error?.message || error.message}`,
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      alert("Debes proporcionar una justificación para la solicitud");
      return;
    }

    if (
      requestedBalanceLimit <= currentBalanceLimit &&
      requestedTimeLimit <= currentTimeLimit
    ) {
      alert("Los nuevos límites deben ser mayores a los actuales");
      return;
    }

    createMutation.mutate({
      clientId,
      currentBalanceLimit,
      currentTimeLimit,
      requestedBalanceLimit,
      requestedTimeLimit,
      reason,
    });
  };

  const balanceIncrease = requestedBalanceLimit - currentBalanceLimit;
  const timeIncrease = requestedTimeLimit - currentTimeLimit;
  const balanceIncreasePercent = (
    (balanceIncrease / currentBalanceLimit) *
    100
  ).toFixed(1);
  const timeIncreasePercent = ((timeIncrease / currentTimeLimit) * 100).toFixed(
    1,
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-lg border border-dark-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-dark-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary-400" />
              Solicitar Aumento de Límite
            </h2>
            <p className="text-sm text-dark-400 mt-1">
              Cliente:{" "}
              <span className="font-medium text-white">{clientName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto flex-1 space-y-6"
        >
          {/* Current Limits */}
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            <h3 className="font-medium mb-3 text-dark-300">Límites Actuales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-dark-400 mb-1">Saldo Máximo</div>
                <div className="text-lg font-bold flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  {currentBalanceLimit.toLocaleString()} {currency}
                </div>
              </div>
              <div>
                <div className="text-xs text-dark-400 mb-1">
                  Días Activos Máximos
                </div>
                <div className="text-lg font-bold flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  {currentTimeLimit} días
                </div>
              </div>
            </div>
          </div>

          {/* Requested Limits */}
          <div className="space-y-4">
            <h3 className="font-medium text-dark-300">
              Nuevos Límites Solicitados
            </h3>

            <div>
              <label className="label">Saldo Máximo ({currency}) *</label>
              <input
                type="number"
                value={requestedBalanceLimit}
                onChange={(e) =>
                  setRequestedBalanceLimit(parseFloat(e.target.value) || 0)
                }
                min={currentBalanceLimit}
                step="1000"
                className="form-input"
                required
              />
              {balanceIncrease > 0 && (
                <p className="text-xs text-green-400 mt-1">
                  +{balanceIncrease.toLocaleString()} {currency} (
                  {balanceIncreasePercent}% de aumento)
                </p>
              )}
            </div>

            <div>
              <label className="label">Días Activos Máximos *</label>
              <input
                type="number"
                value={requestedTimeLimit}
                onChange={(e) =>
                  setRequestedTimeLimit(parseInt(e.target.value) || 0)
                }
                min={currentTimeLimit}
                step="1"
                className="form-input"
                required
              />
              {timeIncrease > 0 && (
                <p className="text-xs text-green-400 mt-1">
                  +{timeIncrease} días ({timeIncreasePercent}% de aumento)
                </p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="label flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Justificación *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explica por qué este cliente necesita un aumento de límite..."
              className="form-input min-h-[120px] resize-y"
              required
            />
            <p className="text-xs text-dark-400 mt-1">
              Esta solicitud se enviará a los administradores para su revisión.
              Proporciona detalles que justifiquen el aumento.
            </p>
          </div>

          {/* Summary */}
          <div className="bg-primary-900/20 border border-primary-700/30 rounded-lg p-4">
            <h4 className="font-medium text-primary-400 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Resumen
            </h4>
            <ul className="space-y-1 text-sm">
              <li className="flex justify-between">
                <span className="text-dark-400">Aumento de saldo:</span>
                <span className="font-medium text-green-400">
                  +{balanceIncrease.toLocaleString()} {currency}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-dark-400">Aumento de días:</span>
                <span className="font-medium text-blue-400">
                  +{timeIncrease} días
                </span>
              </li>
            </ul>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-dark-700 flex items-center justify-between">
          <p className="text-xs text-dark-400">
            Los administradores recibirán una notificación de tu solicitud
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={createMutation.isPending}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !reason.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? (
                "Enviando..."
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  Enviar Solicitud
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
