export interface EmailTemplate {
  id: string;
  businessUnitId: string;
  tenantId: string;
  name: string;
  description?: string | null;
  emailType: string;
  isActive: boolean;
  isDefault: boolean;
  subject: string;
  fromName?: string | null;
  replyToEmail?: string | null;
  htmlContent: string;
  textContent?: string | null;
  preheader?: string | null;
  useBranding: boolean;
  customColors?: Record<string, string> | null;
  defaultAttachments?: any;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
}

export interface CreateEmailTemplateDTO {
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
}

export interface UpdateEmailTemplateDTO {
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
