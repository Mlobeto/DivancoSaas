# Multi-Tenant Request Context - Migration Guide

**Date:** February 14, 2026  
**Status:** Implementation Guide  
**Priority:** CRITICAL

---

## Overview

Se ha implementado un sistema de **Request Context** usando `AsyncLocalStorage` de Node.js para automatizar la inyección de `tenantId` y `businessUnitId` en toda la aplicación.

## ¿Por qué es necesario?

**ANTES** (Problemático):

- ❌ Pasar `tenantId` manualmente por todos los servicios
- ❌ Fácil olvidar el filtro de tenant → data leak
- ❌ APIs verbosas y propensas a errores
- ❌ Código repetitivo en cada función

**AHORA** (Solucionado):

- ✅ `tenantId` se inyecta automáticamente desde el request
- ✅ Prisma filtra TODAS las queries automáticamente
- ✅ Imposible acceder a datos de otro tenant
- ✅ Servicios más limpios y seguros

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│ 1. HTTP Request                                             │
│    GET /api/v1/assets                                       │
│    Authorization: Bearer <jwt>                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. authenticate middleware                                  │
│    - Valida JWT                                             │
│    - Crea req.context = { userId, tenantId, businessUnitId }│
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. contextInjector middleware                               │
│    - Inyecta req.context en AsyncLocalStorage               │
│    - Disponible en TODA la cadena de ejecución              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Controller → Service                                     │
│    - NO necesita pasar tenantId manualmente                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Prisma Extension                                         │
│    - Intercepta TODAS las queries                           │
│    - Inyecta WHERE tenantId = <context.tenantId>            │
│    - Inyecta data.tenantId en CREATE operations             │
└─────────────────────────────────────────────────────────────┘
```

---

## Archivos Creados/Modificados

### Nuevos Archivos

| Archivo                                              | Descripción                                  |
| ---------------------------------------------------- | -------------------------------------------- |
| `shared/src/context/request-context.ts`              | Core: AsyncLocalStorage + helpers            |
| `backend/src/core/middlewares/context.middleware.ts` | Express middleware para inyectar context     |
| `backend/src/config/prisma-extensions.ts`            | Prisma Client Extensions para auto-filtering |

### Archivos Modificados

| Archivo                          | Cambios                                                   |
| -------------------------------- | --------------------------------------------------------- |
| `shared/src/index.ts`            | Export request-context                                    |
| `backend/src/config/database.ts` | Apply Prisma extensions                                   |
| `backend/src/app.ts`             | Register contextInjector middleware                       |
| `backend/prisma/schema.prisma`   | Add tenantId to StockLevel, StockMovement, BulkRentalItem |

---

## Cambios en Schema (Prisma)

### Modelos Actualizados

**StockLevel:**

```prisma
model StockLevel {
  id             String @id @default(uuid())
  tenantId       String  // ← NUEVO
  businessUnitId String
  templateId     String
  // ...

  // Relations
  tenant          Tenant           @relation(...) // ← NUEVO
  businessUnit    BusinessUnit     @relation(...)
  template        AssetTemplate    @relation(...)

  @@unique([tenantId, businessUnitId, templateId, location]) // ← ACTUALIZADO
  @@index([tenantId]) // ← NUEVO
}
```

**StockMovement:**

```prisma
model StockMovement {
  id           String @id @default(uuid())
  tenantId     String  // ← NUEVO
  stockLevelId String
  // ...

  // Relations
  tenant     Tenant     @relation(...) // ← NUEVO
  stockLevel StockLevel @relation(...)

  @@index([tenantId]) // ← NUEVO
}
```

**BulkRentalItem:**

```prisma
model BulkRentalItem {
  id         String @id @default(uuid())
  tenantId   String  // ← NUEVO
  contractId String
  templateId String
  // ...

  // Relations
  tenant     Tenant         @relation(...) // ← NUEVO
  contract   RentalContract @relation(...)

  @@index([tenantId]) // ← NUEVO
}
```

**Tenant (relaciones agregadas):**

```prisma
model Tenant {
  // ... campos existentes ...

  // Relations agregadas:
  stockLevels       StockLevel[]      // ← NUEVO
  stockMovements    StockMovement[]   // ← NUEVO
  bulkRentalItems   BulkRentalItem[]  // ← NUEVO
}
```

---

## Migración de Servicios

### Patrón ANTES (Manual)

```typescript
// ❌ OLD: Manual, error-prone
export class StockLevelService {
  async addStock(
    data: AddStockInput,
    tenantId: string, // Manual
    businessUnitId: string, // Manual
  ) {
    // Validar que businessUnit pertenece a tenant
    const bu = await prisma.businessUnit.findFirst({
      where: {
        id: businessUnitId,
        tenantId: tenantId, // Fácil de olvidar
      },
    });

    // Crear stock level
    return await prisma.stockLevel.create({
      data: {
        ...data,
        tenantId, // Fácil de olvidar
        businessUnitId,
      },
    });
  }
}
```

### Patrón AHORA (Automático)

```typescript
// ✅ NEW: Clean, automatic
import { getTenantId, getBusinessUnitId, getUserId } from "@divancosaas/shared";

