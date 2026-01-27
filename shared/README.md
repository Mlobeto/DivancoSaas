# DivancoSaaS Shared

Tipos y contratos compartidos entre backend, web y mobile.

## Instalación

```bash
npm install
npm run build
```

## Uso

### En el backend:

```typescript
import { User, AuthResponse, ApiResponse } from "@divancosaas/shared";
```

### En web:

```typescript
import type { User, LoginRequest } from "@divancosaas/shared";
```

### En mobile:

```typescript
import type { User, SyncQueueItem } from "@divancosaas/shared";
```

## Estructura

- `index.ts` - Todos los tipos compartidos

## Principios

1. **Solo tipos**: Este paquete NO contiene lógica, solo definiciones de tipos
2. **Sincronización**: Los tipos deben estar sincronizados con el schema de Prisma
3. **Versionado**: Cualquier cambio debe incrementar la versión

## Tipos Importantes

- `User`, `Tenant`, `BusinessUnit` - Entidades core
- `AuthResponse`, `LoginRequest` - Autenticación
- `ApiResponse`, `PaginatedResponse` - Respuestas de API
- `Workflow`, `WorkflowState` - Workflows configurables
- `SyncQueueItem`, `SyncStatus` - Sincronización offline (mobile)
