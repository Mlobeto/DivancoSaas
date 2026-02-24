import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/core/components/Layout";
import { ProtectedAction } from "@/core/components/ProtectedAction";
import { useAuthStore } from "@/store/auth.store";
import { quotationService } from "../services/quotation.service";
import { Quotation, QuotationStatus } from "../types/quotation.types";
import {
  FileText,
  FilePlus,
  Eye,
  Download,
  FileSignature,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  X,
} from "lucide-react";

export function QuotationsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenant, businessUnit } = useAuthStore();
  const [filters, setFilters] = useState<{
    status?: QuotationStatus;
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

  const statusColors: Record<QuotationStatus, string> = {
    draft: "bg-gray-700/30 text-gray-400 border-gray-600",
    sent: "bg-blue-900/30 text-blue-400 border-blue-800",
    viewed: "bg-cyan-900/30 text-cyan-400 border-cyan-800",
    signature_pending: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
    signed: "bg-green-900/30 text-green-400 border-green-800",
    paid: "bg-emerald-900/30 text-emerald-400 border-emerald-800",
    cancelled: "bg-red-900/30 text-red-400 border-red-800",
  };

  const statusIcons: Record<QuotationStatus, any> = {
    draft: FileText,
    sent: FilePlus,
    viewed: Eye,
    signature_pending: Clock,
    signed: CheckCircle,
    paid: CheckCircle,
    cancelled: XCircle,
  };

  const statusLabels: Record<QuotationStatus, string> = {
    draft: "Borrador",
    sent: "Enviada",
    viewed: "Vista",
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
      subtitle={`Gestión de cotizaciones con auto-cálculo y firma digital - ${businessUnit.name}`}
      actions={
        <>
          <ProtectedAction permission="templates:read">
            <button
              onClick={() => navigate("/rental/templates")}
              className="btn-secondary mr-2"
            >
              <FileSignature className="w-4 h-4 inline mr-1" />
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
          💡 Sistema de Cotizaciones Inteligente
        </h2>
        <p className="text-sm text-gray-300 mb-2">
          Este módulo calcula automáticamente los precios desde los activos
          (maquinaria y herramientas), permite override manual, genera PDFs
          personalizados y gestiona firmas digitales.
        </p>
        <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
          <li>
            <strong>Auto-cálculo:</strong> Los precios se calculan desde los
            assets (días × horas × tarifa).
          </li>
          <li>
            <strong>Override manual:</strong> Puedes editar cualquier precio
            después de crearlo.
          </li>
          <li>
            <strong>Plantillas PDF:</strong> Cada BusinessUnit puede tener sus
            propias plantillas con logo y estilos.
          </li>
          <li>
            <strong>Firma digital:</strong> Integración con SignNow para firmas
            electrónicas.
          </li>
          <li>
            <strong>Conversión:</strong> Una vez firmada, se convierte
            automáticamente en contrato de renta.
          </li>
        </ul>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-3 gap-4">
          <select
            value={filters.status || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value as QuotationStatus | undefined,
                page: 1,
              })
            }
            className="form-input"
          >
            <option value="">Todos los estados</option>
            <option value="draft">Borradores</option>
            <option value="sent">Enviadas</option>
            <option value="signature_pending">Pendiente Firma</option>
            <option value="signed">Firmadas</option>
            <option value="paid">Pagadas</option>
            <option value="cancelled">Canceladas</option>
          </select>

          <div className="col-span-2 flex items-center gap-2 text-sm text-dark-400">
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
                  const StatusIcon = statusIcons[quotation.status];
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
                          {quotation.totalAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        {new Date(quotation.validUntil).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium ${
                            statusColors[quotation.status]
                          }`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusLabels[quotation.status]}
                        </span>
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
                          <button
                            onClick={() =>
                              navigate(`/rental/quotations/${quotation.id}`)
                            }
                            className="btn-ghost btn-sm"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {quotation.client?.email && quotation.pdfUrl && (
                            <button
                              onClick={() => handleSendEmail(quotation)}
                              className="btn-primary btn-sm"
                              title="Enviar por email"
                            >
                              <Mail className="w-4 h-4" />
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

      {/* Email Modal */}
      {emailModalOpen && selectedQuotationForEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-xl border border-dark-700 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" />
                Enviar Cotización por Email
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
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={sendEmailMutation.isPending}
              >
                {sendEmailMutation.isPending ? (
                  <>Enviando...</>
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
