# Multi-Tenant Hardening - Quick Reference

## For Developers

### ✅ What Changed

1. **Automatic Tenant Isolation**: All queries now require request context
2. **Strict Enforcement**: Accessing tenant-scoped models without context throws error
3. **BusinessUnit Validation**: BU must belong to user's tenant (validated at auth)
4. **Safe Defaults**: findUnique converted to findFirst with tenant filter

### ✅ What You DON'T Need to Change

- ❌ Service layer code (already works)
- ❌ Controller code (already works)
- ❌ Domain services (already works)
- ❌ API routes (already works)

**Why?** The middleware automatically injects tenant filters. Your code continues to work as-is.

---

## Common Scenarios

### Scenario 1: Regular API Request

**No changes needed!**

```typescript
// Service
async getAssets(businessUnitId: string) {
  // ✅ tenantId automatically injected by middleware
  return prisma.asset.findMany({
    where: { businessUnitId }
  });
}

// Controller
async listAssets(req: Request, res: Response) {
  const { businessUnitId } = req.context!; // Set by auth middleware
  const assets = await assetService.getAssets(businessUnitId);
  res.json({ data: assets });
}
```

### Scenario 2: Background Job

**Use runWithContext()**

```typescript
import { runWithContext } from "@divancosaas/shared";
import { prismaBase } from "@config/database";

// ❌ Wrong - will throw TenantContextError
cron.schedule("0 0 * * *", async () => {
  await prisma.asset.findMany(); // ERROR: no context
});

// ✅ Correct - iterate tenants with context
cron.schedule("0 0 * * *", async () => {
  const tenants = await prismaBase.tenant.findMany({
    where: { status: "ACTIVE" },
  });

  for (const tenant of tenants) {
    await runWithContext(
      {
        tenantId: tenant.id,
        userId: "system",
        businessUnitId: undefined,
      },
      async () => {
        // ✅ All queries here auto-filtered to this tenant
        await generateReports();
        await sendNotifications();
      },
    );
  }
});
```

### Scenario 3: Seed/Migration Script

**Use prismaBase**

```typescript
import { prismaBase } from "@config/database";

// ✅ Use unextended client (no tenant filtering)
const prisma = prismaBase;

async function seed() {
  // Create tenants
  const tenant1 = await prisma.tenant.create({
    data: { name: "Tenant 1" },
  });

  // Create BU
  const bu = await prisma.businessUnit.create({
    data: {
      tenantId: tenant1.id,
      name: "Main BU",
    },
  });

  // Create assets (no auto-injection, must provide tenantId)
  await prisma.asset.create({
    data: {
      tenantId: tenant1.id,
      businessUnitId: bu.id,
      name: "Asset 1",
    },
  });
}
```

### Scenario 4: System-Wide Query

**Use prismaBase**

```typescript
import { prismaBase } from "@config/database";

// ❌ Wrong - filtered to current tenant only
const allTenants = await prisma.tenant.findMany();

// ✅ Correct - bypass tenant filtering
const allTenants = await prismaBase.tenant.findMany();

// ❌ Wrong - will only see current tenant's users
const allUsers = await prisma.user.findMany();

// ✅ Correct - see all users across all tenants
const allUsers = await prismaBase.user.findMany();
```

### Scenario 5: Webhook Handler

**Use validateTenantHeader + optionalContextInjector**

```typescript
import {
  optionalContextInjector,
  validateTenantHeader,
} from "@core/middlewares/context.middleware";

// Register middlewares in order
webhookRouter.use(verifyWebhookSignature); // Your custom signature validation
webhookRouter.use(validateTenantHeader); // Validates tenant exists & active
webhookRouter.use(optionalContextInjector); // Injects context

webhookRouter.post("/payment-received", async (req, res) => {
  // ✅ Context now set, queries auto-filtered
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.body.invoiceId },
  });

  res.json({ success: true });
});
```

---

## Testing

### Unit Tests

```typescript
import { runWithContext } from "@divancosaas/shared";
import { prismaBase } from "@config/database";

describe("AssetService", () => {
  let testTenant: Tenant;
  let testUser: User;

  beforeEach(async () => {
    // Setup test data with prismaBase
    testTenant = await prismaBase.tenant.create({
      data: { name: "Test Tenant" },
    });

    testUser = await prismaBase.user.create({
      data: {
        tenantId: testTenant.id,
        email: "test@example.com",
      },
    });
  });

  it("should only return tenant's assets", async () => {
    // ✅ Run test with context
    await runWithContext(
      {
        tenantId: testTenant.id,
        userId: testUser.id,
      },
      async () => {
        const assets = await assetService.getAll();

        // All assets should belong to test tenant
        expect(assets.every((a) => a.tenantId === testTenant.id)).toBe(true);
      },
    );
  });
});
```

