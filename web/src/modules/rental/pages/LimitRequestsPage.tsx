/**
 * LIMIT REQUESTS PAGE
 * Página para que admin/owner aprueben o rechacen solicitudes de aumento de límite
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import {
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  DollarSign,
  Calendar,
  AlertCircle,
  User,
} from "lucide-react";
import { limitRequestService } from "../services/limit-request.service";
import type {
  LimitRequest,
  LimitRequestMetadata,
} from "../services/limit-request.service";

export function LimitRequestsPage() {
  const [selectedRequest, setSelectedRequest] = useState<LimitRequest | null>(
    null,
  );
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["limitRequests", "pending"],
    queryFn: () => limitRequestService.listPending(),
  });

  if (isLoading) {
    return (
      <Layout title="Solicitudes de Límite">
        <div className="flex items-center justify-center py-12">
          <Clock className="w-8 h-8 animate-spin text-primary-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Solicitudes de Aumento de Límite"
      subtitle="Revisa y aprueba solicitudes de crédito"
    >
      {requests.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            No hay solicitudes pendientes
          </h3>
          <p className="text-dark-400">
            Todas las solicitudes han sido procesadas
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onViewDetails={() => setSelectedRequest(request)}
              onApprove={() => {
                setSelectedRequest(request);
                setShowApprovalModal(true);
              }}
              onReject={() => {
                setSelectedRequest(request);
                setShowRejectionModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <ApprovalModal
          request={selectedRequest}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={() => {
            setShowApprovalModal(false);
            setSelectedRequest(null);
            queryClient.invalidateQueries({ queryKey: ["limitRequests"] });
          }}
        />
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedRequest && (
        <RejectionModal
          request={selectedRequest}
          onClose={() => {
            setShowRejectionModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={() => {
            setShowRejectionModal(false);
            setSelectedRequest(null);
            queryClient.invalidateQueries({ queryKey: ["limitRequests"] });
          }}
        />
      )}
    </Layout>
  );
}

// ─── REQUEST CARD ─────────────────────────────────────────────

interface RequestCardProps {
  request: LimitRequest;
  onViewDetails: () => void;
  onApprove: () => void;
  onReject: () => void;
}

function RequestCard({
  request,
  onViewDetails,
  onApprove,
  onReject,
}: RequestCardProps) {
  const metadata = request.requestMetadata as LimitRequestMetadata;
  const balanceIncrease =
    metadata.requestedBalanceLimit - metadata.currentBalanceLimit;
  const timeIncrease = metadata.requestedTimeLimit - metadata.currentTimeLimit;

  return (
    <div className="card hover:border-primary-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            <h3 className="font-bold text-lg">
              {metadata.clientName || metadata.clientId}
            </h3>
          </div>
          <p className="text-sm text-dark-400">
            Solicitado hace {getRelativeTime(metadata.requestedAt)}
          </p>
        </div>
        <div className="px-3 py-1 rounded-full bg-yellow-900/30 border border-yellow-700 text-yellow-400 text-sm">
          Pendiente
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Balance */}
        <div className="p-3 bg-dark-800 rounded-lg border border-dark-700">
          <div className="flex items-center gap-2 text-xs text-dark-400 mb-1">
            <DollarSign className="w-4 h-4" />
            Saldo Máximo
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">
              {metadata.requestedBalanceLimit.toLocaleString()}
            </span>
            <span className="text-sm text-dark-500">
              desde {metadata.currentBalanceLimit.toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-green-400 mt-1">
            +{balanceIncrease.toLocaleString()} (
            {((balanceIncrease / metadata.currentBalanceLimit) * 100).toFixed(
              0,
            )}
            %)
          </div>
        </div>

        {/* Time */}
        <div className="p-3 bg-dark-800 rounded-lg border border-dark-700">
          <div className="flex items-center gap-2 text-xs text-dark-400 mb-1">
            <Calendar className="w-4 h-4" />
            Días Activos
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">
              {metadata.requestedTimeLimit}
            </span>
            <span className="text-sm text-dark-500">
              desde {metadata.currentTimeLimit}
            </span>
          </div>
          <div className="text-xs text-blue-400 mt-1">
            +{timeIncrease} días (
            {((timeIncrease / metadata.currentTimeLimit) * 100).toFixed(0)}%)
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="mb-4 p-3 bg-dark-800/50 rounded-lg border border-dark-700">
        <div className="flex items-center gap-2 text-xs text-dark-400 mb-2">
          <MessageSquare className="w-4 h-4" />
          Justificación
        </div>
        <p className="text-sm text-dark-300 whitespace-pre-wrap">
          {metadata.reason}
        </p>
      </div>

      {/* Requestor */}
      <div className="flex items-center gap-2 text-sm text-dark-400 mb-4">
        <User className="w-4 h-4" />
        <span>Solicitado por: {request.createdBy}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={onViewDetails} className="btn-ghost flex-1">
          <MessageSquare className="w-4 h-4" />
          Ver Conversación
        </button>
        <button onClick={onReject} className="btn-secondary">
          <XCircle className="w-4 h-4" />
          Rechazar
        </button>
        <button onClick={onApprove} className="btn-primary">
          <CheckCircle className="w-4 h-4" />
          Aprobar
        </button>
      </div>
    </div>
  );
}

