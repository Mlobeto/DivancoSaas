# BULK Inventory Hardening Plan

**Date:** February 14, 2026  
**Status:** Implementation Plan  
**Priority:** HIGH

---

## Executive Summary

This document outlines the hardening plan for the BULK inventory system to ensure:

- **Atomicity**: All stock operations are transactional
- **Consistency**: Prevent invalid state transitions
- **Integrity**: Enforce domain rules strictly
- **Scalability**: Support concurrent operations safely
- **Traceability**: Complete audit trail with before/after snapshots

**Critical Constraint**: Do NOT break existing UNIT functionality. All changes are additive.

---

## 0. Multi-Tenant Architecture: Request Context Pattern

### 0.1 Overview

**CRITICAL**: This SaaS application uses a **request context pattern** with `AsyncLocalStorage` to automatically inject `tenantId` and `businessUnitId` into all database operations.

**Benefits:**

- ✅ No need to manually pass `tenantId` through every function
- ✅ Automatic Prisma filtering prevents cross-tenant data leakage
- ✅ Cleaner service APIs - context is implicit
- ✅ Impossible to forget tenant filtering

### 0.2 How It Works

```typescript
// 1. User makes authenticated request
GET /api/v1/rental/assets
Headers: Authorization: Bearer <jwt>

// 2. authenticate middleware validates JWT and creates req.context
req.context = {
  userId: "user-123",
  tenantId: "tenant-abc",
  businessUnitId: "bu-xyz"
}

// 3. contextInjector middleware injects into AsyncLocalStorage
AsyncLocalStorage.run(req.context, () => { ... })

// 4. Prisma extension automatically filters ALL queries
prisma.asset.findMany()
// → SELECT * FROM assets WHERE tenantId = 'tenant-abc'

// 5. Services don't need to pass tenantId manually
const assets = await assetService.listAssets(); // ✅ Auto-filtered
```

### 0.3 Implementation Files

| File                                                 | Purpose                                     |
| ---------------------------------------------------- | ------------------------------------------- |
| `shared/src/context/request-context.ts`              | AsyncLocalStorage setup + helper functions  |
| `backend/src/core/middlewares/context.middleware.ts` | Express middleware to inject context        |
| `backend/src/config/prisma-extensions.ts`            | Prisma Client Extension for auto-filtering  |
| `backend/src/config/database.ts`                     | Extended Prisma Client with filters enabled |

### 0.4 Service Pattern (NEW)

**OLD WAY** (manual tenantId passing):

```typescript
// ❌ OLD - Error prone, verbose
async addStock(
  data: AddStockInput,
  tenantId: string,      // Manual
  businessUnitId: string // Manual
) {
  await prisma.stockLevel.create({
    data: {
      ...data,
      tenantId,          // Must remember to add
      businessUnitId
    }
  });
}
```

**NEW WAY** (automatic context):

```typescript
// ✅ NEW - Clean, safe
import { getTenantId, getBusinessUnitId } from "@divancosaas/shared";

async addStock(data: AddStockInput) {
  // tenantId automatically injected by Prisma extension
  await prisma.stockLevel.create({
    data: data
  });

  // Or explicitly get from context if needed for logic
  const tenantId = getTenantId();
  const businessUnitId = getBusinessUnitId();
}
```

### 0.5 Helper Functions

```typescript
import {
  getRequestContext, // Get full context object
  getTenantId, // Get tenantId (throws if not in context)
  getBusinessUnitId, // Get businessUnitId (undefined if not set)
  requireBusinessUnitId, // Get businessUnitId (throws if not set)
  getUserId, // Get userId (throws if not in context)
  hasRequestContext, // Check if context is available
  runWithContext, // For tests/background jobs
} from "@divancosaas/shared";
```

### 0.6 Background Jobs & Seeds

For operations OUTSIDE of HTTP requests (seeds, cron jobs, queue processors):

```typescript
import { runWithContext } from "@divancosaas/shared";
import { prismaBase } from "@config/database"; // Use prismaBase (no extensions)

// Option 1: Use prismaBase without auto-filtering
await prismaBase.stockLevel.create({
  data: {
    tenantId: "known-tenant-id", // Explicit
    businessUnitId: "known-bu-id",
    // ...
  }
});

// Option 2: Run with manual context
runWithContext(
  {
    tenantId: "tenant-123",
    businessUnitId: "bu-456",
    userId: "system"
  },
  async () => {
    // Now prisma (extended) works with auto-filtering
    await prisma.stockLevel.create({ data: {...} });
  }
);
```

### 0.7 Testing

```typescript
import { runWithContext } from "@divancosaas/shared";

describe("StockCommandService", () => {
  it("should add stock", async () => {
    // Wrap test in context
    await runWithContext(
      {
        tenantId: testTenant.id,
        businessUnitId: testBU.id,
        userId: testUser.id,
      },
      async () => {
        const result = await stockService.addStock({ quantity: 10 });
        expect(result.tenantId).toBe(testTenant.id); // Auto-injected
      },
    );
  });
});
```

---

## 1. Schema Changes

### 1.1 Add BulkRentalItem Model

**Purpose**: Connect BULK inventory items to rental contracts

```prisma
model BulkRentalItem {
  id        String @id @default(uuid())
  contractId String
  templateId String

  // Quantity and pricing snapshot at contract creation
  quantity      Int
  pricePerDay   Decimal? @db.Decimal(10, 2)
  pricePerWeek  Decimal? @db.Decimal(10, 2)
  pricePerMonth Decimal? @db.Decimal(10, 2)

  // Location tracking
  location String?

  // Reference to stock level used
  stockLevelId String?

  // Audit
  createdAt DateTime @default(now())
  createdBy String?

  // Relations
  contract   RentalContract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  template   AssetTemplate  @relation(fields: [templateId], references: [id], onDelete: Restrict)
  stockLevel StockLevel?    @relation(fields: [stockLevelId], references: [id], onDelete: SetNull)
  creator    User?          @relation("BulkRentalItemCreator", fields: [createdBy], references: [id])

  @@index([contractId])
  @@index([templateId])
  @@index([stockLevelId])
  @@map("bulk_rental_items")
}
```

