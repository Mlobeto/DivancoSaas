import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/core/components/Layout";
import { ProtectedAction } from "@/core/components/ProtectedAction";
import { useAuthStore } from "@/store/auth.store";
import { quotationService } from "../services/quotation.service";
import { Quotation, QuotationStatus } from "../types/quotation.types";
import {
  CreditApprovalModal,
  CreditApprovalPayload,
} from "../components/CreditApprovalModal";
import {
  FileText,
  FilePlus,
  Eye,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  X,
  Pencil,
  RefreshCw,
  Send,
  ThumbsUp,
  ThumbsDown,
  CreditCard,
  UserCheck,
  MessageSquareWarning,
  Hourglass,
} from "lucide-react";

export function QuotationsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenant, businessUnit, permissions, role } = useAuthStore();
  const isOwner = role === "OWNER";
  const [filters, setFilters] = useState<{
    status?: QuotationStatus;
    clientResponse?: "pending_review" | "approved" | "changes_requested";
    clientId?: string;
    page?: number;
    limit?: number;
  }>({
    page: 1,
    limit: 20,
  });

  // Email modal state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedQuotationForEmail, setSelectedQuotationForEmail] =
    useState<Quotation | null>(null);
  const [customMessage, setCustomMessage] = useState("");

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedQuotationForReject, setSelectedQuotationForReject] =
    useState<Quotation | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Confirm payment modal state
  const [confirmPaymentModalOpen, setConfirmPaymentModalOpen] = useState(false);
  const [selectedQuotationForPayment, setSelectedQuotationForPayment] =
    useState<Quotation | null>(null);
  const [paymentNotes, setPaymentNotes] = useState("");

  // Credit approval modal state
  const [approveCreditModalOpen, setApproveCreditModalOpen] = useState(false);
  const [selectedQuotationForApprove, setSelectedQuotationForApprove] =
    useState<Quotation | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["quotations", tenant?.id, businessUnit?.id, filters],
    queryFn: () => quotationService.list(filters),
    enabled: !!tenant?.id && !!businessUnit?.id,
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: ({
      quotationId,
      message,
    }: {
      quotationId: string;
      message?: string;
    }) =>
      quotationService.sendEmail(quotationId, {
        customMessage: message,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      setEmailModalOpen(false);
      setSelectedQuotationForEmail(null);
      setCustomMessage("");
      alert("✅ Cotización enviada por email exitosamente");
    },
    onError: (error: any) => {
      alert(
        `❌ Error al enviar email: ${error.message || "Error desconocido"}`,
      );
    },
  });

  const handleSendEmail = (quotation: Quotation) => {
    setSelectedQuotationForEmail(quotation);
    setEmailModalOpen(true);
  };

  const handleConfirmSendEmail = () => {
    if (!selectedQuotationForEmail) return;
    sendEmailMutation.mutate({
      quotationId: selectedQuotationForEmail.id,
      message: customMessage || undefined,
    });
  };

  // Workflow: Send
  const sendMutation = useMutation({
    mutationFn: (quotationId: string) => quotationService.send(quotationId),
    onSuccess: (_data, quotationId) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", quotationId] });
      alert("✅ Cotización enviada exitosamente");
    },
    onError: (error: any) => {
      alert(
        `❌ Error al enviar: ${error.response?.data?.message || error.message || "Error desconocido"}`,
      );
    },
  });

  // Workflow: Approve
  const approveMutation = useMutation({
    mutationFn: ({
      quotationId,
      payload,
    }: {
      quotationId: string;
      payload?: {
        creditApproval?: {
          creditLimitAmount: number;
          creditLimitDays: number;
          requiresOwnerApprovalOnExceed?: boolean;
          isActive?: boolean;
          notes?: string;
          justification: string;
        };
      };
    }) => quotationService.approve(quotationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      setApproveCreditModalOpen(false);
      setSelectedQuotationForApprove(null);
      alert("✅ Cotización aprobada");
    },
    onError: (error: any) => {
      alert(
        `❌ Error al aprobar: ${error.response?.data?.message || error.message || "Error desconocido"}`,
      );
    },
  });

  // Workflow: Reject
  const rejectMutation = useMutation({
    mutationFn: ({
      quotationId,
      reason,
    }: {
      quotationId: string;
      reason?: string;
    }) => quotationService.reject(quotationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      setRejectModalOpen(false);
      setSelectedQuotationForReject(null);
      setRejectReason("");
      alert("✅ Cotización rechazada");
    },
    onError: (error: any) => {
      alert(
        `❌ Error al rechazar: ${error.response?.data?.message || error.message || "Error desconocido"}`,
      );
    },
  });

  // Workflow: Send Review link to client
  const sendReviewMutation = useMutation({
    mutationFn: (quotationId: string) =>
      quotationService.sendReview(quotationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      alert("✅ Link de revisión enviado al cliente");
    },
    onError: (error: any) => {
      alert(
        `❌ Error al enviar revisión: ${
          error.response?.data?.message || error.message || "Error desconocido"
        }`,
      );
    },
  });

  // Workflow: Confirm Payment
  const confirmPaymentMutation = useMutation({
    mutationFn: ({
      quotationId,
      notes,
    }: {
      quotationId: string;
      notes?: string;
    }) => quotationService.confirmPayment(quotationId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      setConfirmPaymentModalOpen(false);
      setSelectedQuotationForPayment(null);
      setPaymentNotes("");
      alert("✅ Pago confirmado exitosamente");
    },
    onError: (error: any) => {
      alert(
        `❌ Error al confirmar pago: ${error.response?.data?.message || error.message || "Error desconocido"}`,
      );
    },
  });

  const handleReject = (quotation: Quotation) => {
    setSelectedQuotationForReject(quotation);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!selectedQuotationForReject) return;
    rejectMutation.mutate({
      quotationId: selectedQuotationForReject.id,
      reason: rejectReason || undefined,
    });
  };

  const handleConfirmPayment = (quotation: Quotation) => {
    setSelectedQuotationForPayment(quotation);
    setConfirmPaymentModalOpen(true);
  };

  const resetApproveCreditModal = () => {
    setApproveCreditModalOpen(false);
    setSelectedQuotationForApprove(null);
  };

  const handleApprove = (quotation: Quotation) => {
    const approvalReason = quotation.metadata?.approvalReason;

    if (approvalReason !== "credit_limit_exceeded") {
      approveMutation.mutate({ quotationId: quotation.id });
      return;
    }

    setSelectedQuotationForApprove(quotation);
    setApproveCreditModalOpen(true);
  };

  const handleConfirmApproveCredit = (payload: CreditApprovalPayload) => {
    if (!selectedQuotationForApprove) return;

    approveMutation.mutate({
      quotationId: selectedQuotationForApprove.id,
      payload: {
        creditApproval: payload,
      },
    });
  };

  const handleConfirmPaymentSubmit = () => {
    if (!selectedQuotationForPayment) return;
    confirmPaymentMutation.mutate({
      quotationId: selectedQuotationForPayment.id,
      notes: paymentNotes || undefined,
    });
  };

  const statusColors: Record<QuotationStatus, string> = {
    draft: "bg-gray-700/30 text-gray-400 border-gray-600",
    sent: "bg-blue-900/30 text-blue-400 border-blue-800",
    viewed: "bg-cyan-900/30 text-cyan-400 border-cyan-800",
    pending_approval: "bg-orange-900/30 text-orange-400 border-orange-800",
    // legacy — se mantienen para datos históricos
    signature_pending: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
    signed: "bg-green-900/30 text-green-400 border-green-800",
    paid: "bg-emerald-900/30 text-emerald-400 border-emerald-800",
    cancelled: "bg-red-900/30 text-red-400 border-red-800",
  };

  // Estados editables
  const editableStatuses: QuotationStatus[] = [
    "draft",
    "sent",
    "viewed",
    "pending_approval",
  ];
  // Estados en que ya fue enviado (mostrar "Reenviar")
  const sentStatuses: QuotationStatus[] = ["sent", "viewed"];

  const statusIcons: Record<QuotationStatus, any> = {
    draft: FileText,
    sent: FilePlus,
    viewed: Eye,
    pending_approval: Clock,
    signature_pending: Clock, // legacy
    signed: CheckCircle, // legacy
    paid: CheckCircle,
    cancelled: XCircle,
  };

  const statusLabels: Record<QuotationStatus, string> = {
    draft: "Borrador",
    sent: "Enviada",
    viewed: "Vista",
    pending_approval: "Pend. Aprobación",
    signature_pending: "Pendiente Firma",
    signed: "Firmada",
    paid: "Pagada",
    cancelled: "Cancelada",
  };

  if (!tenant || !businessUnit) {
    return (
      <Layout>
        <div className="p-8">
          <div className="card bg-yellow-900/20 border-yellow-800 text-yellow-400">
            <p>
              No se ha seleccionado un tenant o business unit. Por favor,
              configura tu contexto antes de trabajar con cotizaciones.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Cotizaciones"
      subtitle={`Gestión de cotizaciones - ${businessUnit.name}`}
      actions={
        <>
          <ProtectedAction permission="templates:read">
            <button
              onClick={() => navigate("/rental/templates")}
              className="btn-secondary mr-2"
            >
              <FileText className="w-4 h-4 inline mr-1" />
              Plantillas PDF
            </button>
          </ProtectedAction>
          <ProtectedAction permission="quotations:create">
            <button
              onClick={() => navigate("/rental/quotations/new")}
              className="btn-primary"
            >
              + Nueva Cotización
            </button>
          </ProtectedAction>
          <a href="/dashboard" className="btn-ghost">
            ← Dashboard
          </a>
        </>
      }
    >
      {/* Helper card */}
      <div className="card mb-6 bg-dark-800/80 border-dark-600">
        <h2 className="text-sm font-semibold text-primary-300 mb-2">
          💡 Sistema de Cotizaciones
        </h2>
        <p className="text-sm text-gray-300 mb-2">
          Crea cotizaciones, envíalas al cliente por email para revisión. Cuando
          el cliente aprueba, el contrato se genera automáticamente.
        </p>
        <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
          <li>
            <strong>Auto-cálculo:</strong> Precios calculados desde activos
            (días × horas × tarifa).
          </li>
          <li>
            <strong>Revisión del cliente:</strong> El cliente recibe un link
            para aprobar o solicitar cambios.
          </li>
          <li>
            <strong>Contrato automático:</strong> Al aprobar, se crea el
            contrato sin intervención manual.
          </li>
        </ul>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 flex gap-3">
            {/* Filtro por estado interno */}
            <select
              value={filters.status || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: (e.target.value as QuotationStatus) || undefined,
                  clientResponse: undefined,
                  page: 1,
                })
              }
              className="form-input flex-1"
            >
              <option value="">Todos los estados</option>
              <option value="draft">Borradores</option>
              <option value="sent">Enviadas</option>
              <option value="viewed">Vistas</option>
              <option value="pending_approval">Pend. Aprobación interna</option>
              <option value="paid">Pagadas</option>
              <option value="cancelled">Canceladas</option>
            </select>

            {/* Filtro por respuesta del cliente */}
            <select
              value={filters.clientResponse || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  clientResponse:
                    (e.target.value as
                      | "pending_review"
                      | "approved"
                      | "changes_requested"
                      | "") || undefined,
                  status: undefined,
                  page: 1,
                })
              }
              className="form-input flex-1"
            >
              <option value="">Respuesta cliente (todas)</option>
              <option value="pending_review">⏳ En revisión</option>
              <option value="approved">✅ Aprobada por cliente</option>
              <option value="changes_requested">⚠️ Cambios solicitados</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-dark-400">
            <span>
              💡 Tip: Usa las plantillas PDF para personalizar tus cotizaciones
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-dark-400">
            Cargando cotizaciones...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            Error al cargar cotizaciones
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-dark-400 mb-4">
              No hay cotizaciones registradas aún
            </p>
            <button
              onClick={() => navigate("/rental/quotations/new")}
              className="btn-primary"
            >
              + Crear primera cotización
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800 border-b border-dark-700">
                <tr>
                  <th className="text-left p-4 text-dark-300 font-medium text-sm">
                    Código
                  </th>
                  <th className="text-left p-4 text-dark-300 font-medium text-sm">
                    Cliente
                  </th>
                  <th className="text-left p-4 text-dark-300 font-medium text-sm">
                    Total
                  </th>
                  <th className="text-left p-4 text-dark-300 font-medium text-sm">
                    Válida hasta
                  </th>
                  <th className="text-left p-4 text-dark-300 font-medium text-sm">
                    Estado
                  </th>
                  <th className="text-center p-4 text-dark-300 font-medium text-sm">
                    PDF
                  </th>
                  <th className="text-right p-4 text-dark-300 font-medium text-sm">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((quotation: Quotation) => {
                  const StatusIcon = statusIcons[quotation.status] ?? FileText;
                  return (
                    <tr
                      key={quotation.id}
                      className="border-b border-dark-800 hover:bg-dark-800/30 transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-mono text-sm">
                          {quotation.code}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">
                            {quotation.client?.name || "Sin cliente"}
                          </div>
                          {quotation.client?.email && (
                            <div className="text-xs text-dark-400">
                              {quotation.client.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-primary-400">
                          {quotation.currency === "USD"
                            ? "$"
                            : quotation.currency}{" "}
                          {Number(quotation.totalAmount).toLocaleString(
                            "es-CO",
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        {new Date(quotation.validUntil).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium ${
                              statusColors[quotation.status]
                            }`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusLabels[quotation.status]}
                          </span>
                          {quotation.clientResponse === "approved" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium bg-green-900/40 text-green-400 border-green-700">
                              <UserCheck className="w-3 h-3" />
                              Cliente aprobó
                            </span>
                          )}
                          {quotation.clientResponse === "changes_requested" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium bg-yellow-900/40 text-yellow-400 border-yellow-700">
                              <MessageSquareWarning className="w-3 h-3" />
                              Cliente pidió cambios
                            </span>
                          )}
                          {quotation.clientResponse === "pending_review" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium bg-blue-900/40 text-blue-400 border-blue-700">
                              <Hourglass className="w-3 h-3" />
                              En revisión
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {quotation.pdfUrl ? (
                          <a
                            href={quotation.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Download className="w-4 h-4 inline" />
                          </a>
                        ) : (
                          <span className="text-dark-600">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Ver detalles */}
                          <button
                            onClick={() =>
                              navigate(`/rental/quotations/${quotation.id}`)
                            }
                            className="btn-ghost btn-sm"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Editar (solo si no está pagada ni cancelada) */}
                          {editableStatuses.includes(quotation.status) && (
                            <ProtectedAction permission="quotations:update">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/rental/quotations/${quotation.id}/edit`,
                                  )
                                }
                                className="btn-ghost btn-sm text-yellow-400 hover:text-yellow-300"
                                title={
                                  quotation.status === "draft"
                                    ? "Editar"
                                    : "Editar (vuelve a borrador)"
                                }
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </ProtectedAction>
                          )}

                          {/* Enviar workflow (solo borradores) */}
                          {quotation.status === "draft" && (
                            <ProtectedAction permission="quotations:create">
                              <button
                                onClick={() =>
                                  sendMutation.mutate(quotation.id)
                                }
                                disabled={sendMutation.isPending}
                                className={`btn-sm btn-primary transition-all ${
                                  sendMutation.isPending
                                    ? "animate-pulse opacity-75"
                                    : ""
                                }`}
                                title="Enviar cotización al cliente"
                              >
                                {sendMutation.isPending ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </button>
                            </ProtectedAction>
                          )}

                          {/* Aprobar / Rechazar (solo pending_approval) */}
                          {quotation.status === "pending_approval" &&
                            (isOwner ||
                              permissions.includes("quotations:approve") ||
                              permissions.includes(
                                "quotations:approve-credit-limit",
                              )) && (
                              <>
                                <button
                                  onClick={() => handleApprove(quotation)}
                                  disabled={approveMutation.isPending}
                                  className="btn-sm btn-ghost text-green-400 hover:text-green-300"
                                  title="Aprobar cotización"
                                >
                                  <ThumbsUp className="w-4 h-4" />
                                </button>
                                {(isOwner ||
                                  permissions.includes(
                                    "quotations:approve",
                                  )) && (
                                  <button
                                    onClick={() => handleReject(quotation)}
                                    className="btn-sm btn-ghost text-red-400 hover:text-red-300"
                                    title="Rechazar cotización"
                                  >
                                    <ThumbsDown className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}

                          {/* Confirmar pago si hay comprobante subido */}
                          {quotation.metadata?.paymentReceiptUrl &&
                            !["paid", "cancelled"].includes(
                              quotation.status,
                            ) && (
                              <ProtectedAction permission="quotations:confirm-payment">
                                <button
                                  onClick={() =>
                                    handleConfirmPayment(quotation)
                                  }
                                  className="btn-sm btn-ghost text-emerald-400 hover:text-emerald-300"
                                  title="Confirmar pago recibido"
                                >
                                  <CreditCard className="w-4 h-4" />
                                </button>
                              </ProtectedAction>
                            )}

                          {/* Enviar link de revisión al cliente */}
                          {quotation.pdfUrl &&
                            quotation.client?.email &&
                            ["sent", "viewed", "pending_approval"].includes(
                              quotation.status,
                            ) && (
                              <button
                                onClick={() =>
                                  sendReviewMutation.mutate(quotation.id)
                                }
                                disabled={sendReviewMutation.isPending}
                                className="btn-sm btn-ghost text-purple-400 hover:text-purple-300"
                                title="Enviar link de revisión al cliente (aprobar/solicitar cambios)"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            )}

                          {/* Enviar / Reenviar por email (requiere PDF) */}
                          {quotation.client?.email && quotation.pdfUrl && (
                            <button
                              onClick={() => handleSendEmail(quotation)}
                              className={`btn-sm ${
                                sentStatuses.includes(quotation.status)
                                  ? "btn-ghost text-blue-400 hover:text-blue-300"
                                  : "btn-primary"
                              }`}
                              title={
                                sentStatuses.includes(quotation.status)
                                  ? "Reenviar por email"
                                  : "Enviar por email"
                              }
                            >
                              {sentStatuses.includes(quotation.status) ? (
                                <RefreshCw className="w-4 h-4" />
                              ) : (
                                <Mail className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.pagination && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-dark-400">
            Mostrando {data.data.length} de {data.pagination.total} cotizaciones
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setFilters({ ...filters, page: (filters.page || 1) - 1 })
              }
              disabled={filters.page === 1}
              className="btn-secondary btn-sm"
            >
              ← Anterior
            </button>
            <button
              onClick={() =>
                setFilters({ ...filters, page: (filters.page || 1) + 1 })
              }
              disabled={filters.page === data.pagination.totalPages}
              className="btn-secondary btn-sm"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedQuotationForReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-xl border border-dark-700 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ThumbsDown className="w-5 h-5 text-red-400" />
                Rechazar Cotización
              </h2>
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setSelectedQuotationForReject(null);
                  setRejectReason("");
                }}
                className="text-dark-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-dark-800 rounded-lg border border-dark-700">
              <div className="text-sm text-dark-300 mb-1">
                <strong>Cotización:</strong> {selectedQuotationForReject.code}
              </div>
              <div className="text-sm text-dark-300">
                <strong>Cliente:</strong>{" "}
                {selectedQuotationForReject.client?.name}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Motivo del rechazo (Opcional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Indica el motivo del rechazo..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setSelectedQuotationForReject(null);
                  setRejectReason("");
                }}
                className="flex-1 px-4 py-2 border border-dark-600 rounded-lg text-dark-300 hover:bg-dark-800 transition-colors"
                disabled={rejectMutation.isPending}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
                  <>Rechazando...</>
                ) : (
                  <>
                    <ThumbsDown className="w-4 h-4" />
                    Rechazar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {confirmPaymentModalOpen && selectedQuotationForPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-xl border border-dark-700 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Confirmar Pago Recibido
              </h2>
              <button
                onClick={() => {
                  setConfirmPaymentModalOpen(false);
                  setSelectedQuotationForPayment(null);
                  setPaymentNotes("");
                }}
                className="text-dark-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-dark-800 rounded-lg border border-dark-700">
              <div className="text-sm text-dark-300 mb-1">
                <strong>Cotización:</strong> {selectedQuotationForPayment.code}
              </div>
              <div className="text-sm text-dark-300 mb-1">
                <strong>Cliente:</strong>{" "}
                {selectedQuotationForPayment.client?.name}
              </div>
              <div className="text-sm text-dark-300">
                <strong>Total:</strong>{" "}
                {selectedQuotationForPayment.currency === "USD"
                  ? "$"
                  : selectedQuotationForPayment.currency}{" "}
                {Number(selectedQuotationForPayment.totalAmount).toLocaleString(
                  "es-CO",
                )}
              </div>
              {selectedQuotationForPayment.metadata?.paymentReceiptUrl && (
                <div className="mt-2 text-xs text-emerald-400">
                  ✅ Comprobante de pago recibido por el cliente
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Notas internas (Opcional)
              </label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                placeholder="Ej: Transferencia recibida el 15/01 por $5,000..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmPaymentModalOpen(false);
                  setSelectedQuotationForPayment(null);
                  setPaymentNotes("");
                }}
                className="flex-1 px-4 py-2 border border-dark-600 rounded-lg text-dark-300 hover:bg-dark-800 transition-colors"
                disabled={confirmPaymentMutation.isPending}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPaymentSubmit}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={confirmPaymentMutation.isPending}
              >
                {confirmPaymentMutation.isPending ? (
                  <>Confirmando...</>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Confirmar Pago
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <CreditApprovalModal
        isOpen={approveCreditModalOpen}
        quotation={selectedQuotationForApprove}
        isSubmitting={approveMutation.isPending}
        onClose={resetApproveCreditModal}
        onConfirm={handleConfirmApproveCredit}
      />

      {/* Email Modal */}
      {emailModalOpen && selectedQuotationForEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-xl border border-dark-700 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" />
                {selectedQuotationForEmail &&
                sentStatuses.includes(selectedQuotationForEmail.status)
                  ? "Reenviar Cotización por Email"
                  : "Enviar Cotización por Email"}
              </h2>
              <button
                onClick={() => {
                  setEmailModalOpen(false);
                  setSelectedQuotationForEmail(null);
                  setCustomMessage("");
                }}
                className="text-dark-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-dark-800 rounded-lg border border-dark-700">
              <div className="text-sm text-dark-300 mb-1">
                <strong>Cotización:</strong> {selectedQuotationForEmail.code}
              </div>
              <div className="text-sm text-dark-300 mb-1">
                <strong>Cliente:</strong>{" "}
                {selectedQuotationForEmail.client?.name}
              </div>
              <div className="text-sm text-dark-300">
                <strong>Email:</strong>{" "}
                {selectedQuotationForEmail.client?.email}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Mensaje Personalizado (Opcional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Escribe un mensaje personalizado que se incluirá en el email..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEmailModalOpen(false);
                  setSelectedQuotationForEmail(null);
                  setCustomMessage("");
                }}
                className="flex-1 px-4 py-2 border border-dark-600 rounded-lg text-dark-300 hover:bg-dark-800 transition-colors"
                disabled={sendEmailMutation.isPending}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSendEmail}
                className={`flex-1 px-4 py-2 rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  sendEmailMutation.isPending
                    ? "bg-blue-700 text-white animate-pulse"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                disabled={sendEmailMutation.isPending}
              >
                {sendEmailMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Enviando email...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Enviar Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