### Integration Tests

```typescript
import request from "supertest";
import { app } from "@/app";

describe("Asset API", () => {
  let tenant1Token: string;
  let tenant2Token: string;

  beforeEach(async () => {
    tenant1Token = await loginAs(tenant1User);
    tenant2Token = await loginAs(tenant2User);
  });

  it("prevents cross-tenant access", async () => {
    // Create asset as tenant1
    const created = await request(app)
      .post("/api/v1/assets")
      .set("Authorization", `Bearer ${tenant1Token}`)
      .send({ name: "Asset 1" })
      .expect(201);

    // Try to access as tenant2 - should not be found
    await request(app)
      .get(`/api/v1/assets/${created.body.data.id}`)
      .set("Authorization", `Bearer ${tenant2Token}`)
      .expect(404); // Or 403, depending on your API design
  });
});
```

---

## Troubleshooting

### Error: TenantContextError

**Full message**:

```
[TENANT ISOLATION VIOLATION] Cannot perform findMany on model "asset" without tenant context.
This is a security error. Ensure:
1) contextInjector middleware is registered, OR
2) Use runWithContext() for background jobs, OR
3) Use prismaBase for system operations (seeds/migrations).
```

**Cause**: Trying to access tenant-scoped model without request context

**Solutions**:

1. **API endpoint**: Ensure `contextInjector` middleware registered

   ```typescript
   app.use(authenticate);
   app.use(contextInjector); // ← Must be after authenticate
   app.use("/api/v1", routes);
   ```

2. **Background job**: Wrap in runWithContext()

   ```typescript
   await runWithContext({ tenantId, userId: "system" }, async () => {
     await processData();
   });
   ```

3. **System operation**: Use prismaBase
   ```typescript
   import { prismaBase } from "@config/database";
   await prismaBase.tenant.findMany();
   ```

### Error: Business unit does not belong to your tenant

**Message**: `Business unit does not belong to your tenant`

**Cause**: User tried to access BU from different tenant (security violation)

**Action**:

- Check if user manipulated X-Business-Unit-ID header
- Verify user has UserBusinessUnit relation to requested BU
- Review security logs for potential attack

### Warning: Converting findUnique to findFirst

**Message**:

```
[Prisma Security] Converting asset.findUnique to findFirst with tenant filter.
Consider using findFirst directly for better clarity.
```

**Cause**: Using findUnique() on tenant-scoped model

**Recommendation**: Use findFirst() explicitly

```typescript
// ❌ Less clear (converted internally)
const asset = await prisma.asset.findUnique({
  where: { id: assetId },
});

// ✅ More clear
const asset = await prisma.asset.findFirst({
  where: { id: assetId },
  // tenantId automatically added
});
```

---

## Performance Tips

### 1. Use Composite Indexes

If querying frequently by tenant + another field:

```prisma
model Asset {
  id       String @id
  tenantId String
  status   String

  @@index([tenantId, status]) // ← Composite index
}
```

### 2. Avoid N+1 Queries

Use `include` or `select` for relations:

```typescript
// ❌ N+1 problem
const assets = await prisma.asset.findMany();
for (const asset of assets) {
  const template = await prisma.assetTemplate.findUnique({
    where: { id: asset.templateId },
  });
}

// ✅ Single query with join
const assets = await prisma.asset.findMany({
  include: { template: true },
});
```

### 3. Use Pagination

Don't load all records at once:

```typescript
// ❌ Loads all tenant's assets (could be thousands)
const assets = await prisma.asset.findMany();

// ✅ Paginate
const assets = await prisma.asset.findMany({
  take: 50,
  skip: page * 50,
  orderBy: { createdAt: "desc" },
});
```

---

## Security Best Practices

### 1. Never Trust Client Input

