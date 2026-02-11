import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { clientService } from "../services/client.service";
import { GlobalClientSearchResult } from "../types/client.types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ClientLinkModal({ isOpen, onClose, onSuccess }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  // Debounce simple para la búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear previous timeout
    if ((window as any).searchTimeout) {
      clearTimeout((window as any).searchTimeout);
    }

    // Set new timeout
    (window as any).searchTimeout = setTimeout(() => {
      setDebouncedTerm(value);
    }, 500);
  };

  const { data: results, isLoading: isSearching } = useQuery({
    queryKey: ["global-clients-search", debouncedTerm],
    queryFn: () => clientService.searchGlobal(debouncedTerm),
    enabled: debouncedTerm.length >= 3, // Solo buscar si hay 3 o más caracteres
  });

  const linkMutation = useMutation({
    mutationFn: (clientId: string) => clientService.link(clientId),
    onSuccess: () => {
      onSuccess();
      onClose();
      // Limpiar búsqueda
      setSearchTerm("");
      setDebouncedTerm("");
    },
    onError: (err) => {
      console.error("Error linking client:", err);
      alert("Error al vincular cliente. Puede que ya esté vinculado.");
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-dark-900 border border-dark-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-dark-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">
            Vincular Cliente Existente
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">
              Busca en la base de datos global de clientes (por nombre, email o
              NIT) para vincularlo a esta unidad de negocio.
            </p>
            <input
              type="text"
              placeholder="Buscar por nombre, NIT o email..."
              className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={handleSearchChange}
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-[200px] border border-dark-700 rounded-md bg-dark-800/50">
            {isSearching && (
              <div className="p-8 text-center text-gray-400">
                <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Buscando...
              </div>
            )}

            {!isSearching && debouncedTerm.length < 3 && (
              <div className="p-8 text-center text-gray-500">
                Escribe al menos 3 caracteres para buscar.
              </div>
            )}

            {!isSearching &&
              debouncedTerm.length >= 3 &&
              results?.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  No se encontraron clientes con "{debouncedTerm}".
                  <div className="mt-2 text-sm">
                    ¿Es un cliente nuevo? Cierra esta ventana y usa "Nuevo
                    Cliente".
                  </div>
                </div>
              )}

            {!isSearching && results && results.length > 0 && (
              <ul className="divide-y divide-dark-700">
                {results.map((client: GlobalClientSearchResult) => (
                  <li
                    key={client.id}
                    className="p-3 hover:bg-dark-700/50 transition-colors flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-white">
                        {client.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {[client.taxId, client.email, client.phone]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Vinculado a {client.businessUnitsCount} unidad(es) de
                        negocio(s)
                      </div>
                    </div>
                    <div>
                      {client.isLinked ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-800">
                          Ya vinculado
                        </span>
                      ) : (
                        <button
                          onClick={() => linkMutation.mutate(client.id)}
                          disabled={linkMutation.isPending}
                          className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {linkMutation.isPending
                            ? "Vinculando..."
                            : "Vincular"}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-700 bg-dark-800/30 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-gray-200 rounded-md transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
