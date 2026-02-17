# Plan de Implementación RBAC - Sistema de Permisos Granulares

## 🎯 Resumen Ejecutivo

El sistema RBAC (Role-Based Access Control) ya está **diseñado y modelado** en la base de datos, con servicios y middleware implementados. Solo falta **conectar los permisos a los endpoints** y crear la **UI de gestión de roles**.

---

## 📊 Estado Actual

### ✅ Implementado (90%)

1. **Modelo de datos completo**
   - `User.role` - Rol global del sistema (SUPER_ADMIN, DEVELOPER, USER)
   - `UserBusinessUnit.roleId` - Rol por BU (un usuario puede tener diferentes roles en cada BU)
   - `Role` - Roles configurables
   - `Permission` - Permisos granulares (resource:action)
   - `RolePermission` - Many-to-many
   - `PermissionScope` - TENANT / BUSINESS_UNIT / OWN

2. **PermissionService** - Completo y funcional
3. **Auth Middleware** - Middleware `authorize()` ya existe
4. **50+ permisos predefinidos** en seeds
5. **3 roles del sistema** (OWNER, ADMIN, MANAGER)

### ❌ Faltante (10%)

1. Middleware `authorize()` **NO usado en endpoints**
2. API REST de gestión de roles/permisos
3. Frontend para gestión de roles
4. Documentación de uso

---

## 🏗️ Arquitectura del Sistema RBAC

### Conceptos Clave

#### 1. **Rol Global del Sistema** (`User.role`)

```typescript
enum UserRole {
  SUPER_ADMIN  // Dueño de la plataforma, acceso cross-tenant
  DEVELOPER    // Read-only para debugging, sin modificar datos
  USER         // Usuario normal, permisos controlados por roles de BU
}
```

**Propósito:** Determinar privilegios a nivel de plataforma

- `SUPER_ADMIN`: Puede acceder a cualquier tenant/BU, configurar sistema
- `DEVELOPER`: Ver logs, métricas, debugging (solo lectura)
- `USER`: Usuario normal del tenant, permisos basados en roles de BU

#### 2. **Roles por Business Unit** (`UserBusinessUnit.roleId`)

```typescript
// Un usuario puede tener diferentes roles en diferentes BUs
{
  userId: "user-123",
  businessUnitId: "bu-alquiler",
  roleId: "role-admin"
}

{
  userId: "user-123",  // ← Mismo usuario
  businessUnitId: "bu-compras",
  roleId: "role-viewer"  // ← Rol diferente
}
```

**Propósito:** Permisos granulares por BU

- **Flexibilidad:** Juan puede ser ADMIN en "Alquiler" y VIEWER en "Ventas"
- **Aislamiento:** Los roles de una BU no afectan otras BUs

#### 3. **Permisos** (`Permission`)

```typescript
{
  resource: "assets",     // Módulo/recurso
  action: "create",       // Acción
  scope: "BUSINESS_UNIT", // Alcance
  description: "Crear activos"
}
```

**Formato:** `resource:action` → `"assets:create"`, `"quotations:approve"`

**Scopes:**

- `TENANT`: Acceso a nivel de todo el tenant
- `BUSINESS_UNIT`: Limitado a la BU actual (default, más común)
- `OWN`: Solo datos propios del usuario

#### 4. **Asignación Rol-Permisos** (`RolePermission`)

```typescript
// Rol "MANAGER" tiene estos permisos
Role: MANAGER
  ├─ assets:read
  ├─ assets:create
  ├─ quotations:read
  ├─ quotations:create
  └─ quotations:update
```

---

## 🔐 Flujo de Autorización

### Paso a Paso

```typescript
// 1. Usuario hace request
GET /api/v1/assets?businessUnitId=bu-123
Headers:
  Authorization: Bearer <jwt>
  x-business-unit-id: bu-123

// 2. Middleware authenticate() (auth.middleware.ts)
//    - Valida JWT
//    - Carga usuario de DB con sus roles/permisos
//    - Verifica que la BU pertenezca al tenant del usuario
//    - Construye req.context con permisos

req.context = {
  userId: "user-123",
  tenantId: "tenant-abc",
  businessUnitId: "bu-123",
  role: "MANAGER",
  permissions: ["assets:read", "assets:create", "quotations:read"]
}

// 3. Middleware authorize("assets:read")
//    - Verifica si "assets:read" está en req.context.permissions
//    - Si SÍ → next()
//    - Si NO → 403 Forbidden

// 4. Controller ejecuta la lógica
```

### Ejemplo de Uso en Endpoints

