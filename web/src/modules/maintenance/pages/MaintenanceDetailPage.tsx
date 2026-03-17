import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  maintenanceService,
  Supply,
  LastRentalInfo,
} from "../services/maintenance.service";
import api from "@/lib/api";
import type { ApiResponse } from "@/core/types/api.types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AssetDetail {
  id: string;
  code: string;
  name: string;
  assetType: string;
  imageUrl?: string;
  currentLocation?: string;
  state?: { currentState: string; updatedAt: string };
}

interface SupplyLine {
  supplyId: string;
  quantity: number;
}

// ─── Evidence Upload ──────────────────────────────────────────────────────────

function EvidenceUpload({
  assetId,
  evidenceUrls,
  onUploaded,
}: {
  assetId: string;
  evidenceUrls: string[];
  onUploaded: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded = await maintenanceService.uploadEvidence(
        assetId,
        Array.from(files),
      );
      onUploaded([...evidenceUrls, ...uploaded]);
    } catch {
      setError("Error al subir archivos. Intente nuevamente.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Evidencia fotográfica
      </label>

      {/* Preview de URLs ya subidas */}
      {evidenceUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {evidenceUrls.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt={`Evidencia ${i + 1}`}
                className="w-20 h-20 rounded object-cover border border-gray-200"
                onError={(e) => {
                  // Si no es imagen (ej. PDF), mostrar placeholder
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded transition text-white text-xs"
              >
                Ver
              </a>
              <button
                type="button"
                onClick={() =>
                  onUploaded(evidenceUrls.filter((_, idx) => idx !== i))
                }
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <p className="text-sm text-gray-500">
          {uploading
            ? "Subiendo..."
            : "Arrastra fotos aquí o haz click para seleccionar"}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Imágenes y PDFs, máx. 10MB por archivo
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

// ─── Supply Selector ──────────────────────────────────────────────────────────

function SupplySelector({
  supplies,
  lines,
  onChange,
}: {
  supplies: Supply[];
  lines: SupplyLine[];
  onChange: (lines: SupplyLine[]) => void;
}) {
  function addLine() {
    if (supplies.length === 0) return;
    const unused = supplies.find(
      (s) => !lines.some((l) => l.supplyId === s.id),
    );
    if (!unused) return;
    onChange([...lines, { supplyId: unused.id, quantity: 1 }]);
  }

  function updateLine(idx: number, field: keyof SupplyLine, value: string) {
    const next = [...lines];
    if (field === "quantity") {
      next[idx].quantity = Math.max(1, Number(value));
    } else {
      next[idx].supplyId = value;
    }
    onChange(next);
  }

  function removeLine(idx: number) {
    onChange(lines.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Insumos utilizados
      </label>
      {lines.map((line, idx) => {
        const supply = supplies.find((s) => s.id === line.supplyId);
        return (
          <div key={idx} className="flex gap-2 items-center">
            <select
              value={line.supplyId}
              onChange={(e) => updateLine(idx, "supplyId", e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {supplies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.unit}) — Stock: {s.stock}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={supply?.stock ?? 9999}
              value={line.quantity}
              onChange={(e) => updateLine(idx, "quantity", e.target.value)}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-500 w-10">
              {supply?.unit ?? ""}
            </span>
            <button
              type="button"
              onClick={() => removeLine(idx)}
              className="text-red-500 hover:text-red-700 text-lg leading-none"
            >
              ×
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={addLine}
        disabled={lines.length >= supplies.length}
        className="text-sm text-blue-600 hover:underline disabled:opacity-40"
      >
        + Agregar insumo
      </button>
    </div>
  );
}

// ─── Maintenance Form (Post-Obra) ─────────────────────────────────────────────

function PostObraForm({
  assetId,
  onSuccess,
}: {
  assetId: string;
  onSuccess: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<SupplyLine[]>([]);
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [isBusinessException, setIsBusinessException] = useState(false);
  const [costAmount, setCostAmount] = useState("");

  const { data: supplies = [] } = useQuery({
    queryKey: ["supplies"],
    queryFn: () => maintenanceService.listSupplies(),
  });

  /** Último alquiler completado del activo → vincula contrato automáticamente */
  const { data: lastRental } = useQuery<LastRentalInfo | null>({
    queryKey: ["last-rental", assetId],
    queryFn: () => maintenanceService.getLastRental(assetId),
  });

  const mutation = useMutation({
    mutationFn: () =>
      maintenanceService.executePostObra({
        assetId,
        notes,
        suppliesUsed: lines,
        evidenceUrls,
        contractId: lastRental?.contractId ?? undefined,
        chargedTo: isBusinessException ? "BUSINESS" : "CLIENT",
        costAmount: costAmount ? parseFloat(costAmount) : undefined,
      }),
    onSuccess,
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      <h3 className="font-semibold text-gray-900">
        Completar Mantenimiento Post-Obra
      </h3>

      {/* ── Contrato vinculado ─────────────────── */}
      {lastRental ? (
        <div
          className={`rounded-lg border p-4 space-y-3 transition ${
            isBusinessException
              ? "border-orange-300 bg-orange-50"
              : "border-blue-200 bg-blue-50"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Contrato origen del activo
              </p>
              <p className="text-sm font-bold text-gray-900">
                {lastRental.contract.code}
              </p>
              <p className="text-sm text-gray-600">
                Cliente:{" "}
                <span className="font-medium">
                  {lastRental.contract.client.name}
                </span>
              </p>
              <p className="text-xs text-gray-400">
                Devuelto:{" "}
                {new Date(lastRental.actualReturnDate).toLocaleDateString(
                  "es-AR",
                  { day: "2-digit", month: "short", year: "numeric" },
                )}
              </p>
            </div>
            <span
              className={`px-2 py-1 text-xs rounded-full font-semibold ${
                isBusinessException
                  ? "bg-orange-200 text-orange-800"
                  : "bg-blue-200 text-blue-800"
              }`}
            >
              {isBusinessException ? "Costo: Negocio" : "Costo: Cliente"}
            </span>
          </div>

          {/* Checkbox excepción */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isBusinessException}
              onChange={(e) => setIsBusinessException(e.target.checked)}
              className="mt-0.5 accent-orange-500 w-4 h-4 flex-shrink-0"
            />
            <span className="text-sm text-gray-700">
              <strong>Excepción:</strong> El costo de este mantenimiento lo
              absorbe el negocio (no se descuenta al cliente)
            </span>
          </label>

          {/* Monto opcional */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              Costo estimado del mantenimiento (opcional)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costAmount}
                onChange={(e) => setCostAmount(e.target.value)}
                placeholder="0.00"
                className="w-36 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm text-gray-500">
            No se encontró contrato de alquiler previo. El mantenimiento se
            registrará sin vinculación a contrato.
          </p>
        </div>
      )}

      <SupplySelector supplies={supplies} lines={lines} onChange={setLines} />

      <EvidenceUpload
        assetId={assetId}
        evidenceUrls={evidenceUrls}
        onUploaded={setEvidenceUrls}
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Notas del mantenimiento
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Descripción del trabajo realizado..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">
          {(mutation.error as Error)?.message ??
            "Error al completar mantenimiento"}
        </p>
      )}

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className={`w-full py-2.5 text-white rounded-lg font-medium disabled:opacity-50 transition ${
          isBusinessException
            ? "bg-orange-500 hover:bg-orange-600"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {mutation.isPending
          ? "Guardando..."
          : isBusinessException
            ? "Completar → Costo al Negocio"
            : "Completar → Descontar al Cliente"}
      </button>
    </div>
  );
}

// ─── Decommission Form ────────────────────────────────────────────────────────

function DecommissionForm({
  assetId,
  onSuccess,
}: {
  assetId: string;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [confirm, setConfirm] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      maintenanceService.decommissionAsset({ assetId, reason, notes }),
    onSuccess,
  });

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-red-800">Descartar Activo</h3>
      <p className="text-sm text-red-700">
        Esta acción es irreversible. El activo pasará a estado{" "}
        <strong>Fuera de servicio</strong>.
      </p>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Motivo del descarte (oblligatorio)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <textarea
          placeholder="Notas adicionales..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
        />
        <label className="flex items-center gap-2 text-sm text-red-700 cursor-pointer">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
            className="accent-red-600"
          />
          Confirmo que deseo descartar este activo definitivamente
        </label>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">
          {(mutation.error as Error)?.message ?? "Error al descartar activo"}
        </p>
      )}

      <button
        onClick={() => mutation.mutate()}
        disabled={!reason.trim() || !confirm || mutation.isPending}
        className="w-full py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition"
      >
        {mutation.isPending ? "Procesando..." : "Descartar activo"}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MaintenanceDetailPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: asset, isLoading } = useQuery<AssetDetail>({
    queryKey: ["asset-detail", assetId],
    queryFn: async (): Promise<AssetDetail> => {
      const res = await api.get<ApiResponse<AssetDetail>>(`/assets/${assetId}`);
      if (!res.data.data) throw new Error("Asset not found");
      return res.data.data;
    },
    enabled: !!assetId,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["maintenance-history", assetId],
    queryFn: () => maintenanceService.getMaintenanceHistory(assetId!),
    enabled: !!assetId,
  });

  const currentState = asset?.state?.currentState;

  function handleDone() {
    queryClient.invalidateQueries({ queryKey: ["maintenance-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["asset-detail", assetId] });
    queryClient.invalidateQueries({
      queryKey: ["maintenance-history", assetId],
    });
    navigate("/maintenance");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-6 text-center text-gray-500">Activo no encontrado.</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/maintenance")}
          className="text-gray-500 hover:text-gray-700 text-xl leading-none"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {asset.name}
          </h1>
          <p className="text-sm text-gray-500">{asset.code}</p>
        </div>
        <StateBadge state={currentState} />
      </div>

      {/* Info card */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4">
        {asset.imageUrl && (
          <img
            src={asset.imageUrl}
            alt={asset.name}
            className="w-20 h-20 rounded object-cover flex-shrink-0"
          />
        )}
        <div className="min-w-0 space-y-1 text-sm">
          <p>
            <span className="font-medium text-gray-700">Tipo:</span>{" "}
            {asset.assetType}
          </p>
          {asset.currentLocation && (
            <p>
              <span className="font-medium text-gray-700">Ubicación:</span>{" "}
              {asset.currentLocation}
            </p>
          )}
        </div>
      </div>

      {/* Actions según estado */}
      {(currentState === "PENDING_MAINTENANCE" ||
        currentState === "MAINTENANCE") && (
        <PostObraForm assetId={asset.id} onSuccess={handleDone} />
      )}

      {currentState !== "OUT_OF_SERVICE" && (
        <DecommissionForm assetId={asset.id} onSuccess={handleDone} />
      )}

      {/* Historial de mantenimiento */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
          Historial de Mantenimiento
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-lg">
            Sin historial de mantenimiento
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((event) => (
              <div
                key={event.id}
                className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    {event.type} — {event.context}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(event.createdAt).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {event.notes && (
                  <p className="text-sm text-gray-600">{event.notes}</p>
                )}
                {event.evidenceUrls && event.evidenceUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {event.evidenceUrls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                      >
                        <img
                          src={url}
                          alt={`Evidencia ${i + 1}`}
                          className="w-16 h-16 rounded object-cover border border-gray-200 hover:opacity-80 transition"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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
  };
  const info = state
    ? (map[state] ?? { label: state, className: "bg-gray-100 text-gray-700" })
    : { label: "—", className: "bg-gray-100 text-gray-700" };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${info.className}`}
    >
      {info.label}
    </span>
  );
}
