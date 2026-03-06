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
  Lock,
  Wand2,
  Copy,
  Check,
} from "lucide-react";

// ---------- Types ----------

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions?: Permission[];
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  scope?: string;
  description?: string | null;
  key?: string;
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

const OPERARIO_ROLE_ID = "role-operario";

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

const generateSecurePassword = (length = 14): string => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%*()-_=+?";
  const allChars = uppercase + lowercase + numbers + symbols;

  const requiredChars = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  const remainingChars = Array.from(
    { length: Math.max(0, length - requiredChars.length) },
    () => allChars[Math.floor(Math.random() * allChars.length)],
  );

  const passwordArray = [...requiredChars, ...remainingChars];

  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join("");
};

const normalizeRoleValue = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const ROLE_MATCH_ALIASES: Record<string, string[]> = {
  "role-admin": ["admin", "administrativo", "administrator"],
  "role-comercial": ["comercial", "sales", "vendedor"],
  "role-contable": ["contable", "finance", "finanzas", "contador"],
  "role-operaciones": ["operaciones", "operations", "logistica"],
  "role-compras": ["compras", "purchase", "procurement"],
  "role-mantenimiento": ["mantenimiento", "maintenance"],
  "role-operario": ["operario", "operator"],
};

const ROLE_ID_FALLBACKS: Record<string, string[]> = {
  "role-admin": ["role-admin", "role-owner"],
  "role-comercial": [
    "role-comercial",
    "role-vendedor",
    "role-manager",
    "role-employee",
  ],
  "role-contable": ["role-contable", "role-manager", "role-admin"],
  "role-operaciones": ["role-operaciones", "role-manager", "role-employee"],
  "role-compras": ["role-compras", "role-manager", "role-employee"],
  "role-mantenimiento": ["role-mantenimiento", "role-manager", "role-employee"],
  "role-operario": ["role-operario", "role-employee"],
};

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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessUnitId, setBusinessUnitId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "SUSPENDED">(
    "ACTIVE",
  );

  // Options loaded from API
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [dynamicRoles, setDynamicRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loadingAdditionalPermissions, setLoadingAdditionalPermissions] =
    useState(false);
  const [selectedAdditionalPermissionIds, setSelectedAdditionalPermissionIds] =
    useState<string[]>([]);

  // Operator section
  const [isOperario, setIsOperario] = useState(false);
  const [operatorData, setOperatorData] = useState<OperatorData>(
    makeDefaultOperatorData(),
  );
  const [operatorDocs, setOperatorDocs] = useState<OperatorDoc[]>(
    makeDefaultOperatorDocs(),
  );

  // Load options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        const [rolesRes, busRes, permissionsRes] = await Promise.all([
          api.get("/roles"),
          api.get("/business-units"),
          api.get("/permissions"),
        ]);
        setDynamicRoles(rolesRes.data.data || []);
        setBusinessUnits(busRes.data.data || []);
        setAllPermissions(permissionsRes.data.data?.permissions || []);

        // Validar que existan roles y BUs
        if ((rolesRes.data.data || []).length === 0) {
          setError(
            "⚠️ No hay roles del sistema. Ejecuta 'npx prisma db seed' en el backend.",
          );
        }
        if ((busRes.data.data || []).length === 0) {
          setError(
            "⚠️ No hay unidades de negocio. Crea una en Configuración → Unidades de Negocio o ejecuta 'npx prisma db seed'.",
          );
        }
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

  // Reset form when entering create mode (/settings/staff/new)
  useEffect(() => {
    if (isEditing) return;

    setLoadingData(false);
    setError(null);

    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPasswordCopied(false);
    setFirstName("");
    setLastName("");
    setBusinessUnitId("");
    setRoleId("");
    setStatus("ACTIVE");
    setSelectedAdditionalPermissionIds([]);

    setIsOperario(false);
    setOperatorData(makeDefaultOperatorData());
    setOperatorDocs(makeDefaultOperatorDocs());
  }, [isEditing, id]);

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

  useEffect(() => {
    if (!isEditing || !id || !businessUnitId) return;

    const fetchAdditionalPermissions = async () => {
      try {
        setLoadingAdditionalPermissions(true);
        const response = await api.get(`/users/${id}/permissions`, {
          params: { businessUnitId },
        });
        const permissionIds = ((response.data.data || []) as Permission[]).map(
          (permission) => permission.id,
        );
        setSelectedAdditionalPermissionIds(permissionIds);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("[StaffForm][load-additional-permissions]", err);
        }
      } finally {
        setLoadingAdditionalPermissions(false);
      }
    };

    fetchAdditionalPermissions();
  }, [businessUnitId, id, isEditing]);

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

  const handleGeneratePassword = () => {
    const generated = generateSecurePassword();
    setPassword(generated);
    setConfirmPassword(generated);
    setPasswordCopied(false);
    setError(null);
  };

  const handleCopyPassword = async () => {
    if (!password) {
      setError(
        "❌ Primero genera o escribe una contraseña para poder copiarla.",
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(password);
      setPasswordCopied(true);
      setError(null);

      window.setTimeout(() => {
        setPasswordCopied(false);
      }, 2000);
    } catch {
      setError(
        "❌ No se pudo copiar automáticamente. Copia la contraseña manualmente.",
      );
    }
  };

  const resolveRoleForCard = (card: RoleCard): Role | undefined => {
    const byId = dynamicRoles.find((role) => role.id === card.id);
    if (byId) return byId;

    const byName = dynamicRoles.find(
      (role) =>
        normalizeRoleValue(role.name) === normalizeRoleValue(card.label),
    );
    if (byName) return byName;

    const aliases = ROLE_MATCH_ALIASES[card.id] || [];
    if (aliases.length > 0) {
      const byAlias = dynamicRoles.find((role) => {
        const normalizedRoleId = normalizeRoleValue(role.id);
        const normalizedRoleName = normalizeRoleValue(role.name);
        return aliases.some((alias) => {
          const normalizedAlias = normalizeRoleValue(alias);
          return (
            normalizedRoleId.includes(normalizedAlias) ||
            normalizedRoleName.includes(normalizedAlias)
          );
        });
      });
      if (byAlias) return byAlias;
    }

    const fallbackRoleIds = ROLE_ID_FALLBACKS[card.id] || [];
    for (const fallbackRoleId of fallbackRoleIds) {
      const matchByFallbackId = dynamicRoles.find(
        (role) =>
          normalizeRoleValue(role.id) === normalizeRoleValue(fallbackRoleId),
      );
      if (matchByFallbackId) return matchByFallbackId;
    }

    for (const fallbackRoleId of fallbackRoleIds) {
      const fallbackToken = normalizeRoleValue(
        fallbackRoleId.replace(/^role-/, ""),
      );
      const matchByFallbackToken = dynamicRoles.find((role) => {
        const normalizedRoleId = normalizeRoleValue(role.id);
        const normalizedRoleName = normalizeRoleValue(role.name);
        return (
          normalizedRoleId.includes(fallbackToken) ||
          normalizedRoleName.includes(fallbackToken)
        );
      });
      if (matchByFallbackToken) return matchByFallbackToken;
    }

    return undefined;
  };

  const resolveRoleIdForCard = (card: RoleCard): string =>
    resolveRoleForCard(card)?.id || "";

  const handleRoleSelect = (card: RoleCard) => {
    const nextResolvedRoleId = resolveRoleIdForCard(card);

    if (!nextResolvedRoleId) {
      setError(
        `⚠️ El rol "${card.label}" no existe en la base de datos actual. Ejecuta el seed de roles o elige un rol disponible.`,
      );
      return;
    }

    setError((prev) =>
      prev?.includes("no existe en la base de datos") ? null : prev,
    );

    const currentSelectedCard = ROLE_CARDS.find(
      (roleCard) => resolveRoleIdForCard(roleCard) === roleId,
    );
    const wasOperarioRole = currentSelectedCard?.id === OPERARIO_ROLE_ID;
    const isSwitchingFromOperarioToAnotherRole =
      wasOperarioRole && card.id !== OPERARIO_ROLE_ID;

    setRoleId(nextResolvedRoleId);

    if (isSwitchingFromOperarioToAnotherRole) {
      setIsOperario(false);
    }

    if (import.meta.env.DEV) {
      console.log("[StaffForm][role-select]", {
        cardId: card.id,
        cardLabel: card.label,
        resolvedRoleId: nextResolvedRoleId,
        availableRoles: dynamicRoles.map((r) => ({ id: r.id, name: r.name })),
      });
    }
  };

  const handleDynamicRoleSelect = (nextRoleId: string) => {
    const currentSelectedCard = ROLE_CARDS.find(
      (roleCard) => resolveRoleIdForCard(roleCard) === roleId,
    );
    const nextSelectedCard = ROLE_CARDS.find(
      (roleCard) => resolveRoleIdForCard(roleCard) === nextRoleId,
    );

    const wasOperarioRole = currentSelectedCard?.id === OPERARIO_ROLE_ID;
    const nextIsOperarioRole = nextSelectedCard?.id === OPERARIO_ROLE_ID;

    if (wasOperarioRole && !nextIsOperarioRole) {
      setIsOperario(false);
    }

    setRoleId(nextRoleId);
  };

  const toggleAdditionalPermission = (permissionId: string) => {
    setSelectedAdditionalPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isEditing && (!businessUnitId || businessUnitId.trim() === "")) {
      setError(
        "❌ Debes seleccionar una unidad de negocio. Si no hay ninguna disponible, créala primero en Configuración → Unidades de Negocio.",
      );
      setLoading(false);
      return;
    }
    if (!roleId || roleId.trim() === "") {
      setError("❌ Debes seleccionar un rol para el usuario.");
      setLoading(false);
      return;
    }
    if (!dynamicRoles.some((role) => role.id === roleId)) {
      setError(
        "❌ El rol seleccionado no es válido para este tenant. Recarga la página y selecciona un rol disponible.",
      );
      setLoading(false);
      return;
    }

    if (!isEditing) {
      if (!password) {
        setError("❌ Debes definir una contraseña para el usuario.");
        setLoading(false);
        return;
      }

      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
        setError(
          "❌ La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.",
        );
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("❌ Las contraseñas no coinciden.");
        setLoading(false);
        return;
      }
    }

    try {
      if (isEditing) {
        await api.put(`/users/${id}`, { firstName, lastName, status, roleId });

        if (id && businessUnitId) {
          await api.post(`/users/${id}/permissions`, {
            businessUnitId,
            permissionIds: selectedAdditionalPermissionIds,
          });
        }
      } else {
        // Step 1: create user
        const res = await api.post("/users", {
          email,
          password,
          firstName,
          lastName,
          businessUnitId,
          roleId,
        });
        const createdUserId: string | undefined =
          res.data.data?.id || res.data.data?.userId;

        if (import.meta.env.DEV) {
          console.log("[StaffForm][create-user]", {
            email,
            firstName,
            lastName,
            businessUnitId,
            roleId,
            roleName:
              dynamicRoles.find((role) => role.id === roleId)?.name ||
              "unknown",
            passwordLength: password?.length || 0,
            isOperario,
            selectedAdditionalPermissionIdsCount:
              selectedAdditionalPermissionIds.length,
          });
        }

        // Step 2: sync additional permissions (optional)
        if (
          createdUserId &&
          businessUnitId &&
          selectedAdditionalPermissionIds.length > 0
        ) {
          await api.post(`/users/${createdUserId}/permissions`, {
            businessUnitId,
            permissionIds: selectedAdditionalPermissionIds,
          });
        }

        // Step 3: create operator profile if needed
        if (shouldCreateOperatorProfile && createdUserId) {
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

          // Step 4: save documents that have a name filled in
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

  const selectedRoleByResolvedId = ROLE_CARDS.find(
    (card) => resolveRoleIdForCard(card) === roleId,
  );
  const selectedRole = dynamicRoles.find((role) => role.id === roleId);
  const rolePermissionIds = new Set(
    (selectedRole?.permissions || []).map((permission) => permission.id),
  );
  const groupedPermissions = allPermissions.reduce<
    Record<string, Permission[]>
  >((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {});
  const mappedRoleIds = new Set(
    ROLE_CARDS.map((card) => resolveRoleIdForCard(card)).filter(Boolean),
  );
  const unmappedDynamicRoles = dynamicRoles.filter(
    (role) => !mappedRoleIds.has(role.id),
  );
  const selectedDynamicRole = dynamicRoles.find((role) => role.id === roleId);
  const editingRoleName =
    isEditing && (dynamicRoles.find((r) => r.id === roleId)?.name || roleId);
  const isOperarioRoleSelected =
    selectedRoleByResolvedId?.id === OPERARIO_ROLE_ID;
  const shouldCreateOperatorProfile = isOperarioRoleSelected || isOperario;

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
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
              autoComplete="off"
            >
              <input
                type="text"
                name="fake-username"
                autoComplete="username"
                className="hidden"
                tabIndex={-1}
              />
              <input
                type="password"
                name="fake-password"
                autoComplete="new-password"
                className="hidden"
                tabIndex={-1}
              />
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
                    name="staff-email"
                    autoComplete="off"
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

                {!isEditing && (
                  <div className="space-y-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Wand2 className="w-4 h-4" />
                        Generar contraseña segura
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="btn-secondary flex items-center gap-2"
                        disabled={!password}
                      >
                        {passwordCopied ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copiada
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copiar contraseña
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-dark-200 mb-1">
                          <Lock className="w-4 h-4 inline mr-1" />
                          Contraseña *
                        </label>
                        <input
                          type="password"
                          name="staff-password"
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={8}
                          className="input"
                          placeholder="Mínimo 8 caracteres"
                        />
                        <p className="mt-1 text-xs text-dark-400">
                          Debe incluir mayúscula, minúscula y número.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-200 mb-1">
                          <Lock className="w-4 h-4 inline mr-1" />
                          Confirmar contraseña *
                        </label>
                        <input
                          type="password"
                          name="staff-confirm-password"
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={8}
                          className="input"
                          placeholder="Repite la contraseña"
                        />
                      </div>
                    </div>
                  </div>
                )}

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
                    disabled={isEditing || businessUnits.length === 0}
                    required
                    className="input"
                  >
                    <option value="">
                      {loadingOptions
                        ? "Cargando..."
                        : businessUnits.length === 0
                          ? "No hay unidades disponibles"
                          : "Selecciona una unidad"}
                    </option>
                    {businessUnits.map((bu) => (
                      <option key={bu.id} value={bu.id}>
                        {bu.name} ({bu.code})
                      </option>
                    ))}
                  </select>
                  {!isEditing &&
                    businessUnits.length === 0 &&
                    !loadingOptions && (
                      <p className="mt-1 text-xs text-red-400">
                        ⚠️ No hay unidades de negocio. Crea una primero en
                        Configuración.
                      </p>
                    )}
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
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {ROLE_CARDS.map((card) => {
                        const resolvedRoleId = resolveRoleIdForCard(card);
                        const isSelected = roleId === resolvedRoleId;
                        return (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() => handleRoleSelect(card)}
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
                    <p className="text-xs text-dark-400 bg-dark-800 p-3 rounded">
                      💡 Cambiar el rol aquí actualizará el rol principal del
                      usuario.
                    </p>

                    {unmappedDynamicRoles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-dark-400">
                          Roles adicionales disponibles en la base de datos
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {unmappedDynamicRoles.map((role) => {
                            const isSelected = roleId === role.id;
                            return (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => handleDynamicRoleSelect(role.id)}
                                className={`px-3 py-1.5 rounded-md border text-xs transition-all ${
                                  isSelected
                                    ? "border-primary-500 text-primary-300 bg-primary-900/20"
                                    : "border-dark-600 text-dark-300 hover:border-dark-500"
                                }`}
                              >
                                {role.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : loadingOptions ? (
                  <p className="text-sm text-dark-400">Cargando roles...</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {ROLE_CARDS.map((card) => {
                        const resolvedRoleId = resolveRoleIdForCard(card);
                        const isSelected = roleId === resolvedRoleId;
                        return (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() => handleRoleSelect(card)}
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
                    {selectedRoleByResolvedId && (
                      <p className="text-xs text-primary-400">
                        ✓ Rol seleccionado:{" "}
                        <strong>{selectedRoleByResolvedId.label}</strong>
                      </p>
                    )}
                    {!selectedRoleByResolvedId && selectedDynamicRole && (
                      <p className="text-xs text-primary-400">
                        ✓ Rol seleccionado:{" "}
                        <strong>{selectedDynamicRole.name}</strong>
                      </p>
                    )}

                    {unmappedDynamicRoles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-dark-400">
                          Roles adicionales disponibles en la base de datos
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {unmappedDynamicRoles.map((role) => {
                            const isSelected = roleId === role.id;
                            return (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => handleDynamicRoleSelect(role.id)}
                                className={`px-3 py-1.5 rounded-md border text-xs transition-all ${
                                  isSelected
                                    ? "border-primary-500 text-primary-300 bg-primary-900/20"
                                    : "border-dark-600 text-dark-300 hover:border-dark-500"
                                }`}
                              >
                                {role.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="card space-y-4">
                <h2 className="font-semibold text-dark-100 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary-400" />
                  Permisos Específicos
                </h2>

                <div className="rounded-lg border border-dark-700 bg-dark-900/40 p-3 text-xs text-dark-300">
                  {isEditing
                    ? "Ajusta permisos adicionales del usuario (se suman al rol actual)."
                    : "Los permisos del rol se asignan automáticamente. Aquí puedes agregar o quitar permisos adicionales específicos del usuario."}
                </div>

                {loadingAdditionalPermissions ? (
                  <p className="text-xs text-dark-400">
                    Cargando permisos adicionales del usuario...
                  </p>
                ) : !roleId ? (
                  <p className="text-xs text-amber-400">
                    ⚠ Selecciona un rol para ver sus permisos base.
                  </p>
                ) : allPermissions.length === 0 ? (
                  <p className="text-xs text-dark-400">
                    No hay permisos disponibles para configurar.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([resource, permissions]) => (
                        <div
                          key={resource}
                          className="rounded-lg border border-dark-700 p-3"
                        >
                          <p className="text-sm font-semibold text-dark-100 mb-2 capitalize">
                            {resource}
                          </p>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {permissions
                              .slice()
                              .sort((a, b) =>
                                `${a.action}`.localeCompare(`${b.action}`),
                              )
                              .map((permission) => {
                                const inheritedByRole = rolePermissionIds.has(
                                  permission.id,
                                );
                                const isSelectedAdditional =
                                  selectedAdditionalPermissionIds.includes(
                                    permission.id,
                                  );

                                return (
                                  <label
                                    key={permission.id}
                                    className={`flex items-start gap-2 rounded-md border p-2 text-xs ${
                                      inheritedByRole
                                        ? "border-emerald-700/50 bg-emerald-900/10"
                                        : "border-dark-700"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        inheritedByRole || isSelectedAdditional
                                      }
                                      disabled={inheritedByRole}
                                      onChange={() =>
                                        toggleAdditionalPermission(
                                          permission.id,
                                        )
                                      }
                                      className="mt-0.5"
                                    />
                                    <span className="flex-1">
                                      <span className="font-medium text-dark-100">
                                        {permission.action}
                                      </span>
                                      {inheritedByRole ? (
                                        <span className="ml-2 text-emerald-400">
                                          (por rol)
                                        </span>
                                      ) : isSelectedAdditional ? (
                                        <span className="ml-2 text-primary-400">
                                          (adicional)
                                        </span>
                                      ) : null}
                                      {permission.description && (
                                        <p className="text-dark-400 mt-0.5">
                                          {permission.description}
                                        </p>
                                      )}
                                    </span>
                                  </label>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* ── Operario Section (new users only) ── */}
              {!isEditing && (
                <div className="card space-y-4">
                  {isOperarioRoleSelected ? (
                    <div className="rounded-lg border border-orange-700 bg-orange-900/10 p-3">
                      <p className="font-semibold text-dark-100 flex items-center gap-2">
                        <HardHat className="w-4 h-4 text-orange-400" />
                        Rol Operario seleccionado
                      </p>
                      <p className="text-xs text-dark-300 mt-1">
                        El perfil de operario se habilita automáticamente para
                        completar licencias y tarifas.
                      </p>
                    </div>
                  ) : (
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
                          Se creará un perfil de operario con licencias y
                          tarifas
                        </p>
                      </div>
                    </label>
                  )}

                  {/* Operator fields */}
                  {shouldCreateOperatorProfile && (
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
                                operatorType: e.target
                                  .value as OperatorData["operatorType"],
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
                        !password ||
                        !confirmPassword ||
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
