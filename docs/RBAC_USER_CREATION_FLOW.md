# Flujo de Creación de Usuarios y Sistema RBAC

## Resumen del Problema Resuelto

Al crear un usuario desde el formulario web, se enviaba `roleId: ""` (string vacío), causando un error de validación UUID. Esto ocurría porque algunos roles del sistema no tenían permisos asignados.

## Solución Implementada

### 1. Corrección en tenant.service.ts

Cambiamos `isSystem` a `true` cuando se crea un rol OWNER automáticamente al crear un tenant:

```typescript
let ownerRole = await tx.role.findFirst({
  where: { name: "OWNER", isSystem: true }, // ← Ahora busca por isSystem: true
});

if (!ownerRole) {
  ownerRole = await tx.role.create({
    data: {
      name: "OWNER",
      description: "Business owner with full access",
      isSystem: true, // ← Ahora se marca como sistema
    },
  });
}
```

### 2. Asignación de Permisos a Roles

Se creó el script `assign-role-permissions.ts` que asigna permisos estructurados a cada rol:

- **OWNER**: 44 permisos (todos los permisos del sistema)
- **ADMIN**: 24 permisos (acceso completo al tenant, excepto configuración de plataforma)
- **MANAGER**: 19 permisos (gestión operativa completa)
- **EMPLOYEE**: 10 permisos (operaciones básicas: crear, leer, actualizar)
- **VIEWER**: 4 permisos (solo lectura)

## Arquitectura del Sistema RBAC

### Estructura de Permisos

Los permisos siguen el formato `resource:action`:

```typescript
// Ejemplos
"assets:create";
"assets:read";
"assets:update";
"assets:delete";
"users:create";
"clients:read";
```

### Niveles de Acceso por Rol

#### 👁️ VIEWER (Solo Lectura)

```typescript
{
  dashboard: ["read"],
  assets: ["read"],
  supplies: ["read"],
  clients: ["read"],
  rentalContracts: ["read"],
  quotations: ["read"],
  reports: ["read"],
  suppliers: ["read"],
  purchaseOrders: ["read"]
}
```

#### 👤 EMPLOYEE (Operaciones Básicas)

```typescript
{
  dashboard: ["read"],
  assets: ["create", "read", "update"],
  supplies: ["create", "read", "update"],
  clients: ["create", "read", "update"],
  rentalContracts: ["create", "read", "update"],
  quotations: ["create", "read", "update"],
  suppliers: ["read"],
  purchaseOrders: ["read"],
  reports: ["read"]
}
```

#### 👔 MANAGER (Gestión Operativa)

```typescript
{
  // Acceso completo (CRUD) a:
  dashboard: ["create", "read", "update", "delete"],
  assets: ["create", "read", "update", "delete"],
  assetTemplates: ["create", "read", "update", "delete"],
  supplies: ["create", "read", "update", "delete"],
  supplyCategories: ["create", "read", "update", "delete"],
  clients: ["create", "read", "update", "delete"],
  accounts: ["create", "read", "update", "delete"],
  rentalContracts: ["create", "read", "update", "delete"],
  quotations: ["create", "read", "update", "delete"],
  suppliers: ["create", "read", "update", "delete"],
  purchaseOrders: ["create", "read", "update", "delete"],
  supplyQuotes: ["create", "read", "update", "delete"],
  reports: ["create", "read", "update", "delete"],
  // Solo lectura de usuarios
  users: ["read"]
}
```

#### 🔧 ADMIN (Acceso Completo al Tenant)

```typescript
{
  // Todo lo del MANAGER +
  users: ["create", "read", "update", "delete"],
  businessUnits: ["create", "read", "update", "delete"],
  roles: ["read"], // Puede ver roles pero no modificar roles del sistema
  settings: ["create", "read", "update", "delete"]
}
```

#### 👑 OWNER (Acceso Total)

- Todos los 44 permisos del sistema
- Acceso completo a todo

## Flujo de Creación de Usuarios

### 1. El usuario accede al formulario

```
GET /settings/staff/new
```

### 2. El formulario carga roles y business units

```typescript
// Frontend: StaffFormPage.tsx
const rolesResponse = await api.get("/roles");
const businessUnitsResponse = await api.get("/business-units");
```

### 3. Backend devuelve roles con isSystem=true

```typescript
// Backend: role.controller.ts
const roles = await prisma.role.findMany({
  where: { isSystem: true },
  include: {
    permissions: {
      include: { permission: true },
    },
  },
});
```

### 4. Usuario completa el formulario

```typescript
{
  email: "empleado@empresa.com",
  firstName: "Juan",
  lastName: "Pérez",
  businessUnitId: "bu-id-aqui",
  roleId: "role-employee" // ← Ahora se selecciona correctamente
}
```

### 5. Backend crea el usuario

