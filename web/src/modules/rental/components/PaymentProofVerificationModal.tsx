/**
 * PAYMENT PROOF VERIFICATION MODAL
 * Modal para que el staff vea y apruebe comprobantes de pago
 */

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  X,
  CheckCircle,
  FileText,
  Download,
  ExternalLink,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { contractTemplateService } from "../services/contract-template.service";

interface PaymentProofVerificationModalProps {
  contractId: string;
  contractCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentProofVerificationModal({
  contractId,
  contractCode,
  onClose,
  onSuccess,
}: PaymentProofVerificationModalProps) {
  const [notes, setNotes] = useState("");
  const [showFullImage, setShowFullImage] = useState(false);

  // Cargar información del pago
  const { data: paymentInfo, isLoading } = useQuery({
    queryKey: ["paymentProof", contractId],
    queryFn: () => contractTemplateService.getPaymentProof(contractId),
  });

  // Mutación para verificar el pago
  const verifyMutation = useMutation({
    mutationFn: () =>
      contractTemplateService.verifyPaymentProof(contractId, notes),
    onSuccess: () => {
      alert("✅ Pago verificado exitosamente");
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      alert(
        `Error verificando pago: ${error.response?.data?.error?.message || error.message}`,
      );
    },
  });

  const handleVerify = () => {
    if (
      confirm(
        `¿Confirmas que deseas aprobar el comprobante de pago del contrato ${contractCode}?\n\nEsto permitirá crear entregas de implementos.`,
      )
    ) {
      verifyMutation.mutate();
    }
  };

  const isImage = (url?: string) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const isPDF = (url?: string) => {
    if (!url) return false;
    return /\.pdf$/i.test(url);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-dark-900 rounded-lg border border-dark-700 p-8">
          <div className="text-center">Cargando información del pago...</div>
        </div>
      </div>
    );
  }

  if (!paymentInfo?.hasProof) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-dark-900 rounded-lg border border-dark-700 p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-400" />
            <h3 className="text-lg font-bold">No hay comprobante</h3>
          </div>
          <p className="text-dark-400 mb-4">
            Este contrato aún no tiene un comprobante de pago cargado.
          </p>
          <button onClick={onClose} className="btn-primary w-full">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-lg border border-dark-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-dark-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-primary-400" />
              Verificación de Pago
            </h2>
            <p className="text-sm text-dark-400 mt-1">
              Contrato {contractCode}
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
        <div className="p-6 overflow-y-auto flex-1">
          {/* Payment Status */}
          <div className="mb-6">
            {paymentInfo.isVerified ? (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-900/30 border border-green-700 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <div className="font-medium">Pago Verificado</div>
                  <div className="text-xs text-green-300">
                    {paymentInfo.verifiedAt &&
                      `Verificado el ${new Date(paymentInfo.verifiedAt).toLocaleDateString("es-CO")}`}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-orange-900/30 border border-orange-700 text-orange-400">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <div className="font-medium">Pendiente de Verificación</div>
                  <div className="text-xs text-orange-300">
                    El comprobante está esperando aprobación
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="card bg-dark-800 mb-6">
            <h3 className="font-medium mb-4">Información del Pago</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-dark-400">Tipo de pago:</span>
                <span className="font-medium">
                  {paymentInfo.type === "online"
                    ? "Transferencia Online"
                    : paymentInfo.type === "local"
                      ? "Pago en Local"
                      : "No especificado"}
                </span>
              </div>

              {paymentInfo.details && (
                <>
                  {paymentInfo.details.transactionRef && (
                    <div className="flex justify-between">
                      <span className="text-dark-400">Ref. transacción:</span>
                      <span className="font-medium font-mono text-sm">
                        {paymentInfo.details.transactionRef}
                      </span>
                    </div>
                  )}
                  {paymentInfo.details.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-dark-400">Fecha de pago:</span>
                      <span className="font-medium">
                        {new Date(
                          paymentInfo.details.paidAt,
                        ).toLocaleDateString("es-CO")}
                      </span>
                    </div>
                  )}
                  {paymentInfo.details.notes && (
                    <div>
                      <div className="text-dark-400 mb-1">Notas:</div>
                      <div className="text-sm bg-dark-900 p-3 rounded border border-dark-700">
                        {paymentInfo.details.notes}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Payment Proof File */}
          {paymentInfo.url && (
            <div className="card bg-dark-800 mb-6">
              <h3 className="font-medium mb-4">Comprobante de Pago</h3>

              {isImage(paymentInfo.url) ? (
                <div>
                  <div className="relative rounded-lg overflow-hidden border border-dark-700 mb-3">
                    <img
                      src={paymentInfo.url}
                      alt="Comprobante de pago"
                      className="w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setShowFullImage(true)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowFullImage(true)}
                      className="btn-ghost flex items-center gap-2 flex-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver en grande
                    </button>
                    <a
                      href={paymentInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost flex items-center gap-2 flex-1"
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </a>
                  </div>
                </div>
              ) : isPDF(paymentInfo.url) ? (
                <div>
                  <div className="flex items-center gap-3 p-4 bg-dark-900 rounded-lg border border-dark-700 mb-3">
                    <FileText className="w-8 h-8 text-red-400" />
                    <div className="flex-1">
                      <div className="font-medium">Documento PDF</div>
                      <div className="text-xs text-dark-400">
                        Comprobante de pago
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={paymentInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost flex items-center gap-2 flex-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir PDF
                    </a>
                    <a
                      href={paymentInfo.url}
                      download
                      className="btn-ghost flex items-center gap-2 flex-1"
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </a>
                  </div>
                </div>
              ) : (
                <div>
                  <a
                    href={paymentInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Descargar comprobante
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Verification Notes (only if not verified yet) */}
          {!paymentInfo.isVerified && (
            <div className="space-y-2">
              <label className="label">Notas de verificación (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Verificado transferencia bancaria ref. 12345..."
                className="form-input min-h-[100px]"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-dark-700 flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancelar
          </button>
          {!paymentInfo.isVerified && (
            <button
              onClick={handleVerify}
              disabled={verifyMutation.isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {verifyMutation.isPending
                ? "Verificando..."
                : "Verificar y Aprobar Pago"}
            </button>
          )}
        </div>
      </div>

      {/* Full Image Modal */}
      {showFullImage && isImage(paymentInfo.url) && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={paymentInfo.url}
              alt="Comprobante de pago"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
