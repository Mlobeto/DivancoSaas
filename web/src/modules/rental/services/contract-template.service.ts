/**
 * CONTRACT TEMPLATE SERVICE V2.0 (Frontend)
 * Servicio para gestión de templates modulares y payment proof
 */

import apiClient from "@/lib/api";

// ============================================
// TYPES - Template Structure V2.0
// ============================================

export type SectionType =
  | "header"
  | "quotation_summary"
  | "contract_terms"
  | "asset_clauses"
  | "payment_proof"
  | "signatures"
  | "custom_html";

export interface TemplateSection {
  id: string;
  type: SectionType;
  order: number;
  title: string;
  isRequired: boolean;
  config: Record<string, any>;
}

export interface TemplateV2 {
  version: string;
  sections: TemplateSection[];
}

export interface ContractTemplate {
  id: string;
  tenantId: string;
  businessUnitId?: string;
  name: string;
  description?: string;
  type: string;
  version: string;
  content: TemplateV2;
  requiresSignature: boolean;
  requiresPaymentProof: boolean;
  allowLocalPayment: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RenderContractParams {
  contractId: string;
  templateId: string;
  variables?: Record<string, any>;
}

export interface RenderContractResponse {
  html: string;
  contractId: string;
  templateId: string;
}

export interface PaymentProofInfo {
  hasProof: boolean;
  type?: "online" | "local";
  url?: string;
  details?: any;
  verifiedBy?: string;
  verifiedAt?: string;
  isVerified: boolean;
}

// ============================================
// API FUNCTIONS
// ============================================

class ContractTemplateService {
  /**
   * Renderizar contrato desde template v2.0
   */
  async renderContract(
    params: RenderContractParams,
  ): Promise<RenderContractResponse> {
    const { data } = await apiClient.post<{ data: RenderContractResponse }>(
      "/rental/contracts/templates/render",
      params,
    );
    return data.data;
  }

  /**
   * Crear template v2.0
   */
  async createTemplate(template: {
    name: string;
    description?: string;
    businessUnitId?: string;
    template: TemplateV2;
    requiresSignature?: boolean;
    requiresPaymentProof?: boolean;
    allowLocalPayment?: boolean;
  }): Promise<ContractTemplate> {
    const { data } = await apiClient.post<{ data: ContractTemplate }>(
      "/rental/contracts/templates",
      template,
    );
    return data.data;
  }

  /**
   * Migrar template legacy a v2.0
   */
  async migrateToV2(templateId: string): Promise<ContractTemplate> {
    const { data } = await apiClient.post<{ data: ContractTemplate }>(
      `/rental/contracts/templates/${templateId}/migrate-v2`,
    );
    return data.data;
  }

  /**
   * Obtener metadata de template
   */
  async getTemplateMetadata(templateId: string): Promise<ContractTemplate> {
    const { data } = await apiClient.get<{ data: ContractTemplate }>(
      `/rental/contracts/templates/${templateId}/metadata`,
    );
    return data.data;
  }

  /**
   * Preview de sección
   */
  async previewSection(
    section: TemplateSection,
    contractId: string,
  ): Promise<{ html: string }> {
    const { data } = await apiClient.post<{ data: { html: string } }>(
      "/rental/contracts/templates/preview-section",
      { section, contractId },
    );
    return data.data;
  }

  // ============================================
  // PAYMENT PROOF
  // ============================================

  /**
   * Subir comprobante de pago
   */
  async uploadPaymentProof(
    contractId: string,
    file: File,
    details: {
      transactionRef?: string;
      paymentDate?: string;
      notes?: string;
    },
  ): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    if (details.transactionRef) {
      formData.append("transactionRef", details.transactionRef);
    }
    if (details.paymentDate) {
      formData.append("paymentDate", details.paymentDate);
    }
    if (details.notes) {
      formData.append("notes", details.notes);
    }

    const { data } = await apiClient.post(
      `/rental/contracts/${contractId}/payment-proof`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return data.data;
  }

  /**
   * Marcar como pago local
   */
  async markLocalPayment(
    contractId: string,
    details: {
      receivedBy?: string;
      paymentDate?: string;
      notes?: string;
    },
  ): Promise<any> {
    const { data } = await apiClient.post(
      `/rental/contracts/${contractId}/payment-proof/local`,
      details,
    );
    return data.data;
  }

  /**
   * Obtener información de payment proof
   */
  async getPaymentProof(contractId: string): Promise<PaymentProofInfo> {
    const { data } = await apiClient.get<{ data: PaymentProofInfo }>(
      `/rental/contracts/${contractId}/payment-proof`,
    );
    return data.data;
  }

  /**
   * Verificar payment proof (admin)
   */
  async verifyPaymentProof(contractId: string, notes?: string): Promise<any> {
    const { data } = await apiClient.post(
      `/rental/contracts/${contractId}/payment-proof/verify`,
      { notes },
    );
    return data.data;
  }

  // ============================================
  // DIGITAL SIGNATURE
  // ============================================

  /**
   * Enviar contrato a firma digital (SignNow)
   */
  async sendToSignature(
    contractId: string,
    signers: Array<{
      email: string;
      name: string;
      role: string;
    }>,
  ): Promise<{
    requestId: string;
    status: string;
    signerUrls: Array<{ signerEmail: string; url: string }>;
  }> {
    const { data } = await apiClient.post(
      `/rental/contracts/${contractId}/request-signature`,
      { signers },
    );
    return data.data;
  }

  /**
   * Obtener estado de firma
   */
  async getSignatureStatus(contractId: string): Promise<{
    status: "pending" | "sent" | "completed";
    signers: Array<{
      email: string;
      status: string;
      signedAt?: string;
    }>;
  }> {
    const { data } = await apiClient.get(
      `/rental/contracts/${contractId}/signature-status`,
    );
    return data.data;
  }

  /**
   * Descargar PDF del contrato
   */
  async downloadContractPdf(contractId: string): Promise<Blob> {
    const response = await apiClient.get(
      `/rental/contracts/${contractId}/pdf`,
      {
        responseType: "blob",
      },
    );
    return response.data;
  }

  /**
   * Descargar PDF firmado del contrato
   */
  async downloadSignedContractPdf(contractId: string): Promise<Blob> {
    const response = await apiClient.get(
      `/rental/contracts/${contractId}/signed-pdf`,
      {
        responseType: "blob",
      },
    );
    return response.data;
  }
}

export const contractTemplateService = new ContractTemplateService();
