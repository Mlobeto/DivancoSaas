/**
 * Business Unit Branding Service
 * Manages branding configuration per Business Unit
 */

import { PrismaClient } from "@prisma/client";
import type {
  CreateBrandingDTO,
  UpdateBrandingDTO,
  ContactInfo,
  HeaderConfig,
  FooterConfig,
} from "../types/branding.types";

const prisma = new PrismaClient();

class BrandingService {
  /**
   * Get branding for a business unit
   */
  async get(businessUnitId: string) {
    const branding = await prisma.businessUnitBranding.findUnique({
      where: { businessUnitId },
      include: {
        businessUnit: {
          select: {
            id: true,
            name: true,
            slug: true,
            settings: true,
          },
        },
      },
    });

    if (!branding) {
      return null;
    }

    // Ensure footerConfig has textAlign (for backward compatibility)
    const footerConfig = branding.footerConfig as unknown as FooterConfig;
    if (!footerConfig.textAlign) {
      footerConfig.textAlign = "center";
    }

    return {
      ...branding,
      contactInfo: branding.contactInfo as unknown as ContactInfo,
      headerConfig: branding.headerConfig as unknown as HeaderConfig,
      footerConfig,
    };
  }

  /**
   * Get or create default branding for a business unit
   */
  async getOrCreateDefault(businessUnitId: string) {
    let branding = await this.get(businessUnitId);

    if (!branding) {
      branding = await this.create({ businessUnitId });
    }

    return branding;
  }

  /**
   * Create branding for a business unit
   */
  async create(data: CreateBrandingDTO) {
    // Default header config
    const defaultHeaderConfig: HeaderConfig = {
      showLogo: true,
      logoAlign: "left",
      showBusinessName: true,
      showTaxInfo: false,
      height: 80,
    };

    // Default footer config
    const defaultFooterConfig: FooterConfig = {
      showContactInfo: true,
      showDisclaimer: false,
      textAlign: "center",
      height: 60,
    };

    // Merge with provided config
    const headerConfig = {
      ...defaultHeaderConfig,
      ...data.headerConfig,
    };

    const footerConfig = {
      ...defaultFooterConfig,
      ...data.footerConfig,
    };

    const branding = await prisma.businessUnitBranding.create({
      data: {
        businessUnitId: data.businessUnitId,
        logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor || "#1E40AF",
        secondaryColor: data.secondaryColor || "#64748B",
        fontFamily: data.fontFamily || "Inter",
        contactInfo: (data.contactInfo || {}) as any,
        headerConfig: headerConfig as any,
        footerConfig: footerConfig as any,
      },
      include: {
        businessUnit: {
          select: {
            id: true,
            name: true,
            slug: true,
            settings: true,
          },
        },
      },
    });

    return {
      ...branding,
      contactInfo: branding.contactInfo as unknown as ContactInfo,
      headerConfig: branding.headerConfig as unknown as HeaderConfig,
      footerConfig: branding.footerConfig as unknown as FooterConfig,
    };
  }

  /**
   * Update branding for a business unit
   */
  async update(businessUnitId: string, data: UpdateBrandingDTO) {
    // Get current branding
    const current = await this.get(businessUnitId);

    if (!current) {
      throw new Error(`Branding not found for business unit ${businessUnitId}`);
    }

    // Merge configs if provided
    const headerConfig = data.headerConfig
      ? { ...current.headerConfig, ...data.headerConfig }
      : current.headerConfig;

    const footerConfig = data.footerConfig
      ? { ...current.footerConfig, ...data.footerConfig }
      : current.footerConfig;

    const contactInfo = data.contactInfo
      ? data.contactInfo
      : current.contactInfo;

    const updated = await prisma.businessUnitBranding.update({
      where: { businessUnitId },
      data: {
        logoUrl: data.logoUrl !== undefined ? data.logoUrl : current.logoUrl,
        primaryColor:
          data.primaryColor !== undefined
            ? data.primaryColor
            : current.primaryColor,
        secondaryColor:
          data.secondaryColor !== undefined
            ? data.secondaryColor
            : current.secondaryColor,
        fontFamily:
          data.fontFamily !== undefined ? data.fontFamily : current.fontFamily,
        contactInfo: contactInfo as any,
        headerConfig: headerConfig as any,
        footerConfig: footerConfig as any,
      },
      include: {
        businessUnit: {
          select: {
            id: true,
            name: true,
            slug: true,
            settings: true,
          },
        },
      },
    });

    return {
      ...updated,
      contactInfo: updated.contactInfo as unknown as ContactInfo,
      headerConfig: updated.headerConfig as unknown as HeaderConfig,
      footerConfig: updated.footerConfig as unknown as FooterConfig,
    };
  }

  /**
   * Delete branding for a business unit
   */
  async delete(businessUnitId: string) {
    const branding = await prisma.businessUnitBranding.delete({
      where: { businessUnitId },
    });

    return branding;
  }

  /**
   * Check if branding exists for a business unit
   */
  async exists(businessUnitId: string): Promise<boolean> {
    const count = await prisma.businessUnitBranding.count({
      where: { businessUnitId },
    });

    return count > 0;
  }
}

export const brandingService = new BrandingService();
