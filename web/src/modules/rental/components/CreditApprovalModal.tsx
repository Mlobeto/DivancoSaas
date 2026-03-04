import { useEffect, useMemo, useState } from "react";
import { Quotation } from "../types/quotation.types";
import { ThumbsUp, X } from "lucide-react";

export interface CreditApprovalPayload {
  creditLimitAmount: number;
  creditLimitDays: number;
  requiresOwnerApprovalOnExceed?: boolean;
  isActive?: boolean;
  notes?: string;
  justification: string;
}

interface CreditApprovalModalProps {
  isOpen: boolean;
  quotation: Quotation | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (payload: CreditApprovalPayload) => void;
}

export function CreditApprovalModal({
  isOpen,
  quotation,
  isSubmitting = false,
  onClose,
  onConfirm,
}: CreditApprovalModalProps) {
  const creditValidation = useMemo(
    () => quotation?.metadata?.creditValidation || {},
    [quotation],
  );

  const defaultAmount =
    Number(creditValidation.amountLimit) > 0
      ? Number(creditValidation.amountLimit)
      : Number(creditValidation.projectedAmount || quotation?.totalAmount || 0);

  const defaultDays =
    Number(creditValidation.daysLimit) > 0
      ? Number(creditValidation.daysLimit)
      : Number(creditValidation.projectedDays || quotation?.estimatedDays || 0);

  const [creditLimitAmount, setCreditLimitAmount] = useState<string>("");
  const [creditLimitDays, setCreditLimitDays] = useState<string>("");
  const [justification, setJustification] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [requiresOwnerApprovalOnExceed, setRequiresOwnerApprovalOnExceed] =
    useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || !quotation) return;

    setCreditLimitAmount(String(defaultAmount));
    setCreditLimitDays(String(defaultDays));
    setJustification("Aprobación con ajuste de límite de crédito");
    setNotes("");
    setRequiresOwnerApprovalOnExceed(true);
  }, [isOpen, quotation, defaultAmount, defaultDays]);

  if (!isOpen || !quotation) return null;

  const handleConfirm = () => {
    const parsedAmount = Number(creditLimitAmount);
    const parsedDays = Number(creditLimitDays);
    const cleanJustification = justification.trim();

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      alert("❌ El monto debe ser un número válido mayor o igual a 0");
      return;
    }

    if (!Number.isFinite(parsedDays) || parsedDays < 0) {
      alert("❌ Los días deben ser un número válido mayor o igual a 0");
      return;
    }

    if (!cleanJustification) {
      alert("❌ La justificación es obligatoria para esta aprobación");
      return;
    }

    onConfirm({
      creditLimitAmount: parsedAmount,
      creditLimitDays: parsedDays,
      justification: cleanJustification,
      notes: notes.trim() || undefined,
      isActive: true,
      requiresOwnerApprovalOnExceed,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-xl border border-dark-700 max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-green-400" />
            Aprobar y Ajustar Límite de Crédito
          </h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-dark-800 rounded-lg border border-dark-700 space-y-1">
          <div className="text-sm text-dark-300">
            <strong>Cotización:</strong> {quotation.code}
          </div>
          <div className="text-sm text-dark-300">
            <strong>Cliente:</strong> {quotation.client?.name}
          </div>
          <div className="text-sm text-dark-300">
            <strong>Total cotización:</strong>{" "}
            {quotation.currency === "USD" ? "$" : quotation.currency}{" "}
            {Number(quotation.totalAmount).toLocaleString("es-CO")}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Nuevo límite (monto)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={creditLimitAmount}
              onChange={(e) => setCreditLimitAmount(e.target.value)}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Nuevo límite (días)
            </label>
            <input
              type="number"
              min={0}
              step="1"
              value={creditLimitDays}
              onChange={(e) => setCreditLimitDays(e.target.value)}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Justificación (obligatoria)
          </label>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
            placeholder="Describe por qué se aprueba y se ajusta el límite..."
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Notas internas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={2}
            placeholder="Notas para seguimiento interno..."
          />
        </div>

        <label className="mb-5 flex items-center gap-2 text-sm text-dark-300">
          <input
            type="checkbox"
            checked={requiresOwnerApprovalOnExceed}
            onChange={(e) => setRequiresOwnerApprovalOnExceed(e.target.checked)}
            className="rounded"
          />
          Mantener regla de aprobación obligatoria cuando se exceda este nuevo
          límite
        </label>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-dark-600 rounded-lg text-dark-300 hover:bg-dark-800 transition-colors"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>Aprobando...</>
            ) : (
              <>
                <ThumbsUp className="w-4 h-4" />
                Aprobar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
