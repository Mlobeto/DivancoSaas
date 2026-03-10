/**
 * CONTRACT DETAIL PAGE
 * Página de detalle de contrato master con addendums y entregas
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/core/components/Layout";
import { contractService } from "../services/contract.service";
import {
  addendumService,
  type ContractAddendum,
} from "../services/addendum.service";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  PauseCircle,
  Package,
  Calendar,
  DollarSign,
  Plus,
  ArrowLeft,
  Truck,
  AlertCircle,
  CreditCard,
  FileSignature,
} from "lucide-react";
import {
  DeliveryFormModal,
  PaymentProofVerificationModal,
} from "../components";

type ContractStatus = "active" | "suspended" | "completed" | "cancelled";
type AddendumStatus = "draft" | "delivered" | "completed" | "cancelled";

const STATUS_COLORS: Record<ContractStatus, string> = {
  active: "bg-green-900/30 text-green-400 border-green-700",
  suspended: "bg-yellow-900/30 text-yellow-400 border-yellow-700",
  completed: "bg-blue-900/30 text-blue-400 border-blue-700",
  cancelled: "bg-red-900/30 text-red-400 border-red-700",
};

const STATUS_LABELS: Record<ContractStatus, string> = {
  active: "Activo",
  suspended: "Suspendido",
  completed: "Completado",
  cancelled: "Cancelado",
};

const ADDENDUM_STATUS_COLORS: Record<AddendumStatus, string> = {
  draft: "bg-gray-900/30 text-gray-400 border-gray-700",
  delivered: "bg-green-900/30 text-green-400 border-green-700",
  completed: "bg-blue-900/30 text-blue-400 border-blue-700",
  cancelled: "bg-red-900/30 text-red-400 border-red-700",
};

const ADDENDUM_STATUS_LABELS: Record<AddendumStatus, string> = {
  draft: "Borrador",
  delivered: "Entregado",
  completed: "Completado",
  cancelled: "Cancelado",
};

function fmt(n?: number | string | null, currency = "USD") {
  if (n == null) return "-";
  return `${currency} $${Number(n).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
  })}`;
}

function fmtDate(d?: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("es-CO");
}

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Cargar contrato
  const { data: contract, isLoading: loadingContract } = useQuery({
    queryKey: ["contract", id],
    queryFn: () => contractService.getById(id!),
    enabled: !!id,
  });

  // Cargar addendums
  const { data: addendums = [], isLoading: loadingAddendums } = useQuery({
    queryKey: ["addendums", id],
    queryFn: () => addendumService.listByContract(id!),
    enabled: !!id,
  });

  const suspendMutation = useMutation({
    mutationFn: () => contractService.suspend(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      alert("⏸ Contrato suspendido");
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => contractService.reactivate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      alert("▶️ Contrato reactivado");
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => contractService.complete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      alert("✅ Contrato completado");
    },
  });

  const isLoading = loadingContract || loadingAddendums;

  if (isLoading) {
    return (
      <Layout title="Cargando...">
        <div className="flex items-center justify-center py-12">
          <Clock className="w-8 h-8 animate-spin text-primary-400" />
        </div>
      </Layout>
    );
  }

  if (!contract) {
    return (
      <Layout title="Contrato no encontrado">
        <div className="card text-center py-12">
          <XCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <p className="text-dark-400">
            El contrato no existe o no tienes acceso
          </p>
          <button
            onClick={() => navigate("/rental/contracts")}
            className="btn-ghost mt-4"
          >
            ← Volver a contratos
          </button>
        </div>
      </Layout>
    );
  }

  const statusColor =
    STATUS_COLORS[contract.status as ContractStatus] ??
    "bg-gray-700/30 text-gray-400 border-gray-600";
  const statusLabel =
    STATUS_LABELS[contract.status as ContractStatus] ?? contract.status;

  const totalAddendums = addendums.length;
  const activeAddendums = addendums.filter(
    (a) => a.status === "delivered",
  ).length;
  const completedAddendums = addendums.filter(
    (a) => a.status === "completed",
  ).length;

  const canCreateDelivery =
    contract.status === "active" && !!contract.clientAccount;

  return (
    <Layout
      title={`Contrato ${contract.code}`}
      subtitle={contract.client?.name}
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/rental/contracts")}
            className="btn-ghost"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          {canCreateDelivery && (
            <button
              onClick={() => setShowDeliveryModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva Entrega
            </button>
          )}
        </div>
      }
    >
      {/* Header Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Column 1: Status & Dates */}
        <div className="card space-y-4">
          <div>
            <div className="text-xs text-dark-500 mb-1">Estado</div>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-medium ${statusColor}`}
            >
              {contract.status === "active" && (
                <CheckCircle className="w-4 h-4" />
              )}
              {contract.status === "suspended" && (
                <PauseCircle className="w-4 h-4" />
              )}
              {contract.status === "completed" && (
                <FileText className="w-4 h-4" />
              )}
              {contract.status === "cancelled" && (
                <XCircle className="w-4 h-4" />
              )}
              {statusLabel}
            </span>
          </div>

          <div>
            <div className="text-xs text-dark-500 mb-1">Fecha de inicio</div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-dark-400" />
              {fmtDate(contract.startDate)}
            </div>
          </div>

          {contract.estimatedEndDate && (
            <div>
              <div className="text-xs text-dark-500 mb-1">Fin estimado</div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-dark-400" />
                {fmtDate(contract.estimatedEndDate)}
              </div>
            </div>
          )}

          {contract.actualEndDate && (
            <div>
              <div className="text-xs text-dark-500 mb-1">Fecha de cierre</div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-dark-400" />
                {fmtDate(contract.actualEndDate)}
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Client & Account */}
        <div className="card space-y-4">
          <div>
            <div className="text-xs text-dark-500 mb-1">Cliente</div>
            <div className="font-medium">{contract.client?.name}</div>
            {contract.client?.email && (
              <div className="text-sm text-dark-400">
                {contract.client.email}
              </div>
            )}
            {contract.client?.phone && (
              <div className="text-sm text-dark-400">
                {contract.client.phone}
              </div>
            )}
          </div>

          {contract.clientAccount && (
            <div className="pt-3 border-t border-dark-700">
              <div className="text-xs text-dark-500 mb-2">Saldo de cuenta</div>
              <div className="text-2xl font-bold text-primary-400">
                {fmt(contract.clientAccount.balance, contract.currency)}
              </div>
              {contract.clientAccount.balance < 1000 && (
                <div className="flex items-center gap-1 text-xs text-orange-400 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  Saldo bajo
                </div>
              )}
            </div>
          )}
        </div>

        {/* Column 3: Financials */}
        <div className="card space-y-4">
          <div>
            <div className="text-xs text-dark-500 mb-1">Total consumido</div>
            <div className="text-2xl font-bold text-orange-400">
              {fmt(contract.totalConsumed, contract.currency)}
            </div>
          </div>

          {contract.estimatedTotal && (
            <div>
              <div className="text-xs text-dark-500 mb-1">Total estimado</div>
              <div className="text-lg font-medium text-dark-300">
                {fmt(contract.estimatedTotal, contract.currency)}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-dark-700">
            <div className="text-xs text-dark-500 mb-1">Moneda</div>
            <div className="text-sm font-medium">{contract.currency}</div>
          </div>
        </div>
      </div>

      {/* Contract Requirements Status */}
      <div className="card mb-6">
        <h3 className="font-medium mb-4">Estado de Requisitos del Contrato</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Firma Digital Status */}
          <div
            className={`p-4 rounded-lg border ${
              contract.signatureStatus === "signed"
                ? "bg-green-900/20 border-green-700"
                : "bg-orange-900/20 border-orange-700"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <FileSignature
                  className={`w-5 h-5 ${
                    contract.signatureStatus === "signed"
                      ? "text-green-400"
                      : "text-orange-400"
                  }`}
                />
                <div>
                  <div className="font-medium">Firma Digital</div>
                  <div className="text-xs text-dark-400 mt-1">
                    Estado:{" "}
                    {contract.signatureStatus === "signed"
                      ? "Firmado"
                      : contract.signatureStatus === "pending"
                        ? "Pendiente"
                        : contract.signatureStatus || "No solicitado"}
                  </div>
                </div>
              </div>
              {contract.signatureStatus === "signed" ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <Clock className="w-5 h-5 text-orange-400" />
              )}
            </div>
            {contract.signatureCompletedAt && (
              <div className="text-xs text-dark-500 mt-2">
                Firmado el {fmtDate(contract.signatureCompletedAt)}
              </div>
            )}
          </div>

          {/* Payment Verification Status */}
          <div
            className={`p-4 rounded-lg border ${
              contract.paymentVerifiedAt
                ? "bg-green-900/20 border-green-700"
                : contract.paymentProofUrl
                  ? "bg-orange-900/20 border-orange-700"
                  : "bg-dark-800 border-dark-700"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <CreditCard
                  className={`w-5 h-5 ${
                    contract.paymentVerifiedAt
                      ? "text-green-400"
                      : contract.paymentProofUrl
                        ? "text-orange-400"
                        : "text-dark-400"
                  }`}
                />
                <div>
                  <div className="font-medium">Pago Certificado</div>
                  <div className="text-xs text-dark-400 mt-1">
                    {contract.paymentVerifiedAt
                      ? "Verificado por staff"
                      : contract.paymentProofUrl
                        ? "Pendiente de verificación"
                        : "Sin comprobante"}
                  </div>
                </div>
              </div>
              {contract.paymentVerifiedAt ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : contract.paymentProofUrl ? (
                <AlertCircle className="w-5 h-5 text-orange-400" />
              ) : (
                <XCircle className="w-5 h-5 text-dark-400" />
              )}
            </div>
            <div className="flex gap-2 mt-3">
              {contract.paymentProofUrl && !contract.paymentVerifiedAt && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="btn-primary btn-sm flex items-center gap-1 flex-1"
                >
                  <CreditCard className="w-4 h-4" />
                  Verificar Comprobante
                </button>
              )}
              {contract.paymentProofUrl && contract.paymentVerifiedAt && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="btn-ghost btn-sm flex items-center gap-1"
                >
                  Ver Comprobante
                </button>
              )}
              {contract.paymentVerifiedAt && (
                <div className="text-xs text-dark-500 mt-1">
                  Verificado el {fmtDate(contract.paymentVerifiedAt)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Warning if requirements not met */}
        {(!contract.signatureStatus ||
          contract.signatureStatus !== "signed" ||
          !contract.paymentVerifiedAt) && (
          <div className="mt-4 p-3 bg-orange-900/20 border border-orange-700 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5" />
              <div className="text-sm text-orange-300">
                <strong>Importante:</strong> Para permitir entregas de
                implementos, el contrato debe estar{" "}
                {(!contract.signatureStatus ||
                  contract.signatureStatus !== "signed") &&
                  "firmado"}
                {(!contract.signatureStatus ||
                  contract.signatureStatus !== "signed") &&
                  !contract.paymentVerifiedAt &&
                  " y "}
                {!contract.paymentVerifiedAt &&
                  "el pago debe estar verificado por staff"}
                .
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {contract.status === "active" && (
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-dark-400">
              Acciones rápidas del contrato
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => suspendMutation.mutate()}
                disabled={suspendMutation.isPending}
                className="btn-secondary btn-sm"
              >
                <PauseCircle className="w-4 h-4" />
                Suspender
              </button>
              <button
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
                className="btn-ghost btn-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Completar
              </button>
            </div>
          </div>
        </div>
      )}

      {contract.status === "suspended" && (
        <div className="card mb-6 bg-yellow-900/10 border-yellow-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PauseCircle className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-300">Contrato suspendido</span>
            </div>
            <button
              onClick={() => reactivateMutation.mutate()}
              disabled={reactivateMutation.isPending}
              className="btn-secondary btn-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Reactivar
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-400">
            {totalAddendums}
          </div>
          <div className="text-xs text-dark-400 mt-1">Total entregas</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-400">
            {activeAddendums}
          </div>
          <div className="text-xs text-dark-400 mt-1">Activas</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-400">
            {completedAddendums}
          </div>
          <div className="text-xs text-dark-400 mt-1">Completadas</div>
        </div>
      </div>

      {/* Addendums List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary-400" />
            Entregas (Addendums)
          </h2>
          {canCreateDelivery && (
            <button
              onClick={() => setShowDeliveryModal(true)}
              className="btn-ghost btn-sm"
            >
              <Plus className="w-4 h-4" />
              Nueva Entrega
            </button>
          )}
        </div>

        {addendums.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-dark-600 mb-4" />
            <p className="text-dark-400 mb-2">No hay entregas registradas</p>
            <p className="text-sm text-dark-500 mb-4">
              Las entregas documentan cada envío de activos al cliente
            </p>
            {canCreateDelivery && (
              <button
                onClick={() => setShowDeliveryModal(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" />
                Crear Primera Entrega
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {addendums.map((addendum) => (
              <AddendumCard key={addendum.id} addendum={addendum} />
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {contract.notes && (
        <div className="card mt-6">
          <div className="text-xs text-dark-500 mb-2">Notas del contrato</div>
          <p className="text-sm text-dark-300 whitespace-pre-wrap">
            {contract.notes}
          </p>
        </div>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && contract.clientAccount && contract.client && (
        <DeliveryFormModal
          contractId={contract.id}
          clientId={contract.client.id}
          clientName={contract.client.name}
          currency={contract.currency}
          currentBalanceLimit={contract.clientAccount.creditLimit}
          currentTimeLimit={contract.clientAccount.timeLimit}
          contractSigned={contract.signatureStatus === "signed"}
          paymentVerified={!!contract.paymentVerifiedAt}
          signatureStatus={contract.signatureStatus || "not_requested"}
          onClose={() => setShowDeliveryModal(false)}
          onSuccess={() => {
            setShowDeliveryModal(false);
            queryClient.invalidateQueries({ queryKey: ["addendums", id] });
            queryClient.invalidateQueries({ queryKey: ["contract", id] });
          }}
        />
      )}

      {/* Payment Proof Verification Modal */}
      {showPaymentModal && (
        <PaymentProofVerificationModal
          contractId={contract.id}
          contractCode={contract.code}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["contract", id] });
            queryClient.invalidateQueries({
              queryKey: ["paymentProof", contract.id],
            });
          }}
        />
      )}
    </Layout>
  );
}

function AddendumCard({ addendum }: { addendum: ContractAddendum }) {
  const statusColor =
    ADDENDUM_STATUS_COLORS[addendum.status as AddendumStatus] ??
    "bg-gray-700/30 text-gray-400";
  const statusLabel =
    ADDENDUM_STATUS_LABELS[addendum.status as AddendumStatus] ??
    addendum.status;

  return (
    <div className="p-4 rounded-lg border border-dark-700 hover:border-dark-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-primary-400" />
          <div>
            <div className="font-mono font-bold">{addendum.code}</div>
            <div className="text-xs text-dark-500">
              {fmtDate(addendum.deliveryDate || addendum.createdAt)}
            </div>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      {addendum.items && addendum.items.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-dark-500 mb-1">Activos entregados</div>
          <div className="space-y-1">
            {addendum.items.map((item) => (
              <div key={item.id} className="text-sm flex items-center gap-2">
                <span className="text-dark-400">•</span>
                <span>{item.asset?.name || `Asset ${item.assetId}`}</span>
                {item.quantity > 1 && (
                  <span className="text-dark-500">× {item.quantity}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm pt-3 border-t border-dark-800">
        <div className="flex items-center gap-2 text-dark-400">
          <DollarSign className="w-4 h-4" />
          <span>Costo estimado:</span>
        </div>
        <span className="font-bold text-orange-400">
          {fmt(addendum.estimatedAmount, addendum.currency)}
        </span>
      </div>

      {addendum.actualAmount && (
        <div className="flex items-center justify-between text-sm pt-2">
          <span className="text-dark-400">Costo real:</span>
          <span className="font-bold text-green-400">
            {fmt(addendum.actualAmount, addendum.currency)}
          </span>
        </div>
      )}

      {addendum.notes && (
        <div className="mt-3 pt-3 border-t border-dark-800">
          <p className="text-xs text-dark-400">{addendum.notes}</p>
        </div>
      )}
    </div>
  );
}
