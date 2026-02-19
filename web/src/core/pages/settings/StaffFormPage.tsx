/**
 * Staff Form Page
 *
 * Form to create or edit staff members.
 * Includes role assignment functionality.
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/core/components/Layout";
import api from "@/lib/api";
import {
  Save,
  ArrowLeft,
  Mail,
  User,
  Building2,
  Shield,
  GripVertical,
  MoveRight,
  MoveLeft,
  Key,
  Lock,
  Unlock,
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string | null;
  level: number;
}

interface BusinessUnit {
  id: string;
  name: string;
  code: string;
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string | null;
}

interface PermissionCategory {
  name: string;
  icon: string;
  resources: string[];
}

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  businessUnitId: string;
  roleId: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

/**
 * Permission Categories for UI Organization
 */
const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    name: "Cotizaciones",
    icon: "📝",
    resources: ["quotations", "rental-contracts"],
  },
  {
    name: "Inventario",
    icon: "📦",
    resources: ["supplies", "supply-categories", "assets", "asset-templates"],
  },
  {
    name: "Compras",
    icon: "🛒",
    resources: ["suppliers", "purchase-orders", "supply-quotes"],
  },
  { name: "Clientes", icon: "👥", resources: ["clients", "accounts"] },
  {
    name: "Configuración",
    icon: "⚙️",
    resources: ["settings", "users", "roles", "business-units"],
  },
  { name: "Reportes", icon: "📊", resources: ["reports", "dashboard"] },
];

/**
 * Staff Form Page
 */
