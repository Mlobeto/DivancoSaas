/**
 * PENDING DELIVERIES PAGE
 * Página para que mantenimiento vea y gestione entregas pendientes de preparación
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  CheckCircle,
  User,
  Truck,
  FileText,
  AlertCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  addendumService,
  type ContractAddendum,
} from "../services/addendum.service";
import { useSmartPolling } from "@/hooks/useSmartPolling";

// Utility function for date formatting
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface ConfirmPreparationModalProps {
  addendum: ContractAddendum;
  onClose: () => void;
  onSuccess: () => void;
}

function ConfirmPreparationModal({
  addendum,
  onClose,
  onSuccess,
}: ConfirmPreparationModalProps) {
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () => addendumService.confirmPreparation(addendum.id, notes),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      alert(
        `Error confirmando preparación: ${error.response?.data?.error?.message || error.message}`,
      );
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-lg border border-dark-700 w-full max-w-2xl">
        <div className="p-6 border-b border-dark-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            Confirmar Preparación
          </h2>
          <p className="text-sm text-dark-400 mt-1">Addendum {addendum.code}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="card bg-dark-800">
            <h3 className="font-semibold mb-2">Antes de confirmar:</h3>
            <ul className="space-y-2 text-sm text-dark-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                <span>Todos los activos están listos y en buen estado</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                <span>Documentación del operario verificada (si aplica)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                <span>Transporte confirmado y listo</span>
              </li>
            </ul>
          </div>

          <div>
            <label className="label">Notas de preparación</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Observaciones sobre la preparación, estado de los activos, etc..."
              className="form-input"
            />
          </div>
        </div>

        <div className="p-6 border-t border-dark-700 flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? "Confirmando..." : "Confirmar Preparación"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PendingDeliveriesPage() {
  const queryClient = useQueryClient();
  const [selectedAddendum, setSelectedAddendum] =
    useState<ContractAddendum | null>(null);

  // Polling inteligente: solo cuando la pestaña está visible
  const smartInterval = useSmartPolling(120000); // 2 min cuando visible, pausa cuando oculta

  // Fetch todos los addendums pendientes
  const { data: addendums, isLoading } = useQuery({
    queryKey: ["pending-deliveries"],
    queryFn: async () => {
      return await addendumService.getPendingDeliveries();
    },
    refetchInterval: smartInterval, // Polling inteligente
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-dark-400">Cargando entregas pendientes...</div>
        </div>
      </div>
    );
  }

  const pendingAddendums = (addendums ?? []).filter(
    (a: any) => a.status === "pending_preparation",
  );

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Package className="w-8 h-8 text-primary-400" />
          Entregas Pendientes de Preparación
        </h1>
        <p className="text-dark-400 mt-2">
          Verifica documentación, confirma transporte y marca como listo cuando
          esté preparado
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-dark-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {pendingAddendums.length}
              </div>
              <div className="text-sm text-dark-400">Pendientes</div>
            </div>
          </div>
        </div>

        <div className="card bg-dark-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {pendingAddendums.filter((a: any) => a.hasOperator).length}
              </div>
              <div className="text-sm text-dark-400">Con operario</div>
            </div>
          </div>
        </div>

        <div className="card bg-dark-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Truck className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {pendingAddendums.length}
              </div>
              <div className="text-sm text-dark-400">Requieren transporte</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de entregas */}
      {pendingAddendums.length === 0 ? (
        <div className="card bg-dark-800 text-center py-12">
          <Package className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            No hay entregas pendientes
          </h3>
          <p className="text-dark-400">
            Todas las entregas han sido preparadas. ¡Buen trabajo! 🎉
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingAddendums.map((addendum: any) => (
            <div key={addendum.id} className="card bg-dark-800">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{addendum.code}</h3>
                    <span className="badge badge-warning">
                      Pendiente de preparación
                    </span>
                    {addendum.hasOperator && (
                      <span className="badge badge-info flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Requiere operario
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-dark-400 mt-1">
                    Contrato: {addendum.contract?.code} • Cliente:{" "}
                    {addendum.contract?.client?.displayName}
                  </p>
                  <p className="text-xs text-dark-500 mt-1">
                    Creado: {formatDate(addendum.createdAt)}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedAddendum(addendum)}
                  className="btn-primary"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirmar Preparación
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Operario */}
                {addendum.hasOperator && (
                  <div className="card bg-dark-900">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-5 h-5 text-blue-400" />
                      <h4 className="font-semibold">Operario</h4>
                    </div>

                    <div className="space-y-2 text-sm">
                      {addendum.operatorLicenseUrl && (
                        <a
                          href={addendum.operatorLicenseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary-400 hover:text-primary-300"
                        >
                          <FileText className="w-4 h-4" />
                          Ver Licencia
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {addendum.operatorCertificationUrl && (
                        <a
                          href={addendum.operatorCertificationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary-400 hover:text-primary-300"
                        >
                          <FileText className="w-4 h-4" />
                          Ver Certificación
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {addendum.operatorInsuranceUrl && (
                        <a
                          href={addendum.operatorInsuranceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary-400 hover:text-primary-300"
                        >
                          <FileText className="w-4 h-4" />
                          Ver Seguro
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {addendum.operatorDocumentationNotes && (
                        <div className="mt-2 p-2 bg-dark-950 rounded text-dark-300">
                          {addendum.operatorDocumentationNotes}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Transporte */}
                <div className="card bg-dark-900">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="w-5 h-5 text-green-400" />
                    <h4 className="font-semibold">Transporte</h4>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-dark-400">Tipo:</span>{" "}
                      <span className="font-medium">
                        {addendum.transportType === "company_vehicle" &&
                          "Vehículo de la empresa"}
                        {addendum.transportType === "third_party" &&
                          "Tercero / Externo"}
                        {addendum.transportType === "client_pickup" &&
                          "Cliente recoge"}
                        {addendum.transportType === "other" && "Otro"}
                      </span>
                    </div>
                    {addendum.driverName && (
                      <div>
                        <span className="text-dark-400">Conductor:</span>{" "}
                        <span className="font-medium">
                          {addendum.driverName}
                        </span>
                      </div>
                    )}
                    {addendum.transportNotes && (
                      <div className="mt-2 p-2 bg-dark-950 rounded text-dark-300">
                        {addendum.transportNotes}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-dark-400 mb-2">
                  Activos a entregar:
                </h4>
                <div className="space-y-1 text-sm">
                  {JSON.parse(addendum.items || "[]").map(
                    (item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-dark-500">•</span>
                        <span>
                          Asset {item.assetId} × {item.quantity || 1} unidad(es)
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {addendum.notes && (
                <div className="mt-4 p-3 bg-dark-900 rounded">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Notas:</h4>
                      <p className="text-sm text-dark-300">{addendum.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedAddendum && (
        <ConfirmPreparationModal
          addendum={selectedAddendum}
          onClose={() => setSelectedAddendum(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["pending-deliveries"] });
            alert(
              "✅ Preparación confirmada. La entrega está lista para ser enviada.",
            );
          }}
        />
      )}
    </div>
  );
}
