/**
 * CONTRACT PREVIEW COMPONENT
 * Visualización y gestión del contrato con integración de:
 * - Vista previa HTML renderizada
 * - Estado de comprobante de pago
 * - Estado de firmas digitales (SignNow)
 * - Descarga de PDF
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Send,
  X,
  AlertCircle,
  Loader2,
  Eye,
  CheckCircle,
  Clock,
  FileSignature,
} from "lucide-react";
import { contractTemplateService } from "../services/contract-template.service";
import { PaymentProofUploader } from "./PaymentProofUploader";

interface ContractPreviewProps {
  contractId: string;
  templateId: string;
  requiresPaymentProof?: boolean;
  requiresSignature?: boolean;
  allowLocalPayment?: boolean;
  onSignatureRequested?: () => void;
}

type PaymentProofStatus = "pending" | "uploaded" | "verified" | "none";
type SignatureStatus = "pending" | "sent" | "completed" | "none";

export function ContractPreview({
  contractId,
  templateId,
  requiresPaymentProof = false,
  requiresSignature = false,
  allowLocalPayment = true,
  onSignatureRequested,
}: ContractPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const queryClient = useQueryClient();

  // Query: Obtener estado del comprobante de pago
  const { data: paymentProof, isLoading: loadingPayment } = useQuery({
    queryKey: ["paymentProof", contractId],
    queryFn: () => contractTemplateService.getPaymentProof(contractId),
    enabled: requiresPaymentProof,
  });

  // Query: Obtener estado de firmas
  // Polling cada 10 segundos cuando está habilitado
  const { data: signatureInfo } = useQuery({
    queryKey: ["signature", contractId],
    queryFn: () => contractTemplateService.getSignatureStatus(contractId),
    enabled: requiresSignature,
    refetchInterval: 10000, // Poll cada 10s cuando está habilitado
  });

  // Mutation: Renderizar contrato
  const renderMutation = useMutation({
    mutationFn: () =>
      contractTemplateService.renderContract({
        templateId,
        contractId,
      }),
    onSuccess: (data) => {
      setPreviewHtml(data.html);
      setShowPreview(true);
    },
  });

  // Mutation: Enviar a firma digital (SignNow)
  const sendToSignatureMutation = useMutation({
    mutationFn: () =>
      contractTemplateService.sendToSignature(contractId, [
        {
          email: "client@example.com", // TODO: Obtener del contrato
          name: "Cliente",
          role: "client",
        },
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
      onSignatureRequested?.();
    },
  });

  // Mutation: Descargar PDF
  const downloadPdfMutation = useMutation({
    mutationFn: async () => {
      // Si requiere firma y ya está firmado, descargar PDF firmado
      const shouldDownloadSigned = requiresSignature && signatureInfo?.status === "completed";
      
      const blob = shouldDownloadSigned
        ? await contractTemplateService.downloadSignedContractPdf(contractId)
        : await contractTemplateService.downloadContractPdf(contractId);
      
      return { blob, isSigned: shouldDownloadSigned };
    },
    onSuccess: ({ blob, isSigned }) => {
      // Crear URL temporal y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contrato-${contractId}${isSigned ? "-firmado" : ""}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });

  // Determinar estados
  const paymentStatus: PaymentProofStatus = !requiresPaymentProof
    ? "none"
    : !paymentProof
      ? "pending"
      : paymentProof.isVerified
        ? "verified"
        : "uploaded";

  const signatureStatus: SignatureStatus = !requiresSignature
    ? "none"
    : !signatureInfo
      ? "pending"
      : signatureInfo.status === "completed"
        ? "completed"
        : signatureInfo.status === "sent"
          ? "sent"
          : "pending";

  const canSendToSignature =
    requiresSignature &&
    (!requiresPaymentProof || paymentStatus === "verified");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Contrato</h2>
        <div className="flex gap-2">
          <button
            onClick={() => renderMutation.mutate()}
            disabled={renderMutation.isPending}
            className="btn-secondary flex items-center gap-2"
          >
            {renderMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            Vista Previa
          </button>
          <button
            onClick={() => downloadPdfMutation.mutate()}
            disabled={downloadPdfMutation.isPending}
            className="btn-secondary flex items-center gap-2"
          >
            {downloadPdfMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Payment Proof Section */}
      {requiresPaymentProof && (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-full p-2 ${
                  paymentStatus === "verified"
                    ? "bg-green-500/20 text-green-400"
                    : paymentStatus === "uploaded"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {paymentStatus === "verified" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : paymentStatus === "uploaded" ? (
                  <Clock className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Comprobante de Pago
                </h3>
                <p className="text-sm text-gray-400">
                  {paymentStatus === "verified"
                    ? "Verificado"
                    : paymentStatus === "uploaded"
                      ? "Pendiente de verificación"
                      : "Requerido para proceder"}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                paymentStatus === "verified"
                  ? "bg-green-500/20 text-green-400"
                  : paymentStatus === "uploaded"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
              }`}
            >
              {paymentStatus === "verified"
                ? "✓ Verificado"
                : paymentStatus === "uploaded"
                  ? "⏱ Pendiente"
                  : "⚠ Requerido"}
            </span>
          </div>

          {loadingPayment ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <PaymentProofUploader
              contractId={contractId}
              currentProof={
                paymentProof
                  ? {
                      type: paymentProof.type as "online" | "local",
                      url: paymentProof.url,
                      isVerified: paymentProof.isVerified,
                    }
                  : undefined
              }
              allowLocalPayment={allowLocalPayment}
              onSuccess={() => {
                queryClient.invalidateQueries({
                  queryKey: ["paymentProof", contractId],
                });
              }}
            />
          )}
        </div>
      )}

      {/* Signature Section */}
      {requiresSignature && (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-full p-2 ${
                  signatureStatus === "completed"
                    ? "bg-green-500/20 text-green-400"
                    : signatureStatus === "sent"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-gray-500/20 text-gray-400"
                }`}
              >
                <FileSignature className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Firma Digital
                </h3>
                <p className="text-sm text-gray-400">
                  {signatureStatus === "completed"
                    ? "Contrato firmado"
                    : signatureStatus === "sent"
                      ? "Enviado al cliente para firma"
                      : "Pendiente de envío"}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                signatureStatus === "completed"
                  ? "bg-green-500/20 text-green-400"
                  : signatureStatus === "sent"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {signatureStatus === "completed"
                ? "✓ Firmado"
                : signatureStatus === "sent"
                  ? "📤 Enviado"
                  : "⏳ Pendiente"}
            </span>
          </div>

          {!canSendToSignature && requiresPaymentProof && (
            <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-yellow-300">
                    Comprobante de pago requerido
                  </p>
                  <p className="text-sm text-yellow-400/80">
                    El comprobante debe estar verificado antes de enviar el
                    contrato a firma.
                  </p>
                </div>
              </div>
            </div>
          )}

          {signatureStatus === "pending" && (
            <button
              onClick={() => sendToSignatureMutation.mutate()}
              disabled={
                !canSendToSignature || sendToSignatureMutation.isPending
              }
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendToSignatureMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar a Firma Digital (SignNow)
                </>
              )}
            </button>
          )}

          {signatureStatus === "sent" && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
              <div className="flex gap-3">
                <Clock className="h-5 w-5 flex-shrink-0 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-300">
                    Esperando firma del cliente
                  </p>
                  <p className="text-sm text-blue-400/80">
                    El cliente recibirá un correo con el enlace para firmar el
                    contrato.
                  </p>
                </div>
              </div>
            </div>
          )}

          {signatureStatus === "completed" && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-300">
                    Contrato firmado exitosamente
                  </p>
                  <p className="text-sm text-green-400/80">
                    El contrato ha sido firmado por todas las partes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {sendToSignatureMutation.isError && (
            <p className="mt-3 text-sm text-red-400">
              Error al enviar: {(sendToSignatureMutation.error as Error).message}
            </p>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-5xl rounded-lg bg-gray-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-white">
                Vista Previa del Contrato
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-6">
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-700 p-4">
              <button
                onClick={() => setShowPreview(false)}
                className="btn-secondary"
              >
                Cerrar
              </button>
              <button
                onClick={() => downloadPdfMutation.mutate()}
                className="btn-primary flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {renderMutation.isError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">
            Error al renderizar: {(renderMutation.error as Error).message}
          </p>
        </div>
      )}
    </div>
  );
}
