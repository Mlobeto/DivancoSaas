# Bulk Inventory Management Guide

## Overview

This document describes the implementation of bulk inventory management alongside individual asset tracking in the DivancoSaaS platform.

## Problem Solved

Previously, all assets required individual database rows, which was inefficient for fungible/bulk items like scaffolding, where you might have 100 identical units but don't need individual tracking for each.

## Solution

Introduced **dual management types** for assets:

- **UNIT**: Individual tracking (existing behavior) - one row per physical unit
- **BULK**: Quantity-based inventory management - track stock levels only

---

## Schema Changes

### 1. New Enum: `AssetManagementType`

```prisma
enum AssetManagementType {
  UNIT   // Individual tracking (one DB row per physical unit)
  BULK   // Quantity-based inventory (stock levels only)
}
```

### 2. Updated `AssetTemplate` Model

Added new field:

```prisma
managementType AssetManagementType @default(UNIT)
```

This controls how assets of this template are managed:

- **UNIT** = traditional individual Asset records
- **BULK** = quantity tracking via StockLevel records

### 3. New `StockLevel` Model

For templates with `managementType = BULK`:

```prisma
model StockLevel {
  id             String @id @default(uuid())
  businessUnitId String
  templateId     String

  // Quantity tracking
  quantityAvailable Int @default(0)  // Available for rental/sale
  quantityReserved  Int @default(0)  // Reserved in quotations
  quantityRented    Int @default(0)  // Currently rented out

  // Location (optional)
  location String?  // Warehouse, site, etc.

  // Pricing (can override template defaults)
  pricePerDay   Decimal?
  pricePerWeek  Decimal?
  pricePerMonth Decimal?

  // Alerts
  minStock Int?
  maxStock Int?

  notes String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  businessUnit BusinessUnit   @relation(...)
  template     AssetTemplate  @relation(...)
  movements    StockMovement[]
}
```

### 4. New `StockMovement` Model

Audit trail for bulk inventory changes:

```prisma
model StockMovement {
  id           String @id @default(uuid())
  stockLevelId String

  type        StockMovementType
  quantity    Int
  reason      String?
  reference   String?  // Reference to related entity

  balanceAfter Json?  // Snapshot: {available, reserved, rented}
  notes        String?

  createdAt DateTime @default(now())
  createdBy String?

  stockLevel StockLevel @relation(...)
}

enum StockMovementType {
  PURCHASE
  RENTAL_OUT
  RENTAL_RETURN
  SALE
  ADJUSTMENT
  LOSS
  TRANSFER
  RESERVE
  UNRESERVE
}
```

---

## Migration Steps

### Apply the Schema Migration

```bash
cd backend
npx prisma migrate deploy
```

The migration `20260214142421_add_bulk_inventory_management` will:

1. Create `AssetManagementType` enum
2. Create `StockMovementType` enum
3. Add `managementType` column to `asset_templates` (defaults to `UNIT`)
4. Create `stock_levels` table
5. Create `stock_movements` table
6. Add necessary indexes and foreign keys

### Backward Compatibility

✅ **All existing data is safe**:

- All existing `AssetTemplate` records get `managementType = UNIT` (default)
- All existing `Asset` records continue working normally
- No changes to existing relations or functionality

---

## Service Layer Implementation

### 1. Create AssetTemplate Service

```typescript
// src/modules/assets/services/asset-template.service.ts

interface CreateTemplateDto {
  name: string;
  category: AssetCategory;
  managementType: "UNIT" | "BULK";
  businessUnitId: string;
  // ... other fields
}

class AssetTemplateService {
  async createTemplate(dto: CreateTemplateDto) {
    // Validation: ensure managementType is set correctly
    const template = await prisma.assetTemplate.create({
      data: {
        name: dto.name,
        category: dto.category,
        managementType: dto.managementType,
        businessUnitId: dto.businessUnitId,
        // ... other fields
      },
    });

    // If BULK, optionally create initial stock level
    if (dto.managementType === "BULK") {
      await prisma.stockLevel.create({
        data: {
          templateId: template.id,
          businessUnitId: dto.businessUnitId,
          quantityAvailable: 0,
        },
      });
    }

    return template;
  }
}
```