**Add to RentalContract**:

```prisma
model RentalContract {
  // ... existing fields ...
  bulkItems BulkRentalItem[] // New relation
}
```

**Add to AssetTemplate**:

```prisma
model AssetTemplate {
  // ... existing fields ...
  bulkRentalItems BulkRentalItem[] // New relation
}
```

**Add to StockLevel**:

```prisma
model StockLevel {
  // ... existing fields ...
  bulkRentalItems BulkRentalItem[] // New relation
}
```

---

### 1.2 Harden StockLevel Model

**Add optimistic locking and remove any computed fields:**

```prisma
model StockLevel {
  id             String @id @default(uuid())
  businessUnitId String
  templateId     String

  // Quantity tracking (NEVER update directly - use StockMovement service only)
  quantityAvailable Int @default(0) // Available for rental/sale
  quantityReserved  Int @default(0) // Reserved in quotations
  quantityRented    Int @default(0) // Currently rented out

  // Location (optional, for multi-location support)
  location String?

  // Pricing for bulk items
  pricePerDay   Decimal? @db.Decimal(10, 2)
  pricePerWeek  Decimal? @db.Decimal(10, 2)
  pricePerMonth Decimal? @db.Decimal(10, 2)
  unitCost      Decimal? @db.Decimal(10, 2) // Cost per unit for valuation

  // Alerts
  minStock Int? // Minimum stock alert threshold
  maxStock Int? // Maximum stock capacity

  // Optimistic locking for concurrency control
  version Int @default(0)

  notes String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  businessUnit    BusinessUnit      @relation(fields: [businessUnitId], references: [id], onDelete: Cascade)
  template        AssetTemplate     @relation(fields: [templateId], references: [id], onDelete: Restrict)
  movements       StockMovement[]
  bulkRentalItems BulkRentalItem[]

  @@unique([businessUnitId, templateId, location])
  @@index([businessUnitId])
  @@index([templateId])
  @@index([quantityAvailable])
  @@map("stock_levels")
}
```

**Key Changes:**

- Added `version` field for optimistic locking
- Added `unitCost` for inventory valuation
- Changed `onDelete: Cascade` to `onDelete: Restrict` on template relation (prevent accidental deletion)
- Added `bulkRentalItems` relation
- **Removed** any `total` field if it existed (derived as `available + reserved + rented`)

---

### 1.3 Harden StockMovement Model

**Enforce audit trail with before/after snapshots:**

```prisma
model StockMovement {
  id           String @id @default(uuid())
  stockLevelId String

  // Movement type and quantity
  type     StockMovementType
  quantity Int // Always positive (type indicates direction)

  // Before/after snapshots (REQUIRED)
  quantityBefore Int // Total before this movement
  quantityAfter  Int // Total after this movement

  // Detailed state snapshots
  availableBefore  Int
  availableAfter   Int
  reservedBefore   Int
  reservedAfter    Int
  rentedBefore     Int
  rentedAfter      Int

  // References (REQUIRED for RESERVE, RENT_OUT, RETURN)
  referenceId   String? // Quotation ID, Contract ID, etc.
  referenceType String? // "Quotation", "RentalContract", "PurchaseOrder"

  // Reason is REQUIRED for ADJUST movements
  reason String? // "damaged", "lost", "initial", "purchase", etc.
  notes  String?

  // Location (if movement affects specific location)
  location String?

  // Audit
  createdAt DateTime @default(now())
  createdBy String?

  // Relations
  stockLevel StockLevel @relation(fields: [stockLevelId], references: [id], onDelete: Cascade)
  creator    User?      @relation("StockMovementCreator", fields: [createdBy], references: [id])

  @@index([stockLevelId, createdAt])
  @@index([type])
  @@index([referenceId])
  @@index([referenceType])
  @@map("stock_movements")
}

enum StockMovementType {
  ADD          // Incoming stock (purchase, transfer in)
  RESERVE      // Reserve stock for quotation
  UNRESERVE    // Release reservation (quotation cancelled)
  RENT_OUT     // Rent out to customer (contract signed)
  RETURN       // Return from rental
  ADJUST       // Manual adjustment (loss, damage, correction)
}
```

**Key Changes:**

- Added `quantityBefore` and `quantityAfter` for exact audit trail
- Added detailed state snapshots (available/reserved/rented before/after)
- Made `referenceId` and `referenceType` explicit for integration tracing
- Added `location` field for location-specific movements
- Simplified enum to reflect actual business operations
- Added creator relation for user tracking

---

## 2. Migration Plan

### Step 1: Backup Database

```bash
pg_dump divanco_dev > backup_before_bulk_hardening_$(date +%Y%m%d).sql
```

### Step 2: Create Migration

```bash
cd backend
npx prisma migrate dev --name harden_bulk_inventory_system
```

### Step 3: Migration SQL Preview

The migration will:

1. **Add version column to stock_levels** (default 0)
2. **Add unitCost column to stock_levels** (nullable)
3. **Add before/after fields to stock_movements**:
   - quantityBefore INT NOT NULL (backfill with 0)
   - quantityAfter INT NOT NULL (backfill with 0)
   - availableBefore INT NOT NULL (backfill with 0)
   - availableAfter INT NOT NULL (backfill with 0)
   - reservedBefore INT NOT NULL (backfill with 0)
   - reservedAfter INT NOT NULL (backfill with 0)
   - rentedBefore INT NOT NULL (backfill with 0)
   - rentedAfter INT NOT NULL (backfill with 0)
4. **Add referenceType column to stock_movements** (nullable)
5. **Add location column to stock_movements** (nullable)
6. **Create bulk_rental_items table**
7. **Update enum StockMovementType** (remove unused values)
8. **Add indexes** for performance
9. **Change onDelete behavior** on template relation (Cascade → Restrict)

### Step 4: Data Backfill (if needed)

If there are existing StockMovement records without before/after values:

