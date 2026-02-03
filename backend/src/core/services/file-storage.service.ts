/**
 * File Storage Service
 * Servicio del core que abstrae el manejo de archivos
 * Resuelve el adapter correcto según la configuración de cada BusinessUnit
 */

import type { FileStorageProvider } from "../contracts/file-storage.provider";
import { PrismaClient } from "@prisma/client";
import { encryptionService } from "./encryption.service";

const prisma = new PrismaClient();

// Factory para crear instancias de FileStorageProvider
type FileStorageProviderFactory = (config: any) => FileStorageProvider;
let fileStorageProviderFactory: FileStorageProviderFactory;

/**
 * Inyectar factory de FileStorageProvider desde el bootstrap
 * El core NO instancia adapters directamente
 */
export function setFileStorageProviderFactory(
  factory: FileStorageProviderFactory,
) {
  fileStorageProviderFactory = factory;
}

export class FileStorageService {
  /**
   * Obtiene el adapter de storage configurado para una BusinessUnit específica
   */
  private async getStorageProvider(
    tenantId: string,
    businessUnitId: string,
  ): Promise<FileStorageProvider | null> {
    if (!fileStorageProviderFactory) {
      throw new Error(
        "FileStorageProviderFactory not initialized. Call setFileStorageProviderFactory() in bootstrap.",
      );
    }

    // Buscar credenciales de storage para esta BusinessUnit
    const credential = await prisma.integrationCredential.findUnique({
      where: {
        businessUnitId_provider: {
          businessUnitId,
          provider: "AZURE_BLOB_STORAGE",
        },
      },
    });

    if (!credential || !credential.isActive) {
      console.warn(
        `[FileStorageService] No active storage configuration found for BU: ${businessUnitId}`,
      );
      return null;
    }

    // Descifrar credenciales
    const config = encryptionService.decrypt(credential.credentials as string);

    // Usar factory para crear instancia
    return fileStorageProviderFactory(config);
  }

  /**
   * Sube un archivo con procesamiento automático de imágenes
   */
  async uploadFile(params: {
    file: Buffer;
    fileName: string;
    mimeType: string;
    container: string;
    folder?: string;
    tenantId: string;
    businessUnitId: string;
    processImage?: boolean;
    imageOptions?: any;
  }): Promise<any> {
    const provider = await this.getStorageProvider(
      params.tenantId,
      params.businessUnitId,
    );

    if (!provider) {
      throw new Error("Storage not configured for this Business Unit");
    }

    let fileToUpload = params.file;

    // Si es una imagen y se solicita procesamiento
    if (
      params.processImage &&
      params.mimeType.startsWith("image/") &&
      params.imageOptions
    ) {
      const processed = await provider.processImage({
        file: params.file,
        options: params.imageOptions,
      });
      fileToUpload = processed.buffer;
    }

    return await provider.uploadFile({
      file: fileToUpload,
      fileName: params.fileName,
      mimeType: params.mimeType,
      container: params.container,
      folder: params.folder,
      tenantId: params.tenantId,
      businessUnitId: params.businessUnitId,
    });
  }

  /**
   * Descarga un archivo
   */
  async downloadFile(params: {
    blobName: string;
    container: string;
    tenantId: string;
    businessUnitId: string;
  }): Promise<any> {
    const provider = await this.getStorageProvider(
      params.tenantId,
      params.businessUnitId,
    );

    if (!provider) {
      throw new Error("Storage not configured for this Business Unit");
    }

    return await provider.downloadFile(params);
  }

  /**
   * Elimina un archivo
   */
  async deleteFile(params: {
    blobName: string;
    container: string;
    tenantId: string;
    businessUnitId: string;
  }): Promise<void> {
    const provider = await this.getStorageProvider(
      params.tenantId,
      params.businessUnitId,
    );

    if (!provider) {
      throw new Error("Storage not configured for this Business Unit");
    }

    await provider.deleteFile(params);
  }

  /**
   * Genera una URL firmada temporal
   */
  async generateSasToken(params: {
    blobName: string;
    container: string;
    expiresIn: number;
    permissions?: "read" | "write" | "delete" | "list";
    tenantId: string;
    businessUnitId: string;
  }): Promise<string> {
    const provider = await this.getStorageProvider(
      params.tenantId,
      params.businessUnitId,
    );

    if (!provider) {
      throw new Error("Storage not configured for this Business Unit");
    }

    return await provider.generateSasToken(params);
  }

  /**
   * Lista archivos en un container
   */
  async listFiles(params: {
    container: string;
    prefix?: string;
    maxResults?: number;
    tenantId: string;
    businessUnitId: string;
  }): Promise<any[]> {
    const provider = await this.getStorageProvider(
      params.tenantId,
      params.businessUnitId,
    );

    if (!provider) {
      throw new Error("Storage not configured for this Business Unit");
    }

    return await provider.listFiles(params);
  }

  /**
   * Verifica si un archivo existe
   */
  async fileExists(
    blobName: string,
    container: string,
    tenantId: string,
    businessUnitId: string,
  ): Promise<boolean> {
    const provider = await this.getStorageProvider(tenantId, businessUnitId);

    if (!provider) {
      return false;
    }

    return await provider.fileExists(blobName, container);
  }

  /**
   * Obtiene metadata de un archivo
   */
  async getFileMetadata(
    blobName: string,
    container: string,
    tenantId: string,
    businessUnitId: string,
  ): Promise<any> {
    const provider = await this.getStorageProvider(tenantId, businessUnitId);

    if (!provider) {
      throw new Error("Storage not configured for this Business Unit");
    }

    return await provider.getFileMetadata(blobName, container);
  }

  /**
   * Verifica si storage está configurado para una BusinessUnit
   */
  async isConfigured(
    tenantId: string,
    businessUnitId: string,
  ): Promise<boolean> {
    const provider = await this.getStorageProvider(tenantId, businessUnitId);

    if (!provider) {
      return false;
    }

    return await provider.isConfigured(tenantId, businessUnitId);
  }
}

export const fileStorageService = new FileStorageService();
