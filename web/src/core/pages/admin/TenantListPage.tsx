/**
 * Tenant List Page (SUPER_ADMIN)
 *
 * Lists all tenants in the platform.
 * Only accessible by SUPER_ADMIN role.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { Layout } from "@/core/components/Layout";
import api from "@/lib/api";
import {
  Plus,
  Search,
  AlertTriangle,
  Building2,
  Users,
  Package,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan?: string;
  status: "ACTIVE" | "SUSPENDED" | "CANCELLED";
  country?: string;
  billingEmail?: string;
  createdAt: string;
  enabledModules: string[];
  vertical: string | null;
  _count?: {
    businessUnits: number;
  };
}

/**
 * Tenant List Page
 */
export function TenantListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Check if user is SUPER_ADMIN
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // Fetch tenants
  useEffect(() => {
    if (!isSuperAdmin) return;

    const fetchTenants = async () => {
      try {
        setLoading(true);
        const response = await api.get("/tenants");
        setTenants(response.data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [isSuperAdmin]);

  // Delete tenant
  const handleDelete = async (tenantId: string) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar este tenant? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    try {
      await api.delete(`/tenants/${tenantId}`);

      // Remove from list
      setTenants(tenants.filter((t) => t.id !== tenantId));
    } catch (err) {
      alert(
        "Error al eliminar tenant: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    }
  };

  // Filter tenants by search query
  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.billingEmail?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Access denied for non-SUPER_ADMIN
  if (!isSuperAdmin) {
    return (
      <Layout title="Acceso Denegado">
        <div className="p-8">
          <div className="card bg-red-900/20 border-red-800 text-red-400">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold mb-1">Acceso Restringido</h3>
                <p className="text-sm">
                  Solo el SUPER_ADMIN puede acceder a la gestión de tenants.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Gestión de Tenants"
      subtitle="Administra todos los tenants de la plataforma"
      actions={
        <button
          onClick={() => navigate("/admin/tenants/new")}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Tenant
        </button>
      }
    >
      <div className="p-8 space-y-6">
        {/* Search Bar */}
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, slug o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-dark-400">Cargando tenants...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card bg-red-900/20 border-red-800 text-red-400">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold mb-1">Error</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tenants List */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredTenants.length === 0 ? (
              <div className="card text-center py-12">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-dark-400 opacity-50" />
                <p className="text-dark-400 mb-4">
                  {searchQuery
                    ? "No se encontraron tenants con ese criterio"
                    : "No hay tenants registrados"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => navigate("/admin/tenants/new")}
                    className="btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Tenant
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="card hover:border-primary-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      {/* Tenant Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Building2 className="w-6 h-6 text-primary-400" />
                          <div>
                            <h3 className="font-semibold text-lg">
                              {tenant.name}
                            </h3>
                            <p className="text-sm text-dark-400">
                              /{tenant.slug}
                            </p>
                          </div>
                          {/* Status Badge */}
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              tenant.status === "ACTIVE"
                                ? "bg-green-900/30 text-green-400"
                                : tenant.status === "SUSPENDED"
                                  ? "bg-yellow-900/30 text-yellow-400"
                                  : "bg-red-900/30 text-red-400"
                            }`}
                          >
                            {tenant.status === "ACTIVE" && (
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                            )}
                            {tenant.status === "SUSPENDED" && (
                              <Clock className="w-3 h-3 inline mr-1" />
                            )}
                            {tenant.status === "CANCELLED" && (
                              <XCircle className="w-3 h-3 inline mr-1" />
                            )}
                            {tenant.status}
                          </span>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-dark-400 mb-1">Plan</p>
                            <p className="text-sm font-medium">
                              {tenant.plan || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-dark-400 mb-1">País</p>
                            <p className="text-sm font-medium">
                              {tenant.country || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-dark-400 mb-1">
                              Business Units
                            </p>
                            <p className="text-sm font-medium flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {tenant._count?.businessUnits || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-dark-400 mb-1">
                              Módulos
                            </p>
                            <p className="text-sm font-medium flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {tenant.enabledModules.length}
                            </p>
                          </div>
                        </div>

                        {/* Billing Email */}
                        {tenant.billingEmail && (
                          <div className="mt-3">
                            <p className="text-xs text-dark-400">
                              Facturación: {tenant.billingEmail}
                            </p>
                          </div>
                        )}

                        {/* Vertical */}
                        {tenant.vertical && (
                          <div className="mt-2">
                            <span className="text-xs px-2 py-1 rounded bg-purple-900/30 text-purple-400">
                              Vertical: {tenant.vertical}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() =>
                            navigate(`/admin/tenants/${tenant.id}/edit`)
                          }
                          className="btn-secondary p-2"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tenant.id)}
                          className="btn-secondary p-2 hover:bg-red-900/30 hover:border-red-800 hover:text-red-400"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats Summary */}
        {!loading && !error && tenants.length > 0 && (
          <div className="card bg-dark-800 border-dark-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-dark-400 mb-1">Total Tenants</p>
                <p className="text-2xl font-bold text-primary-400">
                  {tenants.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-dark-400 mb-1">Activos</p>
                <p className="text-2xl font-bold text-green-400">
                  {tenants.filter((t) => t.status === "ACTIVE").length}
                </p>
              </div>
              <div>
                <p className="text-xs text-dark-400 mb-1">Suspendidos</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {tenants.filter((t) => t.status === "SUSPENDED").length}
                </p>
              </div>
              <div>
                <p className="text-xs text-dark-400 mb-1">Cancelados</p>
                <p className="text-2xl font-bold text-red-400">
                  {tenants.filter((t) => t.status === "CANCELLED").length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