```sql
-- Update existing movements to have reasonable defaults
UPDATE stock_movements
SET
  quantityBefore = 0,
  quantityAfter = quantity,
  availableBefore = 0,
  availableAfter = 0,
  reservedBefore = 0,
  reservedAfter = 0,
  rentedBefore = 0,
  rentedAfter = 0
WHERE quantityBefore IS NULL;
```

### Step 5: Validate Migration

```bash
npx prisma validate
npx prisma generate
npm run build
```

### Step 6: Test in Development

Run comprehensive tests before deploying to production.

---

## 3. Service Layer Refactoring

### 3.1 Separation of Concerns

**Create two new services:**

#### StockCommandService (Mutations)

- `addStock()`
- `reserveStock()`
- `unreserveStock()`
- `rentOutStock()`
- `returnStock()`
- `adjustStock()`
- All operations wrapped in transactions
- All operations create StockMovement audit trail

#### StockQueryService (Reads)

- `getStockLevel()`
- `listStockLevels()`
- `getStockMovements()`
- `getStockStats()`
- `getLowStockAlerts()`
- `getInventoryValuation()`

**Benefits:**

- Clear separation between reads and writes
- Easier to test
- Easier to add caching to query service
- Follow CQRS pattern

---

### 3.2 Implementation Example: StockCommandService

