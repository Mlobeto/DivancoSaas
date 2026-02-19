/**
 * Staff List Page
 *
 * Lists all users/staff members in the current tenant.
 * Allows filtering by status and search.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { Layout } from "@/core/components/Layout";
import { ProtectedAction } from "@/core/components/ProtectedAction";
import api from "@/lib/api";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Clock,
  Shield,
  Mail,
  Building2,
} from "lucide-react";

interface UserBusinessUnit {
  businessUnitId: string;
  businessUnitName: string;
  roleName: string;
}

interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
  businessUnits: UserBusinessUnit[];
}

const STATUS_CONFIG = {
  ACTIVE: {
    icon: UserCheck,
    label: "Activo",
    className: "bg-green-900/30 text-green-400 border-green-800",
  },
  INACTIVE: {
    icon: UserX,
    label: "Inactivo",
    className: "bg-gray-900/30 text-gray-400 border-gray-800",
  },
  SUSPENDED: {
    icon: Clock,
    label: "Suspendido",
    className: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
  },
};

/**
 * Staff List Page
 */
export function StaffListPage() {
  const navigate = useNavigate();
  const { tenant } = useAuthStore();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const params: any = {};

        // NO filtrar por businessUnit - mostrar todos los usuarios del tenant
        // Los usuarios pueden estar en múltiples BUs

        if (statusFilter !== "ALL") {
          params.status = statusFilter;
        }

        const response = await api.get("/users", { params });
        setUsers(response.data.users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [statusFilter]); // Removido businessUnit?.id de las dependencias

  // Delete user
  const handleDelete = async (userId: string) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      alert(
        "Error al eliminar usuario: " +
          (err instanceof Error ? err.message : "Error desconocido"),
      );
    }
  };

  // Filter users by search query
  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.businessUnits.some((bu) =>
        bu.roleName.toLowerCase().includes(searchLower),
      )
    );
  });

  return (
    <Layout
      title="Gestión de Personal"
      subtitle={`Administra los usuarios de ${tenant?.name || "tu organización"}`}
      actions={
        <ProtectedAction permission="users:create">
          <button
            onClick={() => navigate("/settings/staff/new")}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </ProtectedAction>
      }
    >
      <div className="p-8 space-y-6">
        {/* Search and Filters */}
        <div className="card">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o rol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
              <option value="SUSPENDED">Suspendidos</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="card">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card bg-red-900/20 border-red-800">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredUsers.length === 0 && (
          <div className="card">
            <div className="text-center py-12">
              <Shield className="w-16 h-16 mx-auto mb-4 text-dark-400" />
              <h3 className="text-xl font-semibold mb-2 text-dark-100">
                No hay usuarios
              </h3>
              <p className="text-dark-400 mb-6">
                {searchQuery
                  ? "No se encontraron usuarios con ese criterio de búsqueda."
                  : "Comienza agregando tu primer miembro del equipo."}
              </p>
              <ProtectedAction permission="users:create">
                <button
                  onClick={() => navigate("/settings/staff/new")}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Usuario
                </button>
              </ProtectedAction>
            </div>
          </div>
        )}

        {/* Users Table */}
        {!loading && !error && filteredUsers.length > 0 && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-800 border-b border-dark-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                      Roles y Unidades
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                      Fecha de Creación
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-dark-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {filteredUsers.map((user) => {
                    const StatusIcon = STATUS_CONFIG[user.status].icon;

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-dark-800/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                              <span className="text-primary-400 font-semibold">
                                {user.firstName[0]}
                                {user.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-dark-100">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-dark-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {user.businessUnits.map((bu) => (
                              <div
                                key={bu.businessUnitId}
                                className="text-sm flex items-center gap-2"
                              >
                                <Building2 className="w-3 h-3 text-dark-400" />
                                <span className="text-dark-300">
                                  {bu.businessUnitName}
                                </span>
                                <span className="text-dark-500">•</span>
                                <span className="text-primary-400 font-medium">
                                  {bu.roleName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[user.status].className}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {STATUS_CONFIG[user.status].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-dark-300">
                          {new Date(user.createdAt).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <ProtectedAction permission="users:update">
                              <button
                                onClick={() =>
                                  navigate(`/settings/staff/${user.id}`)
                                }
                                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                                title="Editar usuario"
                              >
                                <Edit className="w-4 h-4 text-dark-300" />
                              </button>
                            </ProtectedAction>
                            <ProtectedAction permission="users:delete">
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </ProtectedAction>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        {!loading && !error && users.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="text-sm text-dark-400 mb-1">Total</div>
              <div className="text-2xl font-bold text-dark-100">
                {users.length}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-dark-400 mb-1">Activos</div>
              <div className="text-2xl font-bold text-green-400">
                {users.filter((u) => u.status === "ACTIVE").length}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-dark-400 mb-1">Inactivos</div>
              <div className="text-2xl font-bold text-gray-400">
                {users.filter((u) => u.status === "INACTIVE").length}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-dark-400 mb-1">Suspendidos</div>
              <div className="text-2xl font-bold text-yellow-400">
                {users.filter((u) => u.status === "SUSPENDED").length}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
