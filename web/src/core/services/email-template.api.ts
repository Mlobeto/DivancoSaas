import api from "@/lib/api";
import type {
  CreateEmailTemplateDTO,
  EmailTemplate,
  UpdateEmailTemplateDTO,
} from "@/core/types/email-template.types";

export const emailTemplateApi = {
  async list(businessUnitId: string): Promise<EmailTemplate[]> {
    const response = await api.get<{ success: boolean; data: EmailTemplate[] }>(
      `/branding/${businessUnitId}/email-templates`,
    );
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  async create(
    businessUnitId: string,
    data: CreateEmailTemplateDTO,
  ): Promise<EmailTemplate> {
    const response = await api.post<{ success: boolean; data: EmailTemplate }>(
      `/branding/${businessUnitId}/email-templates`,
      data,
    );
    return response.data.data;
  },

  async update(
    businessUnitId: string,
    templateId: string,
    data: UpdateEmailTemplateDTO,
  ): Promise<EmailTemplate> {
    const response = await api.put<{ success: boolean; data: EmailTemplate }>(
      `/branding/${businessUnitId}/email-templates/${templateId}`,
      data,
    );
    return response.data.data;
  },

  async setDefault(
    businessUnitId: string,
    templateId: string,
  ): Promise<EmailTemplate> {
    const response = await api.patch<{ success: boolean; data: EmailTemplate }>(
      `/branding/${businessUnitId}/email-templates/${templateId}/default`,
    );
    return response.data.data;
  },

  async setActive(
    businessUnitId: string,
    templateId: string,
    isActive: boolean,
  ): Promise<EmailTemplate> {
    const response = await api.patch<{ success: boolean; data: EmailTemplate }>(
      `/branding/${businessUnitId}/email-templates/${templateId}/active`,
      { isActive },
    );
    return response.data.data;
  },

  async delete(businessUnitId: string, templateId: string): Promise<void> {
    await api.delete(
      `/branding/${businessUnitId}/email-templates/${templateId}`,
    );
  },
};