```typescript
// POST /api/v1/users
const user = await prisma.user.create({
  data: {
    email: data.email,
    password: hashedPassword,
    firstName: data.firstName,
    lastName: data.lastName,
    tenantId,
    businessUnits: {
      create: {
        businessUnitId: data.businessUnitId,
        roleId: data.roleId, // ← Se asigna el rol en la BU
      },
    },
  },
});
```

### 6. Usuario recibe invitación por email

- Se genera una contraseña temporal
- Se envía email con instrucciones de primer login
- El usuario puede cambiar su contraseña en el primer acceso

## Uso del Hook usePermissions en Frontend

### Ejemplo básico

```typescript
import { usePermissions } from "@/core/hooks/usePermissions";

function AssetsList() {
  const { hasPermission, hasAnyPermission } = usePermissions();

  return (
    <div>
      {hasPermission("assets:read") && (
        <div>Lista de activos</div>
      )}

      {hasPermission("assets:create") && (
        <button>Crear Activo</button>
      )}

      {hasAnyPermission(["assets:update", "assets:delete"]) && (
        <button>Editar</button>
      )}
    </div>
  );
}
```

### Ejemplo con múltiples permisos

```typescript
function AdminPanel() {
  const { hasAllPermissions, role } = usePermissions();

  // Verificar que el usuario tenga varios permisos
  if (!hasAllPermissions(["users:create", "users:update", "users:delete"])) {
    return <div>No tienes acceso a este panel</div>;
  }

  // OWNER y SUPER_ADMIN automáticamente tienen todos los permisos
  return <div>Panel de administración...</div>;
}
```

## Scripts de Utilidad

### Verificar roles y permisos en la BD

```bash
cd backend
npx tsx check-roles.ts
```

### Asignar permisos a roles

```bash
cd backend
npx tsx assign-role-permissions.ts
```

### Simular respuesta del endpoint /roles

```bash
cd backend
npx tsx test-roles-endpoint.ts
```

## Validaciones de Seguridad

### 1. Validación de Tenant

El middleware `authenticate` verifica que:

- El usuario pertenezca al tenant en el header `X-Tenant-Id`
- El `businessUnitId` pertenezca al tenant del usuario
- Previene acceso cross-tenant

### 2. Validación de Business Unit

```typescript
// Backend valida que la BU pertenezca al tenant
const businessUnit = await prisma.businessUnit.findFirst({
  where: { id: data.businessUnitId, tenantId },
});

if (!businessUnit) {
  throw new AppError(404, "BUSINESS_UNIT_NOT_FOUND");
}
```

### 3. Validación de Rol

```typescript
// Backend valida que el rol exista
const role = await prisma.role.findUnique({
  where: { id: data.roleId },
});

if (!role) {
  throw new AppError(404, "ROLE_NOT_FOUND");
}
```

## Testing del Flujo

### 1. Iniciar el backend

```bash
cd backend
npm run dev
```

### 2. Iniciar el frontend

```bash
cd web
npm run dev
```

### 3. Hacer login como ADMIN o OWNER

```
Email: admin@construcciones-demo.com
Password: Admin123!
Tenant: construcciones-demo
```

### 4. Ir a Settings > Staff

```
http://localhost:5173/settings/staff
```

### 5. Click en "Agregar Miembro"

### 6. Completar formulario

- Email: nuevo-empleado@empresa.com
- Nombre: Test
- Apellido: Usuario
- Business Unit: Seleccionar una BU
- Rol: Seleccionar EMPLOYEE, MANAGER, etc.

### 7. Verificar la creación

- El usuario debería crearse exitosamente
- Aparecerá en la lista de staff
- El backend habrá enviado un email de invitación

## Próximos Pasos

1. **Agregar validación en frontend**: Asegurar que se seleccione un rol antes de enviar el formulario
2. **Mejorar mensajes de error**: Mostrar errores más descriptivos cuando falle la carga de roles
3. **Implementar roles personalizados**: Permitir que cada tenant cree sus propios roles
4. **Agregar UI para gestión de permisos**: Interfaz para asignar/revocar permisos a roles
5. **Implementar permisos granulares**: Por ejemplo, "assets:read:own" para ver solo los activos propios

---

## ✨ NUEVO: Permisos Adicionales por Usuario

### Concepto

Además de los permisos que un usuario tiene por su **rol**, ahora puedes asignarle **permisos adicionales específicos** que se **SUMAN** a los del rol.

**Caso de uso**: Un EMPLOYEE necesita permisos de ADMIN temporalmente

### Base de Datos

Nueva tabla `user_permissions`:

```sql
CREATE TABLE "user_permissions" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "createdBy" TEXT,

    UNIQUE(userId, businessUnitId, permissionId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (businessUnitId) REFERENCES business_units(id) ON DELETE CASCADE,
    FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE
);
```

### API Endpoints

