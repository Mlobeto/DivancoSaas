/**
 * Staff Form Page
 *
 * Form to create or edit staff members.
 * Role selection via cards + optional operator profile creation.
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
  HardHat,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";

// ---------- Types ----------

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface BusinessUnit {
  id: string;
  name: string;
  code: string;
}

interface RoleCard {
  id: string;
  label: string;
  description: string;
  icon: string;
  colorClasses: string;
}

interface OperatorData {
  document: string;
  phone: string;
  address: string;
  operatorType: "GENERAL" | "HEAVY_MACHINERY" | "VEHICLE" | "EQUIPMENT";
  hourlyRate: string;
  dailyRate: string;
  hireDate: string;
  notes: string;
}

interface OperatorDoc {
  type: string;
  label: string;
  icon: string;
  name: string;
  documentNumber: string;
}

// ---------- Static config ----------

const ROLE_CARDS: RoleCard[] = [
  {
    id: "role-admin",
    label: "Administrativo",
    description: "Gestión de usuarios, configuración y reportes internos",
    icon: "🏢",
    colorClasses: "border-blue-600 bg-blue-900/10 hover:bg-blue-900/25",
  },
  {
    id: "role-comercial",
    label: "Comercial",
    description: "Cotizaciones, contratos y gestión de clientes",
    icon: "💼",
    colorClasses:
      "border-emerald-600 bg-emerald-900/10 hover:bg-emerald-900/25",
  },
  {
    id: "role-contable",
    label: "Contable",
    description: "Facturación, aprobaciones y reportes financieros",
    icon: "📊",
    colorClasses: "border-violet-600 bg-violet-900/10 hover:bg-violet-900/25",
  },
  {
    id: "role-operaciones",
    label: "Operaciones",
    description: "Control de inventario, entregas y logística",
    icon: "🔄",
    colorClasses: "border-orange-600 bg-orange-900/10 hover:bg-orange-900/25",
  },
  {
    id: "role-compras",
    label: "Compras",
    description: "Órdenes de compra y carga de inventario",
    icon: "🛒",
    colorClasses: "border-yellow-600 bg-yellow-900/10 hover:bg-yellow-900/25",
  },
  {
    id: "role-mantenimiento",
    label: "Mantenimiento",
    description: "Gestión de mantenimiento preventivo y correctivo",
    icon: "🔧",
    colorClasses: "border-red-600 bg-red-900/10 hover:bg-red-900/25",
  },
  {
    id: "role-operario",
    label: "Operario",
    description: "Acceso básico operativo (sin gestión administrativa)",
    icon: "⚙️",
    colorClasses: "border-slate-500 bg-slate-900/10 hover:bg-slate-900/25",
  },
];

const OPERATOR_DOC_TYPES: { type: string; label: string; icon: string }[] = [
  { type: "DRIVERS_LICENSE", label: "Licencia / Habilitación", icon: "🪪" },
  { type: "INSURANCE", label: "ART / Seguro", icon: "🛡️" },
  { type: "OTHER", label: "CUIT / Datos fiscales", icon: "📋" },
  {
    type: "HEALTH_CERTIFICATE",
    label: "Apto médico / Examen físico",
    icon: "🏥",
  },
];

const OPERATOR_TYPE_OPTIONS = [
  { value: "GENERAL", label: "General (múltiples equipos)" },
  { value: "HEAVY_MACHINERY", label: "Maquinaria pesada" },
  { value: "VEHICLE", label: "Vehículos" },
  { value: "EQUIPMENT", label: "Equipo especializado" },
];

// ---------- Helpers ----------

const makeDefaultOperatorData = (): OperatorData => ({
  document: "",
  phone: "",
  address: "",
  operatorType: "GENERAL",
  hourlyRate: "",
  dailyRate: "",
  hireDate: new Date().toISOString().substring(0, 10),
  notes: "",
});

const makeDefaultOperatorDocs = (): OperatorDoc[] =>
  OPERATOR_DOC_TYPES.map((d) => ({ ...d, name: "", documentNumber: "" }));

// ---------- Component ----------

export function StaffFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User fields
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessUnitId, setBusinessUnitId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "SUSPENDED">("ACTIVE");

  // Options loaded from API
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [dynamicRoles, setDynamicRoles] = useState<Role[]>([]);

  // Operator section
  const [isOperario, setIsOperario] = useState(false);
  const [operatorData, setOperatorData] = useState<OperatorData>(makeDefaultOperatorData());
  const [operatorDocs, setOperatorDocs] = useState<OperatorDoc[]>(makeDefaultOperatorDocs());

  // Load options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        const [rolesRes, busRes] = await Promise.all([
          api.get("/roles"),
          api.get("/business-units"),
        ]);
        setDynamicRoles(rolesRes.data.data || []);
        setBusinessUnits(busRes.data.data || []);
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

  // Load user for editing
  useEffect(() => {
    if (!isEditing) return;
    const fetchUser = async () => {
      try {
        setLoadingData(true);
        const res = await api.get(`/users/${id}`);
        const u = res.data.data;
        const firstBU = u.businessUnits?.[0];
        setEmail(u.email || "");
        setFirstName(u.firstName || "");
        setLastName(u.lastName || "");
        setBusinessUnitId(firstBU?.businessUnitId || "");
        setRoleId(firstBU?.roleId || "");
        setStatus(u.status || "ACTIVE");
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

  const updateOperatorDoc = (
    index: number,
    field: "name" | "documentNumber",
    value: string,
  ) => {
    setOperatorDocs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isEditing) {
      if (!email || !firstName || !lastName) {
        setError("Por favor completa todos los campos obligatorios");
        setLoading(false);
        return;
      }
      if (!businessUnitId) {
        setError("Por favor selecciona una unidad de negocio");
        setLoading(false);
        return;
      }
      if (!roleId) {
        setError("Por favor selecciona un rol para el usuario");
        setLoading(false);
        return;
      }
    }

    try {
      if (isEditing) {
        await api.put(`/users/${id}`, { firstName, lastName, status });
      } else {
        // Step 1: create user
        const res = await api.post("/users", {
          email,
          firstName,
          lastName,
          businessUnitId,
          roleId,
        });
        const createdUserId: string | undefined =
          res.data.data?.id || res.data.data?.userId;

        // Step 2: create operator profile if checked
        if (isOperario && createdUserId) {
          const opRes = await api.post("/rental/operators", {
            userId: createdUserId,
            document: operatorData.document || undefined,
            phone: operatorData.phone || undefined,
            address: operatorData.address || undefined,
            operatorType: operatorData.operatorType,
            hourlyRate: operatorData.hourlyRate
              ? parseFloat(operatorData.hourlyRate)
              : undefined,
            dailyRate: operatorData.dailyRate
              ? parseFloat(operatorData.dailyRate)
              : undefined,
            hireDate: operatorData.hireDate || undefined,
            notes: operatorData.notes || undefined,
          });
          const operatorProfileId = opRes.data.data?.id;

          // Step 3: save documents that have a name filled in
          if (operatorProfileId) {
            const docsToSend = operatorDocs.filter((d) => d.name.trim() !== "");
            for (const doc of docsToSend) {
              await api
                .post(`/rental/operators/${operatorProfileId}/documents`, {
                  type: doc.type,
                  name: doc.name,
                  documentNumber: doc.documentNumber || undefined,
                })
                .catch(() => console.warn(`Could not save doc ${doc.type}`));
            }
          }
        }
      }

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

  const selectedRoleCard = ROLE_CARDS.find((r) => r.id === roleId);
  const editingRoleName =
    isEditing && (dynamicRoles.find((r) => r.id === roleId)?.name || roleId);

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
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Loading */}
          {loadingData && (
            <div className="card flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="card bg-red-900/20 border-red-800 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {!loadingData && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ── Personal Info ── */}
              <div className="card space-y-4">
                <h2 className="font-semibold text-dark-100 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-400" />
                  Información Personal
                </h2>

                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isEditing}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      minLength={2}
                      className="input"
                      placeholder="Juan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      minLength={2}
                      className="input"
                      placeholder="Pérez"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Unidad de Negocio *
                  </label>
                  <select
                    value={businessUnitId}
                    onChange={(e) => setBusinessUnitId(e.target.value)}
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
                      La unidad de negocio no se puede cambiar desde aquí
                    </p>
                  )}
                </div>

                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1">
                      Estado
                    </label>
                    <select
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as typeof status)
                      }
                      className="input"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo</option>
                      <option value="SUSPENDED">Suspendido</option>
                    </select>
                  </div>
                )}
              </div>

              {/* ── Role Selection ── */}
              <div className="card space-y-4">
                <h2 className="font-semibold text-dark-100 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary-400" />
                  Rol en el Sistema
                </h2>

                {isEditing ? (
                  <div className="bg-dark-800 rounded-lg p-4 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary-400" />
                    <div>
                      <p className="text-sm font-medium text-dark-100">
                        {editingRoleName || "Sin rol asignado"}
                      </p>
                      <p className="text-xs text-dark-400">
                        Para cambiar el rol, usa la gestión de permisos del
                        usuario
                      </p>
                    </div>
                  </div>
                ) : loadingOptions ? (
                  <p className="text-sm text-dark-400">Cargando roles...</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {ROLE_CARDS.map((card) => {
                        const isSelected = roleId === card.id;
                        return (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() => setRoleId(card.id)}
                            className={`text-left p-4 rounded-lg border-2 transition-all ${card.colorClasses} ${
                              isSelected
                                ? "ring-2 ring-primary-500 ring-offset-1 ring-offset-dark-900"
                                : ""
                            }`}
                          >
                            <div className="text-2xl mb-2">{card.icon}</div>
                            <p className="font-semibold text-sm text-dark-100">
                              {card.label}
                            </p>
                            <p className="text-xs text-dark-400 mt-1 leading-snug">
                              {card.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    {!roleId && (
                      <p className="text-xs text-amber-400">
                        ⚠ Selecciona un rol para continuar
                      </p>
                    )}
                    {selectedRoleCard && (
                      <p className="text-xs text-primary-400">
                        ✓ Rol seleccionado:{" "}
                        <strong>{selectedRoleCard.label}</strong>
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* ── Operario Section (new users only) ── */}
              {!isEditing && (
                <div className="card space-y-4">
                  {/* Checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={isOperario}
                        onChange={(e) => setIsOperario(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isOperario
                            ? "bg-primary-600 border-primary-600"
                            : "border-dark-500 group-hover:border-primary-500"
                        }`}
                      >
                        {isOperario && (
                          <svg
                            className="w-3 h-3 text-white"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-dark-100 flex items-center gap-2">
                        <HardHat className="w-4 h-4 text-orange-400" />
                        ¿Este usuario también es operario?
                      </p>
                      <p className="text-xs text-dark-400 mt-0.5">
                        Se creará un perfil de operario con licencias y tarifas
                      </p>
                    </div>
                  </label>

                  {/* Operator fields */}
                  {isOperario && (
                    <div className="space-y-6 pt-4 border-t border-dark-700">
                      {/* Basic fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-dark-200 mb-1">
                            <FileText className="w-4 h-4 inline mr-1" />
                            DNI / Documento
                          </label>
                          <input
                            type="text"
                            value={operatorData.document}
                            onChange={(e) =>
                              setOperatorData((p) => ({
                                ...p,
                                document: e.target.value,
                              }))
                            }
                            className="input"
                            placeholder="30.123.456"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-dark-200 mb-1">
                            <Phone className="w-4 h-4 inline mr-1" />
                            Teléfono
                          </label>
                          <input
                            type="tel"
                            value={operatorData.phone}
                            onChange={(e) =>
                              setOperatorData((p) => ({
                                ...p,
                                phone: e.target.value,
                              }))
                            }
                            className="input"
                            placeholder="+54 9 11 1234-5678"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-dark-200 mb-1">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Dirección
                          </label>
                          <input
                            type="text"
                            value={operatorData.address}
                            onChange={(e) =>
                              setOperatorData((p) => ({
                                ...p,
                                address: e.target.value,
                              }))
                            }
                            className="input"
                            placeholder="Av. Corrientes 1234, CABA"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-dark-200 mb-1">
                            Tipo de Operario
                          </label>
                          <select
                            value={operatorData.operatorType}
                            onChange={(e) =>
                              setOperatorData((p) => ({
                                ...p,
                                operatorType: e.target.value as OperatorData["operatorType"],
                              }))
                            }
                            className="input"
                          >
                            {OPERATOR_TYPE_OPTIONS.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-dark-200 mb-1">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Fecha de Ingreso
                          </label>
                          <input
                            type="date"
                            value={operatorData.hireDate}
                            onChange={(e) =>
                              setOperatorData((p) => ({
                                ...p,
                                hireDate: e.target.value,
                              }))
                            }
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-dark-200 mb-1">
                            <DollarSign className="w-4 h-4 inline mr-1" />
                            Tarifa por Hora ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={operatorData.hourlyRate}
                            onChange={(e) =>
                              setOperatorData((p) => ({
                                ...p,
                                hourlyRate: e.target.value,
                              }))
                            }
                            className="input"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-dark-200 mb-1">
                            <DollarSign className="w-4 h-4 inline mr-1" />
                            Tarifa por Día ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={operatorData.dailyRate}
                            onChange={(e) =>
                              setOperatorData((p) => ({
                                ...p,
                                dailyRate: e.target.value,
                              }))
                            }
                            className="input"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-dark-200 mb-1">
                            Notas internas
                          </label>
                          <textarea
                            rows={2}
                            value={operatorData.notes}
                            onChange={(e) =>
                              setOperatorData((p) => ({
                                ...p,
                                notes: e.target.value,
                              }))
                            }
                            className="input"
                            placeholder="Especialidades, observaciones..."
                          />
                        </div>
                      </div>

                      {/* Documents */}
                      <div>
                        <h3 className="text-sm font-semibold text-dark-200 mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary-400" />
                          Documentación del Operario
                          <span className="text-xs font-normal text-dark-400">
                            (opcional)
                          </span>
                        </h3>
                        <div className="space-y-3">
                          {operatorDocs.map((doc, index) => (
                            <div
                              key={doc.type}
                              className="bg-dark-800/50 rounded-lg p-3 border border-dark-700"
                            >
                              <p className="text-sm font-medium text-dark-200 mb-2">
                                {doc.icon} {doc.label}
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-dark-400 mb-1">
                                    Nombre / Descripción
                                  </label>
                                  <input
                                    type="text"
                                    value={doc.name}
                                    onChange={(e) =>
                                      updateOperatorDoc(
                                        index,
                                        "name",
                                        e.target.value,
                                      )
                                    }
                                    className="input text-sm"
                                    placeholder="Ej: Licencia Cat. B"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-dark-400 mb-1">
                                    Número / Referencia
                                  </label>
                                  <input
                                    type="text"
                                    value={doc.documentNumber}
                                    onChange={(e) =>
                                      updateOperatorDoc(
                                        index,
                                        "documentNumber",
                                        e.target.value,
                                      )
                                    }
                                    className="input text-sm"
                                    placeholder="Nro. documento"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-dark-500 mt-2">
                          Podés agregar más documentos después desde el perfil
                          del operario.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Actions ── */}
              <div className="card flex items-center justify-end gap-3">
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
                      (!email ||
                        !firstName ||
                        !lastName ||
                        !businessUnitId ||
                        !roleId))
                  }
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isEditing ? "Actualizar Usuario" : "Crear Usuario"}
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
