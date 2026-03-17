/**
 * AssetReturnPanel
 *
 * Panel de recepción de activos desde contratos activos.
 * Permite arrastrar activos a "Necesita mantenimiento" o "A stock directo".
 * Se usa como paso intermedio antes de que los activos entren al flujo de taller.
 */

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { maintenanceService } from "../services/maintenance.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FieldAsset {
  rentalId: string;
  assetId: string;
  code: string;
  name: string;
  assetType: string;
  imageUrl?: string;
  currentLocation?: string;
  withdrawalDate: string;
}

type DropZone = "MAINTENANCE" | "STOCK";

interface ReturnEntry {
  asset: FieldAsset;
  destination: DropZone;
  notes: string;
}

// ─── Asset Card ───────────────────────────────────────────────────────────────

function DraggableAssetCard({
  asset,
  isDragging,
  onDragStart,
}: {
  asset: FieldAsset;
  isDragging: boolean;
  onDragStart: () => void;
}) {
  const daysInField = Math.floor(
    (Date.now() - new Date(asset.withdrawalDate).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`bg-white border rounded-xl p-3 cursor-grab active:cursor-grabbing select-none transition-all ${
        isDragging
          ? "opacity-40 border-blue-400 shadow-lg scale-95"
          : "border-gray-200 hover:border-blue-300 hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {asset.imageUrl ? (
          <img
            src={asset.imageUrl}
            alt={asset.name}
            className="w-10 h-10 rounded object-cover flex-shrink-0 border border-gray-100"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-gray-400 text-xs font-bold">
              {asset.assetType?.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {asset.name}
          </p>
          <p className="text-xs text-gray-500">{asset.code}</p>
          {asset.currentLocation && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              📍 {asset.currentLocation}
            </p>
          )}
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0 bg-gray-50 px-1.5 py-0.5 rounded">
          {daysInField}d
        </span>
      </div>
    </div>
  );
}

// ─── Return Entry Row ─────────────────────────────────────────────────────────

function ReturnEntryRow({
  entry,
  onChangeDestination,
  onChangeNotes,
  onRemove,
}: {
  entry: ReturnEntry;
  onChangeDestination: (dest: DropZone) => void;
  onChangeNotes: (notes: string) => void;
  onRemove: () => void;
}) {
  const isMaintenance = entry.destination === "MAINTENANCE";

  return (
    <div
      className={`border rounded-xl p-3 space-y-2 transition-colors ${
        isMaintenance
          ? "border-yellow-300 bg-yellow-50"
          : "border-green-300 bg-green-50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isMaintenance ? "bg-yellow-500" : "bg-green-500"
            }`}
          />
          <span className="text-sm font-semibold text-gray-900 truncate">
            {entry.asset.name}
          </span>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {entry.asset.code}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() =>
              onChangeDestination(
                isMaintenance ? "STOCK" : "MAINTENANCE",
              )
            }
            title="Cambiar destino"
            className={`text-xs px-2 py-1 rounded-lg font-medium transition ${
              isMaintenance
                ? "bg-yellow-200 text-yellow-800 hover:bg-yellow-300"
                : "bg-green-200 text-green-800 hover:bg-green-300"
            }`}
          >
            {isMaintenance ? "→ Mantenimiento" : "→ Stock"}
          </button>
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500 text-lg leading-none px-1 transition"
            title="Quitar"
          >
            ×
          </button>
        </div>
      </div>
      <input
        type="text"
        value={entry.notes}
        onChange={(e) => onChangeNotes(e.target.value)}
        placeholder="Notas de condición (opcional)..."
        className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
    </div>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

function DropZoneArea({
  zone,
  isOver,
  count,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  zone: DropZone;
  isOver: boolean;
  count: number;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const isMaintenance = zone === "MAINTENANCE";
  const label = isMaintenance ? "Necesita mantenimiento" : "A stock directo";
  const sublabel = isMaintenance
    ? "Pasa por el taller antes de estar disponible"
    : "Disponible de inmediato sin revisión";
  const activeClass = isMaintenance
    ? "border-yellow-400 bg-yellow-100"
    : "border-green-400 bg-green-100";
  const idleClass = isMaintenance
    ? "border-yellow-200 bg-yellow-50"
    : "border-green-200 bg-green-50";
  const dotColor = isMaintenance ? "bg-yellow-500" : "bg-green-500";

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-xl p-3 min-h-16 flex items-center justify-center transition-all ${
        isOver ? activeClass : idleClass
      }`}
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          {count > 0 && (
            <span className="text-xs text-gray-500 bg-white border rounded-full px-1.5">
              {count}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">{sublabel}</p>
        {isOver && (
          <p className="text-xs text-gray-600 mt-1 font-medium">
            Soltar aquí
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AssetReturnPanel() {
  const queryClient = useQueryClient();
  const [selectedContractId, setSelectedContractId] = useState<string | null>(
    null,
  );
  const [draggingRentalId, setDraggingRentalId] = useState<string | null>(null);
  const [overZone, setOverZone] = useState<DropZone | null>(null);
  const [returnEntries, setReturnEntries] = useState<ReturnEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const dragZoneRef = useRef<DropZone | null>(null);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["active-contracts-with-assets"],
    queryFn: () => maintenanceService.listActiveContractsWithAssets(),
    enabled: isExpanded,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: () =>
      maintenanceService.batchReturnAssets({
        contractId: selectedContractId!,
        returns: returnEntries.map((e) => ({
          rentalId: e.asset.rentalId,
          destination: e.destination,
          notes: e.notes || undefined,
        })),
      }),
    onSuccess: () => {
      // Invalidar dashboard + contratos
      queryClient.invalidateQueries({ queryKey: ["maintenance-dashboard"] });
      queryClient.invalidateQueries({
        queryKey: ["active-contracts-with-assets"],
      });
      setReturnEntries([]);
      setSelectedContractId(null);
    },
  });

  const selectedContract = contracts.find((c) => c.id === selectedContractId);

  // Assets del contrato seleccionado que NO están en returnEntries aún
  const returnedRentalIds = new Set(returnEntries.map((e) => e.asset.rentalId));
  const pendingAssets: FieldAsset[] =
    selectedContract?.activeRentals
      .filter((r) => !returnedRentalIds.has(r.id))
      .map((r) => ({
        rentalId: r.id,
        assetId: r.assetId,
        code: r.asset.code,
        name: r.asset.name,
        assetType: r.asset.assetType,
        imageUrl: r.asset.imageUrl,
        currentLocation: r.asset.currentLocation,
        withdrawalDate: r.withdrawalDate,
      })) ?? [];

  function handleDrop(zone: DropZone) {
    if (!draggingRentalId || !selectedContract) return;
    const rental = selectedContract.activeRentals.find(
      (r) => r.id === draggingRentalId,
    );
    if (!rental) return;

    const asset: FieldAsset = {
      rentalId: rental.id,
      assetId: rental.assetId,
      code: rental.asset.code,
      name: rental.asset.name,
      assetType: rental.asset.assetType,
      imageUrl: rental.asset.imageUrl,
      currentLocation: rental.asset.currentLocation,
      withdrawalDate: rental.withdrawalDate,
    };

    setReturnEntries((prev) => {
      // Si ya existe, cambiar destino
      const existing = prev.find((e) => e.asset.rentalId === rental.id);
      if (existing) {
        return prev.map((e) =>
          e.asset.rentalId === rental.id
            ? { ...e, destination: zone }
            : e,
        );
      }
      return [...prev, { asset, destination: zone, notes: "" }];
    });

    setDraggingRentalId(null);
    setOverZone(null);
  }

  const maintenanceCount = returnEntries.filter(
    (e) => e.destination === "MAINTENANCE",
  ).length;
  const stockCount = returnEntries.filter(
    (e) => e.destination === "STOCK",
  ).length;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header colapsable */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 text-base">📥</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Recepción desde contratos
            </h2>
            <p className="text-xs text-gray-500">
              Recibir activos devueltos y asignarles destino
            </p>
          </div>
        </div>
        <span className="text-gray-400 text-lg">{isExpanded ? "▲" : "▼"}</span>
      </button>

      {!isExpanded ? null : (
        <div className="border-t border-gray-100 p-5 space-y-5">
          {/* Selector de contrato */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Contrato activo
            </label>
            {isLoading ? (
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ) : contracts.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">
                No hay contratos activos con activos en campo.
              </p>
            ) : (
              <select
                value={selectedContractId ?? ""}
                onChange={(e) => {
                  setSelectedContractId(e.target.value || null);
                  setReturnEntries([]);
                }}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Seleccionar contrato —</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} · {c.client.name} (
                    {c.activeRentals.length} activo
                    {c.activeRentals.length !== 1 ? "s" : ""} en campo)
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedContract && (
            <>
              {/* Información del contrato */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Cliente:</span>{" "}
                  <span className="font-medium">
                    {selectedContract.client.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Saldo:</span>{" "}
                  <span className="font-medium text-green-700">
                    ${Number(selectedContract.clientAccount.balance).toLocaleString("es-AR")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">En campo:</span>{" "}
                  <span className="font-medium">
                    {selectedContract.activeRentals.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Columna izquierda: activos en campo */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Activos en campo ({pendingAssets.length})
                  </h3>
                  {pendingAssets.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-xl">
                      {returnEntries.length > 0
                        ? "Todos los activos asignados"
                        : "Sin activos en campo"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {pendingAssets.map((asset) => (
                        <DraggableAssetCard
                          key={asset.rentalId}
                          asset={asset}
                          isDragging={draggingRentalId === asset.rentalId}
                          onDragStart={() =>
                            setDraggingRentalId(asset.rentalId)
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Columna derecha: zonas de drop */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Destino al devolver
                  </h3>
                  <div className="space-y-2">
                    <DropZoneArea
                      zone="MAINTENANCE"
                      isOver={overZone === "MAINTENANCE"}
                      count={maintenanceCount}
                      onDragOver={(e) => {
                        e.preventDefault();
                        dragZoneRef.current = "MAINTENANCE";
                        setOverZone("MAINTENANCE");
                      }}
                      onDragLeave={() => {
                        setOverZone(null);
                        dragZoneRef.current = null;
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDrop("MAINTENANCE");
                      }}
                    />
                    <DropZoneArea
                      zone="STOCK"
                      isOver={overZone === "STOCK"}
                      count={stockCount}
                      onDragOver={(e) => {
                        e.preventDefault();
                        dragZoneRef.current = "STOCK";
                        setOverZone("STOCK");
                      }}
                      onDragLeave={() => {
                        setOverZone(null);
                        dragZoneRef.current = null;
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDrop("STOCK");
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Lista de entradas de devolución */}
              {returnEntries.length > 0 && (
                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    A devolver ({returnEntries.length})
                  </h3>
                  {returnEntries.map((entry) => (
                    <ReturnEntryRow
                      key={entry.asset.rentalId}
                      entry={entry}
                      onChangeDestination={(dest) =>
                        setReturnEntries((prev) =>
                          prev.map((e) =>
                            e.asset.rentalId === entry.asset.rentalId
                              ? { ...e, destination: dest }
                              : e,
                          ),
                        )
                      }
                      onChangeNotes={(notes) =>
                        setReturnEntries((prev) =>
                          prev.map((e) =>
                            e.asset.rentalId === entry.asset.rentalId
                              ? { ...e, notes }
                              : e,
                          ),
                        )
                      }
                      onRemove={() =>
                        setReturnEntries((prev) =>
                          prev.filter(
                            (e) =>
                              e.asset.rentalId !== entry.asset.rentalId,
                          ),
                        )
                      }
                    />
                  ))}

                  {mutation.isError && (
                    <p className="text-sm text-red-600">
                      {(mutation.error as Error)?.message ??
                        "Error al procesar la devolución"}
                    </p>
                  )}

                  <button
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition text-sm"
                  >
                    {mutation.isPending
                      ? "Procesando..."
                      : `Confirmar devolución de ${returnEntries.length} activo${returnEntries.length !== 1 ? "s" : ""}`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
