import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import { clientService } from "@/modules/clients/services/client.service";
import { AlertCircle, Plus, User } from "lucide-react";
import { useQuotationForm } from "../hooks/useQuotationForm";
import { QuotationTypeSelector } from "../components/QuotationTypeSelector";
import { AssetSearchInput } from "../components/AssetSearchInput";
import { QuotationItemCard } from "../components/QuotationItemCard";
import { QuotationSummary } from "../components/QuotationSummary";
import { TemplateSelector } from "../components/TemplateSelector";

export function QuotationFormPage() {
  const navigate = useNavigate();
  const { businessUnit } = useAuthStore();

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

  const { data: clientsData } = useQuery({
    queryKey: ["clients", "dropdown"],
    queryFn: () => clientService.list({ limit: 100 }),
  });

  const totals = calculateTotals();

  return (
    <Layout
      title="Nueva Cotización"
      subtitle={`Crear cotización v4.0 - ${businessUnit?.name || "Sistema"}`}
      actions={
        <button onClick={() => navigate("/quotations")} className="btn-ghost">
          ← Volver
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6">
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
            >
              <option value="">-- Seleccione un cliente --</option>
              {clientsData?.data?.map((client: any) => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.email || client.phone}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Template Selector */}
        <TemplateSelector
          templateId={templateId}
          onTemplateChange={setTemplateId}
        />

        {/* Asset Search & Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Items de la Cotización
          </h2>

          {/* Asset Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Asset para Agregar
            </label>
            <AssetSearchInput
              searchValue={assetSearch}
              onSearchChange={setAssetSearch}
              searchResults={assetSearchResults}
              isSearching={searchingAssets}
              onSelectAsset={handleAddAsset}
            />
          </div>

          {/* Items List */}
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg">No hay items agregados</p>
              <p className="text-sm">
                Busca y selecciona assets arriba para agregarlos a la cotización
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
            onClick={() => navigate("/quotations")}
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
    </Layout>
  );
}
