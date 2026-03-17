import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import { contractService, RentalContract } from "../services/contract.service";
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  PauseCircle,
  PlayCircle,
  Package,
  Eye,
  Receipt,
} from "lucide-react";

type ContractStatus = "active" | "suspended" | "completed" | "cancelled";

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

const STATUS_ICONS: Record<ContractStatus, any> = {
  active: CheckCircle,
  suspended: PauseCircle,
  completed: FileText,
  cancelled: XCircle,
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

export function ContractsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenant, businessUnit } = useAuthStore();

  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["contracts", tenant?.id, businessUnit?.id, statusFilter],
    queryFn: () => contractService.list({ status: statusFilter || undefined }),
    enabled: !!tenant?.id && !!businessUnit?.id,
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => contractService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      alert("✅ Contrato completado");
    },
    onError: (e: any) =>
      alert(`❌ ${e.response?.data?.error?.message || e.message}`),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => contractService.suspend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      alert("⏸ Contrato suspendido");
    },
    onError: (e: any) =>
      alert(`❌ ${e.response?.data?.error?.message || e.message}`),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => contractService.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      alert("▶️ Contrato reactivado");
    },
    onError: (e: any) =>
      alert(`❌ ${e.response?.data?.error?.message || e.message}`),
  });

  const contracts: RentalContract[] = data?.data ?? [];

  // Totales rápidos
  const totals = {
    active: contracts.filter((c) => c.status === "active").length,
    suspended: contracts.filter((c) => c.status === "suspended").length,
    completed: contracts.filter((c) => c.status === "completed").length,
    withReceipt: contracts.filter(
      (c) => c.receiptUploadedAt && c.status === "active",
    ).length,
  };

  return (
    <Layout
      title="Contratos de Renta"
      subtitle={`Contratos activos y cerrados — ${businessUnit?.name}`}
      actions={
        <div className="flex items-center gap-2">
          <a href="/dashboard" className="btn-ghost">
            ← Dashboard
          </a>
          <button
            onClick={() => navigate("/rental/contracts/new")}
            className="btn-primary flex items-center gap-2"
          >
            + Nuevo Contrato
          </button>
        </div>
      }
    >
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-400">
            {totals.active}
          </div>
          <div className="text-xs text-dark-400 mt-1">Activos</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {totals.suspended}
          </div>
          <div className="text-xs text-dark-400 mt-1">Suspendidos</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-400">
            {totals.completed}
          </div>
          <div className="text-xs text-dark-400 mt-1">Completados</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-400">
            {totals.withReceipt}
          </div>
          <div className="text-xs text-dark-400 mt-1">Con comprobante</div>
        </div>
      </div>

      {/* Filtro */}
      <div className="card mb-6">
        <div className="flex gap-3 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input w-52"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="suspended">Suspendidos</option>
            <option value="completed">Completados</option>
            <option value="cancelled">Cancelados</option>
          </select>
          <span className="text-sm text-dark-400">
            {contracts.length} contrato{contracts.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-dark-400">
            Cargando contratos...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            Error al cargar contratos
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-dark-600 mb-4" />
            <p className="text-dark-400 mb-2">No hay contratos aún</p>
            <p className="text-sm text-dark-500 mb-4">
              Puedes crear un contrato manualmente o desde una cotización
              aprobada.
            </p>
            <button
              onClick={() => navigate("/rental/contracts/new")}
              className="btn-primary"
            >
              + Crear primer contrato
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
                    Estado
                  </th>
                  <th className="text-left p-4 text-dark-300 font-medium text-sm">
                    Inicio
                  </th>
                  <th className="text-left p-4 text-dark-300 font-medium text-sm">
                    Fin estimado
                  </th>
                  <th className="text-left p-4 text-dark-300 font-medium text-sm">
                    Total est.
                  </th>
                  <th className="text-left p-4 text-dark-300 font-medium text-sm">
                    Assets
                  </th>
                  <th className="text-right p-4 text-dark-300 font-medium text-sm">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => {
                  const Icon =
                    STATUS_ICONS[contract.status as ContractStatus] ?? Clock;
                  const colorClass =
                    STATUS_COLORS[contract.status as ContractStatus] ??
                    "bg-gray-700/30 text-gray-400 border-gray-600";
                  const labelText =
                    STATUS_LABELS[contract.status as ContractStatus] ??
                    contract.status;
                  const hasReceipt = !!contract.receiptUploadedAt;

                  return (
                    <tr
                      key={contract.id}
                      className="border-b border-dark-800 hover:bg-dark-800/30 transition-colors"
                    >
                      {/* Código */}
                      <td className="p-4">
                        <div>
                          <span className="font-mono text-sm font-bold">
                            {contract.code}
                          </span>
                          {hasReceipt && (
                            <span
                              className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs
                                         bg-purple-900/40 text-purple-400 border border-purple-700"
                              title="Comprobante de pago recibido"
                            >
                              <Receipt className="w-3 h-3" />
                              Comprobante
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="p-4">
                        <div className="font-medium">
                          {contract.client?.name ?? "-"}
                        </div>
                        {contract.client?.email && (
                          <div className="text-xs text-dark-400">
                            {contract.client.email}
                          </div>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium ${colorClass}`}
                        >
                          <Icon className="w-3 h-3" />
                          {labelText}
                        </span>
                      </td>

                      {/* Inicio */}
                      <td className="p-4 text-sm">
                        {fmtDate(contract.startDate)}
                      </td>

                      {/* Fin estimado */}
                      <td className="p-4 text-sm">
                        {fmtDate(contract.estimatedEndDate)}
                      </td>

                      {/* Total estimado */}
                      <td className="p-4">
                        <span className="font-bold text-primary-400">
                          {fmt(contract.estimatedTotal, contract.currency)}
                        </span>
                      </td>

                      {/* Assets activos */}
                      <td className="p-4">
                        {(contract.activeRentals?.length ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-sm text-cyan-400">
                            <Package className="w-3 h-3" />
                            {contract.activeRentals!.length} activo
                            {contract.activeRentals!.length !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-dark-600 text-sm">—</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Ver detalle */}
                          <button
                            onClick={() =>
                              navigate(`/rental/contracts/${contract.id}`)
                            }
                            className="btn-ghost btn-sm"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Descargar PDF */}
                          {(contract.signedPdfUrl || contract.pdfUrl) && (
                            <a
                              href={contract.signedPdfUrl ?? contract.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-ghost btn-sm text-blue-400 hover:text-blue-300"
                              title="Descargar PDF"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}

                          {/* Suspender / Reactivar */}
                          {contract.status === "active" && (
                            <button
                              onClick={() =>
                                suspendMutation.mutate(contract.id)
                              }
                              disabled={suspendMutation.isPending}
                              className="btn-ghost btn-sm text-yellow-400 hover:text-yellow-300"
                              title="Suspender contrato"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          )}
                          {contract.status === "suspended" && (
                            <button
                              onClick={() =>
                                reactivateMutation.mutate(contract.id)
                              }
                              disabled={reactivateMutation.isPending}
                              className="btn-ghost btn-sm text-green-400 hover:text-green-300"
                              title="Reactivar contrato"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Completar */}
                          {contract.status === "active" && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `¿Completar el contrato ${contract.code}? Esta acción cerrará el contrato.`,
                                  )
                                ) {
                                  completeMutation.mutate(contract.id);
                                }
                              }}
                              disabled={completeMutation.isPending}
                              className="btn-ghost btn-sm text-blue-400 hover:text-blue-300"
                              title="Marcar como completado"
                            >
                              <CheckCircle className="w-4 h-4" />
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
    </Layout>
  );
}
