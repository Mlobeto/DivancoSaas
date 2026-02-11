import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import { clientService } from "../services/client.service";
import { Client, ClientFilters, ClientStatus } from "../types/client.types";

export function ClientsPage() {
  const navigate = useNavigate();
  const { tenant, businessUnit } = useAuthStore();
  const [filters, setFilters] = useState<ClientFilters>({
    page: 1,
    limit: 20,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["clients", tenant?.id, businessUnit?.id, filters],
    queryFn: () => clientService.list(filters),
    enabled: !!tenant?.id && !!businessUnit?.id,
  });

  const statusColors: Record<ClientStatus, string> = {
    ACTIVE: "bg-green-900/30 text-green-400 border-green-800",
    INACTIVE: "bg-gray-700/30 text-gray-400 border-gray-600",
    BLOCKED: "bg-red-900/30 text-red-400 border-red-800",
  };

  const statusLabels: Record<ClientStatus, string> = {
    ACTIVE: "Activo",
    INACTIVE: "Inactivo",
    BLOCKED: "Bloqueado",
  };

  if (!tenant || !businessUnit) {
    return (
      <Layout>
        <div className="p-8">
          <div className="card bg-yellow-900/20 border-yellow-800 text-yellow-400">
            <p>
              No se ha seleccionado un tenant o business unit. Por favor,
              configura tu contexto antes de trabajar con clientes.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Clientes"
      subtitle={`Gestión de clientes y cuenta corriente - ${businessUnit.name}`}
      actions={
        <>
          <a href="/dashboard" className="btn-ghost">
            ← Dashboard
          </a>
        </>
      }
    >
      {/* Helper card */}
      <div className="card mb-6 bg-dark-800/80 border-dark-600">
        <h2 className="text-sm font-semibold text-primary-300 mb-2">
          ¿Para qué sirve este módulo?
        </h2>
        <p className="text-sm text-gray-300 mb-2">
          Este listado concentra todos los clientes de la Business Unit
          seleccionada. Desde aquí vas a poder ver rápidamente el estado del
          cliente, su país y datos de contacto.
        </p>
        <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
          <li>
            Antes de usar alquileres o ventas, asegurate de que tus clientes
            existan aquí.
          </li>
          <li>
            Usa el buscador para filtrar por nombre o alias. El filtro de estado
            te ayuda a ocultar clientes inactivos o bloqueados.
          </li>
          <li>
            Haz clic en "Ver" para abrir la ficha de cliente con resumen de
            movimientos y perfil de riesgo.
          </li>
        </ul>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre o alias..."
            value={filters.search || ""}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value, page: 1 })
            }
            className="form-input col-span-2"
          />

          <select
            value={filters.status || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value as ClientStatus | undefined,
                page: 1,
              })
            }
            className="form-input"
          >
            <option value="">Todos los estados</option>
            <option value={ClientStatus.ACTIVE}>Activos</option>
            <option value={ClientStatus.INACTIVE}>Inactivos</option>
            <option value={ClientStatus.BLOCKED}>Bloqueados</option>
          </select>

          <input
            type="text"
            placeholder="País (ISO, ej: CO, AR)"
            value=""
            onChange={() => {}}
            className="form-input opacity-60 cursor-not-allowed"
            disabled
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Tip: por ahora el filtro avanzado por país y ranking se va a
          configurar más adelante. Empezamos con un filtro simple por nombre y
          estado.
        </p>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="spinner" />
          <p className="text-gray-400 mt-4">Cargando clientes...</p>
        </div>
      )}

      {error && (
        <div className="card bg-red-900/20 border-red-800 text-red-400">
          <p>Error al cargar clientes</p>
          <p className="text-sm mt-2">
            {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      )}

      {data && data.data && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Alias</th>
                  <th>País</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Etiquetas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      No se encontraron clientes para los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  data.data.map((client: Client) => (
                    <tr key={client.id}>
                      <td>
                        <div>
                          <div className="font-semibold">{client.name}</div>
                          {client.type && (
                            <div className="text-xs text-gray-400">
                              {client.type === "COMPANY"
                                ? "Empresa"
                                : "Persona"}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="text-sm text-gray-300">
                        {client.displayName || "-"}
                      </td>
                      <td className="text-sm">{client.countryCode || "-"}</td>
                      <td className="text-sm">{client.email || "-"}</td>
                      <td className="text-sm">{client.phone || "-"}</td>
                      <td>
                        <span
                          className={`status-badge ${statusColors[client.status]}`}
                        >
                          {statusLabels[client.status]}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {(client.tags || []).length === 0 && (
                            <span className="text-xs text-gray-500">-</span>
                          )}
                          {(client.tags || []).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full bg-dark-700 text-xs text-gray-200 border border-dark-500"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => navigate(`/clients/${client.id}`)}
                          className="btn-ghost text-sm"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700 text-sm text-gray-300">
              <div>
                Página {data.pagination.page} de {data.pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-ghost px-3 py-1 text-xs"
                  disabled={data.pagination.page <= 1}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      page: (filters.page || 1) - 1,
                    })
                  }
                >
                  Anterior
                </button>
                <button
                  className="btn-ghost px-3 py-1 text-xs"
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      page: (filters.page || 1) + 1,
                    })
                  }
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
