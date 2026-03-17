import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  maintenanceService,
  MaintenanceAsset,
} from "../services/maintenance.service";

// ─── Asset Card ───────────────────────────────────────────────────────────────

function AssetCard({
  asset,
  actions,
}: {
  asset: MaintenanceAsset;
  actions?: React.ReactNode;
}) {
  const lastReturn = asset.rentals?.[0];
  const lastEvent = asset.maintenanceEvents?.[0];
  const daysSinceReturn = lastReturn?.actualReturnDate
    ? Math.floor(
        (Date.now() - new Date(lastReturn.actualReturnDate).getTime()) /
          86400000,
      )
    : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {asset.imageUrl ? (
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="w-10 h-10 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-gray-400 text-xs font-medium">
                {asset.assetType?.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{asset.name}</p>
            <p className="text-xs text-gray-500">{asset.code}</p>
          </div>
        </div>
        <StateBadge state={asset.state?.currentState} />
      </div>

      <div className="text-xs text-gray-600 space-y-1">
        {asset.currentLocation && (
          <p>
            <span className="font-medium">Ubicación:</span>{" "}
            {asset.currentLocation}
          </p>
        )}
        {lastReturn && (
          <p>
            <span className="font-medium">Último cliente:</span>{" "}
            {lastReturn.contract?.client?.name ?? "—"}
          </p>
        )}
        {daysSinceReturn !== null && (
          <p
            className={
              daysSinceReturn > 3 ? "text-red-600 font-medium" : "text-gray-600"
            }
          >
            <span className="font-medium">Días pendiente:</span>{" "}
            {daysSinceReturn}d
          </p>
        )}
        {lastEvent && (
          <p>
            <span className="font-medium">Último mantenimiento:</span>{" "}
            {lastEvent.type} —{" "}
            {new Date(lastEvent.createdAt).toLocaleDateString("es-AR")}
          </p>
        )}
      </div>

      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

function StateBadge({ state }: { state?: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING_MAINTENANCE: {
      label: "Pendiente",
      className: "bg-yellow-100 text-yellow-800",
    },
    MAINTENANCE: {
      label: "En mantenimiento",
      className: "bg-blue-100 text-blue-800",
    },
    AVAILABLE: {
      label: "Disponible",
      className: "bg-green-100 text-green-800",
    },
    OUT_OF_SERVICE: {
      label: "Fuera de servicio",
      className: "bg-red-100 text-red-800",
    },
    IN_USE: {
      label: "En uso",
      className: "bg-purple-100 text-purple-800",
    },
  };

  const info = state
    ? (map[state] ?? { label: state, className: "bg-gray-100 text-gray-700" })
    : { label: "—", className: "bg-gray-100 text-gray-700" };

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${info.className}`}
    >
      {info.label}
    </span>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  title,
  count,
  color,
  children,
  emptyMessage,
}: {
  title: string;
  count: number;
  color: string;
  children: React.ReactNode;
  emptyMessage: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
          {title}
        </h2>
        <span className="ml-auto bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-lg">
          {emptyMessage}
        </p>
      ) : (
        <div className="flex flex-col gap-3">{children}</div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MaintenanceDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["maintenance-dashboard"],
    queryFn: () => maintenanceService.getDashboard(),
    refetchInterval: 60_000, // Refrescar cada minuto
  });

  async function handleRefresh() {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: ["maintenance-dashboard"],
    });
    setRefreshing(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        Error al cargar el dashboard de mantenimiento.
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Taller de Mantenimiento
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestión de activos post-alquiler
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
        >
          {refreshing ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Pendientes"
          value={summary?.totalPending ?? 0}
          color="bg-yellow-500"
          textColor="text-yellow-700"
          bg="bg-yellow-50"
        />
        <SummaryCard
          label="En mantenimiento"
          value={summary?.totalInMaintenance ?? 0}
          color="bg-blue-500"
          textColor="text-blue-700"
          bg="bg-blue-50"
        />
        <SummaryCard
          label="Completados este mes"
          value={summary?.completedThisMonth ?? 0}
          color="bg-green-500"
          textColor="text-green-700"
          bg="bg-green-50"
        />
        <SummaryCard
          label="Fuera de servicio"
          value={summary?.totalOutOfService ?? 0}
          color="bg-red-500"
          textColor="text-red-700"
          bg="bg-red-50"
        />
      </div>

      {/* Main columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PENDIENTES */}
        <Section
          title="Pendientes de Mantenimiento"
          count={data?.pendingMaintenance.length ?? 0}
          color="bg-yellow-500"
          emptyMessage="No hay activos pendientes de mantenimiento"
        >
          {(data?.pendingMaintenance ?? []).map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              actions={
                <>
                  <button
                    onClick={() => navigate(`/maintenance/${asset.id}`)}
                    className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Iniciar mantenimiento
                  </button>
                  <button
                    onClick={() => navigate(`/maintenance/${asset.id}`)}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Ver detalle
                  </button>
                </>
              }
            />
          ))}
        </Section>

        {/* EN MANTENIMIENTO */}
        <Section
          title="En Mantenimiento"
          count={data?.inMaintenance.length ?? 0}
          color="bg-blue-500"
          emptyMessage="No hay activos en mantenimiento activo"
        >
          {(data?.inMaintenance ?? []).map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              actions={
                <button
                  onClick={() => navigate(`/maintenance/${asset.id}`)}
                  className="flex-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Completar mantenimiento
                </button>
              }
            />
          ))}
        </Section>
      </div>

      {/* OUT OF SERVICE */}
      {(data?.outOfService.length ?? 0) > 0 && (
        <Section
          title="Fuera de Servicio"
          count={data?.outOfService.length ?? 0}
          color="bg-red-500"
          emptyMessage=""
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(data?.outOfService ?? []).map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  textColor,
  bg,
}: {
  label: string;
  value: number;
  color: string;
  textColor: string;
  bg: string;
}) {
  return (
    <div className={`rounded-lg p-4 ${bg} flex flex-col gap-1`}>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      <p className="text-xs text-gray-600 font-medium">{label}</p>
      <div className={`h-1 rounded-full ${color} mt-1 opacity-60`} />
    </div>
  );
}