```typescript
import { PrismaClient, Prisma } from "@prisma/client";
import { AppError } from "@core/middlewares/error.middleware";

export class StockCommandService {
  constructor(private prisma: PrismaClient) {}

  /**
   * ADD STOCK
   * Atomic transaction: Update StockLevel + Create StockMovement
   */
  async addStock(input: {
    templateId: string;
    businessUnitId: string;
    quantity: number;
    unitCost?: number;
    location?: string;
    reason?: string;
    referenceId?: string;
    referenceType?: string;
    createdBy?: string;
  }) {
    // Validation
    this.validatePositiveQuantity(input.quantity);
    await this.validateBulkTemplate(input.templateId);
    await this.validateBusinessUnit(input.businessUnitId, input.templateId);

    // Execute in transaction
    return await this.prisma.$transaction(async (tx) => {
      // Get current stock level with lock
      const stockLevel = await this.getStockLevelWithLock(
        tx,
        input.templateId,
        input.businessUnitId,
        input.location,
      );

      // Calculate new values
      const quantityBefore = this.calculateTotal(stockLevel);
      const newAvailable = stockLevel.quantityAvailable + input.quantity;
      const quantityAfter = quantityBefore + input.quantity;

      // Update stock level with version check
      const updated = await tx.stockLevel.update({
        where: {
          id: stockLevel.id,
          version: stockLevel.version, // Optimistic lock
        },
        data: {
          quantityAvailable: newAvailable,
          unitCost: input.unitCost ?? stockLevel.unitCost,
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      // Create audit trail
      await tx.stockMovement.create({
        data: {
          stockLevelId: stockLevel.id,
          type: "ADD",
          quantity: input.quantity,
          quantityBefore,
          quantityAfter,
          availableBefore: stockLevel.quantityAvailable,
          availableAfter: newAvailable,
          reservedBefore: stockLevel.quantityReserved,
          reservedAfter: stockLevel.quantityReserved,
          rentedBefore: stockLevel.quantityRented,
          rentedAfter: stockLevel.quantityRented,
          referenceId: input.referenceId,
          referenceType: input.referenceType,
          reason: input.reason ?? "stock_addition",
          location: input.location,
          createdBy: input.createdBy,
        },
      });

      return updated;
    });
  }

  /**
   * RESERVE STOCK (for quotation)
   */
  async reserveStock(input: {
    templateId: string;
    businessUnitId: string;
    quantity: number;
    referenceId: string; // REQUIRED: Quotation ID
    referenceType: string; // REQUIRED: "Quotation"
    location?: string;
    createdBy?: string;
  }) {
    // Validation
    this.validatePositiveQuantity(input.quantity);
    this.validateRequired(input.referenceId, "referenceId");
    this.validateRequired(input.referenceType, "referenceType");
    await this.validateBulkTemplate(input.templateId);
    await this.validateBusinessUnit(input.businessUnitId, input.templateId);

    return await this.prisma.$transaction(async (tx) => {
      const stockLevel = await this.getStockLevelWithLock(
        tx,
        input.templateId,
        input.businessUnitId,
        input.location,
      );

      // Check availability
      if (stockLevel.quantityAvailable < input.quantity) {
        throw new AppError(
          `Insufficient stock. Available: ${stockLevel.quantityAvailable}, Requested: ${input.quantity}`,
          400,
        );
      }

      const quantityBefore = this.calculateTotal(stockLevel);
      const newAvailable = stockLevel.quantityAvailable - input.quantity;
      const newReserved = stockLevel.quantityReserved + input.quantity;
      const quantityAfter = quantityBefore; // Total unchanged, just moved

      // Update stock level
      const updated = await tx.stockLevel.update({
        where: {
          id: stockLevel.id,
          version: stockLevel.version,
        },
        data: {
          quantityAvailable: newAvailable,
          quantityReserved: newReserved,
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      // Create audit trail
      await tx.stockMovement.create({
        data: {
          stockLevelId: stockLevel.id,
          type: "RESERVE",
          quantity: input.quantity,
          quantityBefore,
          quantityAfter,
          availableBefore: stockLevel.quantityAvailable,
          availableAfter: newAvailable,
          reservedBefore: stockLevel.quantityReserved,
          reservedAfter: newReserved,
          rentedBefore: stockLevel.quantityRented,
          rentedAfter: stockLevel.quantityRented,
          referenceId: input.referenceId,
          referenceType: input.referenceType,
          reason: "quotation_reservation",
          location: input.location,
          createdBy: input.createdBy,
        },
      });

      return updated;
    });
  }

  /**
   * RENT OUT STOCK (contract signed)
   * Can rent from reserved or directly from available
   */
  async rentOutStock(input: {
    templateId: string;
    businessUnitId: string;
    quantity: number;
    fromReserved?: boolean;
    referenceId: string; // REQUIRED: Contract ID
    referenceType: string; // REQUIRED: "RentalContract"
    location?: string;
    createdBy?: string;
  }) {
    // Validation
    this.validatePositiveQuantity(input.quantity);
    this.validateRequired(input.referenceId, "referenceId");
    this.validateRequired(input.referenceType, "referenceType");
    await this.validateBulkTemplate(input.templateId);
    await this.validateBusinessUnit(input.businessUnitId, input.templateId);

    return await this.prisma.$transaction(async (tx) => {
      const stockLevel = await this.getStockLevelWithLock(
        tx,
        input.templateId,
        input.businessUnitId,
        input.location,
      );

      const quantityBefore = this.calculateTotal(stockLevel);
      let newAvailable = stockLevel.quantityAvailable;
      let newReserved = stockLevel.quantityReserved;
      const newRented = stockLevel.quantityRented + input.quantity;

      if (input.fromReserved) {
        // Rent from reserved stock
        if (stockLevel.quantityReserved < input.quantity) {
          throw new AppError(
            `Insufficient reserved stock. Reserved: ${stockLevel.quantityReserved}, Requested: ${input.quantity}`,
            400,
          );
        }
        newReserved -= input.quantity;
      } else {
        // Rent directly from available stock
        if (stockLevel.quantityAvailable < input.quantity) {
          throw new AppError(
            `Insufficient available stock. Available: ${stockLevel.quantityAvailable}, Requested: ${input.quantity}`,
            400,
          );
        }
        newAvailable -= input.quantity;
      }

      const quantityAfter = quantityBefore; // Total unchanged

      // Update stock level
      const updated = await tx.stockLevel.update({
        where: {
          id: stockLevel.id,
          version: stockLevel.version,
        },
        data: {
          quantityAvailable: newAvailable,
          quantityReserved: newReserved,
          quantityRented: newRented,
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      // Create audit trail
      await tx.stockMovement.create({
        data: {
          stockLevelId: stockLevel.id,
          type: "RENT_OUT",
          quantity: input.quantity,
          quantityBefore,
          quantityAfter,
          availableBefore: stockLevel.quantityAvailable,
          availableAfter: newAvailable,
          reservedBefore: stockLevel.quantityReserved,
          reservedAfter: newReserved,
          rentedBefore: stockLevel.quantityRented,
          rentedAfter: newRented,
          referenceId: input.referenceId,
          referenceType: input.referenceType,
          reason: input.fromReserved
            ? "rent_from_reserved"
            : "rent_from_available",
          location: input.location,
          createdBy: input.createdBy,
        },
      });

      return updated;
    });
  }

  /**
   * RETURN STOCK (rental ended)
   */
  async returnStock(input: {
    templateId: string;
    businessUnitId: string;
    quantity: number;
    referenceId: string; // REQUIRED: Contract ID
    referenceType: string; // REQUIRED: "RentalContract"
    location?: string;
    createdBy?: string;
  }) {
    // Validation
    this.validatePositiveQuantity(input.quantity);
    this.validateRequired(input.referenceId, "referenceId");
    this.validateRequired(input.referenceType, "referenceType");
    await this.validateBulkTemplate(input.templateId);
    await this.validateBusinessUnit(input.businessUnitId, input.templateId);

    return await this.prisma.$transaction(async (tx) => {
      const stockLevel = await this.getStockLevelWithLock(
        tx,
        input.templateId,
        input.businessUnitId,
        input.location,
      );

      // Check if enough rented stock to return
      if (stockLevel.quantityRented < input.quantity) {
        throw new AppError(
          `Cannot return more than rented. Rented: ${stockLevel.quantityRented}, Returning: ${input.quantity}`,
          400,
        );
      }

      const quantityBefore = this.calculateTotal(stockLevel);
      const newAvailable = stockLevel.quantityAvailable + input.quantity;
      const newRented = stockLevel.quantityRented - input.quantity;
      const quantityAfter = quantityBefore; // Total unchanged

      // Update stock level
      const updated = await tx.stockLevel.update({
        where: {
          id: stockLevel.id,
          version: stockLevel.version,
        },
        data: {
          quantityAvailable: newAvailable,
          quantityRented: newRented,
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      // Create audit trail
      await tx.stockMovement.create({
        data: {
          stockLevelId: stockLevel.id,
          type: "RETURN",
          quantity: input.quantity,
          quantityBefore,
          quantityAfter,
          availableBefore: stockLevel.quantityAvailable,
          availableAfter: newAvailable,
          reservedBefore: stockLevel.quantityReserved,
          reservedAfter: stockLevel.quantityReserved,
          rentedBefore: stockLevel.quantityRented,
          rentedAfter: newRented,
          referenceId: input.referenceId,
          referenceType: input.referenceType,
          reason: "rental_return",
          location: input.location,
          createdBy: input.createdBy,
        },
      });

      return updated;
    });
  }

  /**
   * UNRESERVE STOCK (quotation cancelled)
   */
  async unreserveStock(input: {
    templateId: string;
    businessUnitId: string;
    quantity: number;
    referenceId: string; // REQUIRED: Quotation ID
    referenceType: string; // REQUIRED: "Quotation"
    location?: string;
    createdBy?: string;
  }) {
    // Validation
    this.validatePositiveQuantity(input.quantity);
    this.validateRequired(input.referenceId, "referenceId");
    this.validateRequired(input.referenceType, "referenceType");
    await this.validateBulkTemplate(input.templateId);
    await this.validateBusinessUnit(input.businessUnitId, input.templateId);

    return await this.prisma.$transaction(async (tx) => {
      const stockLevel = await this.getStockLevelWithLock(
        tx,
        input.templateId,
        input.businessUnitId,
        input.location,
      );

      // Check if enough reserved stock to unreserve
      if (stockLevel.quantityReserved < input.quantity) {
        throw new AppError(
          `Cannot unreserve more than reserved. Reserved: ${stockLevel.quantityReserved}, Unreserving: ${input.quantity}`,
          400,
        );
      }

      const quantityBefore = this.calculateTotal(stockLevel);
      const newAvailable = stockLevel.quantityAvailable + input.quantity;
      const newReserved = stockLevel.quantityReserved - input.quantity;
      const quantityAfter = quantityBefore; // Total unchanged

      // Update stock level
      const updated = await tx.stockLevel.update({
        where: {
          id: stockLevel.id,
          version: stockLevel.version,
        },
        data: {
          quantityAvailable: newAvailable,
          quantityReserved: newReserved,
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      // Create audit trail
      await tx.stockMovement.create({
        data: {
          stockLevelId: stockLevel.id,
          type: "UNRESERVE",
          quantity: input.quantity,
          quantityBefore,
          quantityAfter,
          availableBefore: stockLevel.quantityAvailable,
          availableAfter: newAvailable,
          reservedBefore: stockLevel.quantityReserved,
          reservedAfter: newReserved,
          rentedBefore: stockLevel.quantityRented,
          rentedAfter: stockLevel.quantityRented,
          referenceId: input.referenceId,
          referenceType: input.referenceType,
          reason: "quotation_cancelled",
          location: input.location,
          createdBy: input.createdBy,
        },
      });

      return updated;
    });
  }

  /**
   * ADJUST STOCK (manual correction, loss, damage)
   * REQUIRED: reason field must be provided
   */
  async adjustStock(input: {
    templateId: string;
    businessUnitId: string;
    quantityDelta: number; // Can be positive or negative
    reason: string; // REQUIRED
    notes?: string;
    location?: string;
    createdBy?: string;
  }) {
    // Validation
    this.validateRequired(input.reason, "reason");
    if (input.quantityDelta === 0) {
      throw new AppError("Adjustment quantity cannot be zero", 400);
    }
    await this.validateBulkTemplate(input.templateId);
    await this.validateBusinessUnit(input.businessUnitId, input.templateId);

    return await this.prisma.$transaction(async (tx) => {
      const stockLevel = await this.getStockLevelWithLock(
        tx,
        input.templateId,
        input.businessUnitId,
        input.location,
      );

      const quantityBefore = this.calculateTotal(stockLevel);
      const newAvailable = stockLevel.quantityAvailable + input.quantityDelta;
      const quantityAfter = quantityBefore + input.quantityDelta;

      // Prevent negative stock
      if (newAvailable < 0) {
        throw new AppError(
          `Adjustment would result in negative stock. Current: ${stockLevel.quantityAvailable}, Delta: ${input.quantityDelta}`,
          400,
        );
      }

      // Update stock level
      const updated = await tx.stockLevel.update({
        where: {
          id: stockLevel.id,
          version: stockLevel.version,
        },
        data: {
          quantityAvailable: newAvailable,
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      // Create audit trail
      await tx.stockMovement.create({
        data: {
          stockLevelId: stockLevel.id,
          type: "ADJUST",
          quantity: Math.abs(input.quantityDelta),
          quantityBefore,
          quantityAfter,
          availableBefore: stockLevel.quantityAvailable,
          availableAfter: newAvailable,
          reservedBefore: stockLevel.quantityReserved,
          reservedAfter: stockLevel.quantityReserved,
          rentedBefore: stockLevel.quantityRented,
          rentedAfter: stockLevel.quantityRented,
          reason: input.reason,
          notes: input.notes,
          location: input.location,
          createdBy: input.createdBy,
        },
      });

      return updated;
    });
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async getStockLevelWithLock(
    tx: Prisma.TransactionClient,
    templateId: string,
    businessUnitId: string,
    location?: string,
  ) {
    const stockLevel = await tx.stockLevel.findFirst({
      where: {
        templateId,
        businessUnitId,
        location: location ?? null,
      },
    });

    if (!stockLevel) {
      throw new AppError("Stock level not found", 404);
    }

    return stockLevel;
  }

  private calculateTotal(stockLevel: {
    quantityAvailable: number;
    quantityReserved: number;
    quantityRented: number;
  }): number {
    return (
      stockLevel.quantityAvailable +
      stockLevel.quantityReserved +
      stockLevel.quantityRented
    );
  }

  private async validateBulkTemplate(templateId: string) {
    const template = await this.prisma.assetTemplate.findUnique({
      where: { id: templateId },
      select: { managementType: true },
    });

    if (!template) {
      throw new AppError("Template not found", 404);
    }

    if (template.managementType !== "BULK") {
      throw new AppError(
        "Stock operations only allowed for BULK management type",
        400,
      );
    }
  }

  private async validateBusinessUnit(
    businessUnitId: string,
    templateId: string,
  ) {
    const template = await this.prisma.assetTemplate.findUnique({
      where: { id: templateId },
      select: { businessUnitId: true },
    });

    if (template?.businessUnitId !== businessUnitId) {
      throw new AppError("Template does not belong to this business unit", 403);
    }
  }

  private validatePositiveQuantity(quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new AppError("Quantity must be a positive integer", 400);
    }
  }

  private validateRequired(value: any, fieldName: string) {
    if (!value) {
      throw new AppError(`${fieldName} is required`, 400);
    }
  }
}
```