export class StockLevelService {
  async addStock(data: AddStockInput) {
    // tenantId y businessUnitId se inyectan automáticamente por Prisma extension
    // NO necesitas pasarlos ni agregarlos al data object

    return await prisma.stockLevel.create({
      data: data, // ← tenantId se inyecta automáticamente
    });

    // Si necesitas el tenantId para lógica de negocio:
    const tenantId = getTenantId();
    const userId = getUserId();
  }
}
```

---

## Funciones Helper Disponibles

```typescript
import {
  // Obtener contexto completo
  getRequestContext, // → { tenantId, businessUnitId, userId, userRoles }

  // Obtener valores individuales
  getTenantId, // → string (throws si no hay context)
  getBusinessUnitId, // → string | undefined
  requireBusinessUnitId, // → string (throws si no hay businessUnitId)
  getUserId, // → string (throws si no hay context)

  // Verificar disponibilidad
  hasRequestContext, // → boolean

  // Para tests y background jobs
  runWithContext, // → Run function with manual context
} from "@divancosaas/shared";
```

### Ejemplo de Uso

```typescript
import {
  getTenantId,
  requireBusinessUnitId,
  getUserId,
} from "@divancosaas/shared";

export class StockCommandService {
  async addStock(input: AddStockInput) {
    // Prisma automáticamente filtra por tenant
    const stockLevel = await prisma.stockLevel.findFirst({
      where: {
        templateId: input.templateId,
        // ← NO necesitas agregar: tenantId: getTenantId()
      },
    });

    // Si necesitas el ID para lógica o audit:
    const userId = getUserId();

    await prisma.stockMovement.create({
      data: {
        stockLevelId: stockLevel.id,
        quantity: input.quantity,
        createdBy: userId, // ← Explicitly set for audit
        // ← tenantId se inyecta automáticamente
      },
    });
  }

  async rentOutStock(input: RentOutInput) {
    // Requiere businessUnitId (throws si no está disponible)
    const businessUnitId = requireBusinessUnitId();

    // Lógica que requiere BU explícito
    const stockLevel = await prisma.stockLevel.findFirst({
      where: {
        templateId: input.templateId,
        businessUnitId, // ← Explicit para esta lógica
      },
    });
  }
}
```

---

## Background Jobs y Seeds

**Problema:** Background jobs y seeds NO están en un request HTTP, por lo que NO tienen context automático.

**Solución 1: Usar `prismaBase` sin extensiones**

```typescript
// backend/src/jobs/stock-reorder.job.ts
import { prismaBase } from "@config/database";

export async function reorderStockJob() {
  // prismaBase NO aplica auto-filtering
  const lowStockLevels = await prismaBase.stockLevel.findMany({
    where: {
      tenantId: "specific-tenant-id", // ← Explicit
      quantityAvailable: { lte: 10 },
    },
  });

  for (const level of lowStockLevels) {
    // Process...
  }
}
```

**Solución 2: Usar `runWithContext()`**

```typescript
// backend/prisma/seed.ts
import { runWithContext } from "@divancosaas/shared";
import prisma from "@config/database"; // Extended client

