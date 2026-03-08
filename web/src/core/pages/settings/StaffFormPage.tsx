/**
 * Staff Form Page
 *
 * Form to create or edit staff members.
 * Role selection via cards + optional operator profile creation.
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/core/components/Layout";
import { PermissionsDragDrop } from "@/core/components/PermissionsDragDrop";
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
  Key,
  ChevronDown,
  Eye,
  EyeOff,
  Camera,
  Upload,
} from "lucide-react";
import { userService } from "@/core/services/user.service";
import { useAuthStore } from "@/store/auth.store";

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

// ---------- Component ----------

export function StaffFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { user: currentUser, updateAvatar } = useAuthStore();

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

  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [existingAvatar, setExistingAvatar] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Password reset (admin only, when editing)
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [userHasOwnerRole, setUserHasOwnerRole] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    setAvatarFile(null);
    setAvatarPreview(null);
    setExistingAvatar(null);

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
        setExistingAvatar(u.avatar || null);

        // Check if user has OWNER role (protection against password reset)
        const hasOwnerRole = u.businessUnits?.some(
          (bu: any) => bu.role?.name === "OWNER" || bu.roleId === "role-owner",
        );
        setUserHasOwnerRole(hasOwnerRole || false);
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("❌ Solo se permiten imágenes (JPG, PNG, WEBP, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("❌ La imagen no puede superar los 5 MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleRoleChange = (newRoleId: string) => {
    setRoleId(newRoleId);
    setError(null);

    // Reset operator profile if switching away from employee role
    const selectedRole = dynamicRoles.find((r) => r.id === newRoleId);
    const isEmployeeRole =
      selectedRole?.id === "role-employee" ||
      selectedRole?.name?.toLowerCase().includes("employee") ||
      selectedRole?.name?.toLowerCase().includes("operario");

    if (!isEmployeeRole && isOperario) {
      setIsOperario(false);
    }

    if (import.meta.env.DEV) {
      console.log("[StaffForm][role-select]", {
        roleId: newRoleId,
        roleName: selectedRole?.name || "unknown",
        isEmployeeRole,
      });
    }
  };

  const toggleAdditionalPermission = (permissionId: string) => {
    setSelectedAdditionalPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  const handleResetPassword = async () => {
    if (!id) return;

    // Validaciones
    if (!newPassword || !confirmNewPassword) {
      setError("⚠️ Debes ingresar la nueva contraseña y confirmarla");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("⚠️ Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 8) {
      setError("⚠️ La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setError("⚠️ La contraseña debe incluir mayúscula, minúscula y número");
      return;
    }

    try {
      setResetPasswordLoading(true);
      setError(null);

      await userService.adminResetPassword(id, newPassword);

      // Success - reset form
      setNewPassword("");
      setConfirmNewPassword("");
      setShowPasswordReset(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      alert("✅ Contraseña cambiada exitosamente");
    } catch (err: any) {
      if (err.response?.data?.error?.code === "CANNOT_RESET_OWNER_PASSWORD") {
        setError(
          "🔒 No se puede cambiar la contraseña de usuarios con rol OWNER. El propietario debe cambiar su contraseña usando su perfil.",
        );
      } else {
        setError(
          "❌ Error al cambiar contraseña: " +
            (err.response?.data?.error?.message ||
              err.message ||
              "Error desconocido"),
        );
      }
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isEditing && !avatarFile && !existingAvatar) {
      setError("❌ Debes subir una foto de perfil para el empleado.");
      setLoading(false);
      return;
    }

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

        // Upload avatar if a new one was selected
        if (id && avatarFile) {
          const formData = new FormData();
          formData.append("avatar", avatarFile);
          const avatarRes = await api.post(`/users/${id}/avatar`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          // Si el usuario está editando su propio perfil, actualizar el navbar
          if (id === currentUser?.id && avatarRes.data?.data?.avatar) {
            updateAvatar(avatarRes.data.data.avatar);
          }
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

        // Step 2.5: Upload avatar (required for new users)
        if (createdUserId && avatarFile) {
          const formData = new FormData();
          formData.append("avatar", avatarFile);
          await api.post(`/users/${createdUserId}/avatar`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
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

  const selectedRole = dynamicRoles.find((role) => role.id === roleId);
  const rolePermissionIds = new Set(
    (selectedRole?.permissions || []).map((permission) => permission.id),
  );
  const shouldCreateOperatorProfile = isOperario;
  const isOperarioRoleSelected =
    roleId === OPERARIO_ROLE_ID ||
    roleId === "role-operario" ||
    selectedRole?.name?.toLowerCase().includes("operario");

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

                {/* Avatar Upload */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-dark-700 flex items-center justify-center">
                      {avatarPreview || existingAvatar ? (
                        <img
                          src={avatarPreview || existingAvatar || ""}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-dark-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      {existingAvatar || avatarPreview
                        ? "Cambiar foto"
                        : "Subir foto"}
                    </button>
                    <p className="mt-2 text-xs text-dark-400">
                      {isEditing
                        ? "JPG, PNG o WEBP. Máximo 5 MB."
                        : "⚠️ Requerida. JPG, PNG o WEBP. Máximo 5 MB."}
                    </p>
                  </div>
                </div>

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

              {/* ── Password Reset (Admin only, when editing) ── */}
              {isEditing && !userHasOwnerRole && (
                <div className="card border-amber-700/30 bg-amber-900/10">
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(!showPasswordReset)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-amber-400" />
                      <h2 className="font-semibold text-dark-100">
                        Cambiar Contraseña
                      </h2>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-dark-400 transition-transform ${
                        showPasswordReset ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showPasswordReset && (
                    <div className="mt-4 pt-4 border-t border-amber-700/20 space-y-4">
                      <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 text-xs text-amber-200">
                        <p className="font-medium mb-1">⚠️ Importante:</p>
                        <ul className="list-disc list-inside space-y-1 text-amber-300/80">
                          <li>
                            El usuario recibirá su nueva contraseña por email
                          </li>
                          <li>
                            No se puede cambiar la contraseña de usuarios con
                            rol OWNER
                          </li>
                          <li>
                            La contraseña debe tener al menos 8 caracteres e
                            incluir mayúscula, minúscula y número
                          </li>
                        </ul>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const generated = generateSecurePassword();
                            setNewPassword(generated);
                            setConfirmNewPassword(generated);
                            setShowNewPassword(true);
                            setShowConfirmPassword(true);
                          }}
                          className="btn-secondary flex items-center gap-2 text-sm"
                        >
                          <Wand2 className="w-4 h-4" />
                          Generar contraseña segura
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-dark-200 mb-1">
                            <Lock className="w-4 h-4 inline mr-1" />
                            Nueva Contraseña *
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="input pr-10"
                              placeholder="Mínimo 8 caracteres"
                              minLength={8}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-dark-400 hover:text-dark-200 transition-colors"
                              title={
                                showNewPassword
                                  ? "Ocultar contraseña"
                                  : "Mostrar contraseña"
                              }
                            >
                              {showNewPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-dark-200 mb-1">
                            <Lock className="w-4 h-4 inline mr-1" />
                            Confirmar Contraseña *
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmNewPassword}
                              onChange={(e) =>
                                setConfirmNewPassword(e.target.value)
                              }
                              className="input pr-10"
                              placeholder="Confirma la contraseña"
                              minLength={8}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-dark-400 hover:text-dark-200 transition-colors"
                              title={
                                showConfirmPassword
                                  ? "Ocultar contraseña"
                                  : "Mostrar contraseña"
                              }
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordReset(false);
                            setNewPassword("");
                            setConfirmNewPassword("");
                            setShowNewPassword(false);
                            setShowConfirmPassword(false);
                            setError(null);
                          }}
                          className="btn-secondary"
                          disabled={resetPasswordLoading}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleResetPassword}
                          className="btn-primary flex items-center gap-2"
                          disabled={resetPasswordLoading}
                        >
                          {resetPasswordLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                              Cambiando...
                            </>
                          ) : (
                            <>
                              <Key className="w-4 h-4" />
                              Cambiar Contraseña
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Owner Role Protection Message ── */}
              {isEditing && userHasOwnerRole && (
                <div className="card border-emerald-700/30 bg-emerald-900/10">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h3 className="font-semibold text-emerald-200">
                        Usuario Protegido (OWNER)
                      </h3>
                      <p className="text-sm text-emerald-300/80">
                        Este usuario tiene rol de propietario (OWNER). Por
                        seguridad, solo puede cambiar su propia contraseña desde
                        su perfil de usuario.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Role Selection ── */}
              <div className="card space-y-4">
                <h2 className="font-semibold text-dark-100 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary-400" />
                  Rol en el Sistema
                </h2>

                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1">
                    Rol *
                  </label>
                  {loadingOptions ? (
                    <p className="text-sm text-dark-400">Cargando roles...</p>
                  ) : (
                    <select
                      value={roleId}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      required
                      className="input"
                    >
                      <option value="">Selecciona un rol</option>
                      {dynamicRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}{" "}
                          {role.description ? `- ${role.description}` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedRole && (
                    <p className="text-xs text-primary-400 mt-2">
                      ✓ Rol seleccionado: <strong>{selectedRole.name}</strong>
                      {selectedRole.description && (
                        <span className="text-dark-400">
                          {" "}
                          - {selectedRole.description}
                        </span>
                      )}
                    </p>
                  )}
                  {!roleId && !loadingOptions && (
                    <p className="text-xs text-amber-400 mt-2">
                      ⚠ Selecciona un rol para continuar
                    </p>
                  )}
                  {isEditing && (
                    <p className="text-xs text-dark-400 bg-dark-800 p-3 rounded mt-2">
                      💡 Cambiar el rol actualizará el rol principal del usuario
                      en todas sus unidades de negocio.
                    </p>
                  )}
                </div>
              </div>

              <div className="card space-y-4">
                <h2 className="font-semibold text-dark-100 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary-400" />
                  Permisos Específicos
                </h2>

                {loadingAdditionalPermissions ? (
                  <p className="text-xs text-dark-400">
                    Cargando permisos adicionales del usuario...
                  </p>
                ) : !roleId ? (
                  <p className="text-xs text-amber-400">
                    ⚠ Selecciona un rol para ver los permisos disponibles.
                  </p>
                ) : allPermissions.length === 0 ? (
                  <p className="text-xs text-dark-400">
                    No hay permisos disponibles para configurar.
                  </p>
                ) : (
                  <PermissionsDragDrop
                    allPermissions={allPermissions}
                    rolePermissionIds={rolePermissionIds}
                    selectedAdditionalPermissionIds={
                      selectedAdditionalPermissionIds
                    }
                    onTogglePermission={toggleAdditionalPermission}
                    roleName={selectedRole?.name || "el rol seleccionado"}
                  />
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
