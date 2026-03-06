import prisma from "@config/database";

export interface CreateEmailTemplateInput {
  tenantId: string;
  businessUnitId: string;
  name: string;
  description?: string;
  emailType: string;
  subject: string;
  fromName?: string;
  replyToEmail?: string;
  htmlContent: string;
  textContent?: string;
  preheader?: string;
  useBranding?: boolean;
  customColors?: Record<string, string>;
  defaultAttachments?: any[];
  isActive?: boolean;
  isDefault?: boolean;
  createdBy?: string;
}

export interface UpdateEmailTemplateInput {
  name?: string;
  description?: string;
  subject?: string;
  fromName?: string;
  replyToEmail?: string;
  htmlContent?: string;
  textContent?: string;
  preheader?: string;
  useBranding?: boolean;
  customColors?: Record<string, string>;
  defaultAttachments?: any[];
  isActive?: boolean;
}

class EmailTemplateService {
  async list(tenantId: string, businessUnitId: string) {
    return prisma.emailTemplate.findMany({
      where: { tenantId, businessUnitId },
      orderBy: [
        { emailType: "asc" },
        { isDefault: "desc" },
        { updatedAt: "desc" },
      ],
    });
  }

  async getById(tenantId: string, businessUnitId: string, templateId: string) {
    return prisma.emailTemplate.findFirst({
      where: {
        id: templateId,
        tenantId,
        businessUnitId,
      },
    });
  }

  async create(input: CreateEmailTemplateInput) {
    const {
      tenantId,
      businessUnitId,
      isDefault,
      createdBy,
      customColors,
      defaultAttachments,
      ...data
    } = input;

    return prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.emailTemplate.updateMany({
          where: {
            tenantId,
            businessUnitId,
            emailType: data.emailType,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      return tx.emailTemplate.create({
        data: {
          tenantId,
          businessUnitId,
          createdBy,
          ...data,
          isActive: input.isActive ?? true,
          isDefault: isDefault ?? false,
          useBranding: input.useBranding ?? true,
          customColors: customColors ?? undefined,
          defaultAttachments: defaultAttachments ?? [],
        },
      });
    });
  }

  async update(
    tenantId: string,
    businessUnitId: string,
    templateId: string,
    input: UpdateEmailTemplateInput,
  ) {
    const existing = await this.getById(tenantId, businessUnitId, templateId);
    if (!existing) {
      throw new Error("EMAIL_TEMPLATE_NOT_FOUND");
    }

    return prisma.emailTemplate.update({
      where: { id: templateId },
      data: {
        ...input,
        customColors: input.customColors ?? undefined,
        defaultAttachments: input.defaultAttachments ?? undefined,
      },
    });
  }

  async setDefault(
    tenantId: string,
    businessUnitId: string,
    templateId: string,
  ) {
    const existing = await this.getById(tenantId, businessUnitId, templateId);
    if (!existing) {
      throw new Error("EMAIL_TEMPLATE_NOT_FOUND");
    }

    return prisma.$transaction(async (tx) => {
      await tx.emailTemplate.updateMany({
        where: {
          tenantId,
          businessUnitId,
          emailType: existing.emailType,
          isDefault: true,
        },
        data: { isDefault: false },
      });

      return tx.emailTemplate.update({
        where: { id: templateId },
        data: { isDefault: true },
      });
    });
  }

  async setActive(
    tenantId: string,
    businessUnitId: string,
    templateId: string,
    isActive: boolean,
  ) {
    const existing = await this.getById(tenantId, businessUnitId, templateId);
    if (!existing) {
      throw new Error("EMAIL_TEMPLATE_NOT_FOUND");
    }

    if (existing.isActive && !isActive) {
      const otherActiveTemplatesCount = await prisma.emailTemplate.count({
        where: {
          tenantId,
          businessUnitId,
          emailType: existing.emailType,
          isActive: true,
          id: { not: templateId },
        },
      });

      if (otherActiveTemplatesCount === 0) {
        throw new Error("EMAIL_TEMPLATE_LAST_ACTIVE_CANNOT_DEACTIVATE");
      }
    }

    return prisma.emailTemplate.update({
      where: { id: templateId },
      data: { isActive },
    });
  }

  async delete(tenantId: string, businessUnitId: string, templateId: string) {
    const existing = await this.getById(tenantId, businessUnitId, templateId);
    if (!existing) {
      throw new Error("EMAIL_TEMPLATE_NOT_FOUND");
    }

    if (existing.isActive) {
      const otherActiveTemplatesCount = await prisma.emailTemplate.count({
        where: {
          tenantId,
          businessUnitId,
          emailType: existing.emailType,
          isActive: true,
          id: { not: templateId },
        },
      });

      if (otherActiveTemplatesCount === 0) {
        throw new Error("EMAIL_TEMPLATE_LAST_ACTIVE_CANNOT_DELETE");
      }
    }

    await prisma.emailTemplate.delete({ where: { id: templateId } });
  }
}

export const emailTemplateService = new EmailTemplateService();