```typescript
// ❌ DANGER: User could send another tenant's ID
const asset = await prisma.asset.findUnique({
  where: { id: req.body.assetId },
  // Even though middleware filters, always validate ownership
});

// ✅ SAFE: Verify belongs to user's context
const { tenantId, businessUnitId } = req.context!;
const asset = await prisma.asset.findFirst({
  where: {
    id: req.body.assetId,
    // Explicitly verify (middleware also does this, but defense in depth)
    tenantId,
    businessUnitId,
  },
});

if (!asset) {
  throw new NotFoundError("Asset not found");
}
```

### 2. Validate Relations

```typescript
// When creating related records, verify parent belongs to tenant
async createRentalContract(data: CreateContractDTO) {
  const { tenantId } = req.context!;

  // ✅ Verify client belongs to this tenant
  const client = await prisma.client.findFirst({
    where: {
      id: data.clientId,
      tenantId // Middleware adds this, but explicit is clearer
    }
  });

  if (!client) {
    throw new ForbiddenError("Client not found in your tenant");
  }

  // Now safe to create contract
  return prisma.rentalContract.create({
    data: {
      clientId: data.clientId,
      // tenantId auto-injected by middleware
    }
  });
}
```

### 3. Audit Sensitive Operations

```typescript
// Log deletions for audit trail
async deleteAsset(assetId: string) {
  const { tenantId, userId } = req.context!;

  const asset = await prisma.asset.findFirst({
    where: { id: assetId }
  });

  if (!asset) {
    throw new NotFoundError();
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      tenantId,
      userId,
      action: "DELETE",
      resource: "Asset",
      resourceId: assetId,
      metadata: { assetName: asset.name }
    }
  });

  await prisma.asset.delete({
    where: { id: assetId }
  });
}
```

---

## Quick Commands

### Check if Context Available

```typescript
import { hasRequestContext, getTenantId } from "@divancosaas/shared";

if (hasRequestContext()) {
  const tenantId = getTenantId();
  console.log("Current tenant:", tenantId);
} else {
  console.log("No context (seed/migration/job)");
}
```

### Get Context Values

```typescript
import {
  getTenantId,
  getBusinessUnitId,
  getUserId,
  requireBusinessUnitId,
} from "@divancosaas/shared";

// May return undefined
const tenantId = getTenantId();

// Returns undefined if not set
const buId = getBusinessUnitId();

// Throws error if no BU in context
const requiredBuId = requireBusinessUnitId();

// Get user ID
const userId = getUserId();
```

---

## Model Categories Reference

### Tenant-Scoped (59 models)

Always filtered by tenantId, cannot access without context.

**Examples**: `asset`, `client`, `rentalContract`, `quotation`, `stockLevel`

### Business Unit-Scoped (12 models)

Filtered by both tenantId AND businessUnitId (if BU in context).

**Examples**: `asset`, `stockLevel`, `rentalContract`, `quotation`

### Global (4 models)

Never filtered, accessible without context.

**Examples**: `tenant`, `module`, `permission`, `intentDefinition`

### Special Handling (9 models)

Complex relationships, filtered indirectly.

**Examples**: `role`, `businessUnitModule`, `integrationCredential`

---

## FAQ

### Q: Do I need to pass tenantId everywhere now?

**A**: No! The middleware automatically injects it. Your existing code continues to work.

### Q: What if I forget to add runWithContext() in a background job?

**A**: You'll get a clear error message telling you exactly what to do. The system fails safe (throws error vs. leaking data).

### Q: How do I query across all tenants?

**A**: Use `prismaBase` instead of `prisma`:

```typescript
import { prismaBase } from "@config/database";
const allTenants = await prismaBase.tenant.findMany();
```

### Q: Will this slow down my queries?

**A**: No. The overhead is negligible (<1ms). Indexes already exist on tenantId.

### Q: Can I still use findUnique()?

**A**: Yes, but it's converted to findFirst() internally. For clarity, use findFirst() directly.

### Q: What about tests?

**A**: Wrap test code in `runWithContext()` or use `prismaBase` for setup:

```typescript
await runWithContext({ tenantId, userId }, async () => {
  // Test code here
});
```

---

## Support

- **Documentation**: [MULTI_TENANT_HARDENING.md](./MULTI_TENANT_HARDENING.md)
- **Migration Plan**: [MIGRATION_PLAN_TENANT_HARDENING.md](./MIGRATION_PLAN_TENANT_HARDENING.md)
- **Security**: Contact security team for architecture questions
- **Bugs**: Create issue with label `tenant-isolation`

---

**Last Updated**: February 14, 2026  
**Version**: 1.0