### 2. Stock Level Management Service

```typescript
// src/modules/assets/services/stock-level.service.ts

class StockLevelService {
  /**
   * Add stock (e.g., from purchase)
   */
  async addStock(
    templateId: string,
    quantity: number,
    reason: string,
    reference?: string,
  ) {
    // Validate template is BULK type
    const template = await prisma.assetTemplate.findUnique({
      where: { id: templateId },
    });

    if (template?.managementType !== "BULK") {
      throw new Error("Cannot manage stock for UNIT-type templates");
    }

    // Update stock level
    const stockLevel = await prisma.stockLevel.findFirst({
      where: { templateId },
    });

    if (!stockLevel) {
      throw new Error("Stock level not found");
    }

    const updated = await prisma.stockLevel.update({
      where: { id: stockLevel.id },
      data: {
        quantityAvailable: {
          increment: quantity,
        },
      },
    });

    // Create movement record
    await prisma.stockMovement.create({
      data: {
        stockLevelId: stockLevel.id,
        type: "PURCHASE",
        quantity,
        reason,
        reference,
        balanceAfter: {
          available: updated.quantityAvailable,
          reserved: updated.quantityReserved,
          rented: updated.quantityRented,
        },
      },
    });

    return updated;
  }

  /**
   * Reserve stock (e.g., for quotation)
   */
  async reserveStock(templateId: string, quantity: number) {
    const stockLevel = await prisma.stockLevel.findFirst({
      where: { templateId },
    });

    if (!stockLevel) {
      throw new Error("Stock level not found");
    }

    if (stockLevel.quantityAvailable < quantity) {
      throw new Error("Insufficient stock available");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.stockLevel.update({
        where: { id: stockLevel.id },
        data: {
          quantityAvailable: { decrement: quantity },
          quantityReserved: { increment: quantity },
        },
      });

      await tx.stockMovement.create({
        data: {
          stockLevelId: stockLevel.id,
          type: "RESERVE",
          quantity,
          balanceAfter: {
            available: updated.quantityAvailable,
            reserved: updated.quantityReserved,
            rented: updated.quantityRented,
          },
        },
      });

      return updated;
    });
  }

  /**
   * Rent out stock (from reserved or available)
   */
  async rentOutStock(
    templateId: string,
    quantity: number,
    fromReserved = false,
  ) {
    const stockLevel = await prisma.stockLevel.findFirst({
      where: { templateId },
    });

    if (!stockLevel) {
      throw new Error("Stock level not found");
    }

    if (fromReserved) {
      if (stockLevel.quantityReserved < quantity) {
        throw new Error("Insufficient reserved stock");
      }

      return prisma.$transaction(async (tx) => {
        const updated = await tx.stockLevel.update({
          where: { id: stockLevel.id },
          data: {
            quantityReserved: { decrement: quantity },
            quantityRented: { increment: quantity },
          },
        });

        await tx.stockMovement.create({
          data: {
            stockLevelId: stockLevel.id,
            type: "RENTAL_OUT",
            quantity,
            balanceAfter: {
              available: updated.quantityAvailable,
              reserved: updated.quantityReserved,
              rented: updated.quantityRented,
            },
          },
        });

        return updated;
      });
    } else {
      if (stockLevel.quantityAvailable < quantity) {
        throw new Error("Insufficient available stock");
      }

      return prisma.$transaction(async (tx) => {
        const updated = await tx.stockLevel.update({
          where: { id: stockLevel.id },
          data: {
            quantityAvailable: { decrement: quantity },
            quantityRented: { increment: quantity },
          },
        });

        await tx.stockMovement.create({
          data: {
            stockLevelId: stockLevel.id,
            type: "RENTAL_OUT",
            quantity,
            balanceAfter: {
              available: updated.quantityAvailable,
              reserved: updated.quantityReserved,
              rented: updated.quantityRented,
            },
          },
        });

        return updated;
      });
    }
  }

  /**
   * Return rented stock
   */
  async returnStock(templateId: string, quantity: number) {
    const stockLevel = await prisma.stockLevel.findFirst({
      where: { templateId },
    });

    if (!stockLevel) {
      throw new Error("Stock level not found");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.stockLevel.update({
        where: { id: stockLevel.id },
        data: {
          quantityRented: { decrement: quantity },
          quantityAvailable: { increment: quantity },
        },
      });

      await tx.stockMovement.create({
        data: {
          stockLevelId: stockLevel.id,
          type: "RENTAL_RETURN",
          quantity,
          balanceAfter: {
            available: updated.quantityAvailable,
            reserved: updated.quantityReserved,
            rented: updated.quantityRented,
          },
        },
      });

      return updated;
    });
  }
}
```