```typescript
// ANTES (solo autenticación, sin permisos)
router.get("/assets", authenticate, AssetController.list);

// DESPUÉS (con permisos granulares)
router.get(
  "/assets",
  authenticate,
  authorize("assets:read"), // ← Solo usuarios con permiso "assets:read"
  AssetController.list,
);

router.post(
  "/assets",
  authenticate,
  authorize("assets:create"), // ← Solo usuarios con permiso "assets:create"
  AssetController.create,
);

router.delete(
  "/assets/:id",
  authenticate,
  authorize("assets:delete"), // ← Solo usuarios con permiso "assets:delete"
  AssetController.delete,
);
```

---

## ✅ Plan de Implementación

### Fase 1: Backend - Proteger Endpoints (2-3 horas)

#### 1.1. Crear GET /api/v1/roles endpoint

```typescript
// backend/src/core/routes/role.routes.ts

import { Router } from "express";
import { authenticate } from "@core/middlewares/auth.middleware";
import { RoleController } from "@core/controllers/role.controller";

const router = Router();

// Listar roles disponibles en una BU
router.get("/roles", authenticate, RoleController.list);

// Obtener permisos de un rol
router.get(
  "/roles/:id/permissions",
  authenticate,
  RoleController.getPermissions,
);

// Crear rol personalizado (solo OWNER o ADMIN)
router.post(
  "/roles",
  authenticate,
  authorize("settings:update"),
  RoleController.create,
);

// Asignar/remover permisos a rol
router.post(
  "/roles/:id/permissions",
  authenticate,
  authorize("settings:update"),
  RoleController.assignPermissions,
);
router.delete(
  "/roles/:id/permissions/:permissionId",
  authenticate,
  authorize("settings:update"),
  RoleController.removePermission,
);

export default router;
```

#### 1.2. Crear RoleController

```typescript
// backend/src/core/controllers/role.controller.ts

import { Request, Response } from "express";
import { PermissionService } from "@core/services/permission.service";
import prisma from "@config/database";

export class RoleController {
  /**
   * GET /api/v1/roles
   * Listar roles disponibles (system roles + tenant custom roles)
   */
  static async list(req: Request, res: Response) {
    try {
      const { tenantId } = req.context!;

      const roles = await prisma.role.findMany({
        where: {
          OR: [
            { isSystem: true }, // Roles del sistema (OWNER, ADMIN, MANAGER)
            { tenantId: tenantId }, // Roles custom del tenant (si implementas multi-tenant roles)
          ],
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: [
          { isSystem: "desc" }, // System roles primero
          { name: "asc" },
        ],
      });

      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      console.error("Error listing roles:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to list roles",
        },
      });
    }
  }

  /**
   * GET /api/v1/roles/:id/permissions
   * Obtener permisos de un rol específico
   */
  static async getPermissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const permissionService = new PermissionService();

      const permissions = await permissionService.getRolePermissions(id);

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      console.error("Error getting role permissions:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get role permissions",
        },
      });
    }
  }
}
```

#### 1.3. Agregar `authorize()` a endpoints críticos

**Prioridad Alta:**

```typescript
// backend/src/core/routes/user.routes.ts
router.post("/users", authenticate, authorize("users:create"), ...);
router.put("/users/:id", authenticate, authorize("users:update"), ...);
router.delete("/users/:id", authenticate, authorize("users:delete"), ...);

// backend/src/modules/rental/rental.routes.ts
router.post("/quotations", authenticate, authorize("quotations:create"), ...);
router.put("/quotations/:id/approve", authenticate, authorize("quotations:approve"), ...);
router.post("/contracts", authenticate, authorize("contracts:create"), ...);

// backend/src/core/routes/branding.routes.ts
router.put("/branding", authenticate, authorize("settings:update"), ...);
```

**Prioridad Media:**

```typescript
// Assets, Clients, Purchases, etc.
router.post("/assets", authenticate, authorize("assets:create"), ...);
router.get("/clients", authenticate, authorize("clients:read"), ...);
```

#### 1.4. Actualizar user.routes.ts para incluir rol en asignación a BU

```typescript
// POST /users/:id/business-units
// Ya recibe roleId en el body, perfecto ✅

// Validar que el roleId existe
const role = await prisma.role.findUnique({ where: { id: roleId } });
if (!role) {
  return res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Role not found" },
  });
}
```

---

### Fase 2: Frontend - UI de Gestión de Staff con Roles (4-5 horas)

#### 2.1. API Services

```typescript
// web/src/core/api/roles.api.ts

import { apiClient } from "./client";

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: RolePermission[];
}

export interface RolePermission {
  id: string;
  permission: Permission;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string | null;
  scope: "TENANT" | "BUSINESS_UNIT" | "OWN";
}

export const rolesApi = {
  /**
   * GET /api/v1/roles
   * Lista todos los roles disponibles (system + custom)
   */
  async getRoles(): Promise<Role[]> {
    const response = await apiClient.get("/roles");
    return response.data.data;
  },

  /**
   * GET /api/v1/roles/:id/permissions
   * Obtiene permisos de un rol
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const response = await apiClient.get(`/roles/${roleId}/permissions`);
    return response.data.data;
  },
};
```

