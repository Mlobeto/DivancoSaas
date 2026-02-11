/**
 * AZURE BLOB STORAGE SERVICE
 * Servicio para subir archivos a Azure Blob Storage
 * Usado para: PDFs de cotizaciones, contratos, documentos firmados
 */

import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";

export interface UploadFileParams {
  file: Buffer;
  fileName: string;
  contentType?: string;
  folder?: string; // ej: "quotations", "contracts", "invoices"
  tenantId: string;
  businessUnitId?: string;
}

export interface UploadFileResult {
  url: string;
  blobName: string;
  containerName: string;
  size: number;
}

export class AzureBlobStorageService {
  private blobServiceClient?: BlobServiceClient;
  private containerName: string;
  private defaultContainerClient?: ContainerClient;

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "uploads";

    if (!connectionString) {
      console.warn(
        "⚠️  AZURE_STORAGE_CONNECTION_STRING not configured. File uploads will fail.",
      );
      return;
    }

    this.blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    this.defaultContainerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );

    console.log(
      `✅ Azure Blob Storage initialized: container="${this.containerName}"`,
    );
  }

  /**
   * Subir archivo a Azure Blob Storage
   */
  async uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
    if (!this.defaultContainerClient) {
      throw new Error("Azure Blob Storage not configured");
    }

    // Estructura de path: tenantId/businessUnitId/folder/filename
    const pathParts = [
      params.tenantId,
      params.businessUnitId || "shared",
      params.folder || "documents",
    ];

    const blobPath = pathParts.join("/");
    const fileExtension = params.fileName.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const blobName = `${blobPath}/${uniqueFileName}`;

    // Obtener block blob client
    const blockBlobClient =
      this.defaultContainerClient.getBlockBlobClient(blobName);

    // Subir archivo
    await blockBlobClient.upload(params.file, params.file.length, {
      blobHTTPHeaders: {
        blobContentType: params.contentType || "application/octet-stream",
      },
      metadata: {
        originalFileName: params.fileName,
        tenantId: params.tenantId,
        businessUnitId: params.businessUnitId || "",
        uploadedAt: new Date().toISOString(),
      },
    });

    return {
      url: blockBlobClient.url,
      blobName,
      containerName: this.containerName,
      size: params.file.length,
    };
  }

  /**
   * Generar URL con SAS token temporal (para acceso seguro)
   */
  async generateSasUrl(
    blobName: string,
    expiresInMinutes: number = 60,
  ): Promise<string> {
    if (!this.defaultContainerClient) {
      throw new Error("Azure Blob Storage not configured");
    }

    const blockBlobClient =
      this.defaultContainerClient.getBlockBlobClient(blobName);

    // TODO: Implementar generación de SAS token
    // Por ahora retornamos URL directa
    // En producción, usar: blockBlobClient.generateSasUrl()
    return blockBlobClient.url;
  }

  /**
   * Descargar archivo desde Azure Blob Storage
   */
  async downloadFile(blobName: string): Promise<Buffer> {
    if (!this.defaultContainerClient) {
      throw new Error("Azure Blob Storage not configured");
    }

    const blockBlobClient =
      this.defaultContainerClient.getBlockBlobClient(blobName);

    const downloadResponse = await blockBlobClient.download(0);

    if (!downloadResponse.readableStreamBody) {
      throw new Error("Failed to download file");
    }

    return await this.streamToBuffer(downloadResponse.readableStreamBody);
  }

  /**
   * Eliminar archivo
   */
  async deleteFile(blobName: string): Promise<void> {
    if (!this.defaultContainerClient) {
      throw new Error("Azure Blob Storage not configured");
    }

    const blockBlobClient =
      this.defaultContainerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
  }

  /**
   * Verificar si un archivo existe
   */
  async fileExists(blobName: string): Promise<boolean> {
    if (!this.defaultContainerClient) {
      return false;
    }

    const blockBlobClient =
      this.defaultContainerClient.getBlockBlobClient(blobName);
    return await blockBlobClient.exists();
  }

  /**
   * Listar archivos de un tenant/folder
   */
  async listFiles(
    tenantId: string,
    folder?: string,
  ): Promise<Array<{ name: string; url: string; size: number }>> {
    if (!this.defaultContainerClient) {
      return [];
    }

    const prefix = folder ? `${tenantId}/${folder}` : tenantId;
    const files: Array<{ name: string; url: string; size: number }> = [];

    for await (const blob of this.defaultContainerClient.listBlobsFlat({
      prefix,
    })) {
      const blockBlobClient = this.defaultContainerClient.getBlockBlobClient(
        blob.name,
      );

      files.push({
        name: blob.name,
        url: blockBlobClient.url,
        size: blob.properties.contentLength || 0,
      });
    }

    return files;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private async streamToBuffer(
    readableStream: NodeJS.ReadableStream,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on("data", (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on("error", reject);
    });
  }
}

// Export singleton
export const azureBlobStorageService = new AzureBlobStorageService();
