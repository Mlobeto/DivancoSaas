/**
 * DELIVERY FORM MODAL
 * Modal para crear entregas con validación de disponibilidad
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Plus, Trash2, CheckCircle, Package } from "lucide-react";
import { addendumService } from "../services/addendum.service";
import { accountService } from "../services/account.service";
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
  notes?: string;
}

interface DeliveryFormModalProps {
  contractId: string;
  clientId: string;
  clientName: string;
  currency: string;
  currentBalanceLimit?: number;
  currentTimeLimit?: number;
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
      // Add currency to result for UI display
      setAvailabilityResult({ ...result, currency });
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
        notes: item.notes,
      }));

      return addendumService.create(contractId, {
        items: itemsToCreate,
        notes,
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

  const totalEstimated = items.reduce(
    (sum, item) => sum + item.estimatedDays * item.dailyRate * item.quantity,
    0,
  );

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
                        <label className="label">Asset ID *</label>
                        <input
                          type="text"
                          value={item.assetId}
                          onChange={(e) =>
                            updateItem(index, "assetId", e.target.value)
                          }
                          placeholder="ID del activo"
                          className="form-input"
                        />
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

              {/* Total */}
              <div className="card bg-dark-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Estimado:</span>
                  <span className="text-2xl font-bold text-orange-400">
                    {currency} $
                    {totalEstimated.toLocaleString("es-CO", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
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
