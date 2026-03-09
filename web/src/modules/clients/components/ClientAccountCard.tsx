import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Clock, AlertCircle, Plus, DollarSign } from "lucide-react";
import { accountService } from "@/modules/rental/services/account.service";
import type { ClientAccountInfo } from "@/modules/rental/services/account.service";

interface ClientAccountCardProps {
  clientId: string;
}

export function ClientAccountCard({ clientId }: ClientAccountCardProps) {
  const queryClient = useQueryClient();
  const [showReloadModal, setShowReloadModal] = useState(false);
  const [reloadAmount, setReloadAmount] = useState("");
  const [reloadDescription, setReloadDescription] = useState("");
  const [reloadMethod, setReloadMethod] = useState("");
  const [reloadReference, setReloadReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const { data, isLoading, error } = useQuery<ClientAccountInfo>({
    queryKey: ["clientAccount", clientId],
    queryFn: () => accountService.getByClientId(clientId),
    enabled: !!clientId,
  });

  const reloadMutation = useMutation({
    mutationFn: (params: {
      accountId: string;
      amount: number;
      description: string;
      paymentMethod?: string;
      referenceNumber?: string;
      proofFile?: File | null;
    }) =>
      accountService.reloadBalance(params.accountId, {
        amount: params.amount,
        description: params.description,
        paymentMethod: params.paymentMethod,
        referenceNumber: params.referenceNumber,
        proofFile: params.proofFile,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientAccount", clientId] });
      setShowReloadModal(false);
      setReloadAmount("");
      setReloadDescription("");
      setReloadMethod("");
      setReloadReference("");
      setProofFile(null);
    },
  });

  const handleReload = () => {
    if (!data?.accountId || !reloadAmount || !reloadDescription) return;

    reloadMutation.mutate({
      accountId: data.accountId,
      amount: Number(reloadAmount),
      description: reloadDescription,
      paymentMethod: reloadMethod || undefined,
      referenceNumber: reloadReference || undefined,
      proofFile,
    });
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-40">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null; // No mostrar nada si no hay cuenta
  }

  if (!data.hasAccount) {
    return (
      <div className="card bg-dark-800/50 border-dark-700">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-400 mb-1">
              Sin cuenta de alquiler
            </h3>
            <p className="text-xs text-dark-300">
              Este cliente no tiene una cuenta de alquiler configurada. Las
              cuentas se crean automáticamente al generar el primer contrato o
              se pueden configurar al editar el cliente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { balance = 0, creditLimit = 0, timeLimit = 0, activeDays = 0 } = data;
  const balancePercent = creditLimit > 0 ? (balance / creditLimit) * 100 : 0;
  const daysPercent = timeLimit > 0 ? (activeDays / timeLimit) * 100 : 0;

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-primary-300 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Cuenta de Alquiler
          </h2>
          <button
            onClick={() => setShowReloadModal(true)}
            className="btn-sm bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-1 text-xs"
          >
            <Plus className="w-3 h-3" />
            Recargar
          </button>
        </div>

        <div className="space-y-4">
          {/* Saldo disponible */}
          <div>
            <div className="flex items-center justify-between text-xs text-dark-300 mb-1">
              <span>Saldo disponible</span>
              <span>
                {balance.toFixed(2)} / {creditLimit.toFixed(2)}{" "}
                {data.currency || "USD"}
              </span>
            </div>
            <div className="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  balancePercent > 75
                    ? "bg-green-500"
                    : balancePercent > 50
                      ? "bg-yellow-500"
                      : balancePercent > 25
                        ? "bg-orange-500"
                        : "bg-red-500"
                }`}
                style={{
                  width: `${Math.max(0, Math.min(100, balancePercent))}%`,
                }}
              />
            </div>
            <div className="mt-1 text-xs text-dark-400">
              Límite de crédito: {creditLimit.toFixed(2)}{" "}
              {data.currency || "USD"}
            </div>
          </div>

          {/* Días activos */}
          <div>
            <div className="flex items-center justify-between text-xs text-dark-300 mb-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Días activos
              </span>
              <span>
                {activeDays} / {timeLimit} días
              </span>
            </div>
            <div className="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  daysPercent < 50
                    ? "bg-green-500"
                    : daysPercent < 75
                      ? "bg-yellow-500"
                      : daysPercent < 90
                        ? "bg-orange-500"
                        : "bg-red-500"
                }`}
                style={{ width: `${Math.max(0, Math.min(100, daysPercent))}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-dark-400">
              Límite de tiempo: {timeLimit} días
            </div>
          </div>

          {/* Estadísticas adicionales */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-dark-700">
            <div>
              <div className="text-xs text-dark-400">Total consumido</div>
              <div className="text-sm font-semibold text-dark-100">
                {(data.totalConsumed || 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-dark-400">Total recargado</div>
              <div className="text-sm font-semibold text-dark-100">
                {(data.totalReloaded || 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-dark-400">Contratos activos</div>
              <div className="text-sm font-semibold text-dark-100">
                {data.activeContracts || 0}
              </div>
            </div>
            <div>
              <div className="text-xs text-dark-400">Rentals activos</div>
              <div className="text-sm font-semibold text-dark-100">
                {data.activeRentals || 0}
              </div>
            </div>
          </div>

          {/* Alerta de saldo bajo */}
          {data.alertTriggered && (
            <div className="bg-red-900/20 border border-red-800 rounded p-2 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-300">
                <strong>Saldo bajo:</strong> El saldo ha caidopor debajo del
                monto de alerta ({(data.alertAmount || 0).toFixed(2)}{" "}
                {data.currency || "USD"})
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de recarga */}
      {showReloadModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary-400" />
                Recargar Saldo
              </h3>
              <button
                onClick={() => setShowReloadModal(false)}
                className="text-dark-400 hover:text-dark-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Monto a recargar *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  min="0"
                  step="1000"
                  value={reloadAmount}
                  onChange={(e) => setReloadAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Pago recibido en efectivo"
                  value={reloadDescription}
                  onChange={(e) => setReloadDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Método de pago</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Transferencia, Efectivo, Cheque"
                  value={reloadMethod}
                  onChange={(e) => setReloadMethod(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Número de referencia</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: TXN-12345"
                  value={reloadReference}
                  onChange={(e) => setReloadReference(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Comprobante de pago
                  <span className="text-xs text-dark-400 ml-2">(opcional)</span>
                </label>
                <input
                  type="file"
                  className="form-input"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setProofFile(file || null);
                  }}
                />
                <p className="text-xs text-dark-400 mt-1">
                  Sube el comprobante de transferencia o pago (imágenes o PDF,
                  máx 5MB)
                </p>
                {proofFile && (
                  <p className="text-xs text-primary-400 mt-1">
                    ✓ {proofFile.name}
                  </p>
                )}
              </div>

              {reloadMutation.error && (
                <div className="bg-red-900/20 border border-red-800 rounded p-3 text-sm text-red-300">
                  Error:{" "}
                  {reloadMutation.error instanceof Error
                    ? reloadMutation.error.message
                    : "Error desconocido"}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => setShowReloadModal(false)}
                  className="btn-ghost"
                  disabled={reloadMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleReload}
                  className="btn-primary"
                  disabled={
                    reloadMutation.isPending ||
                    !reloadAmount ||
                    !reloadDescription
                  }
                >
                  {reloadMutation.isPending
                    ? "Recargando..."
                    : "Recargar saldo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