const demoTenant = await prismaBase.tenant.findFirst({
  where: { slug: "demo" },
});

// Ejecutar seed con contexto manual
await runWithContext(
  {
    tenantId: demoTenant.id,
    businessUnitId: rentalBU.id,
    userId: "seed-system",
  },
  async () => {
    // Ahora prisma (extended) aplica auto-filtering
    await prisma.stockLevel.create({
      data: {
        templateId: "...",
        quantity: 100,
        // ← tenantId se inyecta automáticamente
      },
    });
  },
);
```

---

## Testing

```typescript
import { runWithContext } from "@divancosaas/shared";
import { stockCommandService } from "./stock-command.service";

describe("StockCommandService", () => {
  let testTenant: Tenant;
  let testBU: BusinessUnit;
  let testUser: User;

  beforeEach(async () => {
    // Setup test data
    testTenant = await prismaBase.tenant.create({...});
    testBU = await prismaBase.businessUnit.create({...});
    testUser = await prismaBase.user.create({...});
  });

  it("should add stock with automatic tenant filtering", async () => {
    // Wrap test in context
    await runWithContext(
      {
        tenantId: testTenant.id,
        businessUnitId: testBU.id,
        userId: testUser.id
      },
      async () => {
        // Service method sin parámetros de tenant
        const result = await stockCommandService.addStock({
          templateId: "template-123",
          quantity: 50
        });

        // Verificar que tenantId se inyectó automáticamente
        expect(result.tenantId).toBe(testTenant.id);
        expect(result.businessUnitId).toBe(testBU.id);
      }
    );
  });

  it("should prevent cross-tenant access", async () => {
    const tenant1 = await prismaBase.tenant.create({...});
    const tenant2 = await prismaBase.tenant.create({...});

    // Create stock for tenant1
    await runWithContext(
      { tenantId: tenant1.id, businessUnitId: "bu1", userId: "user1" },
      async () => {
        await prisma.stockLevel.create({
          data: { templateId: "tmpl-1", quantity: 100 }
        });
      }
    );

    // Try to access from tenant2 - should return empty
    await runWithContext(
      { tenantId: tenant2.id, businessUnitId: "bu2", userId: "user2" },
      async () => {
        const levels = await prisma.stockLevel.findMany();
        expect(levels.length).toBe(0); // ← No ve datos de tenant1
      }
    );
  });
});
```

---

## Prisma Extensions: Modelos Afectados

### Tenant-Scoped Models (auto-filtered)

Estos modelos se filtran automáticamente por `tenantId`:

- ✅ User
- ✅ BusinessUnit, UserBusinessUnit
- ✅ Asset, AssetTemplate
- ✅ **StockLevel** (NUEVO)
- ✅ **StockMovement** (NUEVO)
- ✅ **BulkRentalItem** (NUEVO)
- ✅ RentalContract, Quotation, QuotationItem
- ✅ Client, Contact
- ✅ PurchaseOrder, PurchaseItem
- ✅ Supplier, Invoice, Payment
- ✅ Document, AuditLog

### Global Models (NO filtered)

Estos modelos NO se filtran (son globales):

- ❌ Tenant (obviously)
- ❌ Module
- ❌ Permission

---

## Checklist de Migración

### Para Servicios Existentes:

- [ ] Eliminar parámetros `tenantId` y `businessUnitId` de métodos públicos
- [ ] Eliminar validaciones manuales de tenant en queries
- [ ] Eliminar asignación manual de `tenantId` en `create()`
- [ ] Usar `getTenantId()` solo si necesitas el valor para lógica
- [ ] Actualizar tests para usar `runWithContext()`

### Para Nuevos Servicios:

- [ ] NO agregar parámetros `tenantId` o `businessUnitId`
- [ ] Confiar en el auto-filtering de Prisma
- [ ] Usar helpers (`getTenantId`, etc.) solo cuando sea necesario
- [ ] Escribir tests con `runWithContext()`

---

## Ejemplo Completo: Stock Command Service

```typescript
// backend/src/modules/assets/services/stock-command.service.ts
import { PrismaClient, Prisma } from "@prisma/client";
import { getUserId, getTenantId } from "@divancosaas/shared";
import { AppError } from "@core/middlewares/error.middleware";