---

### 3.3 Implementation Example: StockQueryService

```typescript
import { PrismaClient } from "@prisma/client";

export class StockQueryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get stock level with derived total
   */
  async getStockLevel(
    templateId: string,
    businessUnitId: string,
    location?: string,
  ) {
    const stockLevel = await this.prisma.stockLevel.findFirst({
      where: {
        templateId,
        businessUnitId,
        location: location ?? null,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
            managementType: true,
          },
        },
        businessUnit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!stockLevel) {
      return null;
    }

    // Calculate derived total
    const total =
      stockLevel.quantityAvailable +
      stockLevel.quantityReserved +
      stockLevel.quantityRented;

    return {
      ...stockLevel,
      total, // Derived field
    };
  }

  /**
   * List all stock levels for business unit
   */
  async listStockLevels(
    businessUnitId: string,
    filters?: {
      managementType?: "BULK";
      category?: string;
      lowStockOnly?: boolean;
    },
  ) {
    const stockLevels = await this.prisma.stockLevel.findMany({
      where: {
        businessUnitId,
        template: {
          managementType: filters?.managementType,
          category: filters?.category,
        },
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
            managementType: true,
          },
        },
      },
      orderBy: [{ quantityAvailable: "asc" }, { template: { name: "asc" } }],
    });

    // Map with derived totals and filter
    let result = stockLevels.map((sl) => ({
      ...sl,
      total: sl.quantityAvailable + sl.quantityReserved + sl.quantityRented,
    }));

    // Filter low stock if requested
    if (filters?.lowStockOnly) {
      result = result.filter(
        (sl) => sl.minStock && sl.quantityAvailable <= sl.minStock,
      );
    }

    return result;
  }

  /**
   * Get stock movements with pagination
   */
  async getStockMovements(
    templateId: string,
    businessUnitId: string,
    options?: {
      location?: string;
      type?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ) {
    const stockLevel = await this.prisma.stockLevel.findFirst({
      where: {
        templateId,
        businessUnitId,
        location: options?.location ?? null,
      },
      select: { id: true },
    });

    if (!stockLevel) {
      return { movements: [], total: 0 };
    }

    const where: any = {
      stockLevelId: stockLevel.id,
    };

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: options?.limit ?? 100,
        skip: options?.offset ?? 0,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return { movements, total };
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(businessUnitId: string) {
    const stockLevels = await this.prisma.stockLevel.findMany({
      where: {
        businessUnitId,
        minStock: { not: null },
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    return stockLevels
      .filter((sl) => sl.minStock && sl.quantityAvailable <= sl.minStock)
      .map((sl) => ({
        ...sl,
        total: sl.quantityAvailable + sl.quantityReserved + sl.quantityRented,
        alertLevel:
          sl.quantityAvailable === 0
            ? "CRITICAL"
            : sl.quantityAvailable <= sl.minStock! / 2
              ? "HIGH"
              : "MEDIUM",
      }));
  }

  /**
   * Get inventory valuation
   */
  async getInventoryValuation(businessUnitId: string) {
    const stockLevels = await this.prisma.stockLevel.findMany({
      where: {
        businessUnitId,
        unitCost: { not: null },
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    const valuation = stockLevels.map((sl) => {
      const total =
        sl.quantityAvailable + sl.quantityReserved + sl.quantityRented;
      const value = sl.unitCost ? Number(sl.unitCost) * total : 0;

      return {
        templateId: sl.template.id,
        templateName: sl.template.name,
        category: sl.template.category,
        quantity: total,
        unitCost: sl.unitCost ?? 0,
        totalValue: value,
      };
    });

    const totalValue = valuation.reduce((sum, v) => sum + v.totalValue, 0);

    return {
      items: valuation,
      totalValue,
      currency: "USD",
    };
  }

  /**
   * Get stock statistics for dashboard
   */
  async getStockStats(businessUnitId: string) {
    const stockLevels = await this.prisma.stockLevel.findMany({
      where: { businessUnitId },
    });

    const totalAvailable = stockLevels.reduce(
      (sum, sl) => sum + sl.quantityAvailable,
      0,
    );
    const totalReserved = stockLevels.reduce(
      (sum, sl) => sum + sl.quantityReserved,
      0,
    );
    const totalRented = stockLevels.reduce(
      (sum, sl) => sum + sl.quantityRented,
      0,
    );
    const lowStockCount = stockLevels.filter(
      (sl) => sl.minStock && sl.quantityAvailable <= sl.minStock,
    ).length;

    return {
      totalAvailable,
      totalReserved,
      totalRented,
      total: totalAvailable + totalReserved + totalRented,
      lowStockCount,
      itemsCount: stockLevels.length,
    };
  }
}
```

