import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/core/components/Layout";
import { ProtectedAction } from "@/core/components/ProtectedAction";
import { useAuthStore } from "@/store/auth.store";
import { operatorService } from "../services/operator.service";
import {
  OPERATOR_TYPE_LABELS,
  OPERATOR_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  RATE_TYPE_LABELS,
  EXPENSE_TYPE_LABELS,
  EXPENSE_STATUS_LABELS,
} from "../types/operator.types";
import {
  User,
  Edit,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  ArrowLeft,
} from "lucide-react";

export function OperatorDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { businessUnit } = useAuthStore();

  // Load operator with all relations
  const {
    data: operator,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["operator", id],
    queryFn: () => operatorService.getProfile(id!),
    enabled: !!id,
  });

  // Load assignments
  const { data: assignments } = useQuery({
    queryKey: ["operator-assignments", id],
    queryFn: () => operatorService.listAssignments({ operatorProfileId: id }),
    enabled: !!id,
  });

  // Load expenses
  const { data: expensesData } = useQuery({
    queryKey: ["operator-expenses", id],
    queryFn: async () => {
      if (!assignments?.length)
        return {
          data: [],
          pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
        };
      // Get expenses for first assignment (you can expand this)
      const firstAssignmentId = assignments[0]?.id;
      if (!firstAssignmentId)
        return {
          data: [],
          pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
        };
      return operatorService.listExpenses({
        assignmentId: firstAssignmentId,
        limit: 10,
      });
    },
    enabled: !!assignments && assignments.length > 0,
  });

  // Approve document mutation
  const approveDocumentMutation = useMutation({
    mutationFn: ({ documentId }: { documentId: string }) =>
      operatorService.updateDocument(id!, documentId, {
        verificationStatus: "APPROVED",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operator", id] });
      alert("✅ Documento aprobado");
    },
  });

  // Reject document mutation
  const rejectDocumentMutation = useMutation({
    mutationFn: ({
      documentId,
      notes,
    }: {
      documentId: string;
      notes: string;
    }) =>
      operatorService.updateDocument(id!, documentId, {
        verificationStatus: "REJECTED",
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operator", id] });
      alert("❌ Documento rechazado");
    },
  });

  if (isLoading) {
    return (
      <Layout title="Cargando...">
        <div className="p-8 text-center text-dark-400">
          Cargando información del operador...
        </div>
      </Layout>
    );
  }

  if (error || !operator) {
    return (
      <Layout title="Error">
        <div className="p-8 text-center text-red-400">
          Error al cargar operador
        </div>
      </Layout>
    );
  }

  const statusColors = {
    ACTIVE: "bg-green-900/30 text-green-400 border-green-800",
    INACTIVE: "bg-gray-700/30 text-gray-400 border-gray-600",
    ON_LEAVE: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
    TERMINATED: "bg-red-900/30 text-red-400 border-red-800",
  };

  const documentStatusColors = {
    PENDING: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
    APPROVED: "bg-green-900/30 text-green-400 border-green-800",
    REJECTED: "bg-red-900/30 text-red-400 border-red-800",
    EXPIRED: "bg-red-900/30 text-red-400 border-red-800",
  };

  return (
    <Layout
      title={`${operator.user?.firstName} ${operator.user?.lastName}`}
      subtitle={`Operador - ${businessUnit?.name}`}
      actions={
        <>
          <ProtectedAction permission="operators:update">
            <button
              onClick={() => navigate(`/rental/operators/${id}/edit`)}
              className="btn-primary"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
          </ProtectedAction>
          <button
            onClick={() => navigate("/rental/operators")}
            className="btn-ghost"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </>
      }
    >
      {/* Header Card */}
      <div className="card mb-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-primary-900/30 border-2 border-primary-800 flex items-center justify-center flex-shrink-0">
            <User className="w-12 h-12 text-primary-400" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {operator.user?.firstName} {operator.user?.lastName}
                </h2>
                <p className="text-dark-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {operator.user?.email}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${statusColors[operator.status]}`}
              >
                {operator.status === "ACTIVE" ? (
                  <CheckCircle className="w-4 h-4" />
                ) : operator.status === "ON_LEAVE" ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {OPERATOR_STATUS_LABELS[operator.status]}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-dark-400 mb-1">Documento</p>
                <p className="text-sm font-medium text-white flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  {operator.document}
                </p>
              </div>
              <div>
                <p className="text-xs text-dark-400 mb-1">Teléfono</p>
                <p className="text-sm font-medium text-white flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {operator.phone}
                </p>
              </div>
              <div>
                <p className="text-xs text-dark-400 mb-1">Tipo</p>
                <p className="text-sm font-medium text-primary-400">
                  {OPERATOR_TYPE_LABELS[operator.operatorType]}
                </p>
              </div>
              <div>
                <p className="text-xs text-dark-400 mb-1">Fecha Ingreso</p>
                <p className="text-sm font-medium text-white flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {operator.hireDate
                    ? new Date(operator.hireDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Rates */}
            {(operator.dailyRate || operator.hourlyRate) && (
              <div className="mt-4 pt-4 border-t border-dark-700">
                <p className="text-xs text-dark-400 mb-2">Tarifas</p>
                <div className="flex gap-4">
                  {operator.dailyRate && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white">
                        ${operator.dailyRate.toLocaleString()}/día
                      </span>
                    </div>
                  )}
                  {operator.hourlyRate && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-white">
                        ${operator.hourlyRate.toLocaleString()}/hora
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Address */}
            {operator.address && (
              <div className="mt-4 pt-4 border-t border-dark-700">
                <p className="text-xs text-dark-400 mb-1">Dirección</p>
                <p className="text-sm text-white flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {operator.address}
                </p>
              </div>
            )}

            {/* Notes */}
            {operator.notes && (
              <div className="mt-4 pt-4 border-t border-dark-700">
                <p className="text-xs text-dark-400 mb-1">Notas</p>
                <p className="text-sm text-dark-300">{operator.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-400" />
            Documentos
          </h3>

          {!operator.documents || operator.documents.length === 0 ? (
            <p className="text-dark-400 text-center py-8">
              No hay documentos cargados
            </p>
          ) : (
            <div className="space-y-3">
              {operator.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 bg-dark-800/50 rounded-lg border border-dark-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-white text-sm">
                        {DOCUMENT_TYPE_LABELS[doc.type]}
                      </p>
                      {doc.documentNumber && (
                        <p className="text-xs text-dark-400">
                          #{doc.documentNumber}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${documentStatusColors[doc.verificationStatus]}`}
                    >
                      {DOCUMENT_STATUS_LABELS[doc.verificationStatus]}
                    </span>
                  </div>

                  {(doc.issueDate || doc.expiryDate) && (
                    <div className="flex gap-4 text-xs text-dark-400 mb-2">
                      {doc.issueDate && (
                        <span>
                          Emisión:{" "}
                          {new Date(doc.issueDate).toLocaleDateString()}
                        </span>
                      )}
                      {doc.expiryDate && (
                        <span>
                          Vence: {new Date(doc.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}

                  {doc.notes && (
                    <p className="text-xs text-dark-400 mb-2">{doc.notes}</p>
                  )}

                  {doc.verificationStatus === "PENDING" && (
                    <ProtectedAction permission="operators:update">
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() =>
                            approveDocumentMutation.mutate({
                              documentId: doc.id,
                            })
                          }
                          className="btn-sm bg-green-900/30 text-green-400 hover:bg-green-900/50"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt(
                              "Motivo del rechazo (opcional):",
                            );
                            if (reason !== null) {
                              rejectDocumentMutation.mutate({
                                documentId: doc.id,
                                notes: reason,
                              });
                            }
                          }}
                          className="btn-sm bg-red-900/30 text-red-400 hover:bg-red-900/50"
                        >
                          <XCircle className="w-3 h-3" />
                          Rechazar
                        </button>
                      </div>
                    </ProtectedAction>
                  )}
                </div>
              ))}
            </div>
          )}

          <ProtectedAction permission="operators:update">
            <button
              onClick={() => {
                alert(
                  "Funcionalidad de agregar documento próximamente (modal con upload)",
                );
              }}
              className="btn-sm btn-ghost w-full mt-4"
            >
              + Agregar Documento
            </button>
          </ProtectedAction>
        </div>

        {/* Assignments */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary-400" />
            Asignaciones
          </h3>

          {!assignments || assignments.length === 0 ? (
            <p className="text-dark-400 text-center py-8">
              No hay asignaciones registradas
            </p>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-3 bg-dark-800/50 rounded-lg border border-dark-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-white text-sm">
                        {assignment.rentalContract?.code || "Contrato"}
                      </p>
                      {assignment.asset && (
                        <p className="text-xs text-dark-400">
                          {assignment.asset.name}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-900/30 text-primary-300 border border-primary-800">
                      {RATE_TYPE_LABELS[assignment.rateType]}
                    </span>
                  </div>

                  <div className="flex gap-4 text-xs text-dark-400 mb-2">
                    <span>
                      Inicio:{" "}
                      {new Date(assignment.startDate).toLocaleDateString()}
                    </span>
                    {assignment.endDate && (
                      <span>
                        Fin: {new Date(assignment.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-400">
                      ${assignment.rateAmount.toLocaleString()}
                    </span>
                    {assignment.allowExpenses && (
                      <span className="text-xs text-dark-400">
                        Gastos permitidos
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <ProtectedAction permission="operators:assign">
            <button
              onClick={() => {
                alert(
                  "Funcionalidad de crear asignación próximamente (modal con contratos disponibles)",
                );
              }}
              className="btn-sm btn-ghost w-full mt-4"
            >
              + Nueva Asignación
            </button>
          </ProtectedAction>
        </div>
      </div>

      {/* Expenses (if has assignments) */}
      {assignments && assignments.length > 0 && (
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary-400" />
            Gastos Recientes
          </h3>

          {!expensesData?.data || expensesData.data.length === 0 ? (
            <p className="text-dark-400 text-center py-8">
              No hay gastos registrados
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-600">
                    <th className="px-4 py-3 text-left text-xs font-medium text-dark-300">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dark-300">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-dark-300">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-dark-300">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-dark-300">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-600">
                  {expensesData.data.map((expense) => (
                    <tr key={expense.id} className="hover:bg-dark-800/30">
                      <td className="px-4 py-3 text-sm text-dark-300">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-300">
                        {EXPENSE_TYPE_LABELS[expense.expenseType]}
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-300">
                        {expense.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-white">
                        ${expense.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                            expense.status === "APPROVED"
                              ? "bg-green-900/30 text-green-400 border-green-800"
                              : expense.status === "REJECTED"
                                ? "bg-red-900/30 text-red-400 border-red-800"
                                : "bg-yellow-900/30 text-yellow-400 border-yellow-800"
                          }`}
                        >
                          {EXPENSE_STATUS_LABELS[expense.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
