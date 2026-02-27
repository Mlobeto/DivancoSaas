import type { Request, Response } from "express";
import { tenantService } from "@core/services/tenant.service";
import { UserRole } from "@prisma/client";

/**
 * Tenant Controller
 *
 * Handles CRUD operations for tenants (SUPER_ADMIN only)
 *
 * Note: Request is extended globally in auth.middleware.ts with user property
 */
export class TenantController {
  /**
   * GET /api/v1/tenants
   * List all tenants
   */
  async getAllTenants(req: Request, res: Response) {
    try {
      // Only SUPER_ADMIN can list all tenants
      if (req.user?.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          error: "Only SUPER_ADMIN can access this resource",
        });
      }

      const tenants = await tenantService.getAllTenants();

      res.json({
        success: true,
        data: tenants,
        count: tenants.length,
      });
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch tenants",
      });
    }
  }

  /**
   * GET /api/v1/tenants/:id
   * Get tenant by ID
   */
  async getTenantById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;

      // Only SUPER_ADMIN can view any tenant
      // OWNER can only view their own tenant
      if (req.user?.role === UserRole.SUPER_ADMIN) {
        // Can view any tenant
      } else if (req.user?.tenantId === id) {
        // Can view own tenant
      } else {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      const tenant = await tenantService.getTenantById(id);

      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: "Tenant not found",
        });
      }

      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      console.error("Error fetching tenant:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch tenant",
      });
    }
  }

  /**
   * POST /api/v1/tenants
   * Create new tenant
   */
  async createTenant(req: Request, res: Response) {
    try {
      // Only SUPER_ADMIN can create tenants
      if (req.user?.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          error: "Only SUPER_ADMIN can create tenants",
        });
      }

      const {
        name,
        slug,
        plan,
        billingEmail,
        contactEmail,
        contactPhone,
        country,
        preferredPaymentProvider,
        enabledModules,
        vertical,
        // Owner user data
        ownerEmail,
        ownerFirstName,
        ownerLastName,
        ownerPassword,
      } = req.body;

      // Validate required fields
      if (!name || !slug) {
        return res.status(400).json({
          success: false,
          error: "Name and slug are required",
        });
      }

      // Validate owner fields
      if (!ownerEmail || !ownerFirstName || !ownerLastName || !ownerPassword) {
        return res.status(400).json({
          success: false,
          error: "Owner user information is required",
        });
      }

      // Check if slug is available
      const isAvailable = await tenantService.isSlugAvailable(slug);
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          error: "Slug is already taken",
        });
      }

      // Create tenant with owner user
      const tenant = await tenantService.createTenant({
        name,
        slug,
        plan,
        billingEmail,
        contactEmail,
        contactPhone,
        country,
        preferredPaymentProvider,
        enabledModules,
        vertical,
        ownerEmail,
        ownerFirstName,
        ownerLastName,
        ownerPassword,
      });

      res.status(201).json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      console.error("Error creating tenant:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create tenant",
      });
    }
  }

  /**
   * PUT /api/v1/tenants/:id
   * Update tenant
   */
  async updateTenant(req: Request, res: Response) {
    try {
      const id = req.params.id as string;

      // Only SUPER_ADMIN can update tenants
      if (req.user?.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          error: "Only SUPER_ADMIN can update tenants",
        });
      }

      const {
        name,
        slug,
        plan,
        billingEmail,
        contactEmail,
        contactPhone,
        country,
        preferredPaymentProvider,
        status,
        enabledModules,
        vertical,
      } = req.body;

      // If updating slug, check availability
      if (slug) {
        const isAvailable = await tenantService.isSlugAvailable(slug, id);
        if (!isAvailable) {
          return res.status(400).json({
            success: false,
            error: "Slug is already taken",
          });
        }
      }

      const tenant = await tenantService.updateTenant(id, {
        name,
        slug,
        plan,
        billingEmail,
        contactEmail,
        contactPhone,
        country,
        preferredPaymentProvider,
        status,
        enabledModules,
        vertical,
      });

      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      console.error("Error updating tenant:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update tenant",
      });
    }
  }

  /**
   * DELETE /api/v1/tenants/:id
   * Delete tenant (soft delete)
   */
  async deleteTenant(req: Request, res: Response) {
    try {
      const id = req.params.id as string;

      // Only SUPER_ADMIN can delete tenants
      if (req.user?.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          error: "Only SUPER_ADMIN can delete tenants",
        });
      }

      await tenantService.deleteTenant(id);

      res.json({
        success: true,
        message: "Tenant deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting tenant:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete tenant",
      });
    }
  }

  /**
   * GET /api/v1/tenants/me
   * Get current tenant (for authenticated users)
   */
  async getCurrentTenant(req: Request, res: Response) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: "User is not associated with a tenant",
        });
      }

      const tenant = await tenantService.getTenantById(tenantId);

      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: "Tenant not found",
        });
      }

      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      console.error("Error fetching current tenant:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch tenant",
      });
    }
  }
}

export const tenantController = new TenantController();
