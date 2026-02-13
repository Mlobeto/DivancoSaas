import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import { quotationService } from "../services/quotation.service.ts";
import { clientService } from "@/modules/clients/services/client.service";
import apiClient from "@/lib/api";
import {
  Search,
  Plus,
  Trash2,
  AlertCircle,
  Calculator,
  DollarSign,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";

interface AssetSearchResult {
  id: string;
  code: string;
  name: string;
  trackingType: "MACHINERY" | "TOOL" | null;
  imageUrl: string | null;
  pricePerHour: number | null;
  minDailyHours: number | null;
  pricePerDay: number | null;
  pricePerWeek: number | null;
  pricePerMonth: number | null;
  operatorCostType: "PER_HOUR" | "PER_DAY" | null;
  operatorCostRate: number | null;
  requiresOperator: boolean;
  availability: {
    available: boolean;
    status: "available" | "in_use" | "maintenance";
    estimatedReturnDate?: string | null;
  };
}

interface QuotationItem {
  assetId: string;
  assetName: string;
  assetCode: string;
  trackingType: "MACHINERY" | "TOOL" | null;
  quantity: number;
  rentalDays: number;
  minDailyHours?: number;
  startDate: string;
  endDate: string;
  operatorIncluded: boolean;
  customUnitPrice?: number;
  customOperatorCost?: number;
  // Calculated preview
  calculatedUnitPrice?: number;
  calculatedOperatorCost?: number;
}

export function QuotationFormPage() {
  const navigate = useNavigate();
  const { businessUnit } = useAuthStore();

  // Form state
  const [selectedClientId, setSelectedClientId] = useState("");
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [taxRate, setTaxRate] = useState(19); // Default 19% IVA Colombia
  const [validityDays, setValidityDays] = useState(15);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(
    "• Los precios incluyen IVA\n• El pago se realizará 50% adelanto, 50% contra entrega\n• Los equipos deben ser devueltos en las mismas condiciones",
  );

  // Asset search state
  const [assetSearch, setAssetSearch] = useState("");
  const [assetSearchResults, setAssetSearchResults] = useState<
    AssetSearchResult[]
  >([]);
  const [searchingAssets, setSearchingAssets] = useState(false);

  // Load clients for dropdown
  const { data: clientsData } = useQuery({
    queryKey: ["clients", "dropdown"],
    queryFn: () => clientService.list({ limit: 100 }),
  });

  // Search assets (debounced)
  useEffect(() => {
    if (!assetSearch || assetSearch.length < 2) {
      setAssetSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingAssets(true);
      try {
        const response = await apiClient.get(
          "/modules/assets/search-for-quotation",
          {
            params: {
              search: assetSearch,
              includeUnavailable: false,
              limit: 10,
            },
          },
        );
        setAssetSearchResults(response.data.data || []);
      } catch (error) {
        console.error("Error searching assets:", error);
        setAssetSearchResults([]);
      } finally {
        setSearchingAssets(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [assetSearch]);

  // Add asset to items
  const handleAddAsset = useCallback((asset: AssetSearchResult) => {
    const today = new Date().toISOString().split("T")[0];
    const newItem: QuotationItem = {
      assetId: asset.id,
      assetName: asset.name,
      assetCode: asset.code,
      trackingType: asset.trackingType,
      quantity: 1,
      rentalDays: 1,
      minDailyHours: asset.minDailyHours || undefined,
      startDate: today,
      endDate: today,
      operatorIncluded: asset.requiresOperator,
    };

    // Calculate preview
    calculateItemPreview(newItem, asset);

    setItems((prev) => [...prev, newItem]);
    setAssetSearch("");
    setAssetSearchResults([]);
  }, []);

  // Calculate item price preview
  const calculateItemPreview = (
    item: QuotationItem,
    asset?: AssetSearchResult,
  ) => {
    if (!asset && !item.assetId) return;

    // For MACHINERY
    if (item.trackingType === "MACHINERY") {
      const pricePerHour = asset?.pricePerHour || 0;
      const minHours = item.minDailyHours || asset?.minDailyHours || 8;
      item.calculatedUnitPrice = item.rentalDays * minHours * pricePerHour;
    }
    // For TOOL
    else if (item.trackingType === "TOOL") {
      if (item.rentalDays >= 30 && asset?.pricePerMonth) {
        item.calculatedUnitPrice = asset.pricePerMonth;
      } else if (item.rentalDays >= 7 && asset?.pricePerWeek) {
        item.calculatedUnitPrice = asset.pricePerWeek;
      } else {
        item.calculatedUnitPrice = (asset?.pricePerDay || 0) * item.rentalDays;
      }
    }

    // Operator cost
    if (item.operatorIncluded && asset?.operatorCostRate) {
      if (asset.operatorCostType === "PER_HOUR") {
        const minHours = item.minDailyHours || asset.minDailyHours || 8;
        item.calculatedOperatorCost =
          item.rentalDays * minHours * asset.operatorCostRate;
      } else {
        item.calculatedOperatorCost = item.rentalDays * asset.operatorCostRate;
      }
    } else {
      item.calculatedOperatorCost = 0;
    }
  };

  // Update item field
  const updateItem = (
    index: number,
    field: keyof QuotationItem,
    value: any,
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Recalculate end date if start date or rental days change
      if (field === "startDate" || field === "rentalDays") {
        const start = new Date(updated[index].startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + updated[index].rentalDays);
        updated[index].endDate = end.toISOString().split("T")[0];
      }

      return updated;
    });
  };

  // Remove item
  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const unitPrice = item.customUnitPrice ?? item.calculatedUnitPrice ?? 0;
      const operatorCost =
        item.customOperatorCost ?? item.calculatedOperatorCost ?? 0;
      return sum + (unitPrice + operatorCost) * item.quantity;
    }, 0);

    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total };
  };

  // Submit mutation
  const mutation = useMutation({
    mutationFn: (data: any) => quotationService.create(data),
    onSuccess: () => {
      navigate(`/quotations`);
    },
    onError: (error: any) => {
      console.error("Error creating quotation:", error);
    },
  });

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId) {
      alert("Seleccione un cliente");
      return;
    }

    if (items.length === 0) {
      alert("Agregue al menos un item");
      return;
    }

    const payload = {
      clientId: selectedClientId,
      validityDays,
      taxRate,
      notes,
      terms,
      items: items.map((item) => ({
        assetId: item.assetId,
        quantity: item.quantity,
        rentalDays: item.rentalDays,
        minDailyHours: item.minDailyHours,
        startDate: item.startDate,
        endDate: item.endDate,
        operatorIncluded: item.operatorIncluded,
        customUnitPrice: item.customUnitPrice,
        customOperatorCost: item.customOperatorCost,
      })),
    };

    mutation.mutate(payload);
  };

  const totals = calculateTotals();

  return (
    <Layout
      title="Nueva Cotización"
      subtitle={`Crear cotización con auto-cálculo de precios - ${businessUnit?.name}`}
      actions={
        <button onClick={() => navigate("/quotations")} className="btn-ghost">
          ← Volver
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Selection */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-400" />
            Cliente
          </h3>
          <div className="form-group">
            <label className="form-label">Seleccionar Cliente *</label>
            <select
              className="form-input"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              required
            >
              <option value="">-- Seleccione un cliente --</option>
              {clientsData?.data?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.email || client.phone}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Asset Search & Items */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary-400" />
            Items de la Cotización
          </h3>

          {/* Asset Search */}
          <div className="mb-6">
            <label className="form-label">Buscar Asset para Agregar</label>
            <div className="relative">
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Buscar por código o nombre..."
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            </div>

            {/* Search Results Dropdown */}
            {assetSearch && (
              <div className="mt-2 bg-dark-800 border border-dark-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchingAssets && (
                  <div className="p-4 text-center text-dark-400">
                    Buscando...
                  </div>
                )}
                {!searchingAssets && assetSearchResults.length === 0 && (
                  <div className="p-4 text-center text-dark-500">
                    No se encontraron resultados
                  </div>
                )}
                {assetSearchResults.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => handleAddAsset(asset)}
                    className="w-full p-3 hover:bg-dark-700 flex items-center gap-3 border-b border-dark-700 last:border-0 text-left"
                  >
                    {asset.imageUrl && (
                      <img
                        src={asset.imageUrl}
                        alt={asset.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{asset.name}</div>
                      <div className="text-sm text-dark-400">
                        {asset.code} • {asset.trackingType}
                      </div>
                    </div>
                    {asset.availability.available ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Items Table */}
          {items.length === 0 ? (
            <div className="text-center py-8 text-dark-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay items. Busca y agrega assets arriba.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="border border-dark-700 rounded-lg p-4 bg-dark-800/50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{item.assetName}</h4>
                      <p className="text-sm text-dark-400">
                        {item.assetCode} • {item.trackingType}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="form-group">
                      <label className="form-label text-xs">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 1,
                          )
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Días Renta</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        value={item.rentalDays}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "rentalDays",
                            parseInt(e.target.value) || 1,
                          )
                        }
                      />
                    </div>

                    {item.trackingType === "MACHINERY" && (
                      <div className="form-group">
                        <label className="form-label text-xs">Horas/Día</label>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          value={item.minDailyHours || 8}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "minDailyHours",
                              parseInt(e.target.value) || 8,
                            )
                          }
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label text-xs">Inicio</label>
                      <input
                        type="date"
                        className="form-input"
                        value={item.startDate}
                        onChange={(e) =>
                          updateItem(index, "startDate", e.target.value)
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Fin</label>
                      <input
                        type="date"
                        className="form-input"
                        value={item.endDate}
                        readOnly
                        disabled
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Operador</label>
                      <label className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          checked={item.operatorIncluded}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "operatorIncluded",
                              e.target.checked,
                            )
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Incluir</span>
                      </label>
                    </div>
                  </div>

                  {/* Price Preview & Override */}
                  <div className="mt-4 pt-4 border-t border-dark-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-semibold mb-2 text-primary-300">
                        Precio Calculado
                      </h5>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-dark-400">Precio Unit.:</span>
                          <span className="font-mono">
                            ${(item.calculatedUnitPrice || 0).toLocaleString()}
                          </span>
                        </div>
                        {item.operatorIncluded && (
                          <div className="flex justify-between">
                            <span className="text-dark-400">Operador:</span>
                            <span className="font-mono">
                              $
                              {(
                                item.calculatedOperatorCost || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold pt-1 border-t border-dark-700">
                          <span>Subtotal (x{item.quantity}):</span>
                          <span className="font-mono">
                            $
                            {(
                              ((item.calculatedUnitPrice || 0) +
                                (item.calculatedOperatorCost || 0)) *
                              item.quantity
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-semibold mb-2 text-yellow-400">
                        Override Manual (Opcional)
                      </h5>
                      <div className="space-y-2">
                        <div className="form-group">
                          <label className="form-label text-xs">
                            Precio Unit. Custom
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-input"
                            placeholder={`${item.calculatedUnitPrice || 0}`}
                            value={item.customUnitPrice || ""}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "customUnitPrice",
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              )
                            }
                          />
                        </div>
                        {item.operatorIncluded && (
                          <div className="form-group">
                            <label className="form-label text-xs">
                              Costo Operador Custom
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="form-input"
                              placeholder={`${item.calculatedOperatorCost || 0}`}
                              value={item.customOperatorCost || ""}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "customOperatorCost",
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined,
                                )
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Configuration */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary-400" />
            Configuración General
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Validez (días)</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={validityDays}
                onChange={(e) =>
                  setValidityDays(parseInt(e.target.value) || 15)
                }
              />
              <p className="text-xs text-dark-500 mt-1">
                Días que la cotización es válida desde su creación
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Tasa de Impuestos (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="form-input"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="form-group col-span-full">
              <label className="form-label">Notas Internas (Opcional)</label>
              <textarea
                className="form-input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas visibles solo internamente..."
              />
            </div>

            <div className="form-group col-span-full">
              <label className="form-label">Términos y Condiciones</label>
              <textarea
                className="form-input"
                rows={5}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Términos y condiciones que aparecerán en el PDF..."
              />
            </div>
          </div>
        </div>

        {/* Totals Summary */}
        {items.length > 0 && (
          <div className="card bg-dark-900 border-2 border-primary-800">
            <h3 className="text-lg font-semibold mb-4">Resumen de Totales</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-lg">
                <span className="text-dark-400">Subtotal:</span>
                <span className="font-mono font-semibold">
                  $
                  {totals.subtotal.toLocaleString("es-CO", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">IVA ({taxRate}%):</span>
                <span className="font-mono">
                  $
                  {totals.taxAmount.toLocaleString("es-CO", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-2xl font-bold pt-3 border-t border-dark-700">
                <span className="text-primary-400">TOTAL:</span>
                <span className="font-mono text-primary-400">
                  $
                  {totals.total.toLocaleString("es-CO", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/quotations")}
            className="btn-ghost"
            disabled={mutation.isPending}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={
              mutation.isPending || items.length === 0 || !selectedClientId
            }
          >
            {mutation.isPending ? (
              <>Creando...</>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Crear Cotización
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {mutation.error && (
          <div className="p-4 rounded bg-red-900/20 border border-red-800 text-red-400">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5" />
              <strong>Error al crear cotización</strong>
            </div>
            <p className="text-sm">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Error desconocido"}
            </p>
          </div>
        )}
      </form>
    </Layout>
  );
}
