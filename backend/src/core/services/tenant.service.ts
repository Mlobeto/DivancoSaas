import prisma from "@config/database";
import type { Tenant, TenantStatus } from "@prisma/client";
import bcrypt from "bcrypt";

export interface CreateTenantInput {
  name: string;
  slug: string;
  plan?: string;
  billingEmail?: string;
  country?: string;
  preferredPaymentProvider?: string;
  enabledModules?: string[]; // inventory, clients, purchases, etc.
  vertical?: string; // rental, construction, etc.
  // Owner user data
  ownerEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerPassword: string;
}

interface UpdateTenantInput {
  name?: string;
  slug?: string;
  plan?: string;
  billingEmail?: string;
  country?: string;
  preferredPaymentProvider?: string;
  status?: TenantStatus;
  enabledModules?: string[];
  vertical?: string;
}

interface TenantWithConfig extends Tenant {
  enabledModules: string[];
  vertical: string | null;
}

/**
 * Tenant Service
 *
 * Manages tenant (client) CRUD operations for SUPER_ADMIN
 */
export class TenantService {
  /**
   * Get all tenants (SUPER_ADMIN only)
   */
  async getAllTenants(): Promise<TenantWithConfig[]> {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        businessUnits: {
          select: { id: true, name: true, settings: true },
        },
        _count: {
          select: {
            users: true,
            businessUnits: true,
          },
        },
      },
    });

    // Get enabledModules and vertical from first BusinessUnit settings
    return tenants.map((tenant) => {
      const firstBU = tenant.businessUnits[0];
      const settings = (firstBU?.settings as any) || {};
      return {
        ...tenant,
        enabledModules: settings.enabledModules || [],
        vertical: settings.vertical || null,
      };
    });
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(id: string): Promise<TenantWithConfig | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        businessUnits: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!tenant) return null;

    // Get enabledModules and vertical from first BusinessUnit settings
    const firstBU = tenant.businessUnits[0];
    const settings = (firstBU?.settings as any) || {};

    return {
      ...tenant,
      enabledModules: settings.enabledModules || [],
      vertical: settings.vertical || null,
    };
  }

  /**
   * Create new tenant with owner user and default Business Unit
   */
  async createTenant(data: CreateTenantInput): Promise<TenantWithConfig> {
    // Check if owner email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.ownerEmail },
    });

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.ownerPassword, 10);

    // Use transaction to create tenant, user, business unit, and role assignment
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          plan: data.plan || "free",
          billingEmail: data.billingEmail,
          country: data.country,
          preferredPaymentProvider: data.preferredPaymentProvider,
        },
      });

      // 2. Create default "OWNER" role if it doesn't exist
      let ownerRole = await tx.role.findFirst({
        where: { name: "OWNER" },
      });

      if (!ownerRole) {
        ownerRole = await tx.role.create({
          data: {
            name: "OWNER",
            description: "Business owner with full access",
            isSystem: false,
          },
        });
      }

      // 3. Create owner user
      const ownerUser = await tx.user.create({
        data: {
          email: data.ownerEmail,
          password: hashedPassword,
          firstName: data.ownerFirstName,
          lastName: data.ownerLastName,
          role: "USER", // Global role (not SUPER_ADMIN)
          tenantId: tenant.id,
          status: "ACTIVE",
        },
      });

      // 4. Create default Business Unit
      const businessUnit = await tx.businessUnit.create({
        data: {
          name: `${tenant.name} - Principal`,
          slug: `${data.slug}-principal`,
          description: "Business Unit principal",
          tenantId: tenant.id,
          settings: {
            enabledModules: data.enabledModules || [],
            vertical: data.vertical || null,
          },
        },
      });

      // 5. Assign owner user to business unit with OWNER role
      await tx.userBusinessUnit.create({
        data: {
          userId: ownerUser.id,
          businessUnitId: businessUnit.id,
          roleId: ownerRole.id,
        },
      });

      return { tenant, businessUnit };
    });

    // Get enabledModules and vertical from BusinessUnit settings
    const settings = (result.businessUnit.settings as any) || {};
    const { enabledModules = [], vertical = null } = settings;

    return {
      ...result.tenant,
      enabledModules,
      vertical,
    };
  }

  /**
   * Update tenant
   */
  async updateTenant(
    id: string,
    data: UpdateTenantInput,
  ): Promise<TenantWithConfig> {
    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        plan: data.plan,
        billingEmail: data.billingEmail,
        country: data.country,
        preferredPaymentProvider: data.preferredPaymentProvider,
        status: data.status,
      },
      include: {
        businessUnits: {
          select: { id: true, settings: true },
        },
      },
    });

    // Update enabledModules and vertical in first BusinessUnit settings
    if (
      tenant.businessUnits[0] &&
      (data.enabledModules !== undefined || data.vertical !== undefined)
    ) {
      const currentSettings = (tenant.businessUnits[0].settings as any) || {};
      await prisma.businessUnit.update({
        where: { id: tenant.businessUnits[0].id },
        data: {
          settings: {
            ...currentSettings,
            ...(data.enabledModules !== undefined && {
              enabledModules: data.enabledModules,
            }),
            ...(data.vertical !== undefined && { vertical: data.vertical }),
          },
        },
      });
    }

    const { enabledModules = [], vertical = null } = data;

    return {
      ...tenant,
      enabledModules,
      vertical,
    };
  }

  /**
   * Delete tenant (soft delete - set status to CANCELLED)
   */
  async deleteTenant(id: string): Promise<void> {
    await prisma.tenant.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(
    slug: string,
    excludeTenantId?: string,
  ): Promise<boolean> {
    const existing = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!existing) return true;
    if (excludeTenantId && existing.id === excludeTenantId) return true;

    return false;
  }
}

export const tenantService = new TenantService();
