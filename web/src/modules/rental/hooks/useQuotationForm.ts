import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { quotationService } from "../services/quotation.service.ts";
import apiClient from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import type {
  QuotationType,
  RentalPeriodType,
  OperatorCostType,
} from "../types/quotation.types.ts";
import type { AssetRentalProfile } from "@/modules/inventory/services/assets.service";

export interface UseQuotationFormOptions {
  quotationId?: string;
}

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
  startDate?: string;
  endDate?: string;

  // v4.0: Campos de configuración
  rentalPeriodType?: RentalPeriodType;
  standbyHours?: number; // Para MACHINERY
  operatorIncluded: boolean;
  operatorCostType?: OperatorCostType;

  // Override manual
  customUnitPrice?: number;
  customOperatorCost?: number;

  // Calculated preview (legacy - backward compatibility)
  calculatedUnitPrice?: number;
  calculatedOperatorCost?: number;

  // v5.0: Multi-period pricing
  selectedPeriods?: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
  };
  pricePerDay?: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  operatorCostPerDay?: number;
  operatorCostPerWeek?: number;
  operatorCostPerMonth?: number;
}

export function useQuotationForm(options?: UseQuotationFormOptions) {
  const navigate = useNavigate();
  const { businessUnit } = useAuthStore();
  const quotationId = options?.quotationId;

  // Form state
  const [selectedClientId, setSelectedClientId] = useState("");

  // v4.0: Tipo de cotización
  const [quotationType, setQuotationType] =
    useState<QuotationType>("time_based");
  const [estimatedDays, setEstimatedDays] = useState(30); // Default 30 días
  const [estimatedStartDate, setEstimatedStartDate] = useState("");
  const [estimatedEndDate, setEstimatedEndDate] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");

  const [items, setItems] = useState<QuotationItem[]>([]);
  const [taxRate, setTaxRate] = useState(19); // Default 19% IVA Colombia
  const [validityDays, setValidityDays] = useState(15);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(
    "• La entrega dependerá del saldo disponible en su cuenta\n• El servicio está sujeto al lapso de tiempo aprobado según su contrato\n• Los equipos deben ser devueltos en las mismas condiciones",
  );
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);

  // ── EDIT MODE: cargar cotización existente ──────────────────────────────
  const { data: existingQuotation, isLoading: loadingExisting } = useQuery({
    queryKey: ["quotation", quotationId],
    queryFn: () => quotationService.getById(quotationId!),
    enabled: !!quotationId,
  });

  // Pre-poblar estado cuando tenemos los datos
  useEffect(() => {
    if (!existingQuotation) return;
    setSelectedClientId(existingQuotation.clientId ?? "");
    setQuotationType(
      (existingQuotation.quotationType as QuotationType) ?? "time_based",
    );
    setEstimatedDays(existingQuotation.estimatedDays ?? 30);
    setEstimatedStartDate(
      (existingQuotation as any).estimatedStartDate
        ? String((existingQuotation as any).estimatedStartDate).slice(0, 10)
        : "",
    );
    setEstimatedEndDate(
      (existingQuotation as any).estimatedEndDate
        ? String((existingQuotation as any).estimatedEndDate).slice(0, 10)
        : "",
    );
    setServiceDescription((existingQuotation as any).serviceDescription ?? "");
    setNotes(existingQuotation.notes ?? "");
    setTerms((existingQuotation as any).termsAndConditions ?? terms);
    setTaxRate(Number(existingQuotation.taxRate) || 19);
    // Calcular validityDays desde validUntil
    if (existingQuotation.validUntil) {
      const days = Math.max(
        1,
        Math.ceil(
          (new Date(existingQuotation.validUntil).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      );
      setValidityDays(days);
    }
    // Mapear items del backend al formato del form
    const mappedItems: QuotationItem[] = (existingQuotation.items ?? []).map(
      (item: any) => ({
        assetId: item.assetId ?? "",
        assetName: item.description ?? "",
        assetCode: item.asset?.code ?? "",
        trackingType: item.asset?.trackingType ?? null,
        quantity: item.quantity ?? 1,
        rentalDays: item.rentalDays ?? estimatedDays, // Usar estimatedDays de la cotización
        startDate: item.rentalStartDate
          ? String(item.rentalStartDate).slice(0, 10)
          : "",
        endDate: item.rentalEndDate
          ? String(item.rentalEndDate).slice(0, 10)
          : "",
        rentalPeriodType:
          (item.rentalPeriodType as RentalPeriodType) ?? "daily",
        standbyHours: Number(item.standbyHours) || 0,
        operatorIncluded: item.operatorIncluded ?? false,
        operatorCostType:
          (item.operatorCostType as OperatorCostType) ?? "PER_DAY",
        customUnitPrice: item.priceOverridden
          ? Number(item.unitPrice)
          : undefined,
        customOperatorCost:
          item.operatorCost && Number(item.operatorCost) > 0
            ? Number(item.operatorCost)
            : undefined,
        calculatedUnitPrice: Number(item.calculatedUnitPrice) || 0,
        calculatedOperatorCost: Number(item.calculatedOperatorCost) || 0,
      }),
    );
    setItems(mappedItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingQuotation]);

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

  // Add a fully-built QuotationItem directly (used by modal flow)
  const addItem = useCallback((item: QuotationItem) => {
    setItems((prev) => [...prev, item]);
    setAssetSearch("");
    setAssetSearchResults([]);
  }, []);

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
        if (
          (field === "startDate" || field === "rentalDays") &&
          updated[index].startDate
        ) {
          const start = new Date(updated[index].startDate!);
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
    mutationFn: (data: any) =>
      quotationId
        ? quotationService.update(quotationId, data)
        : quotationService.create(data),
    onSuccess: () => {
      navigate(`/rental/quotations`);
    },
    onError: (error: any) => {
      console.error("Error saving quotation:", error);
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
      if (quotationType === "service_based") {
        if (!serviceDescription || serviceDescription.length < 10) {
          alert(
            "Para cotización por servicio, describa el trabajo a realizar (mínimo 10 caracteres)",
          );
          return;
        }
      }

      // Calcular validUntil a partir de validityDays
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + validityDays);

      const payload = {
        businessUnitId: businessUnit?.id,
        clientId: selectedClientId,
        validUntil: validUntilDate.toISOString(),
        taxRate,
        notes,
        termsAndConditions: terms,
        templateId,

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
          assetId: item.assetId || undefined,
          description: item.assetName || "Servicio",
          quantity: item.quantity,
          rentalDays: item.rentalDays,
          rentalStartDate: item.startDate || undefined,
          rentalEndDate: item.endDate || undefined,

          // v4.0: Nuevos campos
          rentalPeriodType: item.rentalPeriodType,
          standbyHours: item.standbyHours,
          operatorIncluded: item.operatorIncluded,
          operatorCostType: item.operatorCostType,

          // Override manual
          customUnitPrice: item.customUnitPrice,
          customOperatorCost: item.customOperatorCost,

          // Precio ya calculado en el modal (evita recálculo en backend si hay override)
          unitPrice: item.customUnitPrice ?? item.calculatedUnitPrice,
        })),
      };

      mutation.mutate(payload);
    },
    [
      selectedClientId,
      businessUnit,
      items,
      quotationType,
      estimatedDays,
      estimatedStartDate,
      estimatedEndDate,
      serviceDescription,
      validityDays,
      taxRate,
      notes,
      terms,
      templateId,
      mutation,
    ],
  );

  return {
    // Meta
    quotationId,
    isEditMode: !!quotationId,
    loadingExisting,
    existingQuotation,
    selectedClientId,
    setSelectedClientId,
    quotationType,
    setQuotationType,
    estimatedDays,
    setEstimatedDays,
    estimatedStartDate,
    setEstimatedStartDate,
    estimatedEndDate,
    setEstimatedEndDate,
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
    addItem,
    updateItem,
    removeItem,
    calculateTotals,
    handleSubmit,

    // Mutation
    mutation,
  };
}
