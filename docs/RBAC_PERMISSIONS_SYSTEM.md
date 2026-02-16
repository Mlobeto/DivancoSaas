# Sistema de Permisos RBAC (Role-Based Access Control)

## 📋 Resumen

Implementación completa de un sistema de permisos robusto basado en roles para DivancoSaaS. Este sistema permite control granular de acceso a recursos y acciones en el sistema.

## 🏗️ Arquitectura

### Componentes

```
Backend:
├── prisma/schema.prisma           # Modelos: Role, Permission, RolePermission
├── src/core/services/
│   ├── permission.service.ts      # Servicio de permisos RBAC
│   └── auth.service.ts            # Incluye permisos en respuestas de auth
└── prisma/seeds/
    └── permissions.seed.ts        # Seed de permisos iniciales

Frontend:
├── src/store/auth.store.ts        # Store incluye permissions[]
├── src/core/types/api.types.ts    # Tipos con permissions
├── src/main.tsx                   # Usa permissions del backend
└── src/app/navigation/            # Usa permissions para filtrado
    └── DynamicNavigation.tsx
```

### Modelo de Datos

```prisma
model Role {
  id          String   @id @default(uuid())
  name        String
  description String?
  isSystem    Boolean  @default(false)
  permissions RolePermission[]
}

model Permission {
  id          String          @id @default(uuid())
  resource    String          # "assets", "clients", "purchases", etc.
  action      String          # "read", "create", "update", "delete"
  scope       PermissionScope @default(BUSINESS_UNIT)
  description String?

  @@unique([resource, action])
}

enum PermissionScope {
  TENANT        # Acceso a nivel tenant
  BUSINESS_UNIT # Acceso a nivel business unit (default)
  OWN           # Solo datos propios
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(...)
  permission   Permission @relation(...)

  @@unique([roleId, permissionId])
}
```

## 🔑 Permisos Definidos

### Módulos Core

#### Inventory (Activos)

- `assets:read` - Ver activos
- `assets:create` - Crear activos
- `assets:update` - Actualizar activos
- `assets:delete` - Eliminar activos

#### Clients

- `clients:read` - Ver clientes
- `clients:create` - Crear clientes
- `clients:update` - Actualizar clientes
- `clients:delete` - Eliminar clientes

#### Purchases

- `purchases:read` - Ver órdenes de compra
- `purchases:create` - Crear órdenes
- `purchases:update` - Actualizar órdenes
- `purchases:delete` - Eliminar órdenes

#### Rental (Alquileres)

- `rental:read` - Ver datos de alquiler
- `rental:create` - Crear registros
- `rental:update` - Actualizar registros
- `rental:delete` - Eliminar registros

### Sub-módulos

#### Quotations (Cotizaciones)

- `quotations:read` - Ver cotizaciones
- `quotations:create` - Crear cotizaciones
- `quotations:update` - Actualizar cotizaciones
- `quotations:delete` - Eliminar cotizaciones
- `quotations:approve` - Aprobar cotizaciones

#### Contracts (Contratos)

- `contracts:read` - Ver contratos
- `contracts:create` - Crear contratos
- `contracts:update` - Actualizar contratos
- `contracts:delete` - Eliminar contratos
- `contracts:sign` - Firmar contratos

### Sistema

#### Templates

- `templates:read` - Ver plantillas
- `templates:create` - Crear plantillas
- `templates:update` - Actualizar plantillas
- `templates:delete` - Eliminar plantillas

#### Reports

- `reports:read` - Ver reportes
- `reports:export` - Exportar reportes

#### Settings

- `settings:read` - Ver configuración
- `settings:update` - Actualizar configuración

#### Users

- `users:read` - Ver usuarios
- `users:create` - Crear usuarios
- `users:update` - Actualizar usuarios
- `users:delete` - Eliminar usuarios

## 👥 Roles Predefinidos

### OWNER

**Acceso completo** - Propietario del negocio

- ✅ Todos los permisos (read, create, update, delete)
- ✅ Puede gestionar usuarios
- ✅ Puede cambiar configuración
- ✅ Acceso a todos los módulos habilitados

### ADMIN

**Administrador** - Lectura/escritura en la mayoría de módulos

- ✅ read, create, update (sin delete)
- ✅ Gestión de usuarios limitada
- ❌ No puede eliminar registros críticos

### MANAGER

**Gerente** - Lectura y creación limitada

- ✅ read, create
- ❌ No puede actualizar
- ❌ No puede eliminar

