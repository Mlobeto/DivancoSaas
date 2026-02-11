/**
 * CLIENTS MODULE - FRONTEND TYPES
 */

export enum ClientStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
}

export enum ClientType {
  PERSON = "PERSON",
  COMPANY = "COMPANY",
}

export type ContactChannel = "EMAIL" | "PHONE" | "WHATSAPP" | "OTHER";

export interface Client {
  id: string;
  tenantId: string;
  businessUnitId: string;
  name: string;
  displayName?: string | null;
  type: ClientType;
  countryCode?: string | null;
  email?: string | null;
  phone?: string | null;
  status: ClientStatus;
  tags?: string[]; // stored as JSON on backend
  createdAt: string;
  updatedAt: string;
  contacts?: ClientContact[];
  taxProfiles?: ClientTaxProfile[];
}

export interface ClientContact {
  id: string;
  clientId: string;
  name: string;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  channel?: ContactChannel | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientTaxProfile {
  id: string;
  clientId: string;
  countryCode: string;
  taxIdType: string;
  taxIdNumber: string;
  taxRegime?: string | null;
  fiscalResponsibility?: string | null;
  fiscalAddressLine1?: string | null;
  fiscalAddressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  extra?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export type MovementDirection = "DEBIT" | "CREDIT";

export interface ClientAccountMovement {
  id: string;
  tenantId: string;
  businessUnitId: string;
  clientId: string;
  date: string;
  amount: number;
  direction: MovementDirection;
  currency: string;
  sourceModule: string;
  sourceType: string;
  sourceId?: string | null;
  description?: string | null;
  balanceAfter?: number | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ClientRiskSnapshot {
  id: string;
  clientId: string;
  score: number;
  segment: string;
  currentBalance?: number | null;
  details?: Record<string, unknown> | null;
  lastUpdatedAt: string;
}

export interface ClientRankingConfig {
  tenantId: string;
  businessUnitId: string;
  weights: Record<string, number>;
  thresholds: Record<string, number>;
  policies: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientFilters {
  status?: ClientStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ClientListResponse {
  data: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClientSummary {
  client: Client;
  recentMovements: ClientAccountMovement[];
  risk: ClientRiskSnapshot | null;
}
