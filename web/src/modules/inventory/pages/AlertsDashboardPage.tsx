/**
 * DOCUMENT EXPIRY ALERTS DASHBOARD
 * Dashboard para monitorear documentos próximos a vencer
 */

import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import {
  alertsService,
  type ExpiringDocument,
} from "@/modules/inventory/services/alerts.service";
import {
  AlertCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Calendar,
  Package,
} from "lucide-react";
import { Link } from "react-router-dom";

export function AlertsDashboardPage() {
  const { tenant, businessUnit } = useAuthStore();

  // Fetch expiring documents
  const { data, isLoading } = useQuery({
    queryKey: ["expiring-documents", businessUnit?.id],
    queryFn: () => alertsService.getExpiringDocumentsByStatus(),
    enabled: !!tenant?.id && !!businessUnit?.id,
    refetchInterval: 60000, // Refetch every minute
  });

  if (!tenant || !businessUnit) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-400">
            Selecciona un tenant y unidad de negocio
          </p>
        </div>
      </Layout>
    );
  }

  const totalAlerts =
    (data?.expired.length || 0) +
    (data?.expiringSoon.length || 0) +
    (data?.expiringMedium.length || 0);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysLabel = (days: number): string => {
    if (days < 0) return `Vencido hace ${Math.abs(days)} días`;
    if (days === 0) return "Vence hoy";
    if (days === 1) return "Vence mañana";
    return `Vence en ${days} días`;
  };

  const DocumentCard = ({ doc }: { doc: ExpiringDocument }) => {
    const statusConfig = {
      EXPIRED: {
        bg: "bg-red-900/30",
        border: "border-red-800",
        text: "text-red-400",
        icon: XCircle,
      },
      EXPIRING: {
        bg: doc.daysUntilExpiry <= 7 ? "bg-orange-900/30" : "bg-yellow-900/30",
        border:
          doc.daysUntilExpiry <= 7 ? "border-orange-800" : "border-yellow-800",
        text: doc.daysUntilExpiry <= 7 ? "text-orange-400" : "text-yellow-400",
        icon: doc.daysUntilExpiry <= 7 ? AlertTriangle : AlertCircle,
      },
      ACTIVE: {
        bg: "bg-blue-900/30",
        border: "border-blue-800",
        text: "text-blue-400",
        icon: FileText,
      },
      ARCHIVED: {
        bg: "bg-gray-900/30",
        border: "border-gray-800",
        text: "text-gray-400",
        icon: FileText,
      },
    };

    const config = statusConfig[doc.status];
    const Icon = config.icon;

    return (
      <div
        className={`${config.bg} border ${config.border} rounded-lg p-4 hover:opacity-80 transition-opacity`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div
              className={`p-2 rounded-lg ${config.bg}`}
              style={{
                backgroundColor: doc.documentType?.color
                  ? doc.documentType.color + "30"
                  : undefined,
              }}
            >
              <Icon
                className="w-5 h-5"
                style={{
                  color: doc.documentType?.color || undefined,
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {doc.documentType && (
                  <span className={`text-sm font-semibold ${config.text}`}>
                    {doc.documentType.name}
                  </span>
                )}
                <span className="text-xs text-gray-400">{doc.type}</span>
              </div>
              <p className="text-sm text-white font-medium mb-1">
                {doc.fileName}
              </p>
              {doc.asset && (
                <Link
                  to={`/machinery/${doc.asset.id}`}
                  className="text-sm text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Package className="w-3 h-3" />
                  {doc.asset.code} - {doc.asset.name}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {doc.issueDate && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Emisión:</span>
              <span className="text-gray-300">{formatDate(doc.issueDate)}</span>
            </div>
          )}
          {doc.expiryDate && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Vencimiento:</span>
              <span className={config.text}>{formatDate(doc.expiryDate)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <span className="text-gray-400">Estado:</span>
            <span className={`${config.text} font-semibold`}>
              {getDaysLabel(doc.daysUntilExpiry)}
            </span>
          </div>
        </div>

        {doc.notes && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400">{doc.notes}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Alertas de Vencimiento
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Monitoreo de documentos próximos a vencer o vencidos
            </p>
          </div>
          <Link
            to="/inventory/document-types"
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Gestionar Tipos de Documentos
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-700 rounded-lg">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Alertas</p>
                <p className="text-2xl font-bold text-white">{totalAlerts}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-900/50 rounded-lg">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-red-300 text-sm">Vencidos</p>
                <p className="text-2xl font-bold text-red-400">
                  {data?.expired.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-900/30 border border-orange-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-900/50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-orange-300 text-sm">Urgentes (≤7 días)</p>
                <p className="text-2xl font-bold text-orange-400">
                  {data?.expiringSoon.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-900/50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-yellow-300 text-sm">Próximos (≤30 días)</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {data?.expiringMedium.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400">Cargando alertas...</p>
          </div>
        ) : totalAlerts === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-800 border border-gray-700 rounded-lg">
            <Calendar className="w-16 h-16 text-green-600 mb-4" />
            <p className="text-white font-semibold mb-2">¡Todo en orden!</p>
            <p className="text-gray-400 text-sm">
              No hay documentos próximos a vencer
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Expired Documents */}
            {data?.expired && data.expired.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <h2 className="text-lg font-semibold text-red-400">
                    Documentos Vencidos ({data.expired.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.expired.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} />
                  ))}
                </div>
              </div>
            )}

            {/* Expiring Soon */}
            {data?.expiringSoon && data.expiringSoon.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <h2 className="text-lg font-semibold text-orange-400">
                    Urgente - Vencen en 7 días o menos (
                    {data.expiringSoon.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.expiringSoon.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} />
                  ))}
                </div>
              </div>
            )}

            {/* Expiring Medium */}
            {data?.expiringMedium && data.expiringMedium.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-lg font-semibold text-yellow-400">
                    Vencen en 8-30 días ({data.expiringMedium.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.expiringMedium.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
