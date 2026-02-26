import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { quotationService } from "../services/quotation.service.ts";
import apiClient from "@/lib/api";
import type {
  QuotationType,
  RentalPeriodType,
  OperatorCostType,
} from "../types/quotation.types.ts";
import type { AssetRentalProfile } from "@/modules/inventory/services/assets.service";

export interface AssetSearchResult {
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
  rentalProfile?: AssetRentalProfile; // Multi-vertical extension
  availability: {
    available: boolean;
    status: "available" | "in_use" | "maintenance";
    estimatedReturnDate?: string | null;
  };
}

export interface QuotationItem {
  assetId: string;
  assetName: string;
  assetCode: string;
  trackingType: "MACHINERY" | "TOOL" | null;
  quantity: number;
  rentalDays: number;
  startDate: string;
  endDate: string;

  // v4.0: Nuevos campos
  rentalPeriodType: RentalPeriodType;
  standbyHours?: number; // Para MACHINERY
  operatorIncluded: boolean;
  operatorCostType?: OperatorCostType;

  // Override manual
  customUnitPrice?: number;
  customOperatorCost?: number;

  // Calculated preview
  calculatedUnitPrice?: number;
  calculatedOperatorCost?: number;
}

export function useQuotationForm() {
  const navigate = useNavigate();

  // Form state
  const [selectedClientId, setSelectedClientId] = useState("");

  // v4.0: Tipo de cotización
  const [quotationType, setQuotationType] =
    useState<QuotationType>("time_based");
  const [estimatedStartDate, setEstimatedStartDate] = useState("");
  const [estimatedEndDate, setEstimatedEndDate] = useState("");
  const [estimatedDays, setEstimatedDays] = useState(0);
  const [serviceDescription, setServiceDescription] = useState("");

  const [items, setItems] = useState<QuotationItem[]>([]);
  const [taxRate, setTaxRate] = useState(19); // Default 19% IVA Colombia
  const [validityDays, setValidityDays] = useState(15);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(
    "• Los precios incluyen IVA\n• El pago se realizará 50% adelanto, 50% contra entrega\n• Los equipos deben ser devueltos en las mismas condiciones",
  );
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);

  // Asset search state
  const [assetSearch, setAssetSearch] = useState("");
  const [assetSearchResults, setAssetSearchResults] = useState<
    AssetSearchResult[]
  >([]);
  const [searchingAssets, setSearchingAssets] = useState(false);

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

  // v4.0: Calcular automáticamente estimatedDays cuando cambian las fechas
  useEffect(() => {
    if (
      estimatedStartDate &&
      estimatedEndDate &&
      quotationType === "time_based"
    ) {
      const start = new Date(estimatedStartDate);
      const end = new Date(estimatedEndDate);
      const days = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
      setEstimatedDays(days > 0 ? days : 0);
    }
  }, [estimatedStartDate, estimatedEndDate, quotationType]);

  // Calculate item price preview
  const calculateItemPreview = useCallback(
    (item: QuotationItem, asset?: AssetSearchResult) => {
      if (!asset && !item.assetId) return;

      // Helper: Obtener valor con fallback desde rentalProfile (multi-vertical)
      const getPrice = (field: keyof AssetRentalProfile) => {
        if (!asset) return 0;
        const profileValue = asset.rentalProfile?.[field];
        const legacyValue = asset[field as keyof AssetSearchResult];
        return Number(profileValue ?? legacyValue ?? 0);
      };

      const trackingType =
        asset?.rentalProfile?.trackingType || asset?.trackingType;

      // For MACHINERY
      if (trackingType === "MACHINERY") {
        const pricePerHour = getPrice("pricePerHour");
        const minDailyHours = getPrice("minDailyHours");
        // v4.0: Usar standbyHours del item
        const standbyHours = item.standbyHours || minDailyHours || 8;
        item.calculatedUnitPrice =
          item.rentalDays * standbyHours * pricePerHour;
      }
      // For TOOL
      else if (trackingType === "TOOL") {
        const pricePerMonth = getPrice("pricePerMonth");
        const pricePerWeek = getPrice("pricePerWeek");
        const pricePerDay = getPrice("pricePerDay");

        if (item.rentalDays >= 30 && pricePerMonth) {
          item.calculatedUnitPrice = pricePerMonth;
        } else if (item.rentalDays >= 7 && pricePerWeek) {
          item.calculatedUnitPrice = pricePerWeek;
        } else {
          item.calculatedUnitPrice = pricePerDay * item.rentalDays;
        }
      }

      // Operator cost (v4.0: usar operatorCostType del item)
      const operatorCostRate = getPrice("operatorCostRate");
      const operatorCostType =
        asset?.rentalProfile?.operatorCostType || asset?.operatorCostType;

      if (item.operatorIncluded && operatorCostRate) {
        const costType = item.operatorCostType || operatorCostType || "PER_DAY";

        if (costType === "PER_HOUR") {
          const minDailyHours = getPrice("minDailyHours");
          const standbyHours = item.standbyHours || minDailyHours || 8;
          item.calculatedOperatorCost =
            item.rentalDays * standbyHours * operatorCostRate;
        } else {
          // PER_DAY
          item.calculatedOperatorCost = item.rentalDays * operatorCostRate;
        }
      } else {
        item.calculatedOperatorCost = 0;
      }
    },
    [],
  );

  // Add asset to items
  const handleAddAsset = useCallback(
    (asset: AssetSearchResult) => {
      const today = new Date().toISOString().split("T")[0];

      // Use rentalProfile with fallback for multi-vertical architecture
      const trackingType =
        asset.rentalProfile?.trackingType || asset.trackingType;
      const minDailyHours =
        asset.rentalProfile?.minDailyHours || asset.minDailyHours;
      const operatorCostType =
        asset.rentalProfile?.operatorCostType || asset.operatorCostType;

      const newItem: QuotationItem = {
        assetId: asset.id,
        assetName: asset.name,
        assetCode: asset.code,
        trackingType: trackingType,
        quantity: 1,
        rentalDays: 1,
        startDate: today,
        endDate: today,

        // v4.0: Nuevos campos pre-llenados desde el asset
        rentalPeriodType: trackingType === "MACHINERY" ? "hourly" : "daily",
        standbyHours: minDailyHours || 0,
        operatorIncluded: asset.requiresOperator,
        operatorCostType: operatorCostType || "PER_DAY",
      };

      // Calculate preview prices
      calculateItemPreview(newItem, asset);

      setItems((prev) => [...prev, newItem]);
      setAssetSearch(""); // Clear search
      setAssetSearchResults([]);
    },
    [calculateItemPreview],
  );

  // Update item field
  const updateItem = useCallback(
    (index: number, field: keyof QuotationItem, value: any) => {
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
    },
    [],
  );

  // Remove item
  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Calculate totals
  const calculateTotals = useCallback(() => {
    const subtotal = items.reduce((sum, item) => {
      const unitPrice = item.customUnitPrice ?? item.calculatedUnitPrice ?? 0;
      const operatorCost =
        item.customOperatorCost ?? item.calculatedOperatorCost ?? 0;
      return sum + (unitPrice + operatorCost) * item.quantity;
    }, 0);

    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total };
  }, [items, taxRate]);

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
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedClientId) {
        alert("Seleccione un cliente");
        return;
      }

      if (items.length === 0) {
        alert("Agregue al menos un item");
        return;
      }

      // v4.0: Validaciones según tipo de cotización
      if (quotationType === "time_based") {
        if (!estimatedStartDate || !estimatedEndDate) {
          alert(
            "Para cotización por tiempo, especifique las fechas de inicio y fin",
          );
          return;
        }
      } else if (quotationType === "service_based") {
        if (!serviceDescription || serviceDescription.length < 10) {
          alert(
            "Para cotización por servicio, describa el trabajo a realizar (mínimo 10 caracteres)",
          );
          return;
        }
      }

      const payload = {
        clientId: selectedClientId,
        validityDays,
        taxRate,
        notes,
        terms,
        templateId, // v4.0: Plantilla para generar PDF

        // v4.0: Tipo de cotización
        quotationType,
        estimatedStartDate:
          quotationType === "time_based" ? estimatedStartDate : undefined,
        estimatedEndDate:
          quotationType === "time_based" ? estimatedEndDate : undefined,
        estimatedDays:
          quotationType === "time_based" ? estimatedDays : undefined,
        serviceDescription:
          quotationType === "service_based" ? serviceDescription : undefined,

        items: items.map((item) => ({
          assetId: item.assetId,
          quantity: item.quantity,
          rentalDays: item.rentalDays,
          startDate: item.startDate,
          endDate: item.endDate,

          // v4.0: Nuevos campos
          rentalPeriodType: item.rentalPeriodType,
          standbyHours: item.standbyHours,
          operatorIncluded: item.operatorIncluded,
          operatorCostType: item.operatorCostType,

          // Override manual
          customUnitPrice: item.customUnitPrice,
          customOperatorCost: item.customOperatorCost,
        })),
      };

      mutation.mutate(payload);
    },
    [
      selectedClientId,
      items,
      quotationType,
      estimatedStartDate,
      estimatedEndDate,
      estimatedDays,
      serviceDescription,
      validityDays,
      taxRate,
      notes,
      terms,
      mutation,
    ],
  );

  return {
    // State
    selectedClientId,
    setSelectedClientId,
    quotationType,
    setQuotationType,
    estimatedStartDate,
    setEstimatedStartDate,
    estimatedEndDate,
    setEstimatedEndDate,
    estimatedDays,
    serviceDescription,
    setServiceDescription,
    items,
    taxRate,
    setTaxRate,
    validityDays,
    setValidityDays,
    notes,
    setNotes,
    terms,
    setTerms,
    templateId,
    setTemplateId,

    // Asset search
    assetSearch,
    setAssetSearch,
    assetSearchResults,
    searchingAssets,

    // Handlers
    handleAddAsset,
    updateItem,
    removeItem,
    calculateTotals,
    handleSubmit,

    // Mutation
    mutation,
  };
}
