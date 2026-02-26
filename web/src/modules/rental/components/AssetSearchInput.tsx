import { Search, CheckCircle, XCircle } from "lucide-react";
import type { AssetSearchResult } from "../hooks/useQuotationForm";

interface AssetSearchInputProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchResults: AssetSearchResult[];
  isSearching: boolean;
  onSelectAsset: (asset: AssetSearchResult) => void;
}

export function AssetSearchInput({
  searchValue,
  onSearchChange,
  searchResults,
  isSearching,
  onSelectAsset,
}: AssetSearchInputProps) {
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar activo por código, nombre, categoría..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {searchResults.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => onSelectAsset(asset)}
              className="w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Asset Image */}
                {asset.imageUrl ? (
                  <img
                    src={asset.imageUrl}
                    alt={asset.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                    Sin imagen
                  </div>
                )}

                {/* Asset Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {asset.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {asset.code} •{" "}
                        {asset.rentalProfile?.trackingType ||
                          asset.trackingType}
                      </p>
                    </div>

                    {/* Availability Badge */}
                    <div className="flex items-center gap-1">
                      {asset.availability.available ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-xs font-medium text-green-600">
                            Disponible
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-xs font-medium text-red-600">
                            No disponible
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pricing Info */}
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    {(() => {
                      // Helper: Obtener precio con fallback desde rentalProfile
                      const getPrice = (field: string) => {
                        const profileValue =
                          asset.rentalProfile?.[
                            field as keyof typeof asset.rentalProfile
                          ];
                        const legacyValue = asset[field as keyof typeof asset];
                        return profileValue ?? legacyValue;
                      };

                      const trackingType =
                        asset.rentalProfile?.trackingType || asset.trackingType;
                      const pricePerHour = getPrice("pricePerHour");
                      const minDailyHours = getPrice("minDailyHours");
                      const pricePerDay = getPrice("pricePerDay");
                      const pricePerWeek = getPrice("pricePerWeek");
                      const pricePerMonth = getPrice("pricePerMonth");
                      const operatorCostRate = getPrice("operatorCostRate");
                      const operatorCostType =
                        asset.rentalProfile?.operatorCostType ||
                        asset.operatorCostType;

                      return (
                        <>
                          {trackingType === "MACHINERY" && (
                            <>
                              {pricePerHour && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Por Hora:</span>
                                  <span className="font-mono">
                                    ${Number(pricePerHour).toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {minDailyHours && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">STANDBY:</span>
                                  <span>{Number(minDailyHours)} hrs/día</span>
                                </div>
                              )}
                            </>
                          )}

                          {trackingType === "TOOL" && (
                            <div className="flex items-center gap-3">
                              {pricePerDay && (
                                <span>
                                  <span className="font-medium">Día:</span> $
                                  {Number(pricePerDay).toLocaleString()}
                                </span>
                              )}
                              {pricePerWeek && (
                                <span>
                                  <span className="font-medium">Semana:</span> $
                                  {Number(pricePerWeek).toLocaleString()}
                                </span>
                              )}
                              {pricePerMonth && (
                                <span>
                                  <span className="font-medium">Mes:</span> $
                                  {Number(pricePerMonth).toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}

                          {asset.requiresOperator && operatorCostRate && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <span className="font-medium">
                                Operador (
                                {operatorCostType === "PER_DAY"
                                  ? "por día"
                                  : "por hora"}
                                ):
                              </span>
                              <span className="font-mono">
                                ${Number(operatorCostRate).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Unavailability Info */}
                  {!asset.availability.available &&
                    asset.availability.estimatedReturnDate && (
                      <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        Retorno estimado:{" "}
                        {new Date(
                          asset.availability.estimatedReturnDate,
                        ).toLocaleDateString()}
                      </div>
                    )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