## 🚀 Instalación y Configuración

### 1. Ejecutar Seed de Permisos

```bash
cd backend
npx tsx prisma/seeds/permissions.seed.ts
```

Esto creará:

- ✅ 40+ permisos para todos los módulos
- ✅ 3 roles predefinidos (OWNER, ADMIN, MANAGER)
- ✅ Asignaciones de permisos a roles

### 2. Verificar Permisos Creados

```sql
-- Consultar todos los permisos
SELECT resource, action, description
FROM permissions
ORDER BY resource, action;

-- Ver permisos de un rol
SELECT p.resource, p.action
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN roles r ON r.id = rp.role_id
WHERE r.name = 'OWNER';
```

## 📝 Uso en el Backend

### PermissionService

```typescript
import { permissionService } from "@/core/services/permission.service";

// Obtener permisos de un usuario en un BU
const permissions = await permissionService.getUserPermissions(
  userId,
  businessUnitId,
);
// Returns: ["assets:read", "clients:read", "purchases:create", ...]

// Verificar si tiene un permiso específico
const canCreate = await permissionService.hasPermission(
  userId,
  businessUnitId,
  "assets",
  "create",
);

// Asignar permiso a un rol
await permissionService.assignPermissionToRole(roleId, permissionId);
```

### AuthService

Los permisos se incluyen automáticamente en las respuestas:

```typescript
// POST /auth/login
{
  "token": "jwt-token",
  "user": {...},
  "tenant": {...},
  "businessUnits": [
    {
      "id": "bu-id",
      "name": "Principal",
      "role": "OWNER",
      "permissions": ["assets:read", "clients:read", ...] // ✅ Permisos del BU
    }
  ],
  "permissions": ["assets:read", "clients:read", ...] // ✅ Permisos del primer BU
}

// GET /auth/me
{
  "user": {...},
  "tenant": {...},
  "businessUnits": [...],
  "permissions": ["assets:read", ...] // ✅ Permisos del usuario
}
```

## 🎨 Uso en el Frontend

### Auth Store

```typescript
import { useAuthStore } from "@/store/auth.store";

const { permissions } = useAuthStore();
// permissions: ["assets:read", "clients:read", ...]
```

### Crear Módulo Context

```typescript
import { createModuleContext } from "@/product";

const context = createModuleContext(
  tenantId,
  businessUnitId,
  permissions, // ✅ Del backend
  config,
);
```

### Navegación Dinámica

La navegación se filtra automáticamente según permisos:

```typescript
// Los módulos solo se muestran si el usuario tiene el permiso requerido
export const inventoryModule: ModuleDefinition = {
  id: "inventory",
  permissions: ["assets:read"], // ✅ Required permission
  navigation: [...],
};
```

### Verificar Permisos en Componentes

```typescript
import { useAuthStore } from '@/store/auth.store';

function MyComponent() {
  const { permissions } = useAuthStore();

  const canCreateAssets = permissions.includes('assets:create');
  const canDeleteAssets = permissions.includes('assets:delete');

  return (
    <div>
      {canCreateAssets && <button>Crear Activo</button>}
      {canDeleteAssets && <button>Eliminar</button>}
    </div>
  );
}
```

## 🔒 Guards de Rutas

```typescript
// Vertical routes con guard de permisos
export const rentalRoutes: VerticalRouteConfig = {
  verticalId: "rental",
  verticalGuard: (context) => {
    // Solo permite acceso si tiene el permiso
    return context.permissions.includes("rental:read");
  },
  routes: [...],
};
```

## 🎯 Best Practices

### 1. Nombrar Permisos

Usar formato: `{resource}:{action}`

```
✅ assets:read
✅ clients:create
✅ quotations:approve

❌ read_assets
❌ CreateClient
❌ APPROVE-QUOTATION
```

### 2. Granularidad Apropiada

```typescript
// ✅ BUENO: Permisos granulares
permissions: ["assets:read"];
permissions: ["assets:create"];
permissions: ["assets:update"];

// ❌ MALO: Permisos muy amplios
permissions: ["assets:*"];
permissions: ["admin"];
```

### 3. Scope Adecuado

```typescript
// PermissionScope para contexto adecuado
TENANT; // Acceso cross-BU dentro del tenant
BUSINESS_UNIT; // Limitado al BU actual (default)
OWN; // Solo registros propios del usuario
```

### 4. Verificar en Backend