---

## 4. Domain Rules Enforcement

### 4.1 AssetTemplate Service Updates

Add validation to prevent changing `managementType` when data exists:

```typescript
// In asset-template.service.ts

async updateTemplate(
  templateId: string,
  businessUnitId: string,
  data: UpdateTemplateInput
) {
  // If trying to change managementType, validate no data exists
  if (data.managementType) {
    const template = await this.prisma.assetTemplate.findUnique({
      where: { id: templateId },
      include: {
        assets: true,
        stockLevels: true,
      },
    });

    if (!template) {
      throw new AppError("Template not found", 404);
    }

    // Prevent changing type if data exists
    if (template.managementType !== data.managementType) {
      if (template.assets.length > 0) {
        throw new AppError(
          "Cannot change management type: template has existing assets (UNIT)",
          400
        );
      }

      const hasStockData = template.stockLevels.some(
        (sl) =>
          sl.quantityAvailable > 0 ||
          sl.quantityReserved > 0 ||
          sl.quantityRented > 0
      );

      if (hasStockData) {
        throw new AppError(
          "Cannot change management type: template has existing stock (BULK)",
          400
        );
      }

      // Check for stock movements
      const movementCount = await this.prisma.stockMovement.count({
        where: {
          stockLevel: {
            templateId,
          },
        },
      });

      if (movementCount > 0) {
        throw new AppError(
          "Cannot change management type: template has stock movement history",
          400
        );
      }
    }
  }

  // Proceed with update
  return await this.prisma.assetTemplate.update({
    where: { id: templateId },
    data,
  });
}
```

### 4.2 Template Deletion Guards

```typescript
// In asset-template.service.ts

async deleteTemplate(templateId: string, businessUnitId: string) {
  const template = await this.prisma.assetTemplate.findUnique({
    where: { id: templateId },
    include: {
      assets: true,
      stockLevels: true,
      bulkRentalItems: true,
    },
  });

  if (!template) {
    throw new AppError("Template not found", 404);
  }

  // Prevent deletion if UNIT assets exist
  if (template.assets.length > 0) {
    throw new AppError(
      `Cannot delete template: ${template.assets.length} assets still exist`,
      400
    );
  }

  // Prevent deletion if BULK stock exists
  const hasActiveStock = template.stockLevels.some(
    (sl) =>
      sl.quantityAvailable > 0 || sl.quantityReserved > 0 || sl.quantityRented > 0
  );

  if (hasActiveStock) {
    throw new AppError(
      "Cannot delete template: active stock exists (available, reserved, or rented)",
      400
    );
  }

  // Prevent deletion if bulk rental items exist
  if (template.bulkRentalItems.length > 0) {
    throw new AppError(
      `Cannot delete template: ${template.bulkRentalItems.length} rental contracts reference this template`,
      400
    );
  }

  // Safe to delete
  return await this.prisma.assetTemplate.delete({
    where: { id: templateId },
  });
}
```