export function StaffFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<FormData>({
    email: "",
    firstName: "",
    lastName: "",
    businessUnitId: "",
    roleId: "",
    status: "ACTIVE",
  });

  // Options
  const [roles, setRoles] = useState<Role[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Permissions -only visible when editing
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [additionalPermissions, setAdditionalPermissions] = useState<string[]>(
    [],
  ); // IDs of additional permissions
  const [draggedPermission, setDraggedPermission] = useState<string | null>(
    null,
  );
  const [showPermissions, setShowPermissions] = useState(false);

  // Load roles and business units
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);

        // Fetch roles
        const rolesResponse = await api.get("/roles");
        setRoles(rolesResponse.data.data || []);

        // Fetch business units
        const businessUnitsResponse = await api.get("/business-units");
        setBusinessUnits(businessUnitsResponse.data.data || []);
      } catch (err) {
        setError(
          "Error al cargar opciones: " +
            (err instanceof Error ? err.message : "Error desconocido"),
        );
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  // Load user data for editing
  useEffect(() => {
    if (!isEditing) return;

    const fetchUser = async () => {
      try {
        setLoadingData(true);
        const response = await api.get(`/users/${id}`);
        const user = response.data.data;

        // Get first businessUnit assignment (users can have multiple but we edit one at a time)
        const firstBU = user.businessUnits?.[0];

        setFormData({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          businessUnitId: firstBU?.businessUnitId || "",
          roleId: firstBU?.roleId || "",
          status: user.status || "ACTIVE",
        });
      } catch (err) {
        setError(
          "Error al cargar usuario: " +
            (err instanceof Error ? err.message : "Error desconocido"),
        );
      } finally {
        setLoadingData(false);
      }
    };

    fetchUser();
  }, [id, isEditing]);

  // Load permissions data when editing
  useEffect(() => {
    if (!isEditing || !formData.businessUnitId) return;

    const fetchPermissions = async () => {
      try {
        // Get all permissions
        const allPermsResponse = await api.get("/permissions");
        setAllPermissions(allPermsResponse.data.data?.permissions || []);

        // Get user's additional permissions
        const userPermsResponse = await api.get(`/users/${id}/permissions`, {
          params: { businessUnitId: formData.businessUnitId },
        });
        const additionalPerms = userPermsResponse.data.data || [];
        setAdditionalPermissions(additionalPerms.map((p: Permission) => p.id));

        // Get role permissions (for display only)
        if (formData.roleId) {
          const rolePermsResponse = await api.get(
            `/roles/${formData.roleId}/permissions`,
          );
          setRolePermissions(rolePermsResponse.data.data || []);
        }
      } catch (err) {
        console.error("Error loading permissions:", err);
      }
    };

    fetchPermissions();
  }, [id, isEditing, formData.businessUnitId, formData.roleId]);

  // Drag & Drop Handlers for Permissions
  const handlePermissionDragStart = (permissionId: string) => {
    setDraggedPermission(permissionId);
  };

  const handlePermissionDragEnd = () => {
    setDraggedPermission(null);
  };

  const handlePermissionDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToAdditional = (e: React.DragEvent) => {
    e.preventDefault();
    if (
      draggedPermission &&
      !additionalPermissions.includes(draggedPermission)
    ) {
      setAdditionalPermissions((prev) => [...prev, draggedPermission]);
    }
    setDraggedPermission(null);
  };

  const handleDropToAvailable = (e: React.DragEvent) => {
    e.preventDefault();
    if (
      draggedPermission &&
      additionalPermissions.includes(draggedPermission)
    ) {
      setAdditionalPermissions((prev) =>
        prev.filter((id) => id !== draggedPermission),
      );
    }
    setDraggedPermission(null);
  };

  const moveToAdditional = (permissionId: string) => {
    if (!additionalPermissions.includes(permissionId)) {
      setAdditionalPermissions((prev) => [...prev, permissionId]);
    }
  };

  const removeFromAdditional = (permissionId: string) => {
    setAdditionalPermissions((prev) =>
      prev.filter((id) => id !== permissionId),
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields when creating
      if (!isEditing) {
        if (!formData.email || !formData.firstName || !formData.lastName) {
          setError("Por favor completa todos los campos obligatorios");
          setLoading(false);
          return;
        }
        if (!formData.businessUnitId) {
          setError("Por favor selecciona una unidad de negocio");
          setLoading(false);
          return;
        }
        if (!formData.roleId) {
          setError("Por favor selecciona un rol para el usuario");
          setLoading(false);
          return;
        }
      }

      if (isEditing) {
        // Update user (PUT /users/:id)
        await api.put(`/users/${id}`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          status: formData.status,
        });

        // Update additional permissions if visible
        if (showPermissions) {
          await api.post(`/users/${id}/permissions`, {
            businessUnitId: formData.businessUnitId,
            permissionIds: additionalPermissions,
          });
        }
      } else {
        // Create user (POST /users)
        const response = await api.post("/users", {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          businessUnitId: formData.businessUnitId,
          roleId: formData.roleId,
        });

        // Mostrar mensaje de éxito si viene del backend
        if (response.data.message) {
          console.log("✅", response.data.message);
        }
      }

      // Redirect to list
      navigate("/settings/staff");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Error al guardar usuario",
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Layout
      title={isEditing ? "Editar Usuario" : "Nuevo Usuario"}
      subtitle={
        isEditing
          ? "Actualiza la información del miembro del equipo"
          : "Agrega un nuevo miembro a tu equipo"
      }
      actions={
        <button
          onClick={() => navigate("/settings/staff")}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      }
    >
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          {/* Loading State */}
          {loadingData && (
            <div className="card">
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="card bg-red-900/20 border-red-800 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          {!loadingData && (
            <form onSubmit={handleSubmit} className="card space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isEditing} // Can't change email when editing
                  required
                  className="input"
                  placeholder="usuario@empresa.com"
                />
                {isEditing && (
                  <p className="mt-1 text-xs text-dark-400">
                    El email no se puede modificar
                  </p>
                )}
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nombre *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  minLength={2}
                  className="input"
                  placeholder="Juan"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Apellido *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  minLength={2}
                  className="input"
                  placeholder="Pérez"
                />
              </div>

              {/* Business Unit */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Unidad de Negocio *
                </label>
                <select
                  name="businessUnitId"
                  value={formData.businessUnitId}
                  onChange={handleChange}
                  disabled={isEditing || loadingOptions}
                  required
                  className="input"
                >
                  <option value="">Selecciona una unidad</option>
                  {businessUnits.map((bu) => (
                    <option key={bu.id} value={bu.id}>
                      {bu.name} ({bu.code})
                    </option>
                  ))}
                </select>
                {isEditing && (
                  <p className="mt-1 text-xs text-dark-400">
                    La unidad de negocio no se puede modificar desde aquí
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Rol *
                </label>
                <select
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleChange}
                  disabled={isEditing || loadingOptions}
                  required
                  className="input"
                >
                  <option value="">Selecciona un rol</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                      {role.description && ` - ${role.description}`}
                    </option>
                  ))}
                </select>
                {isEditing && (
                  <p className="mt-1 text-xs text-dark-400">
                    El rol no se puede modificar desde aquí
                  </p>
                )}
                {!isEditing && roles.length === 0 && !loadingOptions && (
                  <p className="mt-1 text-xs text-red-400">
                    ⚠️ No hay roles disponibles. Contacta al administrador.
                  </p>
                )}
                {!isEditing && roles.length > 0 && (
                  <p className="mt-1 text-xs text-dark-400">
                    Define los permisos que tendrá el usuario ({roles.length}{" "}
                    roles disponibles)
                  </p>
                )}
              </div>

              {/* Status (only when editing) */}
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Estado
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                    <option value="SUSPENDED">Suspendido</option>
                  </select>
                </div>
              )}

              {/* Permissions Section (only when editing) */}
              {isEditing && (
                <div className="pt-6 border-t border-dark-700">
                  <button
                    type="button"
                    onClick={() => setShowPermissions(!showPermissions)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-primary-400" />
                      <h3 className="font-semibold text-lg">
                        Permisos Adicionales
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-dark-400">
                      {showPermissions ? (
                        <>
                          <Unlock className="w-4 h-4" />
                          Expandido
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Clic para expandir
                        </>
                      )}
                    </div>
                  </button>

                  {showPermissions && (
                    <div className="mt-6 space-y-6">
                      {/* Role Permissions Info */}
                      <div className="bg-blue-900/10 border border-blue-800/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-blue-300 mb-2">
                              Permisos Base del Rol ({rolePermissions.length})
                            </h4>
                            <p className="text-xs text-dark-400 mb-3">
                              Estos permisos vienen del rol asignado y no se
                              pueden modificar aquí.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {rolePermissions.map((perm) => (
                                <span
                                  key={perm.id}
                                  className="px-2 py-1 bg-blue-900/30 border border-blue-700/50 rounded text-xs text-blue-200"
                                >
                                  {perm.resource}:{perm.action}
                                </span>
                              ))}
                              {rolePermissions.length === 0 && (
                                <span className="text-xs text-dark-400">
                                  Sin permisos base
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Drag & Drop Interface */}
                      <div className="space-y-4">
                        <p className="text-sm text-dark-400">
                          Arrastra permisos adicionales para personalizar los
                          accesos de este usuario más allá de su rol base.
                        </p>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Available Permissions Column */}
                          <div
                            className="space-y-3"
                            onDragOver={handlePermissionDragOver}
                            onDrop={handleDropToAvailable}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-sm text-dark-300">
                                📦 Permisos Disponibles
                              </h4>
                              <span className="text-xs text-dark-400">
                                {
                                  allPermissions.filter(
                                    (p) =>
                                      !additionalPermissions.includes(p.id) &&
                                      !rolePermissions.some(
                                        (rp) => rp.id === p.id,
                                      ),
                                  ).length
                                }{" "}
                                disponibles
                              </span>
                            </div>

                            <div className="space-y-4 min-h-[300px] p-3 rounded-lg border-2 border-dashed border-dark-700 bg-dark-900/30 max-h-[600px] overflow-y-auto">
                              {PERMISSION_CATEGORIES.map((category) => {
                                const categoryPerms = allPermissions.filter(
                                  (p) =>
                                    category.resources.includes(p.resource) &&
                                    !additionalPermissions.includes(p.id) &&
                                    !rolePermissions.some(
                                      (rp) => rp.id === p.id,
                                    ),
                                );

                                if (categoryPerms.length === 0) return null;

                                return (
                                  <div
                                    key={category.name}
                                    className="space-y-2"
                                  >
                                    <h5 className="text-xs font-semibold text-dark-300 flex items-center gap-2">
                                      <span>{category.icon}</span>
                                      {category.name} ({categoryPerms.length})
                                    </h5>
                                    {categoryPerms.map((perm) => (
                                      <div
                                        key={perm.id}
                                        draggable
                                        onDragStart={() =>
                                          handlePermissionDragStart(perm.id)
                                        }
                                        onDragEnd={handlePermissionDragEnd}
                                        className={`card cursor-move hover:border-primary-600 transition-all group ${
                                          draggedPermission === perm.id
                                            ? "opacity-50 scale-95"
                                            : ""
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <GripVertical className="w-4 h-4 text-dark-400 group-hover:text-primary-400" />
                                          <div className="flex-1">
                                            <p className="text-xs font-medium">
                                              {perm.resource}:{perm.action}
                                            </p>
                                            {perm.description && (
                                              <p className="text-xs text-dark-500 mt-0.5">
                                                {perm.description}
                                              </p>
                                            )}
                                          </div>
                                          <button
                                            onClick={() =>
                                              moveToAdditional(perm.id)
                                            }
                                            className="p-1 rounded hover:bg-primary-900/30 text-dark-400 hover:text-primary-400 transition-colors"
                                            title="Asignar permiso"
                                          >
                                            <MoveRight className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}

                              {allPermissions.filter(
                                (p) =>
                                  !additionalPermissions.includes(p.id) &&
                                  !rolePermissions.some((rp) => rp.id === p.id),
                              ).length === 0 && (
                                <div className="text-center py-8 text-dark-400 text-sm">
                                  <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  Todos los permisos asignados
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Additional Permissions Column */}
                          <div
                            className="space-y-3"
                            onDragOver={handlePermissionDragOver}
                            onDrop={handleDropToAdditional}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-sm text-primary-300">
                                ✅ Permisos Adicionales
                              </h4>
                              <span className="text-xs text-dark-400">
                                {additionalPermissions.length} adicionales
                              </span>
                            </div>

                            <div className="space-y-2 min-h-[300px] p-3 rounded-lg border-2 border-dashed border-primary-700/30 bg-primary-900/10 max-h-[600px] overflow-y-auto">
                              {allPermissions
                                .filter((p) =>
                                  additionalPermissions.includes(p.id),
                                )
                                .map((perm) => (
                                  <div
                                    key={perm.id}
                                    draggable
                                    onDragStart={() =>
                                      handlePermissionDragStart(perm.id)
                                    }
                                    onDragEnd={handlePermissionDragEnd}
                                    className={`card border-primary-600 bg-primary-900/20 cursor-move hover:border-primary-500 transition-all group ${
                                      draggedPermission === perm.id
                                        ? "opacity-50 scale-95"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <GripVertical className="w-4 h-4 text-primary-400 group-hover:text-primary-300" />
                                      <div className="flex-1">
                                        <p className="text-xs font-medium">
                                          {perm.resource}:{perm.action}
                                        </p>
                                        {perm.description && (
                                          <p className="text-xs text-dark-500 mt-0.5">
                                            {perm.description}
                                          </p>
                                        )}
                                      </div>
                                      <button
                                        onClick={() =>
                                          removeFromAdditional(perm.id)
                                        }
                                        className="p-1 rounded hover:bg-red-900/30 text-primary-400 hover:text-red-400 transition-colors"
                                        title="Remover permiso"
                                      >
                                        <MoveLeft className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}

                              {additionalPermissions.length === 0 && (
                                <div className="text-center py-8 text-dark-400 text-sm">
                                  <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  Arrastra permisos aquí
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => navigate("/settings/staff")}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={
                    loading ||
                    loadingOptions ||
                    (!isEditing &&
                      (!formData.email ||
                        !formData.firstName ||
                        !formData.lastName ||
                        !formData.businessUnitId ||
                        !formData.roleId))
                  }
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isEditing ? "Actualizar" : "Crear"} Usuario
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
