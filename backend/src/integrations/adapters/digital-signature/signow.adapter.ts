/**
 * SIGNOW ADAPTER
 * Implementación de DigitalSignatureProvider para SignNow
 * Docs: https://docs.signnow.com/
 */

import axios, { AxiosInstance } from "axios";
import crypto from "crypto";
import {
  DigitalSignatureProvider,
  SignatureRequestParams,
  SignatureRequest,
  SignatureStatusInfo,
  SignatureWebhookEvent,
  SignatureStatus,
  SignatureEventType,
  DigitalSignatureError,
  InvalidWebhookSignatureError,
  SignerStatusInfo,
} from "@core/contracts/digital-signature.provider";

interface SignNowConfig {
  apiKey: string;
  clientId?: string;
  clientSecret?: string;
  environment: "sandbox" | "production";
  webhookSecret?: string;
}

export class SignNowAdapter implements DigitalSignatureProvider {
  readonly name = "signow";
  private apiKey: string;
  private baseUrl: string;
  private webhookSecret?: string;
  private axiosInstance: AxiosInstance;

  constructor(config: SignNowConfig) {
    this.apiKey = config.apiKey;
    this.webhookSecret = config.webhookSecret;
    this.baseUrl =
      config.environment === "sandbox"
        ? "https://api-eval.signnow.com"
        : "https://api.signnow.com";

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  async createSignatureRequest(
    params: SignatureRequestParams,
  ): Promise<SignatureRequest> {
    try {
      // 1. Descargar el documento desde la URL
      const documentBuffer = await this.downloadDocument(params.documentUrl);

      // 2. Subir documento a SignNow
      const uploadResponse = await this.uploadDocument(
        documentBuffer,
        params.documentName,
      );

      // 3. Preparar campos de firma
      const fields = this.prepareSignatureFields(params.signers);

      // 4. Aplicar campos al documento
      if (fields.length > 0) {
        await this.applyFieldsToDocument(uploadResponse.id, fields);
      }

      // 5. Crear invitación de firma
      const inviteResponse = await this.createInvite(uploadResponse.id, params);

      return {
        id: uploadResponse.id,
        internalId: params.metadata?.internalId,
        status: "pending",
        signUrl: inviteResponse.link,
        signerUrls: inviteResponse.signerLinks?.map((link: any) => ({
          signerEmail: link.email,
          url: link.link,
        })),
        expiresAt: new Date(
          Date.now() + (params.expiresInDays || 30) * 24 * 60 * 60 * 1000,
        ),
        createdAt: new Date(),
        providerMetadata: {
          documentId: uploadResponse.id,
          inviteId: inviteResponse.id,
        },
      };
    } catch (error: any) {
      throw new DigitalSignatureError(
        `SignNow error: ${error.message}`,
        error.response?.data?.error || "SIGNOW_ERROR",
        "signow",
        error.response?.data,
      );
    }
  }

  async getSignatureStatus(requestId: string): Promise<SignatureStatusInfo> {
    try {
      const response = await this.axiosInstance.get(`/document/${requestId}`);

      const document = response.data;
      const status = this.mapSignNowStatus(document);

      // Obtener información de firmantes
      const signers = this.extractSignerInfo(document);

      return {
        requestId,
        status,
        progress: this.calculateProgress(signers),
        signers,
        updatedAt: new Date(document.updated * 1000),
        signedAt:
          status === "signed" ? new Date(document.updated * 1000) : undefined,
        signedDocumentUrl:
          status === "signed" ? `/document/${requestId}/download` : undefined,
      };
    } catch (error: any) {
      throw new DigitalSignatureError(
        `Failed to get signature status: ${error.message}`,
        "GET_STATUS_ERROR",
        "signow",
        error.response?.data,
      );
    }
  }

  async downloadSignedDocument(requestId: string): Promise<Buffer> {
    try {
      const response = await this.axiosInstance.get(
        `/document/${requestId}/download`,
        {
          responseType: "arraybuffer",
        },
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      throw new DigitalSignatureError(
        `Failed to download signed document: ${error.message}`,
        "DOWNLOAD_ERROR",
        "signow",
        error.response?.data,
      );
    }
  }

  async cancelSignatureRequest(requestId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/document/${requestId}`);
    } catch (error: any) {
      throw new DigitalSignatureError(
        `Failed to cancel signature request: ${error.message}`,
        "CANCEL_ERROR",
        "signow",
        error.response?.data,
      );
    }
  }

  async parseWebhook(
    rawPayload: any,
    signature?: string,
  ): Promise<SignatureWebhookEvent | null> {
    try {
      // 1. Verificar firma del webhook (si está configurado)
      if (this.webhookSecret && signature) {
        const isValid = this.verifyWebhookSignature(rawPayload, signature);
        if (!isValid) {
          throw new InvalidWebhookSignatureError("signow");
        }
      }

      // 2. Parsear evento según el tipo
      const event = rawPayload.event || rawPayload.event_type;
      const documentId = rawPayload.document_id || rawPayload.id;

      if (!documentId) {
        console.warn("SignNow webhook missing document_id");
        return null;
      }

      // 3. Normalizar evento
      const normalizedEvent: SignatureWebhookEvent = {
        requestId: documentId,
        eventType: this.mapEventType(event),
        status: this.mapWebhookStatus(rawPayload.status || event),
        timestamp: new Date(
          rawPayload.timestamp || rawPayload.created_at || Date.now(),
        ),
        signerEmail: rawPayload.signer?.email || rawPayload.user_email,
        signerName: rawPayload.signer?.name || rawPayload.user_name,
        signedAt: rawPayload.signed_at
          ? new Date(rawPayload.signed_at * 1000)
          : undefined,
        viewedAt: rawPayload.viewed_at
          ? new Date(rawPayload.viewed_at * 1000)
          : undefined,
        declinedReason: rawPayload.decline_reason,
        documentUrl: rawPayload.download_link,
        metadata: {
          originalPayload: rawPayload,
        },
      };

      return normalizedEvent;
    } catch (error: any) {
      if (error instanceof InvalidWebhookSignatureError) {
        throw error;
      }
      console.error("Error parsing SignNow webhook:", error);
      return null;
    }
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private async downloadDocument(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });
    return Buffer.from(response.data);
  }

  private async uploadDocument(
    documentBuffer: Buffer,
    filename: string,
  ): Promise<{ id: string }> {
    const formData = new FormData();
    const blob = new Blob([documentBuffer as any], { type: "application/pdf" });
    formData.append("file", blob, filename);

    const response = await this.axiosInstance.post("/document", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return { id: response.data.id };
  }

  private prepareSignatureFields(signers: any[]): any[] {
    const fields: any[] = [];

    signers.forEach((signer, index) => {
      if (signer.requiredFields) {
        signer.requiredFields.forEach((field: any) => {
          fields.push({
            type: field.type,
            page_number: field.page || 1,
            x: field.x || 100,
            y: field.y || 100 + index * 50,
            width: field.width || 200,
            height: field.height || 50,
            required: field.required,
            label: field.label,
            role: signer.role || `Signer ${index + 1}`,
          });
        });
      } else {
        // Campo de firma por defecto
        fields.push({
          type: "signature",
          page_number: 1,
          x: 100,
          y: 100 + index * 80,
          width: 200,
          height: 60,
          required: true,
          label: `Firma de ${signer.name}`,
          role: signer.role || `Signer ${index + 1}`,
        });
      }
    });

    return fields;
  }

  private async applyFieldsToDocument(
    documentId: string,
    fields: any[],
  ): Promise<void> {
    await this.axiosInstance.post(`/document/${documentId}/fields`, {
      fields,
    });
  }

  private async createInvite(
    documentId: string,
    params: SignatureRequestParams,
  ): Promise<{ id: string; link: string; signerLinks?: any[] }> {
    const inviteData = {
      document_id: documentId,
      to: params.signers.map((signer, index) => ({
        email: signer.email,
        role: signer.role || `Signer ${index + 1}`,
        order: signer.order || index + 1,
        authentication: {
          type: "email",
        },
      })),
      from: params.metadata?.fromEmail || "noreply@divancosaas.com",
      subject:
        params.metadata?.subject || `Firma requerida: ${params.documentName}`,
      message: params.message || "Por favor firma este documento.",
      redirect_uri: params.metadata?.redirectUrl,
      reminder: params.reminders?.enabled
        ? params.reminders.intervalDays || 3
        : undefined,
    };

    const response = await this.axiosInstance.post(
      `/document/${documentId}/invite`,
      inviteData,
    );

    return {
      id: response.data.id,
      link: response.data.link,
      signerLinks: response.data.signers,
    };
  }

  private mapSignNowStatus(document: any): SignatureStatus {
    // SignNow status logic
    const signatures = document.signatures || [];
    const totalSigners = signatures.length;
    const signedCount = signatures.filter(
      (sig: any) => sig.data && sig.data !== "",
    ).length;

    if (document.status === "cancelled") return "cancelled";
    if (document.expired) return "expired";
    if (document.declined) return "declined";
    if (signedCount === totalSigners && totalSigners > 0) return "signed";
    if (signedCount > 0 && signedCount < totalSigners)
      return "partially_signed";
    if (document.viewed) return "viewed";
    return "pending";
  }

  private mapWebhookStatus(status: string): SignatureStatus {
    const statusMap: Record<string, SignatureStatus> = {
      pending: "pending",
      waiting: "pending",
      sent: "pending",
      opened: "viewed",
      viewed: "viewed",
      completed: "signed",
      signed: "signed",
      partially_signed: "partially_signed",
      declined: "declined",
      rejected: "declined",
      expired: "expired",
      cancelled: "cancelled",
    };
    return statusMap[status.toLowerCase()] || "pending";
  }

  private mapEventType(event: string): SignatureEventType {
    const eventMap: Record<string, SignatureEventType> = {
      "document.created": "document.created",
      "document.sent": "document.created",
      "document.opened": "document.viewed",
      "document.viewed": "document.viewed",
      "document.signed": "document.signed",
      "document.completed": "document.completed",
      "document.declined": "document.declined",
      "document.expired": "document.expired",
      "document.cancelled": "document.cancelled",
      "reminder.sent": "reminder.sent",
    };
    return eventMap[event] || "document.created";
  }

  private extractSignerInfo(document: any): SignerStatusInfo[] {
    const signatures = document.signatures || [];
    const invites = document.invites || [];

    return signatures.map((sig: any) => {
      const invite = invites.find(
        (inv: any) => inv.signer_id === sig.signer_id,
      );

      return {
        email: sig.email || invite?.email || "unknown",
        name: sig.signer_name || invite?.signer_name || "Unknown",
        status: sig.data ? "signed" : sig.viewed ? "viewed" : "pending",
        signedAt: sig.signed_at ? new Date(sig.signed_at * 1000) : undefined,
        viewedAt: sig.viewed_at ? new Date(sig.viewed_at * 1000) : undefined,
        declinedReason: sig.decline_reason,
      };
    });
  }

  private calculateProgress(signers: SignerStatusInfo[]): number {
    if (signers.length === 0) return 0;
    const signedCount = signers.filter((s) => s.status === "signed").length;
    return Math.round((signedCount / signers.length) * 100);
  }

  private verifyWebhookSignature(payload: any, signature: string): boolean {
    if (!this.webhookSecret) return true; // Si no hay secret, aceptar

    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }
}