```typescript
// web/src/core/api/users.api.ts

import { apiClient } from "./client";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  role: "SUPER_ADMIN" | "DEVELOPER" | "USER";
  businessUnits: UserBusinessUnit[];
}

export interface UserBusinessUnit {
  id: string;
  businessUnitId: string;
  roleId: string;
  businessUnit: {
    id: string;
    name: string;
  };
  role: {
    id: string;
    name: string;
    description: string | null;
  };
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessUnitId: string;
  roleId: string; // Rol inicial en la primera BU
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export interface AssignBusinessUnitDto {
  businessUnitId: string;
  roleId: string;
}

export const usersApi = {
  /**
   * GET /api/v1/users?businessUnitId=xxx&status=ACTIVE
   */
  async getUsers(
    filters: {
      businessUnitId?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const response = await apiClient.get("/users", { params: filters });
    return response.data;
  },

  /**
   * GET /api/v1/users/:id
   */
  async getUser(id: string): Promise<User> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.data;
  },

  /**
   * POST /api/v1/users
   */
  async createUser(data: CreateUserDto): Promise<User> {
    const response = await apiClient.post("/users", data);
    return response.data.data;
  },

  /**
   * PUT /api/v1/users/:id
   */
  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data.data;
  },

  /**
   * DELETE /api/v1/users/:id
   */
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },

  /**
   * POST /api/v1/users/:id/business-units
   */
  async assignToBusinessUnit(
    id: string,
    data: AssignBusinessUnitDto,
  ): Promise<void> {
    await apiClient.post(`/users/${id}/business-units`, data);
  },

  /**
   * DELETE /api/v1/users/:id/business-units/:businessUnitId
   */
  async removeFromBusinessUnit(
    id: string,
    businessUnitId: string,
  ): Promise<void> {
    await apiClient.delete(`/users/${id}/business-units/${businessUnitId}`);
  },

  /**
   * POST /api/v1/users/:id/deactivate
   */
  async deactivateUser(id: string): Promise<void> {
    await apiClient.post(`/users/${id}/deactivate`);
  },
};
```

#### 2.2. StaffPage.tsx

```typescript
// web/src/core/pages/settings/StaffPage.tsx

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, User } from "@core/api/users.api";
import { rolesApi } from "@core/api/roles.api";
import { useBusinessUnit } from "@core/hooks/useBusinessUnit";
import {
  Plus,
  Search,
  MoreVertical,
  UserPlus,
  Edit,
  Trash2,
  UserX,
  Shield
} from "lucide-react";

export default function StaffPage() {
  const queryClient = useQueryClient();
  const { currentBusinessUnit } = useBusinessUnit();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", currentBusinessUnit?.id, statusFilter, search],
    queryFn: () => usersApi.getUsers({
      businessUnitId: currentBusinessUnit?.id,
      status: statusFilter === "all" ? undefined : statusFilter,
      search
    }),
    enabled: !!currentBusinessUnit
  });

  // Fetch roles for dropdowns
  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.getRoles()
  });

  const users = usersData?.data || [];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Gestión de Staff
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Administra usuarios, roles y permisos por unidad de negocios
            </p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Crear Usuario
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
            <option value="SUSPENDED">Suspendidos</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Roles en BUs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user: User) => (
                <UserRow key={user.id} user={user} roles={roles} />
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No se encontraron usuarios
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateUserDialog
          onClose={() => setShowCreateDialog(false)}
          roles={roles}
        />
      )}
    </div>
  );
}

function UserRow({ user, roles }: { user: User; roles: any[] }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.firstName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
              {user.firstName[0]}{user.lastName[0]}
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-gray-500">
              {user.role === "SUPER_ADMIN" && "Super Admin"}
              {user.role === "DEVELOPER" && "Developer"}
              {user.role === "USER" && "Usuario"}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {user.email}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {user.businessUnits?.map((bu) => (
            <span
              key={bu.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
            >
              <Shield size={12} />
              {bu.businessUnit.name} - {bu.role.name}
            </span>
          ))}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`
          inline-flex px-2 py-1 text-xs rounded-full
          ${user.status === "ACTIVE" ? "bg-green-100 text-green-700" : ""}
          ${user.status === "INACTIVE" ? "bg-gray-100 text-gray-700" : ""}
          ${user.status === "SUSPENDED" ? "bg-red-100 text-red-700" : ""}
        `}>
          {user.status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical size={20} />
        </button>
      </td>
    </tr>
  );
}

function CreateUserDialog({ onClose, roles }: any) {
  // Implementation here
  return null;
}
```

---

### Fase 3: Seeds y Migración (30 min)

