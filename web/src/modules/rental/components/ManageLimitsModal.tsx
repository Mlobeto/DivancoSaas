/**
 * MANAGE LIMITS MODAL
 * Gestión de límites de crédito/tiempo de una cuenta.
 *
 * Flujo por rol:
 * - Owner / SuperAdmin / usuario con "accounts:update" → edita directamente
 * - Cualquier otro usuario → solicita aprobación vía sistema de chat (LimitIncreaseRequestModal)
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  ShieldAlert,
  Settings,
  Clock,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import { usePermissions } from "@/core/hooks/usePermissions";
import { accountService } from "../services/account.service";
import { LimitIncreaseRequestModal } from "./LimitIncreaseRequestModal";

interface ManageLimitsModalProps {
  accountId: string;
  clientId: string;
  clientName: string;
  currentCreditLimit: number;
  currentTimeLimit: number;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManageLimitsModal({
  accountId,
  clientId,
  clientName,
  currentCreditLimit,
  currentTimeLimit,
  currency,
  onClose,
  onSuccess,
}: ManageLimitsModalProps) {
  const { hasPermission } = usePermissions();
  const canEditDirectly = hasPermission("accounts:update");

  // Si no tiene permiso directo → mostrar LimitIncreaseRequestModal directamente
  if (!canEditDirectly) {
    return (
      <LimitIncreaseRequestModal
        clientId={clientId}
        clientName={clientName}
        currentBalanceLimit={currentCreditLimit}
        currentTimeLimit={currentTimeLimit}
        currency={currency}
        onClose={onClose}
        onSuccess={() => {
          onClose();
          onSuccess();
        }}
      />
    );
  }

  return (
    <DirectEditModal
      accountId={accountId}
      clientName={clientName}
      currentCreditLimit={currentCreditLimit}
      currentTimeLimit={currentTimeLimit}
      currency={currency}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

// ─── Direct Edit (owner / admin) ─────────────────────────────────────────────

function DirectEditModal({
  accountId,
  clientName,
  currentCreditLimit,
  currentTimeLimit,
  currency,
  onClose,
  onSuccess,
}: Omit<ManageLimitsModalProps, "clientId">) {
  const queryClient = useQueryClient();

  const [creditLimit, setCreditLimit] = useState(currentCreditLimit.toString());
  const [timeLimit, setTimeLimit] = useState(currentTimeLimit.toString());
  const [reason, setReason] = useState("");

  const updateMutation = useMutation({
    mutationFn: () =>
      accountService.updateLimits(accountId, {
        creditLimit: Number(creditLimit),
        timeLimit: Number(timeLimit),
        reason: reason || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({
        queryKey: ["account-by-client"],
      });
      onSuccess();
    },
    onError: (error: any) => {
      alert(
        `Error actualizando límites: ${error?.response?.data?.error?.message || error.message}`,
      );
    },
  });

  const creditChanged = Number(creditLimit) !== currentCreditLimit;
  const timeChanged = Number(timeLimit) !== currentTimeLimit;
  const hasChanges = creditChanged || timeChanged;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) {
      alert("No hay cambios que guardar");
      return;
    }
    if (Number(creditLimit) < 0 || Number(timeLimit) < 0) {
      alert("Los límites no pueden ser negativos");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-lg border border-dark-700 w-full max-w-md">
        {/* Header */}
        <div className="p-5 border-b border-dark-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-400" />
            <div>
              <h2 className="font-bold text-dark-100">Gestionar Límites</h2>
              <p className="text-xs text-dark-400">{clientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-dark-800 rounded transition-colors text-dark-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badge de acceso directo */}
        <div className="px-5 pt-4 flex items-center gap-2 text-xs text-green-300 bg-green-900/20 mx-5 mt-4 rounded-lg p-2 border border-green-800">
          <ShieldAlert className="w-4 h-4 text-green-400 shrink-0" />
          <span>
            Tienes permiso para modificar límites directamente. Los cambios se
            aplican de inmediato.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Crédito */}
          <div>
            <label className="label flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-primary-400" />
              Límite de crédito ({currency})
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="100"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="form-input pr-28"
              />
              {creditChanged && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-yellow-400 font-medium">
                  antes: {currentCreditLimit.toLocaleString("es-CO")}
                </span>
              )}
            </div>
            <p className="text-xs text-dark-500 mt-1">
              Límite actual:{" "}
              <span className="text-dark-300">
                {currentCreditLimit.toLocaleString("es-CO")} {currency}
              </span>
            </p>
          </div>

          {/* Tiempo */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary-400" />
              Límite de tiempo (días)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                className="form-input pr-24"
              />
              {timeChanged && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-yellow-400 font-medium">
                  antes: {currentTimeLimit}d
                </span>
              )}
            </div>
            <p className="text-xs text-dark-500 mt-1">
              Límite actual:{" "}
              <span className="text-dark-300">{currentTimeLimit} días</span>
            </p>
          </div>

          {/* Razón */}
          <div>
            <label className="label">
              Motivo del cambio{" "}
              <span className="text-dark-500">(opcional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Ej: Ampliación por proyecto nuevo, historial de pagos excelente..."
              className="form-input resize-none"
            />
          </div>

          {/* Vista previa de cambios */}
          {hasChanges && (
            <div className="bg-dark-800 rounded-lg p-3 text-xs border border-dark-700">
              <p className="text-dark-400 mb-2 font-medium">
                Resumen de cambios:
              </p>
              {creditChanged && (
                <div className="flex justify-between mb-1">
                  <span className="text-dark-400">Límite de crédito</span>
                  <span>
                    <span className="text-dark-500 line-through mr-1">
                      {currentCreditLimit.toLocaleString("es-CO")}
                    </span>
                    <span className="text-green-400 font-bold">
                      → {Number(creditLimit).toLocaleString("es-CO")} {currency}
                    </span>
                  </span>
                </div>
              )}
              {timeChanged && (
                <div className="flex justify-between">
                  <span className="text-dark-400">Límite de tiempo</span>
                  <span>
                    <span className="text-dark-500 line-through mr-1">
                      {currentTimeLimit}d
                    </span>
                    <span className="text-green-400 font-bold">
                      → {timeLimit}d
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t border-dark-700">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!hasChanges || updateMutation.isPending}
              className="btn-primary disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
