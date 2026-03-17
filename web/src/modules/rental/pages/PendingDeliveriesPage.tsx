/**
 * PENDING DELIVERIES PAGE
 * Página para que bodega gestione el workflow completo de entregas:
 *  Tab 1: "Por preparar"   — addendums en pending_preparation → confirmar preparación
 *  Tab 2: "Listos a enviar" — addendums en ready_to_ship       → confirmar entrega al cliente
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
  Send,
  ChevronRight,
} from "lucide-react";
import {
  addendumService,
  type ContractAddendum,
} from "../services/addendum.service";
import { useSmartPolling } from "@/hooks/useSmartPolling";

const formatDate = (dateString?: string) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─── Modal: Confirmar Preparación ────────────────────────────────────────────

function ConfirmPreparationModal({
  addendum,
  onClose,
  onSuccess,
}: {
  addendum: ContractAddendum;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [notes, setNotes] = useState("");
  const mutation = useMutation({
    mutationFn: () => addendumService.confirmPreparation(addendum.id, notes),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.error?.message || error.message}`);
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-lg border border-dark-700 w-full max-w-2xl">
        <div className="p-6 border-b border-dark-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-orange-400" />
            Confirmar Preparación
          </h2>
          <p className="text-sm text-dark-400 mt-1">Addendum {addendum.code}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="card bg-dark-800">
            <h3 className="font-semibold mb-2">
              Verificar antes de confirmar:
            </h3>
            <ul className="space-y-2 text-sm text-dark-300">
              {[
                "Todos los activos están listos y en buen estado",
                "Documentación del operario verificada (si aplica)",
                "Transporte confirmado y listo",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <label className="label">Notas de preparación</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Observaciones sobre la preparación, estado de los activos..."
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
            {mutation.isPending ? "Confirmando..." : "Confirmar Preparación →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Confirmar Entrega al Cliente ──────────────────────────────────────

function ConfirmDeliveryModal({
  addendum,
  onClose,
  onSuccess,
}: {
  addendum: ContractAddendum;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [notes, setNotes] = useState("");
  const mutation = useMutation({
    mutationFn: () => addendumService.confirmDelivery(addendum.id, notes),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.error?.message || error.message}`);
    },
  });

  const clientName =
    addendum.contract?.client?.displayName ||
    addendum.contract?.client?.name ||
    "Cliente";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-lg border border-dark-700 w-full max-w-2xl">
        <div className="p-6 border-b border-dark-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Send className="w-6 h-6 text-green-400" />
            Confirmar Entrega al Cliente
          </h2>
          <p className="text-sm text-dark-400 mt-1">
            {addendum.code} → {clientName}
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="card bg-green-900/20 border border-green-700/30">
            <p className="text-sm text-green-300 font-medium">
              ⚠️ Al confirmar la entrega, los cargos de facturación comenzarán
              inmediatamente para todos los activos de este addendum.
            </p>
          </div>

          {/* Activos que se entregan */}
          <div>
            <h3 className="font-semibold mb-2 text-sm text-dark-400">
              Activos entregados:
            </h3>
            <div className="space-y-1">
              {(addendum.rentals ?? []).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 text-sm p-2 bg-dark-800 rounded"
                >
                  <Package className="w-4 h-4 text-dark-400 flex-shrink-0" />
                  <span className="font-medium">{r.asset.name}</span>
                  <span className="text-dark-500 text-xs">
                    ({r.asset.code})
                  </span>
                  {r.periodType && (
                    <span className="ml-auto badge badge-info text-xs">
                      {r.periodType}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Notas de entrega</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Observaciones de la entrega, firmado por, condiciones..."
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
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {mutation.isPending ? "Confirmando..." : "Confirmar Entrega"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card de Addendum ─────────────────────────────────────────────────────────

function AddendumCard({
  addendum,
  onAction,
  actionLabel,
  actionIcon,
  actionClass,
}: {
  addendum: ContractAddendum;
  onAction: () => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
  actionClass: string;
}) {
  const clientName =
    addendum.contract?.client?.displayName ||
    addendum.contract?.client?.name ||
    "Cliente";

  return (
    <div className="card bg-dark-800">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold">{addendum.code}</h3>
            {addendum.status === "pending_preparation" && (
              <span className="badge badge-warning">Por preparar</span>
            )}
            {addendum.status === "ready_to_ship" && (
              <span className="badge badge-info">Listo para enviar</span>
            )}
            {addendum.hasOperator && (
              <span className="badge badge-secondary flex items-center gap-1">
                <User className="w-3 h-3" />
                Con operario
              </span>
            )}
          </div>
          <p className="text-sm text-dark-400 mt-1">
            Contrato: {addendum.contract?.code} • {clientName}
          </p>
          <p className="text-xs text-dark-500 mt-0.5">
            Creado: {formatDate(addendum.createdAt)}
            {addendum.preparedAt && (
              <> · Preparado: {formatDate(addendum.preparedAt)}</>
            )}
          </p>
        </div>
        <button onClick={onAction} className={actionClass}>
          {actionIcon}
          {actionLabel}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Activos */}
        <div className="card bg-dark-900">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
            <Package className="w-4 h-4 text-primary-400" />
            Activos
          </h4>
          <div className="space-y-1 text-sm">
            {(addendum.rentals ?? []).length > 0 ? (
              (addendum.rentals ?? []).map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-dark-500" />
                  <span className="font-medium">{r.asset.name}</span>
                  <span className="text-dark-500 text-xs">
                    ({r.asset.code})
                  </span>
                </div>
              ))
            ) : (
              <p className="text-dark-500 text-xs">Sin activos listados</p>
            )}
          </div>
        </div>

        {/* Transporte y operario */}
        <div className="card bg-dark-900 space-y-3">
          {addendum.transportType && (
            <div>
              <h4 className="font-semibold text-sm mb-1 flex items-center gap-1">
                <Truck className="w-4 h-4 text-green-400" />
                Transporte
              </h4>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-dark-400">Tipo: </span>
                  <span>
                    {addendum.transportType === "company_vehicle" &&
                      "Vehículo empresa"}
                    {addendum.transportType === "third_party" &&
                      "Tercero / Externo"}
                    {addendum.transportType === "client_pickup" &&
                      "Cliente recoge"}
                    {addendum.transportType === "other" && "Otro"}
                  </span>
                </div>
                {addendum.driverName && (
                  <div>
                    <span className="text-dark-400">Conductor: </span>
                    <span>{addendum.driverName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {addendum.hasOperator && (
            <div>
              <h4 className="font-semibold text-sm mb-1 flex items-center gap-1">
                <User className="w-4 h-4 text-blue-400" />
                Documentos operario
              </h4>
              <div className="space-y-1 text-sm">
                {[
                  { url: addendum.operatorLicenseUrl, label: "Licencia" },
                  {
                    url: addendum.operatorCertificationUrl,
                    label: "Certificación",
                  },
                  { url: addendum.operatorInsuranceUrl, label: "Seguro" },
                ].map(({ url, label }) =>
                  url ? (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary-400 hover:text-primary-300"
                    >
                      <FileText className="w-3 h-3" />
                      {label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : null,
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {addendum.notes && (
        <div className="mt-4 p-3 bg-dark-900 rounded flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-dark-300">{addendum.notes}</p>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "pending_preparation" | "ready_to_ship";

export function PendingDeliveriesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("pending_preparation");
  const [selectedForPrep, setSelectedForPrep] =
    useState<ContractAddendum | null>(null);
  const [selectedForDelivery, setSelectedForDelivery] =
    useState<ContractAddendum | null>(null);

  const smartInterval = useSmartPolling(120000);

  const { data: pendingPrep = [], isLoading: loadingPrep } = useQuery({
    queryKey: ["pending-deliveries", "pending_preparation"],
    queryFn: () => addendumService.getPendingDeliveries(),
    refetchInterval: smartInterval,
  });

  const { data: readyToShip = [], isLoading: loadingShip } = useQuery({
    queryKey: ["pending-deliveries", "ready_to_ship"],
    queryFn: () => addendumService.getReadyToShipDeliveries(),
    refetchInterval: smartInterval,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["pending-deliveries"] });
  };

  const isLoading = loadingPrep || loadingShip;
  const currentList = tab === "pending_preparation" ? pendingPrep : readyToShip;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center h-64">
        <div className="text-dark-400">Cargando entregas...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Package className="w-8 h-8 text-primary-400" />
          Gestión de Entregas
        </h1>
        <p className="text-dark-400 mt-2">
          Prepara y confirma la entrega de activos a clientes
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-dark-700">
        <button
          onClick={() => setTab("pending_preparation")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            tab === "pending_preparation"
              ? "border-primary-400 text-primary-400"
              : "border-transparent text-dark-400 hover:text-dark-200"
          }`}
        >
          <Clock className="w-4 h-4" />
          Por preparar
          {pendingPrep.length > 0 && (
            <span className="badge badge-warning">{pendingPrep.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab("ready_to_ship")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            tab === "ready_to_ship"
              ? "border-green-400 text-green-400"
              : "border-transparent text-dark-400 hover:text-dark-200"
          }`}
        >
          <Send className="w-4 h-4" />
          Listos para enviar
          {readyToShip.length > 0 && (
            <span className="badge badge-success">{readyToShip.length}</span>
          )}
        </button>
      </div>

      {/* Lista */}
      {currentList.length === 0 ? (
        <div className="card bg-dark-800 text-center py-12">
          {tab === "pending_preparation" ? (
            <>
              <Clock className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No hay entregas por preparar
              </h3>
              <p className="text-dark-400">
                Cuando llegue una orden de entrega aparecerá aquí.
              </p>
            </>
          ) : (
            <>
              <Send className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No hay entregas listas para enviar
              </h3>
              <p className="text-dark-400">
                Las entregas preparadas aparecerán aquí para ser confirmadas.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((addendum: ContractAddendum) =>
            tab === "pending_preparation" ? (
              <AddendumCard
                key={addendum.id}
                addendum={addendum}
                onAction={() => setSelectedForPrep(addendum)}
                actionLabel="Marcar como listo"
                actionIcon={<CheckCircle className="w-4 h-4" />}
                actionClass="btn-primary flex items-center gap-2"
              />
            ) : (
              <AddendumCard
                key={addendum.id}
                addendum={addendum}
                onAction={() => setSelectedForDelivery(addendum)}
                actionLabel="Confirmar Entrega"
                actionIcon={<Send className="w-4 h-4" />}
                actionClass="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              />
            ),
          )}
        </div>
      )}

      {/* Modales */}
      {selectedForPrep && (
        <ConfirmPreparationModal
          addendum={selectedForPrep}
          onClose={() => setSelectedForPrep(null)}
          onSuccess={() => {
            invalidate();
            setTab("ready_to_ship");
          }}
        />
      )}
      {selectedForDelivery && (
        <ConfirmDeliveryModal
          addendum={selectedForDelivery}
          onClose={() => setSelectedForDelivery(null)}
          onSuccess={() => {
            invalidate();
          }}
        />
      )}
    </div>
  );
}
