/**
 * DELIVERY FORM MODAL
 * Modal para crear entregas con validación de disponibilidad
 */

import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  X,
  Plus,
  Trash2,
  CheckCircle,
  Package,
  User,
  Truck,
  AlertTriangle,
  TrendingDown,
  Wallet,
  Bell,
  ClipboardList,
  FileCheck,
} from "lucide-react";
import { addendumService } from "../services/addendum.service";
import { accountService } from "../services/account.service";
import { assetsService } from "@/modules/inventory/services/assets.service";
import type { Asset } from "@/modules/inventory/services/assets.service";
import {
  DeliveryAvailabilityCheck,
  type AvailabilityResult,
} from "./DeliveryAvailabilityCheck";
import { LimitIncreaseRequestModal } from "./LimitIncreaseRequestModal";

interface DeliveryItem {
  assetId: string;
  assetName?: string;
  quantity: number;
  estimatedDays: number;
  dailyRate: number;
  hourlyRate?: number;
  expectedReturnDate?: string;
  initialHourometer?: number;
  initialOdometer?: number;
  notes?: string;
}

interface DeliveryFormModalProps {
  contractId: string;
  clientId: string;
  clientName: string;
  currency: string;
  currentBalanceLimit?: number;
  currentTimeLimit?: number;
  contractSigned: boolean;
  paymentVerified: boolean;
  signatureStatus: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeliveryFormModal({
  contractId,
  clientId,
  clientName,
  currency,
  currentBalanceLimit,
  currentTimeLimit,
  contractSigned,
  paymentVerified,
  signatureStatus,
  onClose,
  onSuccess,
}: DeliveryFormModalProps) {
  const [step, setStep] = useState<"form" | "validation">("form");
  const [items, setItems] = useState<DeliveryItem[]>([
    {
      assetId: "",
      quantity: 1,
      estimatedDays: 30,
      dailyRate: 0,
    },
  ]);
  const [notes, setNotes] = useState("");
  const [availabilityResult, setAvailabilityResult] =
    useState<AvailabilityResult | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Operario
  const [hasOperator, setHasOperator] = useState(false);
  const [operatorLicenseUrl, setOperatorLicenseUrl] = useState("");
  const [operatorCertificationUrl, setOperatorCertificationUrl] = useState("");
  const [operatorInsuranceUrl, setOperatorInsuranceUrl] = useState("");
  const [operatorDocumentationNotes, setOperatorDocumentationNotes] =
    useState("");

  // Transporte
  const [transportType, setTransportType] = useState("company_vehicle");
  const [driverName, setDriverName] = useState("");
  const [transportNotes, setTransportNotes] = useState("");

  // Cuenta del cliente — saldo en tiempo real
  const { data: accountInfo } = useQuery({
    queryKey: ["account-by-client", clientId],
    queryFn: () => accountService.getByClientId(clientId),
    enabled: !!clientId,
    staleTime: 30_000, // 30 s
  });

  // Assets disponibles para el selector
  const { data: allAssets = [] } = useQuery({
    queryKey: ["assets-list-for-delivery"],
    queryFn: () => assetsService.list(),
  });

  // Cálculos de saldo actualizados mientras el usuario modifica los ítems
  const balanceSnapshot = useMemo(() => {
    const currentBalance = accountInfo?.balance ?? 0;
    const creditLimit = accountInfo?.creditLimit ?? 0;
    const effectiveBalance = currentBalance + creditLimit;

    const estimatedCost = items.reduce(
      (sum, item) =>
        sum +
        (item.estimatedDays || 0) *
          (item.dailyRate || 0) *
          (item.quantity || 1),
      0,
    );

    const remainingBalance = effectiveBalance - estimatedCost;
    const pctUsed =
      effectiveBalance > 0 ? (estimatedCost / effectiveBalance) * 100 : 100;

    // Días
    const timeLimit = accountInfo?.timeLimit ?? 0;
    const activeDays = accountInfo?.activeDays ?? 0;
    const deliveryDays = items.reduce(
      (max, item) => Math.max(max, item.estimatedDays || 0),
      0,
    );
    const remainingDays = timeLimit - activeDays - deliveryDays;

    return {
      currentBalance,
      creditLimit,
      effectiveBalance,
      estimatedCost,
      remainingBalance,
      pctUsed: Math.min(pctUsed, 100),
      canAfford: remainingBalance >= 0,
      timeLimit,
      activeDays,
      deliveryDays,
      remainingDays,
      hasTimeLimit: timeLimit > 0,
    };
  }, [accountInfo, items]);

  // Mapa id→Asset para acceso rápido
  const assetsMap = useMemo<Record<string, Asset>>(
    () => Object.fromEntries(allAssets.map((a: Asset) => [a.id, a])),
    [allAssets],
  );

  // Auto-habilitar sección de operario si algún asset seleccionado lo requiere
  useEffect(() => {
    const anyRequiresOperator = items.some(
      (item) => item.assetId && assetsMap[item.assetId]?.requiresOperator,
    );
    if (anyRequiresOperator) setHasOperator(true);
  }, [items, assetsMap]);

  // Validar disponibilidad
  const checkAvailabilityMutation = useMutation({
    mutationFn: (validItems: DeliveryItem[]) => {
      const checkItems = validItems.map((item) => ({
        assetId: item.assetId,
        estimatedDays: item.estimatedDays,
        dailyRate: item.dailyRate,
      }));
      return accountService.checkAvailability({
        clientId,
        items: checkItems,
      });
    },
    onSuccess: (result) => {
      // Add currency and contract validation status to result for UI display
      setAvailabilityResult({
        ...result,
        currency,
        contractSigned,
        paymentVerified,
        signatureStatus,
      });
      setStep("validation");
    },
    onError: (error: any) => {
      alert(
        `Error validando disponibilidad: ${error.response?.data?.error?.message || error.message}`,
      );
    },
  });

  // Crear addendum
  const createMutation = useMutation({
    mutationFn: () => {
      const itemsToCreate = items.map((item) => ({
        assetId: item.assetId,
        quantity: item.quantity,
        estimatedDailyRate: item.dailyRate,
        estimatedHourlyRate: item.hourlyRate,
        expectedReturnDate: item.expectedReturnDate,
        initialHourometer: item.initialHourometer,
        initialOdometer: item.initialOdometer,
        notes: item.notes,
      }));

      return addendumService.create(contractId, {
        items: itemsToCreate,
        notes,
        hasOperator,
        operatorLicenseUrl: hasOperator ? operatorLicenseUrl : undefined,
        operatorCertificationUrl: hasOperator
          ? operatorCertificationUrl
          : undefined,
        operatorInsuranceUrl: hasOperator ? operatorInsuranceUrl : undefined,
        operatorDocumentationNotes: hasOperator
          ? operatorDocumentationNotes
          : undefined,
        transportType,
        driverName,
        transportNotes,
      });
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      alert(
        `Error creando entrega: ${error.response?.data?.error?.message || error.message}`,
      );
    },
  });

  const addItem = () => {
    setItems([
      ...items,
      {
        assetId: "",
        quantity: 1,
        estimatedDays: 30,
        dailyRate: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof DeliveryItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleValidate = () => {
    // Validar requisitos del contrato PRIMERO
    if (!contractSigned) {
      alert(
        "El contrato debe estar firmado antes de crear entregas. Por favor, solicita al cliente que firme el contrato.",
      );
      return;
    }

    if (!paymentVerified) {
      alert(
        "El pago debe estar verificado por staff antes de crear entregas. Por favor, verifica el comprobante de pago primero.",
      );
      return;
    }

    // Validar que todos los items tengan datos completos
    const validItems = items.filter(
      (item) => item.assetId && item.estimatedDays > 0 && item.dailyRate > 0,
    );

    if (validItems.length === 0) {
      alert("Debes agregar al menos un activo con tarifa diaria");
      return;
    }

    if (validItems.length < items.length) {
      alert(
        "Algunos items no tienen datos completos (asset, días, tarifa diaria)",
      );
      return;
    }

    checkAvailabilityMutation.mutate(validItems);
  };

  const handleSubmit = () => {
    // Double-check contract requirements
    if (!contractSigned || !paymentVerified) {
      alert(
        "El contrato debe estar firmado y el pago verificado antes de crear entregas.",
      );
      return;
    }

    if (!availabilityResult?.canDeliver) {
      alert("No se puede crear la entrega: disponibilidad insuficiente");
      return;
    }

    createMutation.mutate();
  };

  const handleBack = () => {
    setStep("form");
    setAvailabilityResult(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-lg border border-dark-700 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-dark-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-primary-400" />
              {step === "form" ? "Nueva Entrega" : "Validar Disponibilidad"}
            </h2>
            <p className="text-sm text-dark-400 mt-1">
              {step === "form"
                ? "Configura los activos a entregar"
                : "Verifica que el cliente tenga saldo suficiente"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === "form" ? (
            <div className="space-y-6">
              {/* Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-medium">Activos a entregar</label>
                  <button
                    onClick={addItem}
                    className="btn-ghost btn-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar activo
                  </button>
                </div>

                {items.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 border border-dark-700 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-dark-400">
                        Activo #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(index)}
                          className="p-1 hover:bg-dark-800 rounded text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="label">Activo *</label>
                        <select
                          value={item.assetId}
                          onChange={(e) =>
                            updateItem(index, "assetId", e.target.value)
                          }
                          className="form-input"
                        >
                          <option value="">Seleccionar activo...</option>
                          {allAssets
                            .filter(
                              (a: Asset) =>
                                !a.isCurrentlyRented || a.id === item.assetId,
                            )
                            .map((a: Asset) => (
                              <option key={a.id} value={a.id}>
                                {a.code} — {a.name}
                              </option>
                            ))}
                        </select>

                        {/* Panel de requerimientos del activo seleccionado */}
                        {item.assetId &&
                          assetsMap[item.assetId] &&
                          (() => {
                            const asset = assetsMap[item.assetId];
                            const isMachinery =
                              asset.requiresTracking ||
                              asset.trackingType === "MACHINERY";
                            return (
                              <div className="mt-2 p-3 bg-dark-950 rounded-lg border border-dark-600 text-xs space-y-2">
                                <div className="flex flex-wrap gap-1.5">
                                  <span className="badge">
                                    {asset.assetType}
                                  </span>
                                  {asset.requiresOperator && (
                                    <span className="badge badge-warning flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      Requiere operario
                                    </span>
                                  )}
                                  {isMachinery && (
                                    <span className="badge badge-info flex items-center gap-1">
                                      <FileCheck className="w-3 h-3" />
                                      Con horómetro
                                      {asset.currentHourMeter != null &&
                                        ` (actual: ${asset.currentHourMeter} h)`}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="text-dark-400 flex items-center gap-1 mb-1">
                                    <ClipboardList className="w-3 h-3" />
                                    Evidencias requeridas para esta entrega:
                                  </p>
                                  <ul className="space-y-0.5 text-dark-300 pl-2">
                                    <li>
                                      • Fotos del estado actual antes de salida
                                    </li>
                                    <li>• Inspección visual completada</li>
                                    {asset.requiresOperator && (
                                      <>
                                        <li>
                                          • Licencia de conducir del operario
                                          vigente
                                        </li>
                                        <li>
                                          • Certificación del fabricante vigente
                                        </li>
                                        <li>
                                          • Examen médico ocupacional vigente
                                        </li>
                                        <li>
                                          • ARL activa — entrega de EPP
                                          documentada
                                        </li>
                                      </>
                                    )}
                                    {isMachinery && (
                                      <li>
                                        • Lectura inicial de horómetro /
                                        odómetro confirmada
                                      </li>
                                    )}
                                    {asset.documentExpiries &&
                                      Object.keys(asset.documentExpiries)
                                        .length > 0 && (
                                        <li className="text-yellow-400 mt-1">
                                          ⚠️ Verificar documentos con fechas de
                                          vencimiento registradas
                                        </li>
                                      )}
                                  </ul>
                                </div>
                              </div>
                            );
                          })()}
                      </div>

                      <div>
                        <label className="label">Cantidad *</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "quantity",
                              parseInt(e.target.value) || 1,
                            )
                          }
                          min="1"
                          className="form-input"
                        />
                      </div>

                      <div>
                        <label className="label">Días estimados *</label>
                        <input
                          type="number"
                          value={item.estimatedDays}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "estimatedDays",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          min="1"
                          className="form-input"
                        />
                      </div>

                      <div>
                        <label className="label">
                          Tarifa diaria ({currency}) *
                        </label>
                        <input
                          type="number"
                          value={item.dailyRate}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "dailyRate",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          min="0"
                          step="0.01"
                          className="form-input"
                        />
                      </div>

                      <div>
                        <label className="label">
                          Tarifa horaria ({currency}){" "}
                          <span className="text-dark-500">(opcional)</span>
                        </label>
                        <input
                          type="number"
                          value={item.hourlyRate || ""}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "hourlyRate",
                              parseFloat(e.target.value) || undefined,
                            )
                          }
                          min="0"
                          step="0.01"
                          placeholder="Para maquinaria"
                          className="form-input"
                        />
                      </div>

                      {/* Horómetro / Odómetro — solo para MACHINERY */}
                      {item.assetId &&
                        (assetsMap[item.assetId]?.requiresTracking ||
                          assetsMap[item.assetId]?.trackingType ===
                            "MACHINERY") && (
                          <>
                            <div>
                              <label className="label">
                                Horómetro inicial (h)
                              </label>
                              <input
                                type="number"
                                value={item.initialHourometer ?? ""}
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "initialHourometer",
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined,
                                  )
                                }
                                placeholder={
                                  assetsMap[item.assetId]?.currentHourMeter !=
                                  null
                                    ? `Actual: ${assetsMap[item.assetId].currentHourMeter} h`
                                    : "Ingrese lectura"
                                }
                                className="form-input"
                              />
                            </div>
                            <div>
                              <label className="label">
                                Odómetro inicial (km)
                              </label>
                              <input
                                type="number"
                                value={item.initialOdometer ?? ""}
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "initialOdometer",
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined,
                                  )
                                }
                                placeholder={
                                  assetsMap[item.assetId]?.currentKm != null
                                    ? `Actual: ${assetsMap[item.assetId].currentKm} km`
                                    : "Si aplica"
                                }
                                className="form-input"
                              />
                            </div>
                          </>
                        )}

                      <div className="col-span-2">
                        <label className="label">
                          Fecha de retorno esperada
                        </label>
                        <input
                          type="date"
                          value={item.expectedReturnDate || ""}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "expectedReturnDate",
                              e.target.value,
                            )
                          }
                          className="form-input"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="label">Notas del item</label>
                        <textarea
                          value={item.notes || ""}
                          onChange={(e) =>
                            updateItem(index, "notes", e.target.value)
                          }
                          rows={2}
                          placeholder="Observaciones específicas de este activo..."
                          className="form-input"
                        ></textarea>
                      </div>
                    </div>

                    {/* Item subtotal */}
                    <div className="pt-2 border-t border-dark-800 text-sm">
                      <span className="text-dark-400">Subtotal estimado: </span>
                      <span className="font-bold text-orange-400">
                        {currency} $
                        {(
                          item.estimatedDays *
                          item.dailyRate *
                          item.quantity
                        ).toLocaleString("es-CO", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div>
                <label className="label">Notas de la entrega</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Observaciones generales de la entrega..."
                  className="form-input"
                ></textarea>
              </div>

              {/* Operario */}
              <div className="card bg-dark-800 space-y-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-400" />
                  <h3 className="font-semibold">Operario</h3>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasOperator}
                    onChange={(e) => setHasOperator(e.target.checked)}
                    className="w-4 h-4 rounded border-dark-600 text-primary-500 focus:ring-primary-500"
                  />
                  <span>¿Esta entrega requiere operario?</span>
                </label>

                {hasOperator && (
                  <div className="space-y-3 pl-6 border-l-2 border-primary-500">
                    <div>
                      <label className="label">URL de Licencia</label>
                      <input
                        type="url"
                        value={operatorLicenseUrl}
                        onChange={(e) => setOperatorLicenseUrl(e.target.value)}
                        placeholder="https://..."
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="label">URL de Certificación</label>
                      <input
                        type="url"
                        value={operatorCertificationUrl}
                        onChange={(e) =>
                          setOperatorCertificationUrl(e.target.value)
                        }
                        placeholder="https://..."
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="label">URL de Seguro</label>
                      <input
                        type="url"
                        value={operatorInsuranceUrl}
                        onChange={(e) =>
                          setOperatorInsuranceUrl(e.target.value)
                        }
                        placeholder="https://..."
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="label">Notas de documentación</label>
                      <textarea
                        value={operatorDocumentationNotes}
                        onChange={(e) =>
                          setOperatorDocumentationNotes(e.target.value)
                        }
                        rows={2}
                        placeholder="Observaciones sobre la documentación del operario..."
                        className="form-input"
                      ></textarea>
                    </div>
                  </div>
                )}
              </div>

              {/* Transporte */}
              <div className="card bg-dark-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary-400" />
                  <h3 className="font-semibold">Transporte</h3>
                </div>

                <div>
                  <label className="label">Tipo de transporte *</label>
                  <select
                    value={transportType}
                    onChange={(e) => setTransportType(e.target.value)}
                    className="form-input"
                  >
                    <option value="company_vehicle">
                      Vehículo de la empresa
                    </option>
                    <option value="third_party">
                      Tercero / Transporte externo
                    </option>
                    <option value="client_pickup">
                      Cliente recoge en sede
                    </option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                {transportType !== "client_pickup" && (
                  <div>
                    <label className="label">Nombre del conductor</label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Nombre completo del conductor"
                      className="form-input"
                    />
                  </div>
                )}

                <div>
                  <label className="label">Notas de transporte</label>
                  <textarea
                    value={transportNotes}
                    onChange={(e) => setTransportNotes(e.target.value)}
                    rows={2}
                    placeholder="Observaciones sobre el transporte, ruta, horarios..."
                    className="form-input"
                  ></textarea>
                </div>
              </div>

              {/* Notificación automática a Mantenimiento */}
              {items.some((item) => item.assetId) && (
                <div className="card bg-blue-900/10 border border-blue-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-400" />
                    <h3 className="font-semibold text-sm text-blue-300">
                      Notificación automática a Mantenimiento
                    </h3>
                  </div>
                  <p className="text-xs text-dark-400">
                    Al confirmar, el área de mantenimiento recibirá una
                    notificación con los requerimientos de preparación de cada
                    activo:
                  </p>
                  <ul className="text-xs text-dark-300 space-y-1">
                    {items
                      .filter((item) => item.assetId && assetsMap[item.assetId])
                      .map((item, i) => {
                        const asset = assetsMap[item.assetId];
                        const reqs: string[] = [];
                        if (asset.requiresOperator)
                          reqs.push("operario + docs");
                        if (
                          asset.requiresTracking ||
                          asset.trackingType === "MACHINERY"
                        )
                          reqs.push("horómetro");
                        return (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-blue-400 shrink-0">•</span>
                            <span>
                              <strong>{asset.name}</strong>
                              {reqs.length > 0 && (
                                <span className="text-dark-500 ml-1">
                                  ({reqs.join(", ")})
                                </span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}

              {/* Panel de Saldo en Tiempo Real */}
              <div
                className={`card border-2 transition-colors ${
                  !accountInfo
                    ? "bg-dark-800 border-dark-700"
                    : balanceSnapshot.canAfford
                      ? balanceSnapshot.pctUsed >= 80
                        ? "bg-yellow-900/20 border-yellow-600"
                        : "bg-green-900/20 border-green-700"
                      : "bg-red-900/20 border-red-600"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="w-5 h-5 text-primary-400" />
                  <h3 className="font-semibold text-sm">
                    Saldo de la cuenta — actualización en tiempo real
                  </h3>
                </div>

                {!accountInfo ? (
                  <p className="text-dark-400 text-sm">Cargando saldo...</p>
                ) : (
                  <>
                    {/* Filas de saldo */}
                    <div className="space-y-2 text-sm mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-dark-300">Saldo disponible</span>
                        <span className="font-semibold text-green-400">
                          {currency}{" "}
                          {balanceSnapshot.effectiveBalance.toLocaleString(
                            "es-CO",
                            { minimumFractionDigits: 2 },
                          )}
                          {balanceSnapshot.creditLimit > 0 && (
                            <span className="text-dark-400 font-normal text-xs ml-1">
                              (inc. crédito {currency}{" "}
                              {balanceSnapshot.creditLimit.toLocaleString(
                                "es-CO",
                                { maximumFractionDigits: 0 },
                              )}
                              )
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-dark-300 flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5 text-orange-400" />
                          Costo estimado entrega
                        </span>
                        <span className="font-semibold text-orange-400">
                          − {currency}{" "}
                          {balanceSnapshot.estimatedCost.toLocaleString(
                            "es-CO",
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>

                      <div className="border-t border-dark-700 pt-2 flex justify-between items-center">
                        <span className="font-medium">
                          Saldo después de entrega
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            balanceSnapshot.canAfford
                              ? balanceSnapshot.pctUsed >= 80
                                ? "text-yellow-400"
                                : "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {currency}{" "}
                          {balanceSnapshot.remainingBalance.toLocaleString(
                            "es-CO",
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-full bg-dark-700 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          balanceSnapshot.canAfford
                            ? balanceSnapshot.pctUsed >= 80
                              ? "bg-yellow-500"
                              : "bg-green-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${balanceSnapshot.pctUsed}%` }}
                      />
                    </div>
                    <div className="text-xs text-dark-400 mb-3">
                      {balanceSnapshot.pctUsed.toFixed(1)}% del saldo disponible
                      consumido por esta entrega
                    </div>

                    {/* Días (si la cuenta tiene límite de tiempo) */}
                    {balanceSnapshot.hasTimeLimit && (
                      <div className="border-t border-dark-700 pt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <div className="text-dark-400">Días máx.</div>
                          <div className="font-bold text-dark-200">
                            {balanceSnapshot.timeLimit}
                          </div>
                        </div>
                        <div>
                          <div className="text-dark-400">Días activos</div>
                          <div className="font-bold text-orange-400">
                            {balanceSnapshot.activeDays}
                          </div>
                        </div>
                        <div>
                          <div className="text-dark-400">Días restantes</div>
                          <div
                            className={`font-bold ${balanceSnapshot.remainingDays < 0 ? "text-red-400" : "text-green-400"}`}
                          >
                            {balanceSnapshot.remainingDays}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Alertas */}
                    {!balanceSnapshot.canAfford && (
                      <div className="mt-3 flex items-start gap-2 text-xs text-red-300 bg-red-900/30 rounded-lg p-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span>
                          Saldo insuficiente. Falta{" "}
                          <strong>
                            {currency}{" "}
                            {Math.abs(
                              balanceSnapshot.remainingBalance,
                            ).toLocaleString("es-CO", {
                              minimumFractionDigits: 2,
                            })}
                          </strong>
                          . El sistema bloqueará la entrega al validar la
                          disponibilidad.
                        </span>
                      </div>
                    )}
                    {balanceSnapshot.canAfford &&
                      balanceSnapshot.pctUsed >= 80 && (
                        <div className="mt-3 flex items-start gap-2 text-xs text-yellow-300 bg-yellow-900/30 rounded-lg p-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                          <span>
                            El costo de esta entrega consume más del 80% del
                            saldo disponible.
                          </span>
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          ) : (
            // Validation Step
            <div className="space-y-4">
              {availabilityResult && (
                <DeliveryAvailabilityCheck
                  result={availabilityResult}
                  onReloadBalance={() => {
                    // TODO: Abrir modal de recarga
                    alert("Función de recarga pendiente de implementar");
                  }}
                  onRequestLimitIncrease={() => {
                    setShowLimitModal(true);
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-dark-700 flex items-center justify-between">
          <button onClick={onClose} className="btn-ghost">
            Cancelar
          </button>

          <div className="flex gap-2">
            {step === "validation" && (
              <button onClick={handleBack} className="btn-secondary">
                ← Editar
              </button>
            )}

            {step === "form" ? (
              <button
                onClick={handleValidate}
                disabled={
                  checkAvailabilityMutation.isPending || items.length === 0
                }
                className="btn-primary"
              >
                {checkAvailabilityMutation.isPending ? (
                  "Validando..."
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Validar Disponibilidad
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={
                  !availabilityResult?.canDeliver || createMutation.isPending
                }
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? (
                  "Creando..."
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    Crear Entrega
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Limit Increase Request Modal */}
      {showLimitModal && currentBalanceLimit && currentTimeLimit && (
        <LimitIncreaseRequestModal
          clientId={clientId}
          clientName={clientName}
          currentBalanceLimit={currentBalanceLimit}
          currentTimeLimit={currentTimeLimit}
          currency={currency}
          onClose={() => setShowLimitModal(false)}
          onSuccess={() => {
            setShowLimitModal(false);
            alert("✅ Solicitud enviada exitosamente a los administradores");
          }}
        />
      )}
    </div>
  );
}