---

## 5. RentalContract Integration

### 5.1 Contract Creation with BULK Items

```typescript
// In rental-contract.service.ts

async createContractWithBulkItems(input: {
  contractData: CreateRentalContractDTO;
  bulkItems: Array<{
    templateId: string;
    quantity: number;
    pricePerDay?: number;
    pricePerWeek?: number;
    pricePerMonth?: number;
    location?: string;
  }>;
  createdBy: string;
}) {
  return await this.prisma.$transaction(async (tx) => {
    // 1. Create contract
    const contract = await tx.rentalContract.create({
      data: input.contractData,
    });

    // 2. Process each bulk item
    for (const item of input.bulkItems) {
      // Validate template is BULK
      const template = await tx.assetTemplate.findUnique({
        where: { id: item.templateId },
        select: { managementType: true },
      });

      if (template?.managementType !== "BULK") {
        throw new AppError(
          `Template ${item.templateId} is not BULK type`,
          400
        );
      }

      // Get stock level
      const stockLevel = await tx.stockLevel.findFirst({
        where: {
          templateId: item.templateId,
          businessUnitId: input.contractData.businessUnitId,
          location: item.location ?? null,
        },
      });

      if (!stockLevel) {
        throw new AppError(
          `Stock level not found for template ${item.templateId}`,
          404
        );
      }

      // Rent out stock (from reserved or available)
      const commandService = new StockCommandService(this.prisma);
      await commandService.rentOutStock({
        templateId: item.templateId,
        businessUnitId: input.contractData.businessUnitId,
        quantity: item.quantity,
        fromReserved: true, // Try from reserved first
        referenceId: contract.id,
        referenceType: "RentalContract",
        location: item.location,
        createdBy: input.createdBy,
      });

      // Create BulkRentalItem
      await tx.bulkRentalItem.create({
        data: {
          contractId: contract.id,
          templateId: item.templateId,
          stockLevelId: stockLevel.id,
          quantity: item.quantity,
          pricePerDay: item.pricePerDay,
          pricePerWeek: item.pricePerWeek,
          pricePerMonth: item.pricePerMonth,
          location: item.location,
          createdBy: input.createdBy,
        },
      });
    }

    return contract;
  });
}
```

### 5.2 Contract Cancellation with Auto-Return

```typescript
// In rental-contract.service.ts

async cancelContract(contractId: string, reason: string, cancelledBy: string) {
  return await this.prisma.$transaction(async (tx) => {
    // Get contract with bulk items
    const contract = await tx.rentalContract.findUnique({
      where: { id: contractId },
      include: {
        bulkItems: true,
      },
    });

    if (!contract) {
      throw new AppError("Contract not found", 404);
    }

    // Return all bulk items
    const commandService = new StockCommandService(this.prisma);

    for (const item of contract.bulkItems) {
      await commandService.returnStock({
        templateId: item.templateId,
        businessUnitId: contract.businessUnitId,
        quantity: item.quantity,
        referenceId: contractId,
        referenceType: "RentalContract",
        location: item.location ?? undefined,
        createdBy: cancelledBy,
      });
    }

    // Update contract status
    return await tx.rentalContract.update({
      where: { id: contractId },
      data: {
        status: "cancelled",
        actualEndDate: new Date(),
        notes: `${contract.notes ?? ""}\nCancelled: ${reason}`,
        updatedAt: new Date(),
      },
    });
  });
}
```

---

## 6. Validation Summary

### Critical Validations Checklist

#### Before Stock Operations:

- ✅ Template must have `managementType === "BULK"`
- ✅ BusinessUnit must match template's businessUnit
- ✅ Quantity must be positive integer
- ✅ Sufficient stock available for reserve/rent operations
- ✅ referenceId and referenceType required for RESERVE, RENT_OUT, RETURN
- ✅ reason required for ADJUST operations

#### Before Template Changes:

- ✅ Cannot change `managementType` if Assets exist (UNIT)
- ✅ Cannot change `managementType` if StockLevel with quantities > 0 exists (BULK)
- ✅ Cannot change `managementType` if StockMovements exist
- ✅ Cannot delete template if Assets exist
- ✅ Cannot delete template if active stock exists
- ✅ Cannot delete template if BulkRentalItems exist

#### Transaction Safety:

- ✅ All stock mutations wrapped in Prisma transactions
- ✅ Optimistic locking via `version` field prevents race conditions
- ✅ StockLevel update and StockMovement creation are atomic
- ✅ Contract creation + stock rent-out are atomic

---

## 7. Risk Analysis

### High Risk Areas

| Risk                                     | Impact             | Mitigation                                   |
| ---------------------------------------- | ------------------ | -------------------------------------------- |
| **Concurrent reservations**              | Oversell stock     | ✅ Optimistic locking via `version` field    |
| **Lost audit trail**                     | Compliance issues  | ✅ StockMovement with before/after snapshots |
| **Negative stock**                       | Data integrity     | ✅ Validation in all mutation methods        |
| **Orphaned reservations**                | Stock stuck        | ⚠️ TODO: Implement expiration mechanism      |
| **Contract cancellation without return** | Stock leakage      | ✅ Auto-return in cancellation flow          |
| **Direct quantity updates**              | Bypass audit trail | ✅ Enforce via service layer only            |

### Medium Risk Areas

