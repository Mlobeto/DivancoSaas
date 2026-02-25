import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import { clientService } from "@/modules/clients/services/client.service";
import {
  AlertCircle,
  Plus,
  User,
  Clock,
  Briefcase,
  Search,
} from "lucide-react";
import { useQuotationForm } from "../hooks/useQuotationForm";
import { QuotationTypeSelector } from "../components/QuotationTypeSelector";
import { AssetSearchInput } from "../components/AssetSearchInput";
import { QuotationItemCard } from "../components/QuotationItemCard";
import { QuotationSummary } from "../components/QuotationSummary";
import { TemplateSelector } from "../components/TemplateSelector";
import {
  AddTimeBasedItemModal,
  TimeBasedItemData,
} from "../components/AddTimeBasedItemModal";
import {
  AddServiceBasedItemModal,
  ServiceBasedItemData,
} from "../components/AddServiceBasedItemModal";
import { PreviewPanel } from "../components/PreviewPanel";

export function QuotationFormPage() {
  const navigate = useNavigate();
  const { businessUnit } = useAuthStore();

  // Modal states
  const [selectedAssetForModal, setSelectedAssetForModal] = useState<any>(null);
  const [showTimeBasedModal, setShowTimeBasedModal] = useState(false);
  const [showServiceBasedModal, setShowServiceBasedModal] = useState(false);

  const {
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
  } = useQuotationForm();

  const { data: clientsData, isLoading: loadingClients } = useQuery({
    queryKey: ["clients", "dropdown"],
    queryFn: () => clientService.list({ limit: 100 }),
  });

  // Debug log
  console.log("Clients data:", clientsData);
  console.log("Loading clients:", loadingClients);

  const totals = calculateTotals();

  // Get selected client name for preview
  const selectedClient = clientsData?.data?.find(
    (c: any) => c.id === selectedClientId,
  );

  // Handle adding time-based item from modal
  const handleAddTimeBasedItem = (itemData: TimeBasedItemData) => {
    const newItem = {
      ...itemData,
      calculatedUnitPrice: 0, // Will be calculated
      calculatedOperatorCost: 0, // Will be calculated
    };
    handleAddAsset(newItem as any);
  };

  // Handle adding service-based item from modal
  const handleAddServiceBasedItem = (itemData: ServiceBasedItemData) => {
    const newItem = {
      assetId: "", // No asset for service-based
      assetName: itemData.description,
      assetCode: "",
      trackingType: null,
      description: itemData.description,
      quantity: itemData.quantity,
      rentalDays: 0,
      startDate: "",
      endDate: "",
      rentalPeriodType: "daily" as const,
      standbyHours: undefined,
      operatorIncluded: false,
      operatorCostType: undefined,
      customUnitPrice: itemData.fixedPrice,
      calculatedUnitPrice: itemData.fixedPrice,
      calculatedOperatorCost: 0,
      detailedDescription: itemData.detailedDescription,
      milestones: itemData.milestones,
    };
    handleAddAsset(newItem as any);
  };

  // Handle asset selection from search (time-based only)
  const handleAssetSelect = (asset: any) => {
    setSelectedAssetForModal(asset);
    setShowTimeBasedModal(true);
  };

  return (
    <Layout
      title="Nueva Cotización"
      subtitle={`Crear cotización v4.0 - ${businessUnit?.name || "Sistema"}`}
      actions={
        <button
          onClick={() => navigate("/rental/quotations")}
          className="btn-ghost"
        >
          ← Volver
        </button>
      }
    >
      {/* 2-Column Layout: Sidebar + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-[1600px] mx-auto">
        {/* LEFT SIDEBAR - Form */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quotation Type Selector */}
            <QuotationTypeSelector
              quotationType={quotationType}
              onTypeChange={setQuotationType}
              estimatedStartDate={estimatedStartDate}
              onStartDateChange={setEstimatedStartDate}
              estimatedEndDate={estimatedEndDate}
              onEndDateChange={setEstimatedEndDate}
              estimatedDays={estimatedDays}
              serviceDescription={serviceDescription}
              onServiceDescriptionChange={setServiceDescription}
            />

            {/* Client Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Cliente
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Cliente <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  required
                  disabled={loadingClients}
                >
                  <option value="">
                    {loadingClients
                      ? "Cargando clientes..."
                      : "-- Seleccione un cliente --"}
                  </option>
                  {clientsData?.data?.map((client: any) => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.email || client.phone}
                    </option>
                  ))}
                </select>
                {clientsData?.data && clientsData.data.length === 0 && (
                  <p className="mt-2 text-sm text-yellow-600">
                    No hay clientes registrados.{" "}
                    <a href="/clients/new" className="underline">
                      Crear cliente
                    </a>
                  </p>
                )}
              </div>
            </div>

            {/* Template Selector */}
            <TemplateSelector
              templateId={templateId}
              onTemplateChange={setTemplateId}
            />

            {/* Items Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Items de la Cotización
              </h2>

              {/* Action Buttons based on type */}
              <div className="mb-6 space-y-3">
                {quotationType === "time_based" ? (
                  <>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                        <Search className="w-4 h-4 text-blue-600" />
                        <span>
                          Busca un asset para agregarlo a la cotización
                        </span>
                      </p>
                      <AssetSearchInput
                        searchValue={assetSearch}
                        onSearchChange={setAssetSearch}
                        searchResults={assetSearchResults}
                        isSearching={searchingAssets}
                        onSelectAsset={handleAssetSelect}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowServiceBasedModal(true)}
                      className="w-full p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg hover:from-green-100 hover:to-green-200 transition-all flex items-center justify-center gap-3 group"
                    >
                      <Briefcase className="w-5 h-5 text-green-700 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-green-900">
                        + Definir Servicio/Trabajo
                      </span>
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                      Agrega servicios con precio fijo (ej: construcción de 2 km
                      de caminos)
                    </p>
                  </>
                )}
              </div>

              {/* Items List */}
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg">No hay items agregados</p>
                  <p className="text-sm">
                    {quotationType === "time_based"
                      ? "Busca y selecciona assets arriba para agregarlos"
                      : "Haz clic en 'Definir Servicio/Trabajo' para agregar"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <QuotationItemCard
                      key={index}
                      item={item}
                      index={index}
                      onUpdate={updateItem}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Configuration */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Configuración General
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Validez (días)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    value={validityDays}
                    onChange={(e) =>
                      setValidityDays(parseInt(e.target.value) || 15)
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Días que la cotización es válida desde su creación
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas Internas (Opcional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas visibles solo internamente..."
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Términos y Condiciones
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                    rows={4}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Términos y condiciones que aparecerán en el PDF..."
                  />
                </div>
              </div>
            </div>

            {/* Totals Summary */}
            {items.length > 0 && (
              <QuotationSummary
                subtotal={totals.subtotal}
                taxRate={taxRate}
                onTaxRateChange={setTaxRate}
                taxAmount={totals.taxAmount}
                total={totals.total}
              />
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pb-8">
              <button
                type="button"
                onClick={() => navigate("/rental/quotations")}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={mutation.isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
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
        </div>

        {/* RIGHT SIDEBAR - Preview Panel */}
        <div className="lg:col-span-2">
          <PreviewPanel
            quotationType={quotationType}
            clientName={selectedClient?.name}
            estimatedStartDate={estimatedStartDate}
            estimatedEndDate={estimatedEndDate}
            estimatedDays={estimatedDays}
            serviceDescription={serviceDescription}
            items={items}
            subtotal={totals.subtotal}
            taxRate={taxRate}
            taxAmount={totals.taxAmount}
            total={totals.total}
            businessUnitName={businessUnit?.name}
          />
        </div>
      </div>

      {/* Modals */}
      <AddTimeBasedItemModal
        isOpen={showTimeBasedModal}
        onClose={() => {
          setShowTimeBasedModal(false);
          setSelectedAssetForModal(null);
        }}
        asset={selectedAssetForModal}
        estimatedStartDate={estimatedStartDate}
        estimatedEndDate={estimatedEndDate}
        estimatedDays={estimatedDays}
        onAdd={handleAddTimeBasedItem}
      />

      <AddServiceBasedItemModal
        isOpen={showServiceBasedModal}
        onClose={() => setShowServiceBasedModal(false)}
        onAdd={handleAddServiceBasedItem}
      />
    </Layout>
  );
}