// ─── APPROVAL MODAL ───────────────────────────────────────────

interface ApprovalModalProps {
  request: LimitRequest;
  onClose: () => void;
  onSuccess: () => void;
}

function ApprovalModal({ request, onClose, onSuccess }: ApprovalModalProps) {
  const metadata = request.requestMetadata as LimitRequestMetadata;
  const [approvedBalanceLimit, setApprovedBalanceLimit] = useState(
    metadata.requestedBalanceLimit,
  );
  const [approvedTimeLimit, setApprovedTimeLimit] = useState(
    metadata.requestedTimeLimit,
  );
  const [notes, setNotes] = useState("");

  const approveMutation = useMutation({
    mutationFn: () =>
      limitRequestService.approve(request.id, {
        approvedBalanceLimit,
        approvedTimeLimit,
        notes,
      }),
    onSuccess: () => {
      alert("✅ Solicitud aprobada exitosamente");
      onSuccess();
    },
    onError: (error: any) => {
      alert(
        `Error aprobando solicitud: ${error.response?.data?.error?.message || error.message}`,
      );
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-lg border border-dark-700 w-full max-w-2xl">
        <div className="p-6 border-b border-dark-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            Aprobar Solicitud
          </h2>
          <p className="text-sm text-dark-400 mt-1">
            {metadata.clientName || metadata.clientId}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            <h3 className="font-medium mb-2">Límites Solicitados</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-dark-400">Saldo: </span>
                <span className="font-medium">
                  {metadata.requestedBalanceLimit.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-dark-400">Días: </span>
                <span className="font-medium">
                  {metadata.requestedTimeLimit}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Saldo Aprobado *</label>
            <input
              type="number"
              value={approvedBalanceLimit}
              onChange={(e) =>
                setApprovedBalanceLimit(parseFloat(e.target.value) || 0)
              }
              min={metadata.currentBalanceLimit}
              step="1000"
              className="form-input"
            />
          </div>

          <div>
            <label className="label">Días Activos Aprobados *</label>
            <input
              type="number"
              value={approvedTimeLimit}
              onChange={(e) =>
                setApprovedTimeLimit(parseInt(e.target.value) || 0)
              }
              min={metadata.currentTimeLimit}
              className="form-input"
            />
          </div>

          <div>
            <label className="label">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comentarios adicionales sobre la aprobación..."
              className="form-input min-h-[80px]"
            />
          </div>
        </div>

        <div className="p-6 border-t border-dark-700 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={approveMutation.isPending}
          >
            Cancelar
          </button>
          <button
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
            className="btn-primary"
          >
            {approveMutation.isPending
              ? "Aprobando..."
              : "Confirmar Aprobación"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── REJECTION MODAL ──────────────────────────────────────────

interface RejectionModalProps {
  request: LimitRequest;
  onClose: () => void;
  onSuccess: () => void;
}

function RejectionModal({ request, onClose, onSuccess }: RejectionModalProps) {
  const metadata = request.requestMetadata as LimitRequestMetadata;
  const [reason, setReason] = useState("");

  const rejectMutation = useMutation({
    mutationFn: () => limitRequestService.reject(request.id, { reason }),
    onSuccess: () => {
      alert("❌ Solicitud rechazada");
      onSuccess();
    },
    onError: (error: any) => {
      alert(
        `Error rechazando solicitud: ${error.response?.data?.error?.message || error.message}`,
      );
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-lg border border-dark-700 w-full max-w-lg">
        <div className="p-6 border-b border-dark-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <XCircle className="w-6 h-6 text-red-400" />
            Rechazar Solicitud
          </h2>
          <p className="text-sm text-dark-400 mt-1">
            {metadata.clientName || metadata.clientId}
          </p>
        </div>

        <div className="p-6">
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="text-sm text-red-300">
                El solicitante recibirá una notificación con el motivo del
                rechazo.
              </div>
            </div>
          </div>

          <div>
            <label className="label">Motivo del Rechazo *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explica por qué se rechaza esta solicitud..."
              className="form-input min-h-[120px]"
              required
            />
          </div>
        </div>

        <div className="p-6 border-t border-dark-700 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={rejectMutation.isPending}
          >
            Cancelar
          </button>
          <button
            onClick={() => rejectMutation.mutate()}
            disabled={rejectMutation.isPending || !reason.trim()}
            className="btn-danger"
          >
            {rejectMutation.isPending ? "Rechazando..." : "Confirmar Rechazo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── UTILS ────────────────────────────────────────────────────

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "hace unos segundos";
  if (diffMins < 60) return `hace ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
  if (diffHours < 24)
    return `hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  if (diffDays < 7) return `hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
  return date.toLocaleDateString("es-CO");
}