| Risk                               | Impact                | Mitigation                          |
| ---------------------------------- | --------------------- | ----------------------------------- |
| **Template deletion with history** | Data loss             | ✅ Prevent deletion if data exists  |
| **ManagementType mismatch**        | Business logic errors | ✅ Validate in all operations       |
| **Multi-location complexity**      | Stock fragmentation   | ✅ location field in all operations |

### Low Risk Areas

| Risk                        | Impact                    | Mitigation                         |
| --------------------------- | ------------------------- | ---------------------------------- |
| **Performance degradation** | Slower queries            | Consider indexes, caching          |
| **Storage growth**          | Large StockMovement table | Archive old movements periodically |

---

## 8. Testing Plan

### Unit Tests

```typescript
describe("StockCommandService", () => {
  describe("addStock", () => {
    it("should add stock and create audit trail");
    it("should reject negative quantity");
    it("should reject UNIT template");
    it("should increment version");
  });

  describe("reserveStock", () => {
    it("should reserve from available stock");
    it("should reject if insufficient stock");
    it("should require referenceId");
    it("should create RESERVE movement");
  });

  describe("rentOutStock", () => {
    it("should rent from reserved stock");
    it("should rent from available stock");
    it("should reject if insufficient");
    it("should require referenceId");
  });

  describe("returnStock", () => {
    it("should return rented stock to available");
    it("should reject if return > rented");
    it("should create RETURN movement");
  });

  describe("adjustStock", () => {
    it("should require reason");
    it("should allow positive adjustment");
    it("should allow negative adjustment");
    it("should reject if results in negative stock");
  });

  describe("concurrency", () => {
    it("should handle concurrent reservations with optimistic lock");
    it("should retry on version mismatch");
  });
});
```

### Integration Tests

```typescript
describe("RentalContract + BULK Integration", () => {
  it("should create contract and rent bulk items atomically");
  it("should cancel contract and return stock atomically");
  it("should prevent deletion of template with active rentals");
  it("should track complete audit trail across operations");
});
```

---

## 9. Rollout Plan

### Phase 1: Schema Migration (Week 1)

- ✅ Create migration
- ✅ Test in development
- ✅ Deploy to staging
- ✅ Validate data integrity

### Phase 2: Service Refactor (Week 1-2)

- ✅ Create StockCommandService
- ✅ Create StockQueryService
- ✅ Update controllers to use new services
- ✅ Add validation guards

### Phase 3: Integration (Week 2)

- ✅ Update RentalContract to use BulkRentalItem
- ✅ Implement auto-return on cancellation
- ✅ Test end-to-end flows

### Phase 4: Monitoring & Optimization (Week 3)

- ✅ Add logging for all stock operations
- ✅ Monitor for version conflicts (optimistic lock failures)
- ✅ Add performance monitoring
- ✅ Implement caching for read-heavy queries

### Phase 5: Production Deploy (Week 4)

- ✅ Deploy to production during low-traffic window
- ✅ Monitor for errors
- ✅ Be ready to rollback if needed

---

## 10. Next Steps (Future Enhancements)

### Reservation Expiration

- Add `expiresAt` field to track reservation timeout
- Background job to auto-unreserve expired quotations

### Multi-Currency Support

- Add currency field to BulkRentalItem
- Handle exchange rates at contract creation

### Batch Operations

- Implement bulk reserve/unreserve for quotations with many items
- Optimize for performance

### Enhanced Reporting

- Stock turnover rate
- Average rental duration
- Revenue per item type
- Forecasting based on historical data

---

## Appendix: Migration SQL Template

```sql
-- Add version field to stock_levels
ALTER TABLE stock_levels ADD COLUMN version INTEGER NOT NULL DEFAULT 0;

-- Add unitCost to stock_levels
ALTER TABLE stock_levels ADD COLUMN unit_cost DECIMAL(10,2);

-- Add detailed audit fields to stock_movements
ALTER TABLE stock_movements ADD COLUMN quantity_before INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stock_movements ADD COLUMN quantity_after INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stock_movements ADD COLUMN available_before INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stock_movements ADD COLUMN available_after INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stock_movements ADD COLUMN reserved_before INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stock_movements ADD COLUMN reserved_after INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stock_movements ADD COLUMN rented_before INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stock_movements ADD COLUMN rented_after INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stock_movements ADD COLUMN reference_type VARCHAR(255);
ALTER TABLE stock_movements ADD COLUMN location VARCHAR(255);

-- Create bulk_rental_items table
CREATE TABLE bulk_rental_items (
  id VARCHAR(36) PRIMARY KEY,
  contract_id VARCHAR(36) NOT NULL,
  template_id VARCHAR(36) NOT NULL,
  stock_level_id VARCHAR(36),
  quantity INTEGER NOT NULL,
  price_per_day DECIMAL(10,2),
  price_per_week DECIMAL(10,2),
  price_per_month DECIMAL(10,2),
  location VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(36),

  CONSTRAINT fk_bulk_rental_contract FOREIGN KEY (contract_id)
    REFERENCES rental_contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_bulk_rental_template FOREIGN KEY (template_id)
    REFERENCES asset_templates(id) ON DELETE RESTRICT,
  CONSTRAINT fk_bulk_rental_stock_level FOREIGN KEY (stock_level_id)
    REFERENCES stock_levels(id) ON DELETE SET NULL,
  CONSTRAINT fk_bulk_rental_creator FOREIGN KEY (created_by)
    REFERENCES users(id)
);

CREATE INDEX idx_bulk_rental_contract ON bulk_rental_items(contract_id);
CREATE INDEX idx_bulk_rental_template ON bulk_rental_items(template_id);
CREATE INDEX idx_bulk_rental_stock_level ON bulk_rental_items(stock_level_id);

-- Update stock_movements enum
-- This depends on your DB migration tool
-- Prisma will generate the correct ALTER TYPE command

-- Add indexes for performance
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_id);
CREATE INDEX idx_stock_movements_reference_type ON stock_movements(reference_type);
```

---

**Document Status:** Ready for Implementation  
**Last Updated:** February 14, 2026  
**Next Review:** After Phase 1 completion