#### 3.1. Ejecutar seed de permisos

```bash
cd backend
npx ts-node prisma/seeds/permissions.seed.ts
```

#### 3.2. Verificar roles creados

```sql
SELECT * FROM roles;
-- Debe mostrar: OWNER, ADMIN, MANAGER

SELECT r.name, p.resource, p.action
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'OWNER';
-- Debe mostrar todos los permisos
```

---

## 🔍 Casos de Uso Reales

### Caso 1: Juan es Admin en Alquiler, Viewer en Compras

```typescript
// UserBusinessUnit records:
{
  userId: "juan-123",
  businessUnitId: "bu-alquiler",
  roleId: "role-admin"  // ADMIN role
}

{
  userId: "juan-123",
  businessUnitId: "bu-compras",
  roleId: "role-viewer"  // VIEWER role
}

// En BU Alquiler:
req.context.permissions = [
  "assets:read", "assets:create", "assets:update",
  "quotations:read", "quotations:create", "quotations:approve"
]

// En BU Compras:
req.context.permissions = [
  "purchases:read"  // Solo lectura
]
```

**Resultado:** Juan puede crear cotizaciones en Alquiler, pero solo ver órdenes de compra en Compras.

### Caso 2: María es OWNER en todo

```typescript
{
  userId: "maria-456",
  businessUnitId: "bu-alquiler",
  roleId: "role-owner"  // OWNER role
}

// Permission Service detecta rol OWNER
// Genera TODOS los permisos automáticamente
req.context.permissions = [
  "assets:create", "assets:read", "assets:update", "assets:delete",
  "quotations:create", "quotations:read", "quotations:update", "quotations:delete", "quotations:approve",
  "contracts:create", "contracts:read", "contracts:update", "contracts:delete", "contracts:sign",
  "settings:read", "settings:update",
  "users:create", "users:read", "users:update", "users:delete"
]
```

**Resultado:** María tiene acceso completo a todo sin restricciones.

---

## 📝 Checklist de Implementación

### Backend

- [ ] Crear `role.routes.ts` con endpoints GET /roles
- [ ] Crear `RoleController` con métodos list, getPermissions
- [ ] Agregar `authorize()` a todos los endpoints críticos:
  - [ ] user.routes.ts (users:create, users:update, users:delete)
  - [ ] rental.routes.ts (quotations:_, contracts:_)
  - [ ] branding.routes.ts (settings:update)
  - [ ] assets.routes.ts (assets:\*)
  - [ ] clients.routes.ts (clients:\*)
  - [ ] purchases.routes.ts (purchases:\*)
- [ ] Ejecutar seed de permisos: `npx ts-node prisma/seeds/permissions.seed.ts`
- [ ] Testing manual de permisos con Postman/Thunder Client

### Frontend

- [ ] Crear `roles.api.ts` con getRoles, getRolePermissions
- [ ] Crear `users.api.ts` completo (getUsers, createUser, updateUser, deleteUser, assignToBusinessUnit, removeFromBusinessUnit, deactivateUser)
- [ ] Crear `StaffPage.tsx` con tabla de usuarios
- [ ] Crear `UserFormDialog.tsx` para crear/editar usuarios
- [ ] Crear `AssignBusinessUnitDialog.tsx` para asignar usuarios a BUs con roles
- [ ] Agregar ruta `/settings/staff` a AppRouter
- [ ] Agregar link en menú de configuración
- [ ] Testing UI completo

### Documentación

- [ ] Guía de uso del sistema de permisos
- [ ] Ejemplos de configuración de roles personalizados
- [ ] Troubleshooting común

---

## 🚀 Próximos Pasos

1. **¿Quieres que implemente las Fases 1 y 2 ahora?**
   - Backend: RoleController + protección de endpoints
   - Frontend: StaffPage con gestión de usuarios y roles

2. **¿Necesitas roles custom por tenant?**
   - Actualmente solo hay roles del sistema (OWNER, ADMIN, MANAGER)
   - Puedo agregar la capacidad de crear roles personalizados por tenant

3. **¿Quieres un sistema de permisos más granular?**
   - Ejemplo: `assets:read:own` (solo ver sus propios assets)
   - Requiere lógica adicional en controllers

---

## 💡 Recomendación

**Implementar en este orden:**

1. ✅ **Fase 1 (Backend)** - 2-3 horas - Proteger endpoints críticos
2. ✅ **Fase 3 (Seeds)** - 30 min - Ejecutar seeds de permisos
3. ✅ **Fase 2 (Frontend)** - 4-5 horas - UI de gestión de staff
4. 🔮 **Futuro:** Roles custom por tenant, permisos OWN scope, audit logs

**Total estimado:** 7-9 horas de desarrollo enfocado

¿Quieres que comencemos con la implementación? ¿Alguna duda sobre la arquitectura?