#### Obtener permisos adicionales

```http
GET /api/v1/users/:id/permissions?businessUnitId=xxx
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": "perm-id",
      "resource": "settings",
      "action": "update",
      "scope": "BUSINESS_UNIT",
      "description": "Update system settings"
    }
  ]
}
```

#### Asignar permisos adicionales

```http
POST /api/v1/users/:id/permissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "businessUnitId": "bu-id",
  "permissionIds": ["perm-id-1", "perm-id-2"]
}

Response:
{
  "success": true,
  "message": "User permissions updated successfully"
}
```

#### Revocar permiso adicional

```http
DELETE /api/v1/users/:id/permissions/:permissionId?businessUnitId=xxx
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Permission revoked successfully"
}
```

### Servicio de Permisos (Backend)

```typescript
import { permissionService } from "@core/services/permission.service";

// Asignar permiso adicional a un usuario
await permissionService.grantUserPermission(
  userId,
  businessUnitId,
  permissionId,
  grantedByUserId,
);

// Obtener permisos totales (rol + adicionales)
const allPermissions = await permissionService.getUserPermissions(
  userId,
  businessUnitId,
);
// ['assets:read', 'assets:create', 'settings:update', ...]

// Obtener SOLO permisos adicionales
const additionalOnly = await permissionService.getUserAdditionalPermissions(
  userId,
  businessUnitId,
);
// [Permission{ resource: 'settings', action: 'update' }, ...]

// Reemplazar todos los permisos adicionales
await permissionService.syncUserPermissions(
  userId,
  businessUnitId,
  ["perm-id-1", "perm-id-2"],
  grantedByUserId,
);

// Revocar permiso adicional
await permissionService.revokeUserPermission(
  userId,
  businessUnitId,
  permissionId,
);
```

### Frontend (usePermissions)

El hook `usePermissions` **automáticamente** incluye los permisos adicionales:

```typescript
import { usePermissions } from "@/core/hooks/usePermissions";

function UserProfile({ userId }) {
  const { hasPermission } = usePermissions();

  // Este permiso podría venir del rol O ser adicional del usuario
  if (hasPermission("settings:update")) {
    return <Button>Modificar Settings</Button>;
  }
}
```

### Ejemplo Completo

```bash
# Ejecutar demo
cd backend
npx tsx demo-user-permissions.ts
```

Output del demo:

```
🎯 Demo: Permisos Adicionales de Usuario

Escenario: Un EMPLOYEE necesita permisos de ADMIN temporalmente

============================================================

📝 Paso 1: Creando usuario EMPLOYEE...
✅ Usuario creado: demo-employee@test.com
   Rol: EMPLOYEE

📋 Paso 2: Permisos del rol EMPLOYEE
   Total: 10 permisos
   ✓ assets:create
   ✓ assets:read
   ✓ clients:read
   ...

   Puede modificar settings: ❌

➕ Paso 3: Asignando permisos adicionales de ADMIN...
   + settings:update
✅ Permisos adicionales asignados

📊 Paso 4: Permisos totales (EMPLOYEE + adicionales)
   Total: 11 permisos

   Permisos del rol EMPLOYEE:
   ✓ assets:create
   ✓ assets:read
   ...

   Permisos adicionales (solo del usuario):
   🆕 settings:update

   Ahora puede modificar settings: ✅
```

### Casos de Uso

1. **Delegación temporal**: Un EMPLOYEE necesita aprobar quotations mientras el MANAGER está de vacaciones
2. **Especialistas**: Un técnico necesita acceso a informes financieros para un proyecto específico
3. **Ascensos en prueba**: Probar a un empleado con responsabilidades de MANAGER sin cambiar su rol
4. **Permisos de emergencia**: Otorgar acceso temporal sin modificar la estructura de roles

### Seguridad

- Los permisos adicionales se asignan **por Business Unit**
- Solo usuarios con permiso `users:update` pueden asignar/revocar permisos
- Los permisos se eliminan automáticamente si se elimina el usuario (CASCADE)
- No se pueden duplicar: constraint UNIQUE en (userId, businessUnitId, permissionId)
- Se registra quién otorgó el permiso (`createdBy`)

### Scripts de Utilidad

```bash
# Ver permisos de roles
cd backend
npx tsx check-roles.ts

# Asignar permisos a roles
npx tsx assign-role-permissions.ts

# Demo de permisos adicionales
npx tsx demo-user-permissions.ts
```

---

## Recursos

- Esquema Prisma: `backend/prisma/schema.prisma`
- Middleware de autenticación: `backend/src/core/middlewares/auth.middleware.ts`
- Servicio de permisos: `backend/src/core/services/permission.service.ts`
- Hook de permisos: `web/src/core/hooks/usePermissions.ts`
- Controlador de roles: `backend/src/core/controllers/role.controller.ts`
