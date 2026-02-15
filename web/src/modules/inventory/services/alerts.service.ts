import api from "@/lib/api";
import type { ApiResponse } from "@/core/types/api.types";
import type { AssetAttachment } from "./assets.service";

export interface ExpiringDocument extends AssetAttachment {
  asset: {
    id: string;
    code: string;
    name: string;
    currentLocation?: string;
  };
  documentType?: {
    id: string;
    code: string;
    name: string;
    color?: string;
  };
  daysUntilExpiry: number;
}

export const alertsService = {
  /**
   * Get expiring or expired documents
   */
  async getExpiringDocuments(
    daysAhead: number = 30,
  ): Promise<ExpiringDocument[]> {
    const response = await api.get<ApiResponse<AssetAttachment[]>>(
      "/modules/assets/attachments",
      {
        params: {
          status: "EXPIRING,EXPIRED",
        },
      },
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to fetch expiring documents",
      );
    }

    const attachments = response.data.data || [];

    // Calculate days until expiry and filter
    const expiringDocs: ExpiringDocument[] = attachments
      .filter((att) => att.expiryDate)
      .map((att) => {
        const expiryDate = new Date(att.expiryDate!);
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          ...att,
          daysUntilExpiry: diffDays,
        } as ExpiringDocument;
      })
      .filter((doc) => doc.daysUntilExpiry <= daysAhead)
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    return expiringDocs;
  },

  /**
   * Get expiring documents grouped by status
   */
  async getExpiringDocumentsByStatus() {
    const docs = await this.getExpiringDocuments(90); // 90 days ahead

    return {
      expired: docs.filter((d) => d.status === "EXPIRED"),
      expiringSoon: docs.filter(
        (d) => d.status === "EXPIRING" && d.daysUntilExpiry <= 7,
      ),
      expiringMedium: docs.filter(
        (d) =>
          d.status === "EXPIRING" &&
          d.daysUntilExpiry > 7 &&
          d.daysUntilExpiry <= 30,
      ),
      expiringLater: docs.filter(
        (d) => d.status === "ACTIVE" && d.daysUntilExpiry > 30,
      ),
    };
  },
};