export class StockCommandService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Add stock to inventory
   * NO requiere tenantId o businessUnitId - se inyectan automáticamente
   */
  async addStock(input: {
    templateId: string;
    quantity: number;
    unitCost?: number;
    location?: string;
  }) {
    this.validatePositiveQuantity(input.quantity);
    await this.validateBulkTemplate(input.templateId);

    return await this.prisma.$transaction(async (tx) => {
      // Find stock level - auto-filtered por tenant
      const stockLevel = await tx.stockLevel.findFirst({
        where: {
          templateId: input.templateId,
          location: input.location ?? null,
          // ← NO necesitas: tenantId: getTenantId()
        },
      });

      if (!stockLevel) {
        throw new AppError("Stock level not found", 404);
      }

      // Update quantities
      const quantityBefore = this.calculateTotal(stockLevel);
      const newAvailable = stockLevel.quantityAvailable + input.quantity;

      const updated = await tx.stockLevel.update({
        where: {
          id: stockLevel.id,
          version: stockLevel.version,
        },
        data: {
          quantityAvailable: newAvailable,
          version: { increment: 1 },
        },
      });

      // Create audit trail
      await tx.stockMovement.create({
        data: {
          stockLevelId: stockLevel.id,
          type: "ADD",
          quantity: input.quantity,
          quantityBefore,
          quantityAfter: quantityBefore + input.quantity,
          availableBefore: stockLevel.quantityAvailable,
          availableAfter: newAvailable,
          reservedBefore: stockLevel.quantityReserved,
          reservedAfter: stockLevel.quantityReserved,
          rentedBefore: stockLevel.quantityRented,
          rentedAfter: stockLevel.quantityRented,
          createdBy: getUserId(), // ← Explicit para audit
          // ← tenantId se inyecta automáticamente
        },
      });

      return updated;
    });
  }

  private calculateTotal(sl: any): number {
    return sl.quantityAvailable + sl.quantityReserved + sl.quantityRented;
  }

  private validatePositiveQuantity(qty: number): void {
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new AppError("Quantity must be positive integer", 400);
    }
  }

  private async validateBulkTemplate(templateId: string): Promise<void> {
    // Auto-filtered por tenant
    const template = await this.prisma.assetTemplate.findUnique({
      where: { id: templateId },
      select: { managementType: true },
    });

    if (!template) {
      throw new AppError("Template not found", 404);
    }

    if (template.managementType !== "BULK") {
      throw new AppError("Only BULK templates allowed", 400);
    }
  }
}
```

---

## Próximos Pasos

1. **Crear migración:**

   ```bash
   cd backend
   npx prisma migrate dev --name add_tenant_id_to_bulk_inventory
   ```

2. **Regenerar Prisma Client:**

   ```bash
   npx prisma generate
   ```

3. **Actualizar servicios existentes:**
   - Eliminar parámetros de `tenantId`/`businessUnitId`
   - Confiar en auto-filtering

4. **Actualizar tests:**
   - Usar `runWithContext()` para wrapping

5. **Verificar aislamiento:**
   - Test cross-tenant access prevention
   - Audit logs con tenant correcto

---

## Troubleshooting

### Error: "Request context not available"

**Causa:** Intentando usar `getTenantId()` fuera de un request HTTP (seed, job, test sin context).

**Solución:**

```typescript
// Option 1: Check first
if (hasRequestContext()) {
  const tenantId = getTenantId();
}

// Option 2: Use prismaBase
import { prismaBase } from "@config/database";
await prismaBase.stockLevel.create({
  data: { tenantId: "explicit-id", ... }
});

// Option 3: Wrap in context
runWithContext({ tenantId: "...", ... }, async () => {
  // Now context is available
});
```

### Prisma no filtra automáticamente

**Causa:** Usando `prismaBase` en lugar de `prisma` extendido.

**Solución:**

```typescript
// ❌ Wrong:
import { prismaBase } from "@config/database";

// ✅ Correct:
import prisma from "@config/database"; // Extended client
```

---

**Document Status:** Ready for Implementation  
**Last Updated:** February 14, 2026
