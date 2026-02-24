/**
 * Business Unit Branding Types
 */

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
}

export interface HeaderConfig {
  showLogo: boolean;
  logoAlign: "left" | "center" | "right";
  showBusinessName: boolean;
  showTaxInfo: boolean;
  height: number;
}

export interface FooterConfig {
  showContactInfo: boolean;
  showDisclaimer: boolean;
  disclaimerText?: string;
  textAlign: "left" | "center" | "right";
  height: number;
}

export interface BusinessUnitBranding {
  id: string;
  businessUnitId: string;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  contactInfo?: ContactInfo;
  headerConfig: HeaderConfig;
  footerConfig: FooterConfig;
  createdAt: string;
  updatedAt: string;
  businessUnit?: {
    id: string;
    name: string;
    slug: string;
    settings?: any;
  };
}

export interface CreateBrandingDTO {
  businessUnitId: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  contactInfo?: ContactInfo;
  headerConfig?: Partial<HeaderConfig>;
  footerConfig?: Partial<FooterConfig>;
}

export interface UpdateBrandingDTO {
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  contactInfo?: ContactInfo;
  headerConfig?: Partial<HeaderConfig>;
  footerConfig?: Partial<FooterConfig>;
}

export type DocumentType =
  | "quotation"
  | "contract"
  | "attachment"
  | "note"
  | "report"
  | "receipt";

export type DocumentFormat = "A4" | "ticket";

export interface PreviewOptions {
  documentType?: DocumentType;
  format?: DocumentFormat;
  sampleData?: any;
}
