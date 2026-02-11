import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/core/components/Layout";
import { useAuthStore } from "@/store/auth.store";
import { clientService } from "../services/client.service";
import type { ClientSummary } from "../types/client.types";

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenant, businessUnit } = useAuthStore();

  const { data, isLoading, error } = useQuery<ClientSummary | null>({
    queryKey: ["clientSummary", tenant?.id, businessUnit?.id, id],
    queryFn: () => clientService.getSummary(id as string),
    enabled: !!tenant?.id && !!businessUnit?.id && !!id,
  });

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
      title={data?.client?.displayName || data?.client?.name || "Cliente"}
      subtitle={
        data?.client
          ? `Ficha de cliente - ${businessUnit.name}`
          : "Cargando ficha de cliente..."
      }
      actions={
        <>
          <button
            onClick={() => navigate(`/clients/${id}/edit`)}
            className="btn-secondary mr-2"
          >
            Editar
          </button>
          <button onClick={() => navigate("/clients")} className="btn-ghost">
            ← Clientes
          </button>
        </>
      }
    >
      {isLoading && (
        <div className="text-center py-12">
          <div className="spinner" />
          <p className="text-gray-400 mt-4">Cargando ficha de cliente...</p>
        </div>
      )}

      {error && (
        <div className="card bg-red-900/20 border-red-800 text-red-400 mb-6">
          <p>Error al cargar la ficha del cliente</p>
          <p className="text-sm mt-2">
            {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      )}

      {data && data.client && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal: datos generales y contactos */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-sm font-semibold text-primary-300 mb-4">
                Datos generales
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 text-xs">Nombre</div>
                  <div className="text-gray-100 font-medium">
                    {data.client.name}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Alias</div>
                  <div className="text-gray-100">
                    {data.client.displayName || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Tipo</div>
                  <div className="text-gray-100">
                    {data.client.type === "COMPANY" ? "Empresa" : "Persona"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Estado</div>
                  <div className="text-gray-100">
                    {data.client.status === "ACTIVE"
                      ? "Activo"
                      : data.client.status === "INACTIVE"
                        ? "Inactivo"
                        : "Bloqueado"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">País</div>
                  <div className="text-gray-100">
                    {data.client.countryCode || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Email</div>
                  <div className="text-gray-100">
                    {data.client.email || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Teléfono</div>
                  <div className="text-gray-100">
                    {data.client.phone || "-"}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-gray-400 text-xs mb-1">Etiquetas</div>
                <div className="flex flex-wrap gap-1">
                  {(data.client.tags || []).length === 0 && (
                    <span className="text-xs text-gray-500">
                      Aún no hay etiquetas configuradas para este cliente.
                    </span>
                  )}
                  {(data.client.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-dark-700 text-xs text-gray-200 border border-dark-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-sm font-semibold text-primary-300 mb-4">
                Contactos
              </h2>
              {(!data.client.contacts || data.client.contacts.length === 0) && (
                <p className="text-sm text-gray-400">
                  Todavía no se registraron contactos para este cliente. Podés
                  empezar con al menos una persona de compras o administración
                  para facilitar la comunicación.
                </p>
              )}
              {data.client.contacts && data.client.contacts.length > 0 && (
                <div className="space-y-3">
                  {data.client.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex justify-between items-start border-b border-dark-700 pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <div className="text-gray-100 font-medium">
                          {contact.name}
                        </div>
                        {contact.position && (
                          <div className="text-xs text-gray-400">
                            {contact.position}
                          </div>
                        )}
                        <div className="text-xs text-gray-300 mt-1">
                          {contact.email && (
                            <span className="mr-3">{contact.email}</span>
                          )}
                          {contact.phone && <span>{contact.phone}</span>}
                        </div>
                      </div>
                      {contact.channel && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-dark-700 text-gray-300 border border-dark-500">
                          Canal: {contact.channel}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-sm font-semibold text-primary-300 mb-4">
                Datos fiscales
              </h2>
              {(!data.client.taxProfiles ||
                data.client.taxProfiles.length === 0) && (
                <p className="text-sm text-gray-400">
                  Aún no se cargó un perfil fiscal para este cliente. Usá este
                  espacio más adelante para configurar NIT, CUIT u otros
                  identificadores según el país.
                </p>
              )}
              {data.client.taxProfiles &&
                data.client.taxProfiles.length > 0 && (
                  <div className="space-y-4 text-sm">
                    {data.client.taxProfiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="border border-dark-700 rounded-lg p-3"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div>
                            <div className="text-gray-400 text-xs">País</div>
                            <div className="text-gray-100">
                              {profile.countryCode}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs">Tipo ID</div>
                            <div className="text-gray-100">
                              {profile.taxIdType}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs">
                              Número ID
                            </div>
                            <div className="text-gray-100">
                              {profile.taxIdNumber}
                            </div>
                          </div>
                          {profile.taxRegime && (
                            <div>
                              <div className="text-gray-400 text-xs">
                                Régimen
                              </div>
                              <div className="text-gray-100">
                                {profile.taxRegime}
                              </div>
                            </div>
                          )}
                          {profile.fiscalResponsibility && (
                            <div>
                              <div className="text-gray-400 text-xs">
                                Responsabilidad
                              </div>
                              <div className="text-gray-100">
                                {profile.fiscalResponsibility}
                              </div>
                            </div>
                          )}
                        </div>
                        {(profile.fiscalAddressLine1 || profile.city) && (
                          <div className="mt-3 text-xs text-gray-300">
                            <span>{profile.fiscalAddressLine1}</span>
                            {profile.city && ` - ${profile.city}`}
                            {profile.state && `, ${profile.state}`}
                            {profile.postalCode && ` (${profile.postalCode})`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>

          {/* Columna lateral: riesgo y movimientos */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-sm font-semibold text-primary-300 mb-4">
                Perfil de riesgo y ranking
              </h2>
              {!data.risk && (
                <p className="text-sm text-gray-400">
                  Todavía no se calculó un perfil de riesgo para este cliente.
                  Más adelante, otros módulos (por ejemplo, alquileres) van a
                  usar este espacio para decidir si se puede aprobar una
                  operación sin anticipo o con menos fricción.
                </p>
              )}
              {data.risk && (
                <div className="space-y-3 text-sm">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-gray-400 text-xs">Score</div>
                      <div className="text-2xl font-semibold text-primary-300">
                        {data.risk.score}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-400 text-xs">Segmento</div>
                      <div className="text-gray-100 font-medium">
                        {data.risk.segment}
                      </div>
                    </div>
                  </div>
                  {data.risk.currentBalance !== undefined && (
                    <div>
                      <div className="text-gray-400 text-xs">
                        Balance actual estimado
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          (data.risk.currentBalance || 0) > 0
                            ? "text-red-400"
                            : "text-gray-100"
                        }`}
                      >
                        ${data.risk.currentBalance?.toFixed(2)}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Nota: por ahora este score es solo informativo. Las reglas
                    de negocio concretas (por ejemplo, cuándo pedir anticipo) se
                    van a configurar en la sección de configuración de clientes.
                  </p>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-sm font-semibold text-primary-300 mb-4">
                Últimos movimientos de cuenta corriente
              </h2>
              {(!data.recentMovements || data.recentMovements.length === 0) && (
                <p className="text-sm text-gray-400">
                  Aún no hay movimientos registrados para este cliente. Cuando
                  empieces a registrar facturas, notas de crédito o anticipos,
                  van a aparecer aquí.
                </p>
              )}
              {data.recentMovements && data.recentMovements.length > 0 && (
                <div className="overflow-x-auto -mx-3 px-3">
                  <table className="table text-xs">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Dirección</th>
                        <th>Monto</th>
                        <th>Moneda</th>
                        <th>Origen</th>
                        <th>Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentMovements.map((m) => (
                        <tr key={m.id}>
                          <td>{new Date(m.date).toLocaleDateString()}</td>
                          <td>
                            <span
                              className={`status-badge px-2 py-0.5 text-[10px] ${
                                m.direction === "DEBIT"
                                  ? "bg-red-900/30 text-red-300 border-red-800"
                                  : "bg-green-900/30 text-green-300 border-green-800"
                              }`}
                            >
                              {m.direction === "DEBIT" ? "Débito" : "Crédito"}
                            </span>
                          </td>
                          <td className="text-right">{m.amount.toFixed(2)}</td>
                          <td>{m.currency}</td>
                          <td className="text-[11px]">
                            {m.sourceModule} / {m.sourceType}
                          </td>
                          <td className="text-[11px] text-gray-300">
                            {m.description || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card bg-dark-800/80 border-dark-600">
              <h2 className="text-sm font-semibold text-primary-300 mb-2">
                ¿Cómo usar esta ficha?
              </h2>
              <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
                <li>
                  Revisá los datos generales antes de generar una cotización o
                  contrato: país, tipo de cliente y datos de contacto.
                </li>
                <li>
                  Usá la sección de movimientos para tener una idea rápida de
                  cómo viene pagando el cliente.
                </li>
                <li>
                  Cuando activemos reglas de riesgo, esta ficha te va a indicar
                  si podés aprobar operaciones con menos fricción (por ejemplo,
                  sin anticipo).
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
