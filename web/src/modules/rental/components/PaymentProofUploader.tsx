/**
 * PAYMENT PROOF UPLOADER
 * Componente para subir comprobantes de pago o marcar pago local
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  Check,
  X,
  FileText,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { contractTemplateService } from "../services/contract-template.service";

interface PaymentProofUploaderProps {
  contractId: string;
  currentProof?: {
    type?: "online" | "local";
    url?: string;
    isVerified: boolean;
  };
  allowLocalPayment?: boolean;
  onSuccess?: () => void;
}

export function PaymentProofUploader({
  contractId,
  currentProof,
  allowLocalPayment = true,
  onSuccess,
}: PaymentProofUploaderProps) {
  const [mode, setMode] = useState<"upload" | "local" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (data: { file: File; details: any }) =>
      contractTemplateService.uploadPaymentProof(
        contractId,
        data.file,
        data.details,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
      queryClient.invalidateQueries({
        queryKey: ["paymentProof", contractId],
      });
      onSuccess?.();
      resetForm();
    },
  });

  const localPaymentMutation = useMutation({
    mutationFn: (details: any) =>
      contractTemplateService.markLocalPayment(contractId, details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
      queryClient.invalidateQueries({
        queryKey: ["paymentProof", contractId],
      });
      onSuccess?.();
      resetForm();
    },
  });

  const resetForm = () => {
    setMode(null);
    setFile(null);
    setTransactionRef("");
    setNotes("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    uploadMutation.mutate({
      file,
      details: {
        transactionRef: transactionRef || undefined,
        paymentDate: paymentDate || undefined,
        notes: notes || undefined,
      },
    });
  };

  const handleMarkLocal = () => {
    localPaymentMutation.mutate({
      paymentDate: paymentDate || undefined,
      notes: notes || undefined,
    });
  };

  // Si ya hay comprobante cargado
  if (currentProof?.type) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
        <div className="flex items-start gap-4">
          <div
            className={`rounded-full p-3 ${
              currentProof.type === "local"
                ? "bg-green-500/20 text-green-400"
                : "bg-blue-500/20 text-blue-400"
            }`}
          >
            {currentProof.type === "local" ? (
              <DollarSign className="h-6 w-6" />
            ) : (
              <FileText className="h-6 w-6" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              {currentProof.type === "local"
                ? "Pago Local/Efectivo"
                : "Comprobante de Pago"}
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              {currentProof.type === "local"
                ? "El pago fue realizado en efectivo o de forma presencial"
                : "Comprobante de pago cargado exitosamente"}
            </p>
            {currentProof.url && (
              <a
                href={currentProof.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
              >
                <FileText className="h-4 w-4" />
                Ver comprobante
              </a>
            )}
            {currentProof.isVerified && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
                <Check className="h-4 w-4" />
                Verificado
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Si no hay comprobante, mostrar opciones
  if (!mode) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">
            Comprobante de Pago Requerido
          </h3>
        </div>
        <p className="mb-6 text-sm text-gray-400">
          Debe cargar un comprobante de pago antes de proceder con la firma del
          contrato.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setMode("upload")}
            className="flex-1 rounded-lg border border-blue-500 bg-blue-500/10 px-4 py-3 text-center text-sm font-medium text-blue-400 transition hover:bg-blue-500/20"
          >
            <Upload className="mx-auto mb-1 h-5 w-5" />
            Subir Comprobante
          </button>
          {allowLocalPayment && (
            <button
              onClick={() => setMode("local")}
              className="flex-1 rounded-lg border border-green-500 bg-green-500/10 px-4 py-3 text-center text-sm font-medium text-green-400 transition hover:bg-green-500/20"
            >
              <DollarSign className="mx-auto mb-1 h-5 w-5" />
              Pago Local/Efectivo
            </button>
          )}
        </div>
      </div>
    );
  }

  // Modo upload
  if (mode === "upload") {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Subir Comprobante de Pago
          </h3>
          <button
            onClick={resetForm}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`mb-4 rounded-lg border-2 border-dashed p-8 text-center transition ${
            dragActive
              ? "border-blue-500 bg-blue-500/10"
              : "border-gray-600 bg-gray-900/50"
          }`}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-blue-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-white">{file.name}</p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="mx-auto mb-3 h-12 w-12 text-gray-400" />
              <p className="mb-2 text-sm text-gray-300">
                Arrastra tu archivo aquí o{" "}
                <label className="cursor-pointer text-blue-400 hover:text-blue-300">
                  selecciona un archivo
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                  />
                </label>
              </p>
              <p className="text-xs text-gray-500">PDF, JPG, PNG - Máx. 2MB</p>
            </>
          )}
        </div>

        {/* Detalles */}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Referencia de Transacción
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="Ej: TRANS-123456"
              className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Fecha de Pago
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Información adicional sobre el pago..."
              rows={3}
              className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={resetForm}
            className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploadMutation.isPending}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadMutation.isPending ? "Subiendo..." : "Subir Comprobante"}
          </button>
        </div>

        {uploadMutation.isError && (
          <p className="mt-3 text-sm text-red-400">
            Error al subir: {(uploadMutation.error as Error).message}
          </p>
        )}
      </div>
    );
  }

  // Modo local payment
  if (mode === "local") {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Confirmar Pago Local/Efectivo
          </h3>
          <button
            onClick={resetForm}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4">
          <p className="text-sm text-yellow-300">
            Al confirmar, se registrará que el pago fue realizado en efectivo o
            de forma presencial, sin necesidad de comprobante digital.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Fecha de Pago
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Pago recibido en efectivo en oficina central"
              rows={3}
              className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={resetForm}
            className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleMarkLocal}
            disabled={localPaymentMutation.isPending}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {localPaymentMutation.isPending
              ? "Registrando..."
              : "Confirmar Pago Local"}
          </button>
        </div>

        {localPaymentMutation.isError && (
          <p className="mt-3 text-sm text-red-400">
            Error: {(localPaymentMutation.error as Error).message}
          </p>
        )}
      </div>
    );
  }

  return null;
}
