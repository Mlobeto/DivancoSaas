/**
 * Tenant Form Page (SUPER_ADMIN)
 *
 * Create or edit a tenant.
 * Only accessible by SUPER_ADMIN role.
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { moduleRegistry, verticalRegistry } from "@/product";
import { Layout } from "@/core/components/Layout";
import {
  Save,
  AlertTriangle,
  Building2,
  Package,
  CheckCircle,
  ArrowLeft,
  GripVertical,
  MoveRight,
  MoveLeft,
  User,
  Key,
  Mail,
} from "lucide-react";

interface TenantFormData {
  name: string;
  slug: string;
  plan: string;
  billingEmail: string;
  country: string;
  status: "ACTIVE" | "SUSPENDED" | "CANCELLED";
  enabledModules: string[];
  vertical: string | null;
  // Owner user data (only for creation)
  ownerEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerPassword: string;
}

interface ModuleInfo {
  id: string;
  name: string;
  description: string;
}

interface VerticalInfo {
  id: string;
  name: string;
  description: string;
}

/**
 * Generate temporary password
 */
function generateTempPassword(): string {
  const length = 12;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Tenant Form Page
 */
export function TenantFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const isEditing = !!id;

  const [formData, setFormData] = useState<TenantFormData>({
    name: "",
    slug: "",
    plan: "basic",
    billingEmail: "",
    country: "CO",
    status: "ACTIVE",
    enabledModules: [],
    vertical: null,
    ownerEmail: "",
    ownerFirstName: "",
    ownerLastName: "",
    ownerPassword: generateTempPassword(),
  });

  const [availableModules, setAvailableModules] = useState<ModuleInfo[]>([]);
  const [availableVerticals, setAvailableVerticals] = useState<VerticalInfo[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedModule, setDraggedModule] = useState<string | null>(null);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // Drag & Drop Handlers
  const handleDragStart = (moduleId: string) => {
    setDraggedModule(moduleId);
  };

  const handleDragEnd = () => {
    setDraggedModule(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToAssigned = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedModule && !formData.enabledModules.includes(draggedModule)) {
      setFormData((prev) => ({
        ...prev,
        enabledModules: [...prev.enabledModules, draggedModule],
      }));
    }
    setDraggedModule(null);
  };

  const handleDropToAvailable = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedModule && formData.enabledModules.includes(draggedModule)) {
      setFormData((prev) => ({
        ...prev,
        enabledModules: prev.enabledModules.filter(
          (id) => id !== draggedModule,
        ),
      }));
    }
    setDraggedModule(null);
  };

  // Move module to assigned
  const moveToAssigned = (moduleId: string) => {
    if (!formData.enabledModules.includes(moduleId)) {
      setFormData((prev) => ({
        ...prev,
        enabledModules: [...prev.enabledModules, moduleId],
      }));
    }
  };

  // Move module to available
  const moveToAvailable = (moduleId: string) => {
    setFormData((prev) => ({
      ...prev,
      enabledModules: prev.enabledModules.filter((id) => id !== moduleId),
    }));
  };

  // Load available modules and verticals
  useEffect(() => {
    const modules: ModuleInfo[] = [];
    const verticals: VerticalInfo[] = [];

    // Get core modules
    const coreModules = moduleRegistry.getAllModules();
    coreModules.forEach((mod) => {
      modules.push({
        id: mod.id,
        name: mod.name,
        description: mod.description || "",
      });
    });

    // Get verticals
    const allVerticals = verticalRegistry.getAllVerticals();
    allVerticals.forEach((vert) => {
      verticals.push({
        id: vert.id,
        name: vert.name,
        description: vert.description || "",
      });
    });

    setAvailableModules(modules);
    setAvailableVerticals(verticals);
  }, []);

  // Load tenant data if editing
  useEffect(() => {
    if (!isEditing || !id || !isSuperAdmin) return;

    const fetchTenant = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/tenants/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch tenant");
        }

        const data = await response.json();
        const tenant = data.data;

        setFormData({
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan || "basic",
          billingEmail: tenant.billingEmail || "",
          country: tenant.country || "CO",
          status: tenant.status,
          enabledModules: tenant.enabledModules || [],
          vertical: tenant.vertical || null,
          // Owner fields not used when editing
          ownerEmail: "",
          ownerFirstName: "",
          ownerLastName: "",
          ownerPassword: "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [isEditing, id, isSuperAdmin]);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    }));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.slug) {
      setError("Nombre y slug son requeridos");
      return;
    }

    // Validate owner fields when creating
    if (!isEditing) {
      if (
        !formData.ownerEmail ||
        !formData.ownerFirstName ||
        !formData.ownerLastName ||
        !formData.ownerPassword
      ) {
        setError("Todos los campos del usuario administrador son requeridos");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.ownerEmail)) {
        setError("Email del administrador no es válido");
        return;
      }

      // Validate password length
      if (formData.ownerPassword.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres");
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);

      const url = isEditing ? `/api/v1/tenants/${id}` : "/api/v1/tenants";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save tenant");
      }

      // Success - redirect to list
      navigate("/admin/tenants");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  // Access denied
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
                  Solo el SUPER_ADMIN puede crear o editar tenants.
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
      title={isEditing ? "Editar Tenant" : "Nuevo Tenant"}
      subtitle={
        isEditing
          ? "Modifica la información del tenant"
          : "Crea un nuevo tenant en la plataforma"
      }
      actions={
        <button
          onClick={() => navigate("/admin/tenants")}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      }
    >
      <div className="p-8">
        {/* Loading State */}
        {loading && (
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-dark-400">Cargando tenant...</p>
          </div>
        )}

        {/* Form */}
        {!loading && (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            {/* Error Message */}
            {error && (
              <div className="card bg-red-900/20 border-red-800 text-red-400">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="w-5 h-5 text-primary-400" />
                <h3 className="font-semibold text-lg">Información Básica</h3>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nombre del Tenant *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="input w-full"
                    placeholder="Ej: Constructora ABC"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="input w-full font-mono"
                    placeholder="constructora-abc"
                    required
                  />
                  <p className="text-xs text-dark-400 mt-1">
                    Se usa en la URL: /{formData.slug}
                  </p>
                </div>

                {/* Plan and Country */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Plan
                    </label>
                    <select
                      value={formData.plan}
                      onChange={(e) =>
                        setFormData({ ...formData, plan: e.target.value })
                      }
                      className="input w-full"
                    >
                      <option value="basic">Basic</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      País
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      className="input w-full"
                    >
                      <option value="CO">Colombia</option>
                      <option value="MX">México</option>
                      <option value="US">Estados Unidos</option>
                      <option value="ES">España</option>
                      <option value="AR">Argentina</option>
                      <option value="CL">Chile</option>
                      <option value="PE">Perú</option>
                    </select>
                  </div>
                </div>

                {/* Billing Email */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email de Facturación
                  </label>
                  <input
                    type="email"
                    value={formData.billingEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, billingEmail: e.target.value })
                    }
                    className="input w-full"
                    placeholder="facturacion@empresa.com"
                  />
                </div>

                {/* Status (only when editing) */}
                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Estado
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as any,
                        })
                      }
                      className="input w-full"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="SUSPENDED">Suspendido</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Owner User Information (only when creating) */}
            {!isEditing && (
              <div className="card">
                <div className="flex items-center gap-2 mb-6">
                  <User className="w-5 h-5 text-primary-400" />
                  <h3 className="font-semibold text-lg">
                    Usuario Administrador (OWNER)
                  </h3>
                </div>

                <p className="text-sm text-dark-400 mb-6">
                  Este usuario tendrá acceso completo al tenant y podrá crear
                  más usuarios. Recibirá las credenciales para acceder al
                  sistema.
                </p>

                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email del Administrador *
                    </label>
                    <input
                      type="email"
                      value={formData.ownerEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, ownerEmail: e.target.value })
                      }
                      className="input w-full"
                      placeholder="admin@empresa.com"
                      required
                    />
                  </div>

                  {/* First Name and Last Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={formData.ownerFirstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ownerFirstName: e.target.value,
                          })
                        }
                        className="input w-full"
                        placeholder="Juan"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        value={formData.ownerLastName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ownerLastName: e.target.value,
                          })
                        }
                        className="input w-full"
                        placeholder="Pérez"
                        required
                      />
                    </div>
                  </div>

                  {/* Temporary Password */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Key className="w-4 h-4 inline mr-1" />
                      Contraseña Temporal
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.ownerPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ownerPassword: e.target.value,
                          })
                        }
                        className="input w-full font-mono text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            ownerPassword: generateTempPassword(),
                          })
                        }
                        className="btn-secondary whitespace-nowrap"
                      >
                        🔄 Generar
                      </button>
                    </div>
                    <p className="text-xs text-dark-400 mt-1">
                      El usuario deberá cambiar esta contraseña en su primer
                      inicio de sesión.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Modules - Trello Style Drag & Drop */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <Package className="w-5 h-5 text-primary-400" />
                <h3 className="font-semibold text-lg">
                  Módulos - Sistema de Arrastre
                </h3>
              </div>

              <p className="text-sm text-dark-400 mb-6">
                Arrastra los módulos entre columnas o usa los botones de flecha
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available Modules Column */}
                <div
                  className="space-y-3"
                  onDragOver={handleDragOver}
                  onDrop={handleDropToAvailable}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm text-dark-300">
                      📦 Disponibles
                    </h4>
                    <span className="text-xs text-dark-400">
                      {
                        availableModules.filter(
                          (m) => !formData.enabledModules.includes(m.id),
                        ).length
                      }{" "}
                      módulos
                    </span>
                  </div>

                  <div className="space-y-2 min-h-[200px] p-3 rounded-lg border-2 border-dashed border-dark-700 bg-dark-900/30">
                    {availableModules
                      .filter((m) => !formData.enabledModules.includes(m.id))
                      .map((module) => (
                        <div
                          key={module.id}
                          draggable
                          onDragStart={() => handleDragStart(module.id)}
                          onDragEnd={handleDragEnd}
                          className={`card cursor-move hover:border-primary-600 transition-all group ${
                            draggedModule === module.id
                              ? "opacity-50 scale-95"
                              : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <GripVertical className="w-5 h-5 text-dark-400 mt-0.5 group-hover:text-primary-400" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {module.name}
                              </p>
                              <p className="text-xs text-dark-400 mt-1">
                                {module.description}
                              </p>
                            </div>
                            <button
                              onClick={() => moveToAssigned(module.id)}
                              className="p-1.5 rounded hover:bg-primary-900/30 text-dark-400 hover:text-primary-400 transition-colors"
                              title="Asignar módulo"
                            >
                              <MoveRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                    {availableModules.filter(
                      (m) => !formData.enabledModules.includes(m.id),
                    ).length === 0 && (
                      <div className="text-center py-8 text-dark-400 text-sm">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        Todos los módulos asignados
                      </div>
                    )}
                  </div>
                </div>

                {/* Assigned Modules Column */}
                <div
                  className="space-y-3"
                  onDragOver={handleDragOver}
                  onDrop={handleDropToAssigned}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm text-primary-300">
                      ✅ Asignados
                    </h4>
                    <span className="text-xs text-dark-400">
                      {formData.enabledModules.length} módulos
                    </span>
                  </div>

                  <div className="space-y-2 min-h-[200px] p-3 rounded-lg border-2 border-dashed border-primary-700/30 bg-primary-900/10">
                    {availableModules
                      .filter((m) => formData.enabledModules.includes(m.id))
                      .map((module) => (
                        <div
                          key={module.id}
                          draggable
                          onDragStart={() => handleDragStart(module.id)}
                          onDragEnd={handleDragEnd}
                          className={`card border-primary-600 bg-primary-900/20 cursor-move hover:border-primary-500 transition-all group ${
                            draggedModule === module.id
                              ? "opacity-50 scale-95"
                              : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <GripVertical className="w-5 h-5 text-primary-400 mt-0.5 group-hover:text-primary-300" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {module.name}
                              </p>
                              <p className="text-xs text-dark-400 mt-1">
                                {module.description}
                              </p>
                            </div>
                            <button
                              onClick={() => moveToAvailable(module.id)}
                              className="p-1.5 rounded hover:bg-red-900/30 text-primary-400 hover:text-red-400 transition-colors"
                              title="Remover módulo"
                            >
                              <MoveLeft className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                    {formData.enabledModules.length === 0 && (
                      <div className="text-center py-8 text-dark-400 text-sm">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        Arrastra módulos aquí
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {availableModules.length === 0 && (
                <p className="text-sm text-dark-400 text-center py-4">
                  No hay módulos disponibles
                </p>
              )}
            </div>

            {/* Vertical */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <Package className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-lg">Vertical (Opcional)</h3>
              </div>

              <div className="space-y-3">
                <label className="card cursor-pointer border-dark-700 hover:border-dark-600">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="vertical"
                      checked={formData.vertical === null}
                      onChange={() =>
                        setFormData({ ...formData, vertical: null })
                      }
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium">Ninguna</p>
                      <p className="text-xs text-dark-400 mt-1">
                        No usar vertical específica
                      </p>
                    </div>
                  </div>
                </label>

                {availableVerticals.map((vertical) => (
                  <label
                    key={vertical.id}
                    className={`card cursor-pointer transition-all ${
                      formData.vertical === vertical.id
                        ? "border-purple-600 bg-purple-900/10"
                        : "border-dark-700 hover:border-dark-600"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="vertical"
                        checked={formData.vertical === vertical.id}
                        onChange={() =>
                          setFormData({ ...formData, vertical: vertical.id })
                        }
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">{vertical.name}</p>
                        <p className="text-xs text-dark-400 mt-1">
                          {vertical.description}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {availableVerticals.length === 0 && (
                <p className="text-sm text-dark-400 text-center py-4">
                  No hay verticales disponibles
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEditing ? "Guardando..." : "Creando..."}
                  </>
                ) : (
                  <>
                    {isEditing ? (
                      <>
                        <Save className="w-4 h-4" />
                        Guardar Cambios
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Crear Tenant
                      </>
                    )}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/tenants")}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
