/**
 * Types for Business Unit Branding
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

export interface BrandingData {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  contactInfo?: ContactInfo;
  headerConfig: HeaderConfig;
  footerConfig: FooterConfig;
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
  logoUrl?: string;
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
