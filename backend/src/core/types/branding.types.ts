/**
 * Types for Business Unit Branding
 */

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
  height: number;
}

export interface BrandingData {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerConfig: HeaderConfig;
  footerConfig: FooterConfig;
}

export interface CreateBrandingDTO {
  businessUnitId: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  headerConfig?: Partial<HeaderConfig>;
  footerConfig?: Partial<FooterConfig>;
}

export interface UpdateBrandingDTO {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
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