### 3. Validation Middleware

```typescript
// src/modules/assets/middleware/validate-management-type.ts

export async function validateUnitManagement(templateId: string) {
  const template = await prisma.assetTemplate.findUnique({
    where: { id: templateId },
    select: { managementType: true },
  });

  if (template?.managementType !== "UNIT") {
    throw new BadRequestException(
      "This operation is only allowed for UNIT-type templates",
    );
  }
}

export async function validateBulkManagement(templateId: string) {
  const template = await prisma.assetTemplate.findUnique({
    where: { id: templateId },
    select: { managementType: true },
  });

  if (template?.managementType !== "BULK") {
    throw new BadRequestException(
      "This operation is only allowed for BULK-type templates",
    );
  }
}
```

### 4. Updated Asset Creation

```typescript
// src/modules/assets/services/asset.service.ts

class AssetService {
  async createAsset(dto: CreateAssetDto) {
    // Validate: prevent creating individual assets for BULK templates
    if (dto.templateId) {
      await validateUnitManagement(dto.templateId);
    }

    // Proceed with normal asset creation
    return prisma.asset.create({
      data: {
        ...dto,
      },
    });
  }
}
```

---

## Usage Examples

### Example 1: Create UNIT Template (Excavator)

```typescript
const excavatorTemplate = await assetTemplateService.createTemplate({
  name: "Excavadora CAT 320",
  category: "MACHINERY",
  managementType: "UNIT", // Individual tracking
  businessUnitId: "bu-123",
  requiresPreventiveMaintenance: true,
  requiresDocumentation: true,
});

// Create individual asset instances
await assetService.createAsset({
  templateId: excavatorTemplate.id,
  code: "EXC-001",
  name: "Excavadora CAT 320 #1",
  // ... maintenance, hourometer, etc.
});
```

### Example 2: Create BULK Template (Scaffolding)

```typescript
const scaffoldingTemplate = await assetTemplateService.createTemplate({
  name: "Andamio Tubular 2m",
  category: "IMPLEMENT",
  managementType: "BULK", // Quantity-based
  businessUnitId: "bu-123",
});

// Add 100 units to stock
await stockLevelService.addStock(
  scaffoldingTemplate.id,
  100,
  "Initial purchase",
  "PO-2024-001",
);

// Rent out 20 units
await stockLevelService.rentOutStock(scaffoldingTemplate.id, 20);

// View stock
const stockLevel = await prisma.stockLevel.findFirst({
  where: { templateId: scaffoldingTemplate.id },
});
// { quantityAvailable: 80, quantityReserved: 0, quantityRented: 20 }
```

---

## Frontend Integration

### Display Logic

```typescript
// components/AssetTemplateCard.tsx

function AssetTemplateCard({ template }) {
  if (template.managementType === 'UNIT') {
    return (
      <div>
        <h3>{template.name}</h3>
        <p>Individual Units: {template.assets.length}</p>
        <Button onClick={() => createNewAsset(template.id)}>
          + Add Unit
        </Button>
      </div>
    );
  }

  if (template.managementType === 'BULK') {
    const stockLevel = template.stockLevels[0];
    return (
      <div>
        <h3>{template.name}</h3>
        <p>Available: {stockLevel.quantityAvailable}</p>
        <p>Reserved: {stockLevel.quantityReserved}</p>
        <p>Rented: {stockLevel.quantityRented}</p>
        <Button onClick={() => addStock(template.id)}>
          + Add Stock
        </Button>
      </div>
    );
  }
}
```

