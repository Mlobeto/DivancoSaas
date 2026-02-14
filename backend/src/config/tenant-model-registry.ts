/**
 * Tenant Model Registry
 *
 * Centralized registry for tenant-scoped and business unit-scoped models.
 * This is used by Prisma middleware to automatically enforce tenant isolation.
 *
 * ADDING NEW MODELS:
 * 1. Ensure the Prisma model has `tenantId String` field
 * 2. Add `@@index([tenantId])` to the model
 * 3. Add FK relation: `tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)`
 * 4. Add model name to TENANT_SCOPED_MODELS below
 * 5. If model also has businessUnitId, add to BUSINESS_UNIT_SCOPED_MODELS
 * 6. Generate migration
 */

/**
 * Models that MUST be filtered by tenantId
 *
 * These models contain tenant-specific data and MUST NEVER
 * be accessed without tenant isolation.
 */
export const TENANT_SCOPED_MODELS = [
  // User management
  "user",
  "businessUnit",
  "userBusinessUnit",

  // Assets - Core domain
  "asset",
  "assetState",
  "assetEvent",
  "maintenanceRecord",
  "assetUsage",
  "assetRental",
  "assetAttachment",
  "assetDocumentType",

  // Inventory - BULK management
  "stockLevel",
  "stockMovement",
  "bulkRentalItem",

  // Clients
  "client",
  "clientAccount",
  "clientBusinessUnit",
  "clientContact",
  "clientTaxProfile",
  "clientAccountMovement",
  "clientRankingConfig",
  "clientRiskSnapshot",

  // Supply chain
  "supplyCategory",
  "supply",
  "supplyUsage",
  "supplier",
  "supplierContact",
  "supplierAccountEntry",
  "supplyQuote",

  // Purchases
  "purchaseOrder",
  "purchaseOrderItem",
  "stockTransaction",

  // Rentals
  "rentalContract",
  "rentalAccountMovement",
  "contractAsset",
  "usageReport",
  "incident",
  "preventiveConfig",
  "maintenanceEvent",

  // Quotations & Templates
  "template",
  "quotation",
  "quotationItem",
  "quotationContract",

  // Platform subscription (tenant-level)
  "platformSubscription",

  // Audit & Events
  "auditLog",
  "eventQueue",
] as const;

/**
 * Models that require BOTH tenantId AND businessUnitId
 *
 * These models are scoped to a specific business unit within a tenant.
 * Both tenant AND business unit isolation must be enforced.
 */
export const BUSINESS_UNIT_SCOPED_MODELS = [
  // Asset domain - BU specific
  "asset",
  "assetTemplate", // Note: AssetTemplate has businessUnitId but NOT tenantId (belongs to BU directly)
  "assetState",
  "assetEvent",

  // Inventory - BULK
  "stockLevel",
  "stockMovement",
  "bulkRentalItem",

  // Supply management
  "supply",
  "supplyUsage",

  // Purchases & Transactions
  "purchaseOrder",
  "stockTransaction",

  // Rentals
  "rentalContract",
  "quotation",
] as const;

/**
 * Models that are GLOBAL and should NEVER be filtered by tenant
 *
 * These contain system-wide configuration or reference data.
 */
export const GLOBAL_MODELS = [
  "tenant", // Obviously global
  "module", // System modules
  "permission", // System permissions
  "intentDefinition", // AI intent definitions
] as const;

/**
 * Models that have special handling
 *
 * These models exist but have complex relationships or special rules.
 * They may be tenant-scoped indirectly through relations.
 */
export const SPECIAL_HANDLING_MODELS = [
  "role", // Belongs to tenant indirectly via BusinessUnit
  "rolePermission", // Junction table - enforce via Role
  "businessUnitModule", // Junction - enforce via BusinessUnit
  "integrationCredential", // Belongs to tenant via BusinessUnit
  "businessUnitIntegration", // Belongs to tenant via BusinessUnit
  "businessUnitChannelConfig", // Belongs to tenant via BusinessUnit
  "businessUnitIntent", // Belongs to tenant via BusinessUnit
  "userChannelIdentity", // Belongs to tenant via User
  "workflow", // System-wide workflows
  "systemAnnouncement", // Global announcements
] as const;

/**
 * Type exports for type safety
 */
export type TenantScopedModel = (typeof TENANT_SCOPED_MODELS)[number];
export type BusinessUnitScopedModel =
  (typeof BUSINESS_UNIT_SCOPED_MODELS)[number];
export type GlobalModel = (typeof GLOBAL_MODELS)[number];
export type SpecialHandlingModel = (typeof SPECIAL_HANDLING_MODELS)[number];

/**
 * Check if a model is tenant-scoped
 */
export function isTenantScoped(
  modelName: string,
): modelName is TenantScopedModel {
  return TENANT_SCOPED_MODELS.includes(modelName as any);
}

/**
 * Check if a model requires business unit scoping
 */
export function isBusinessUnitScoped(
  modelName: string,
): modelName is BusinessUnitScopedModel {
  return BUSINESS_UNIT_SCOPED_MODELS.includes(modelName as any);
}

/**
 * Check if a model is global (no tenant filtering)
 */
export function isGlobalModel(modelName: string): modelName is GlobalModel {
  return GLOBAL_MODELS.includes(modelName as any);
}

/**
 * Check if model needs special handling
 */
export function hasSpecialHandling(
  modelName: string,
): modelName is SpecialHandlingModel {
  return SPECIAL_HANDLING_MODELS.includes(modelName as any);
}

/**
 * Validation: Ensure a model is properly registered
 *
 * This helps catch configuration errors at startup.
 */
export function validateModelRegistration(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for duplicates between categories
  const allModels = [
    ...TENANT_SCOPED_MODELS,
    ...GLOBAL_MODELS,
    ...SPECIAL_HANDLING_MODELS,
  ];

  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const model of allModels) {
    if (seen.has(model)) {
      duplicates.add(model);
    }
    seen.add(model);
  }

  if (duplicates.size > 0) {
    errors.push(
      `Duplicate models found in registry: ${Array.from(duplicates).join(", ")}`,
    );
  }

  // Validate: BU-scoped models must also be tenant-scoped (except assetTemplate)
  for (const model of BUSINESS_UNIT_SCOPED_MODELS) {
    if (
      model !== "assetTemplate" &&
      !TENANT_SCOPED_MODELS.includes(model as any)
    ) {
      errors.push(
        `Model "${model}" is in BUSINESS_UNIT_SCOPED_MODELS but not in TENANT_SCOPED_MODELS. ` +
          `All BU-scoped models must also be tenant-scoped.`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get enforcement strategy for a model
 */
export function getEnforcementStrategy(modelName: string): {
  requireTenant: boolean;
  requireBusinessUnit: boolean;
  strategy: "strict" | "optional" | "none" | "special";
} {
  if (isGlobalModel(modelName)) {
    return {
      requireTenant: false,
      requireBusinessUnit: false,
      strategy: "none",
    };
  }

  if (hasSpecialHandling(modelName)) {
    return {
      requireTenant: false,
      requireBusinessUnit: false,
      strategy: "special",
    };
  }

  const requireTenant = isTenantScoped(modelName);
  const requireBusinessUnit = isBusinessUnitScoped(modelName);

  return {
    requireTenant,
    requireBusinessUnit,
    strategy: requireTenant ? "strict" : "optional",
  };
}
