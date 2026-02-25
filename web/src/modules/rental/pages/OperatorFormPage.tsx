import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import { operatorService } from "../services/operator.service";
import { userService } from "@/core/services/user.service";
import {
  CreateOperatorProfileDTO,
  UpdateOperatorProfileDTO,
  OperatorType,
  OperatorStatus,
  OPERATOR_TYPE_LABELS,
  OPERATOR_STATUS_LABELS,
} from "../types/operator.types";
import { UserPlus, Save, AlertCircle } from "lucide-react";

export function OperatorFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { businessUnit } = useAuthStore();
  const isEdit = !!id;

  // Form state
  const [userId, setUserId] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [operatorType, setOperatorType] = useState<OperatorType>("INTERNAL");
  const [hourlyRate, setHourlyRate] = useState<number | undefined>(undefined);
  const [dailyRate, setDailyRate] = useState<number | undefined>(undefined);
  const [hireDate, setHireDate] = useState("");
  const [status, setStatus] = useState<OperatorStatus>("ACTIVE");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load users for dropdown
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["users", "dropdown", businessUnit?.id],
    queryFn: () =>
      userService.list({
        businessUnitId: businessUnit?.id,
        status: "ACTIVE",
        limit: 100,
      }),
    enabled: !!businessUnit?.id && !isEdit,
  });

  // Load operator if editing
  const { data: operatorData, isLoading: loadingOperator } = useQuery({
    queryKey: ["operator", id],
    queryFn: () => operatorService.getProfile(id!),
    enabled: isEdit,
  });

  // Populate form when editing
  useEffect(() => {
    if (operatorData) {
      setUserId(operatorData.userId);
      setDocument(operatorData.document);
      setPhone(operatorData.phone);
      setAddress(operatorData.address || "");
      setOperatorType(operatorData.operatorType);
      setHourlyRate(operatorData.hourlyRate || undefined);
      setDailyRate(operatorData.dailyRate || undefined);
      setHireDate(
        operatorData.hireDate
          ? new Date(operatorData.hireDate).toISOString().split("T")[0]
          : "",
      );
      setStatus(operatorData.status);
      setNotes(operatorData.notes || "");
    }
  }, [operatorData]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateOperatorProfileDTO) =>
      operatorService.createProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operators"] });
      alert("✅ Operador creado exitosamente");
      navigate("/rental/operators");
    },
    onError: (error: any) => {
      alert(
        `❌ Error al crear operador: ${error.message || "Error desconocido"}`,
      );
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateOperatorProfileDTO) =>
      operatorService.updateProfile(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operators"] });
      queryClient.invalidateQueries({ queryKey: ["operator", id] });
      alert("✅ Operador actualizado exitosamente");
      navigate("/rental/operators");
    },
    onError: (error: any) => {
      alert(
        `❌ Error al actualizar operador: ${error.message || "Error desconocido"}`,
      );
    },
  });

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEdit && !userId) {
      newErrors.userId = "Debe seleccionar un usuario";
    }
    if (!document.trim()) {
      newErrors.document = "El documento es requerido";
    }
    if (!phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
    }
    if (!operatorType) {
      newErrors.operatorType = "Debe seleccionar un tipo de operador";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (isEdit) {
      const updateData: UpdateOperatorProfileDTO = {
        document,
        phone,
        address: address || undefined,
        operatorType,
        hourlyRate,
        dailyRate,
        notes: notes || undefined,
        status,
      };
      updateMutation.mutate(updateData);
    } else {
      const createData: CreateOperatorProfileDTO = {
        userId,
        document,
        phone,
        address: address || undefined,
        operatorType,
        hourlyRate,
        dailyRate,
        hireDate: hireDate || undefined,
        notes: notes || undefined,
      };
      createMutation.mutate(createData);
    }
  };

  if (isEdit && loadingOperator) {
    return (
      <Layout title="Cargando...">
        <div className="p-8 text-center text-dark-400">
          Cargando operador...
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={isEdit ? "Editar Operador" : "Nuevo Operador"}
      subtitle={businessUnit?.name || "Sistema"}
      actions={
        <button
          onClick={() => navigate("/rental/operators")}
          className="btn-ghost"
        >
          ← Volver
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary-400" />
            {isEdit
              ? "Editar Información del Operador"
              : "Información del Operador"}
          </h2>

          {/* User selection (only for create) */}
          {!isEdit && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Usuario *
              </label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className={`form-input ${errors.userId ? "border-red-500" : ""}`}
                disabled={loadingUsers}
              >
                <option value="">Seleccionar usuario...</option>
                {usersData?.data?.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} - {user.email}
                  </option>
                ))}
              </select>
              {errors.userId && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.userId}
                </p>
              )}
              <p className="mt-1 text-xs text-dark-400">
                💡 El usuario debe estar previamente registrado en el sistema
              </p>
            </div>
          )}

          {/* Document */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Documento de Identidad *
            </label>
            <input
              type="text"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              className={`form-input ${errors.document ? "border-red-500" : ""}`}
              placeholder="Ej: 12345678"
            />
            {errors.document && (
              <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.document}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`form-input ${errors.phone ? "border-red-500" : ""}`}
              placeholder="Ej: +57 300 1234567"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.phone}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="form-input"
              placeholder="Dirección completa"
            />
          </div>

          {/* Operator Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Tipo de Operador *
            </label>
            <select
              value={operatorType}
              onChange={(e) => setOperatorType(e.target.value as OperatorType)}
              className={`form-input ${errors.operatorType ? "border-red-500" : ""}`}
            >
              {Object.entries(OPERATOR_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.operatorType && (
              <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.operatorType}
              </p>
            )}
          </div>

          {/* Rates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Tarifa Diaria
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
                  $
                </span>
                <input
                  type="number"
                  value={dailyRate || ""}
                  onChange={(e) =>
                    setDailyRate(
                      e.target.value ? parseFloat(e.target.value) : undefined,
                    )
                  }
                  className="form-input pl-8"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Tarifa por Hora
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
                  $
                </span>
                <input
                  type="number"
                  value={hourlyRate || ""}
                  onChange={(e) =>
                    setHourlyRate(
                      e.target.value ? parseFloat(e.target.value) : undefined,
                    )
                  }
                  className="form-input pl-8"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Hire Date */}
          {!isEdit && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Fecha de Contratación
              </label>
              <input
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                className="form-input"
              />
            </div>
          )}

          {/* Status (only for edit) */}
          {isEdit && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OperatorStatus)}
                className="form-input"
              >
                {Object.entries(OPERATOR_STATUS_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input"
              rows={4}
              placeholder="Notas adicionales sobre el operador..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/rental/operators")}
            className="btn-ghost"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="btn-primary"
          >
            <Save className="w-4 h-4" />
            {createMutation.isPending || updateMutation.isPending
              ? "Guardando..."
              : isEdit
                ? "Actualizar Operador"
                : "Crear Operador"}
          </button>
        </div>
      </form>
    </Layout>
  );
}