---

## API Endpoints

### Suggested Routes

```typescript
// Unit Management (existing)
POST   /api/assets              // Create individual asset
GET    /api/assets/:id          // Get asset details
PUT    /api/assets/:id          // Update asset
DELETE /api/assets/:id          // Delete asset

// Bulk Management (new)
POST   /api/stock-levels/purchase    // Add stock from purchase
POST   /api/stock-levels/reserve     // Reserve stock
POST   /api/stock-levels/rent        // Rent out stock
POST   /api/stock-levels/return      // Return stock
POST   /api/stock-levels/adjust      // Manual adjustment
GET    /api/stock-levels/:templateId // Get stock level
GET    /api/stock-movements/:templateId // Get movement history
```

---

## Testing Strategy

### Unit Tests

```typescript
describe("StockLevelService", () => {
  it("should prevent stock operations on UNIT templates", async () => {
    const unitTemplate = await createTemplate({ managementType: "UNIT" });

    await expect(
      stockLevelService.addStock(unitTemplate.id, 10, "test"),
    ).rejects.toThrow("Cannot manage stock for UNIT-type templates");
  });

  it("should correctly track stock movements", async () => {
    const bulkTemplate = await createTemplate({ managementType: "BULK" });

    // Add 100 units
    await stockLevelService.addStock(bulkTemplate.id, 100, "purchase");

    // Reserve 30
    await stockLevelService.reserveStock(bulkTemplate.id, 30);

    // Rent 20 from reserved
    await stockLevelService.rentOutStock(bulkTemplate.id, 20, true);

    const stockLevel = await prisma.stockLevel.findFirst({
      where: { templateId: bulkTemplate.id },
    });

    expect(stockLevel.quantityAvailable).toBe(70); // 100 - 30
    expect(stockLevel.quantityReserved).toBe(10); // 30 - 20
    expect(stockLevel.quantityRented).toBe(20);
  });
});
```

---

## Data Migration (if needed)

If you have existing templates that should be BULK but are currently UNIT:

```sql
-- Example: Convert "Andamio Tubular" templates to BULK
UPDATE asset_templates
SET "managementType" = 'BULK'
WHERE name LIKE '%Andamio%'
  AND category = 'IMPLEMENT';

-- Then create stock levels for these templates
INSERT INTO stock_levels (id, "businessUnitId", "templateId", "quantityAvailable")
SELECT
  gen_random_uuid(),
  "businessUnitId",
  id,
  0
FROM asset_templates
WHERE "managementType" = 'BULK'
  AND id NOT IN (SELECT "templateId" FROM stock_levels);
```

---

## Monitoring and Alerts

### Low Stock Alerts

```typescript
// Cron job to check low stock
async function checkLowStockAlerts() {
  const lowStockItems = await prisma.stockLevel.findMany({
    where: {
      AND: [
        { minStock: { not: null } },
        {
          quantityAvailable: {
            lte: prisma.raw('"minStock"'),
          },
        },
      ],
    },
    include: {
      template: true,
      businessUnit: true,
    },
  });

  for (const item of lowStockItems) {
    await sendAlert({
      type: "LOW_STOCK",
      template: item.template.name,
      current: item.quantityAvailable,
      minimum: item.minStock,
    });
  }
}
```

---

## Next Steps

1. ✅ Schema updated
2. ✅ Migration created
3. ⏳ Implement service layer
4. ⏳ Add API endpoints
5. ⏳ Update frontend UI
6. ⏳ Add validation middleware
7. ⏳ Write tests
8. ⏳ Update documentation

---

## Questions?

Contact the development team for clarification on implementation details.
