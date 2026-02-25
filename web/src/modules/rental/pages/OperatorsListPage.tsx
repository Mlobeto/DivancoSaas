import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/core/components/Layout";
import { ProtectedAction } from "@/core/components/ProtectedAction";
import { useAuthStore } from "@/store/auth.store";
import { operatorService } from "../services/operator.service";
import {
  OperatorProfile,
  OperatorStatus,
  OperatorType,
  OPERATOR_STATUS_LABELS,
  OPERATOR_TYPE_LABELS,
} from "../types/operator.types";
import {
  User,
  UserPlus,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Users,
} from "lucide-react";

export function OperatorsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenant, businessUnit } = useAuthStore();
  const [filters, setFilters] = useState<{
    status?: OperatorStatus;
    operatorType?: OperatorType;
    search?: string;
    page?: number;
    limit?: number;
  }>({
    page: 1,
    limit: 20,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["operators", tenant?.id, businessUnit?.id, filters],
    queryFn: () => operatorService.listProfiles(filters),
    enabled: !!tenant?.id && !!businessUnit?.id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (operatorId: string) =>
      operatorService.deleteProfile(operatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operators"] });
      alert("✅ Operador eliminado exitosamente");
    },
    onError: (error: any) => {
      alert(
        `❌ Error al eliminar operador: ${error.message || "Error desconocido"}`,
      );
    },
  });

  const handleDelete = (operator: OperatorProfile) => {
    if (
      window.confirm(
        `¿Estás seguro de eliminar al operador ${operator.user?.firstName} ${operator.user?.lastName}?`,
      )
    ) {
      deleteMutation.mutate(operator.id);
    }
  };

  const statusColors: Record<OperatorStatus, string> = {
    ACTIVE: "bg-green-900/30 text-green-400 border-green-800",
    INACTIVE: "bg-gray-700/30 text-gray-400 border-gray-600",
    ON_LEAVE: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
    TERMINATED: "bg-red-900/30 text-red-400 border-red-800",
  };

  const statusIcons: Record<OperatorStatus, any> = {
    ACTIVE: CheckCircle,
    INACTIVE: XCircle,
    ON_LEAVE: Clock,
    TERMINATED: XCircle,
  };

  return (
    <Layout
      title="Gestión de Operadores"
      actions={
        <>
          <ProtectedAction permission="operators:create">
            <button
              onClick={() => navigate("/rental/operators/new")}
              className="btn-primary"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Operador
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
          👷 Sistema de Gestión de Operadores
        </h2>
        <p className="text-sm text-gray-300 mb-2">
          Gestiona operadores de maquinaria, asignaciones a contratos, reportes
          diarios desde mobile y control de gastos.
        </p>
        <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
          <li>
            <strong>Perfiles:</strong> Operadores internos, externos y
            subcontratistas.
          </li>
          <li>
            <strong>Documentos:</strong> Licencias, certificaciones y seguros
            con verificación.
          </li>
          <li>
            <strong>Asignaciones:</strong> Vincula operadores a contratos y
            assets específicos.
          </li>
          <li>
            <strong>Reportes diarios:</strong> Los operadores registran trabajo
            desde la app móvil.
          </li>
          <li>
            <strong>Gastos:</strong> Control de gastos con límites diarios y
            aprobación.
          </li>
        </ul>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.status || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value as OperatorStatus | undefined,
                page: 1,
              })
            }
            className="form-input"
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
            <option value="ON_LEAVE">Con Licencia</option>
            <option value="TERMINATED">Desvinculados</option>
          </select>

          <select
            value={filters.operatorType || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                operatorType: e.target.value as OperatorType | undefined,
                page: 1,
              })
            }
            className="form-input"
          >
            <option value="">Todos los tipos</option>
            <option value="INTERNAL">Internos</option>
            <option value="EXTERNAL">Externos</option>
            <option value="SUBCONTRACTOR">Subcontratistas</option>
          </select>

          <input
            type="text"
            placeholder="Buscar por nombre, documento..."
            value={filters.search || ""}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value, page: 1 })
            }
            className="form-input"
          />
        </div>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card bg-green-900/20 border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Activos</p>
                <p className="text-2xl font-bold text-green-400">
                  {data.data.filter((o) => o.status === "ACTIVE").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400/50" />
            </div>
          </div>
          <div className="card bg-yellow-900/20 border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Con Licencia</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {data.data.filter((o) => o.status === "ON_LEAVE").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400/50" />
            </div>
          </div>
          <div className="card bg-gray-700/20 border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Inactivos</p>
                <p className="text-2xl font-bold text-gray-400">
                  {data.data.filter((o) => o.status === "INACTIVE").length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-gray-400/50" />
            </div>
          </div>
          <div className="card bg-primary-900/20 border-primary-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-2xl font-bold text-primary-400">
                  {data.data.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-primary-400/50" />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-dark-400">
            Cargando operadores...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            Error al cargar operadores
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-dark-400 mb-4">
              No hay operadores registrados aún
            </p>
            <ProtectedAction permission="operators:create">
              <button
                onClick={() => navigate("/rental/operators/new")}
                className="btn-primary"
              >
                <UserPlus className="w-4 h-4" />
                Crear primer operador
              </button>
            </ProtectedAction>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-600 bg-dark-800/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-300 uppercase">
                    Operador
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-300 uppercase">
                    Documento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-300 uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-300 uppercase">
                    Tarifas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-300 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-dark-300 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600">
                {data.data.map((operator) => {
                  const StatusIcon = statusIcons[operator.status];
                  return (
                    <tr
                      key={operator.id}
                      className="hover:bg-dark-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-900/30 border border-primary-800 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-400" />
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {operator.user?.firstName}{" "}
                              {operator.user?.lastName}
                            </div>
                            <div className="text-xs text-dark-400">
                              {operator.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-300">
                        {operator.document}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-900/30 text-primary-300 border border-primary-800">
                          {OPERATOR_TYPE_LABELS[operator.operatorType]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {operator.dailyRate && (
                          <div className="text-dark-300">
                            ${operator.dailyRate.toLocaleString()}/día
                          </div>
                        )}
                        {operator.hourlyRate && (
                          <div className="text-dark-400 text-xs">
                            ${operator.hourlyRate.toLocaleString()}/hora
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[operator.status]}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {OPERATOR_STATUS_LABELS[operator.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <ProtectedAction permission="operators:read">
                            <button
                              onClick={() =>
                                navigate(`/rental/operators/${operator.id}`)
                              }
                              className="btn-icon btn-ghost"
                              title="Ver detalles"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </ProtectedAction>
                          <ProtectedAction permission="operators:update">
                            <button
                              onClick={() =>
                                navigate(
                                  `/rental/operators/${operator.id}/edit`,
                                )
                              }
                              className="btn-icon btn-ghost text-primary-400 hover:text-primary-300"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </ProtectedAction>
                          <ProtectedAction permission="operators:delete">
                            <button
                              onClick={() => handleDelete(operator)}
                              className="btn-icon btn-ghost text-red-400 hover:text-red-300"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </ProtectedAction>
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
      {data && data.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-dark-400">
            Página {data.pagination.page} de {data.pagination.totalPages} (
            {data.pagination.total} operadores)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setFilters({ ...filters, page: (filters.page || 1) - 1 })
              }
              disabled={!filters.page || filters.page <= 1}
              className="btn-ghost"
            >
              ← Anterior
            </button>
            <button
              onClick={() =>
                setFilters({ ...filters, page: (filters.page || 1) + 1 })
              }
              disabled={filters.page === data.pagination.totalPages}
              className="btn-ghost"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