```typescript
// ✅ SIEMPRE verificar permisos en el backend
router.post("/assets", async (req, res) => {
  const hasPermission = await permissionService.hasPermission(
    req.userId,
    req.businessUnitId,
    "assets",
    "create",
  );

  if (!hasPermission) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Crear activo...
});

// ❌ NUNCA confiar solo en frontend
```

## 🔄 Flujo de Permisos

```
1. Usuario hace login
   ↓
2. Backend obtiene rol del usuario en BU
   ↓
3. Backend consulta permisos del rol
   ↓
4. Backend incluye permisos en respuesta de auth
   ↓
5. Frontend guarda permisos en auth store
   ↓
6. Componentes usan permisos del store
   ↓
7. Router filtra rutas según permisos
   ↓
8. Navegación filtra items según permisos
```

## 📊 Gestión de Permisos

### Crear Nuevo Permiso

```typescript
await permissionService.upsertPermission(
  "reports",
  "export",
  "Export reports to PDF/Excel",
  "BUSINESS_UNIT",
);
```

### Asignar Permisos a un Rol

```typescript
const roleId = "role-uuid";
const permissionIds = ["perm-1-uuid", "perm-2-uuid"];

await permissionService.assignPermissionsToRole(roleId, permissionIds);
```

### Crear Rol Personalizado

```typescript
// 1. Crear el rol
const customRole = await prisma.role.create({
  data: {
    name: "OPERATOR",
    description: "Operador con permisos limitados",
    isSystem: false,
  },
});

// 2. Asignar permisos
const permissions = await prisma.permission.findMany({
  where: {
    OR: [
      { resource: "assets", action: "read" },
      { resource: "assets", action: "update" },
    ],
  },
});

await permissionService.assignPermissionsToRole(
  customRole.id,
  permissions.map((p) => p.id),
);
```

## 🐛 Troubleshooting

### Permisos no se muestran en frontend

1. Verificar que el seed se ejecutó correctamente
2. Verificar que el usuario tiene un rol asignado en el BU
3. Verificar que auth store recibe permissions en login
4. Revisar console.log de permisos en DynamicNavigation

```typescript
console.log("[Auth] Permissions from backend:", data.permissions);
console.log("[Store] Saved permissions:", useAuthStore.getState().permissions);
```

### Usuario no puede acceder a módulo

1. Verificar que el módulo requiere el permiso correcto:

```typescript
// En module.ts
permissions: ["assets:read"], // Debe coincidir con permiso en BD
```

2. Verificar que el rol tiene el permiso asignado:

```sql
SELECT * FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.name = 'OWNER' AND p.resource = 'assets';
```

### Rutas no se construyen (404)

1. Verificar verticalGuard:

```typescript
verticalGuard: (context) => {
  return context.permissions.includes("rental:read"); // Verificar nombre exacto
},
```

2. Verificar logs del router:

```
[RouteBuilder] Vertical guard failed: rental  // ❌ Falla permiso
[AppRouter V2] Built 0 dynamic routes          // ❌ No se construyen rutas
```

## 📚 Recursos Adicionales

- [Prisma RBAC Guide](https://www.prisma.io/docs/guides/database/authentication)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [Pattern: Role-Based Access Control](https://patterns.arcitura.com/security-patterns/role-based-access-control)

## ✅ Checklist de Implementación

- [x] Modelos de Prisma (Role, Permission, RolePermission)
- [x] Servicio de permisos (permission.service.ts)
- [x] Seed de permisos iniciales
- [x] Auth service incluye permisos en respuestas
- [x] Auth store guarda permisos
- [x] Frontend usa permisos del backend
- [x] Navegación filtra por permisos
- [x] Router filtra rutas por permisos
- [ ] Middleware de autorización en rutas del backend
- [ ] UI para gestión de roles y permisos (Admin panel)
- [ ] Tests unitarios para permission service
- [ ] Tests de integración para flujo de autenticación

## 🎉 Resultado

Con este sistema implementado:

✅ **Seguridad**: Los permisos se gestionan en el backend
✅ **Flexibilidad**: Fácil agregar nuevos roles y permisos
✅ **Escalabilidad**: Soporte para múltiples BUs y roles personalizados
✅ **Mantenibilidad**: Lógica centralizada sin código hardcodeado
✅ **Auditoría**: Permisos rastreables por rol y usuario

## 📞 Soporte

Para preguntas o issues relacionados con el sistema de permisos, crear un issue en el repositorio o contactar al equipo de desarrollo.

---

**Última actualización**: 2026-02-15
**Versión**: 1.0.0
