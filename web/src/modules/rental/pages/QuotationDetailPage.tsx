import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { quotationService } from "../services/quotation.service";
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Download,
  Edit,
  Mail,
  UserCheck,
  MessageSquareWarning,
  AlertCircle,
  DollarSign,
  Package,
  Hourglass,
} from "lucide-react";

export function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: quotation,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["quotation", id],
    queryFn: () => quotationService.getById(id!),
    enabled: !!id,
  });

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-dark-300">Cargando cotización...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !quotation) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-900/20 border border-red-800 text-red-400 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Error</span>
            </div>
            <p>No se pudo cargar la cotización</p>
          </div>
          <button
            onClick={() => navigate("/rental/quotations")}
            className="mt-4 btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al listado
          </button>
        </div>
      </Layout>
    );
  }

  const statusLabels: Record<
    string,
    {
      label: string;
      color: string;
      icon: React.ComponentType<{ className?: string }>;
    }
  > = {
    draft: {
      label: "Borrador",
      color: "bg-gray-700/30 text-gray-400 border-gray-600",
      icon: FileText,
    },
    sent: {
      label: "Enviada",
      color: "bg-blue-900/30 text-blue-400 border-blue-800",
      icon: Mail,
    },
    viewed: {
      label: "Vista",
      color: "bg-purple-900/30 text-purple-400 border-purple-800",
      icon: Clock,
    },
    pending_approval: {
      label: "Pend. Aprobación",
      color: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
      icon: Hourglass,
    },
    approved: {
      label: "Aprobada",
      color: "bg-green-900/30 text-green-400 border-green-800",
      icon: CheckCircle,
    },
    paid: {
      label: "Pagada",
      color: "bg-emerald-900/30 text-emerald-400 border-emerald-800",
      icon: DollarSign,
    },
    cancelled: {
      label: "Cancelada",
      color: "bg-red-900/30 text-red-400 border-red-800",
      icon: XCircle,
    },
    changes_requested: {
      label: "Cambios solicitados",
      color: "bg-orange-900/30 text-orange-400 border-orange-800",
      icon: MessageSquareWarning,
    },
  };

  const clientResponseLabels: Record<
    string,
    {
      label: string;
      color: string;
      icon: React.ComponentType<{ className?: string }>;
    }
  > = {
    pending_review: {
      label: "Pendiente de revisión",
      color: "bg-yellow-900/40 text-yellow-400 border-yellow-700",
      icon: Hourglass,
    },
    approved: {
      label: "Aprobada por el cliente",
      color: "bg-green-900/40 text-green-400 border-green-700",
      icon: UserCheck,
    },
    changes_requested: {
      label: "Cliente pidió cambios",
      color: "bg-orange-900/40 text-orange-400 border-orange-700",
      icon: MessageSquareWarning,
    },
  };

  const periodLabels: Record<string, string> = {
    daily: "Diario",
    weekly: "Semanal",
    monthly: "Mensual",
  };

  const status = statusLabels[quotation.status] || statusLabels.draft;
  const StatusIcon = status.icon;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate("/rental/quotations")}
            className="btn-secondary mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al listado
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {quotation.code}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${status.color}`}
                >
                  <StatusIcon className="w-4 h-4" />
                  {status.label}
                </span>

                {quotation.clientResponse &&
                  clientResponseLabels[quotation.clientResponse] && (
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${
                        clientResponseLabels[quotation.clientResponse].color
                      }`}
                    >
                      {(() => {
                        const ResponseIcon =
                          clientResponseLabels[quotation.clientResponse].icon;
                        return <ResponseIcon className="w-4 h-4" />;
                      })()}
                      {clientResponseLabels[quotation.clientResponse].label}
                    </span>
                  )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {quotation.pdfUrl && (
                <a
                  href={quotation.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </a>
              )}

              {quotation.status === "draft" && (
                <button
                  onClick={() => navigate(`/rental/quotations/${id}/edit`)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
              )}

              {quotation.clientResponse === "approved" &&
                !quotation.metadata?.masterContractId && (
                  <button
                    onClick={() =>
                      navigate(`/rental/contracts/new?quotationId=${id}`)
                    }
                    className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-500"
                  >
                    <FileText className="w-4 h-4" />
                    Generar Contrato Marco
                  </button>
                )}

              {quotation.metadata?.masterContractId && (
                <button
                  onClick={() =>
                    navigate(
                      `/rental/contracts/${quotation.metadata!.masterContractId}`,
                    )
                  }
                  className="btn-secondary flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Ver Contrato
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Información General
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-dark-300">Cliente</label>
                  <p className="text-white font-medium">
                    {quotation.client?.name || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-dark-300">Email</label>
                  <p className="text-white font-medium">
                    {quotation.client?.email || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-dark-300">
                    Fecha de cotización
                  </label>
                  <p className="text-white font-medium">
                    {formatDate(quotation.quotationDate)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-dark-300">Válida hasta</label>
                  <p className="text-white font-medium">
                    {formatDate(quotation.validUntil)}
                  </p>
                </div>
                {quotation.quotationType === "time_based" &&
                  quotation.estimatedDays && (
                    <>
                      <div>
                        <label className="text-sm text-dark-300">
                          Días estimados
                        </label>
                        <p className="text-white font-medium">
                          {quotation.estimatedDays} días
                        </p>
                      </div>
                      {quotation.estimatedStartDate && (
                        <div>
                          <label className="text-sm text-dark-300">
                            Inicio estimado
                          </label>
                          <p className="text-white font-medium">
                            {formatDate(quotation.estimatedStartDate)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                {quotation.quotationType === "service_based" &&
                  quotation.serviceDescription && (
                    <div className="col-span-2">
                      <label className="text-sm text-dark-300">
                        Descripción del servicio
                      </label>
                      <p className="text-white font-medium">
                        {quotation.serviceDescription}
                      </p>
                    </div>
                  )}
              </div>
            </div>

            {quotation.clientResponse &&
              quotation.clientResponse !== "pending_review" &&
              clientResponseLabels[quotation.clientResponse] && (
                <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-400" />
                    Respuesta del Cliente
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      {(() => {
                        const ResponseIcon =
                          clientResponseLabels[quotation.clientResponse!].icon;
                        return <ResponseIcon className="w-5 h-5 mt-0.5" />;
                      })()}
                      <div className="flex-1">
                        <p className="text-dark-200 font-medium mb-1">
                          {clientResponseLabels[quotation.clientResponse].label}
                        </p>
                        {quotation.clientRespondedAt && (
                          <p className="text-sm text-dark-400">
                            {formatDateTime(quotation.clientRespondedAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    {quotation.selectedPeriodType && (
                      <div className="bg-dark-700/50 border border-dark-600 rounded-lg p-4">
                        <label className="text-sm text-dark-300 block mb-1">
                          Período seleccionado por el cliente
                        </label>
                        <p className="text-white font-semibold">
                          {periodLabels[quotation.selectedPeriodType] ||
                            quotation.selectedPeriodType}
                        </p>
                      </div>
                    )}

                    {quotation.clientMessage && (
                      <div className="bg-dark-700/50 border border-dark-600 rounded-lg p-4">
                        <label className="text-sm text-dark-300 block mb-2">
                          Mensaje del cliente
                        </label>
                        <p className="text-white whitespace-pre-wrap">
                          {quotation.clientMessage}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                Items ({quotation.items.length})
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-700">
                    <tr className="text-left">
                      <th className="pb-3 text-sm font-medium text-dark-300">
                        Descripción
                      </th>
                      <th className="pb-3 text-sm font-medium text-dark-300 text-center">
                        Cantidad
                      </th>
                      <th className="pb-3 text-sm font-medium text-dark-300 text-right">
                        Precio Unit.
                      </th>
                      <th className="pb-3 text-sm font-medium text-dark-300 text-right">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {quotation.items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-3">
                          <p className="text-white font-medium">
                            {item.description}
                          </p>
                          {item.notes && (
                            <p className="text-sm text-dark-400 mt-1">
                              {item.notes}
                            </p>
                          )}
                        </td>
                        <td className="py-3 text-center text-white">
                          {item.quantity}
                        </td>
                        <td className="py-3 text-right text-white">
                          {quotation.currency}{" "}
                          {Number(item.unitPrice).toLocaleString("es-CO")}
                        </td>
                        <td className="py-3 text-right text-white font-medium">
                          {quotation.currency}{" "}
                          {Number(item.subtotal).toLocaleString("es-CO")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {quotation.notes && (
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Notas
                </h2>
                <p className="text-dark-200 whitespace-pre-wrap">
                  {quotation.notes}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Resumen Financiero
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-dark-300">Subtotal</span>
                  <span className="text-white font-medium">
                    {quotation.currency}{" "}
                    {Number(quotation.subtotal).toLocaleString("es-CO")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-300">
                    IVA ({Number(quotation.taxRate)}%)
                  </span>
                  <span className="text-white font-medium">
                    {quotation.currency}{" "}
                    {Number(quotation.taxAmount).toLocaleString("es-CO")}
                  </span>
                </div>
                <div className="pt-3 border-t border-dark-700 flex justify-between">
                  <span className="text-white font-semibold text-lg">
                    Total
                  </span>
                  <span className="text-green-400 font-bold text-xl">
                    {quotation.currency}{" "}
                    {Number(quotation.totalAmount).toLocaleString("es-CO")}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Información Adicional
              </h2>

              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-dark-300 block mb-1">Creado</label>
                  <p className="text-white">
                    {formatDateTime(quotation.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-dark-300 block mb-1">
                    Actualizado
                  </label>
                  <p className="text-white">
                    {formatDateTime(quotation.updatedAt)}
                  </p>
                </div>
                {quotation.assignedUser && (
                  <div>
                    <label className="text-dark-300 block mb-1">
                      Asignado a
                    </label>
                    <p className="text-white">{quotation.assignedUser.email}</p>
                  </div>
                )}
                {quotation.businessUnit && (
                  <div>
                    <label className="text-dark-300 block mb-1">
                      Business Unit
                    </label>
                    <p className="text-white">{quotation.businessUnit.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
