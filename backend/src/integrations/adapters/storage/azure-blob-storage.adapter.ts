/**
 * Azure Blob Storage Adapter with Sharp Image Processing
 * Implementación del contrato FileStorageProvider usando Azure Blob Storage
 *
 * Documentación oficial: https://learn.microsoft.com/azure/storage/blobs/
 *
 * Requisitos:
 * - Azure Storage Account
 * - Container(s) creados
 * - Access Key o Connection String
 * - Sharp instalado para procesamiento de imágenes
 */

import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  ContainerClient,
} from "@azure/storage-blob";
import sharp from "sharp";
import { logger } from "../../../core/utils/logger";
import {
  FileStorageProvider,
  UploadFileParams,
  UploadFileResult,
  DownloadFileParams,
  DownloadFileResult,
  DeleteFileParams,
  GenerateSasTokenParams,
  ProcessImageParams,
  ProcessedImageResult,
  ListFilesParams,
  FileMetadata,
  AzureBlobStorageConfig,
} from "../../../core/contracts/file-storage.provider";

export class AzureBlobStorageAdapter implements FileStorageProvider {
  private blobServiceClient: BlobServiceClient;
  private sharedKeyCredential: StorageSharedKeyCredential;

  constructor(private config: AzureBlobStorageConfig) {
    // Crear credenciales
    this.sharedKeyCredential = new StorageSharedKeyCredential(
      config.accountName,
      config.accountKey,
    );

    // Crear cliente del servicio
    this.blobServiceClient = new BlobServiceClient(
      `https://${config.accountName}.blob.core.windows.net`,
      this.sharedKeyCredential,
    );
  }

  /**
   * Sube un archivo al storage
   */
  async uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
    try {
      const containerName = this.getContainerName(params.container);
      const containerClient =
        this.blobServiceClient.getContainerClient(containerName);

      // Crear container si no existe
      await containerClient.createIfNotExists({
        access: "blob", // público por defecto, puede cambiarse a 'private'
      });

      // Generar nombre único para el blob con estructura multi-tenant
      const blobName = this.generateBlobName(
        params.fileName,
        params.tenantId,
        params.businessUnitId,
        params.folder,
      );
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Subir archivo
      await blockBlobClient.uploadData(params.file, {
        blobHTTPHeaders: {
          blobContentType: params.mimeType,
        },
        metadata: params.metadata,
      });

      // Obtener propiedades
      const properties = await blockBlobClient.getProperties();

      // Construir URL (CDN si está configurado, sino la URL del blob)
      const url = this.config.cdnEndpoint
        ? `${this.config.cdnEndpoint}/${containerName}/${blobName}`
        : blockBlobClient.url;

      return {
        url,
        blobName,
        size: properties.contentLength || 0,
        mimeType: properties.contentType || params.mimeType,
        uploadedAt: properties.createdOn || new Date(),
      };
    } catch (error: any) {
      logger.error({ error, fileName: params.fileName }, "[AzureBlobStorageAdapter] Upload error");
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Descarga un archivo del storage
   */
  async downloadFile(params: DownloadFileParams): Promise<DownloadFileResult> {
    try {
      const containerName = this.getContainerName(params.container);
      const containerClient =
        this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(
        params.blobName,
      );

      // Descargar blob
      const downloadResponse = await blockBlobClient.download();

      if (!downloadResponse.readableStreamBody) {
        throw new Error("No stream body in download response");
      }

      // Convertir stream a buffer
      const buffer = await this.streamToBuffer(
        downloadResponse.readableStreamBody,
      );
      const properties = await blockBlobClient.getProperties();

      return {
        buffer,
        mimeType: properties.contentType || "application/octet-stream",
        size: properties.contentLength || 0,
      };
    } catch (error: any) {
      logger.error({ error, blobName: params.blobName }, "[AzureBlobStorageAdapter] Download error");
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Elimina un archivo del storage
   */
  async deleteFile(params: DeleteFileParams): Promise<void> {
    try {
      const containerName = this.getContainerName(params.container);
      const containerClient =
        this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(
        params.blobName,
      );

      await blockBlobClient.delete();
    } catch (error: any) {
      logger.error({ error, blobName: params.blobName }, "[AzureBlobStorageAdapter] Delete error");
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Genera una URL firmada temporal (SAS token)
   */
  async generateSasToken(params: GenerateSasTokenParams): Promise<string> {
    try {
      const containerName = this.getContainerName(params.container);
      const containerClient =
        this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(
        params.blobName,
      );

      // Configurar permisos
      const permissions = new BlobSASPermissions();
      if (params.permissions === "read") permissions.read = true;
      if (params.permissions === "write") {
        permissions.write = true;
        permissions.create = true; // Necesario para escribir
        permissions.add = true; // Necesario para agregar
      }
      if (params.permissions === "delete") permissions.delete = true;
      // Nota: 'list' no aplica a blobs individuales, solo a containers
      if (!params.permissions) permissions.read = true; // Por defecto solo lectura

      // Generar SAS token
      const sasToken = generateBlobSASQueryParameters(
        {
          containerName,
          blobName: params.blobName,
          permissions,
          startsOn: new Date(),
          expiresOn: new Date(Date.now() + params.expiresIn * 1000),
        },
        this.sharedKeyCredential,
      ).toString();

      return `${blockBlobClient.url}?${sasToken}`;
    } catch (error: any) {
      logger.error({ error, blobName: params.blobName }, "[AzureBlobStorageAdapter] SAS token error");
      throw new Error(`Failed to generate SAS token: ${error.message}`);
    }
  }

  /**
   * Procesa una imagen usando Sharp
   */
  async processImage(
    params: ProcessImageParams,
  ): Promise<ProcessedImageResult> {
    try {
      let sharpInstance = sharp(params.file);

      // Resize
      if (params.options.resize) {
        sharpInstance = sharpInstance.resize({
          width: params.options.resize.width,
          height: params.options.resize.height,
          fit: params.options.resize.fit || "cover",
        });
      }

      // Formato y calidad
      const format = params.options.format || "jpeg";
      const quality = params.options.quality || 80;

      switch (format) {
        case "jpeg":
          sharpInstance = sharpInstance.jpeg({ quality });
          break;
        case "png":
          sharpInstance = sharpInstance.png({ quality });
          break;
        case "webp":
          sharpInstance = sharpInstance.webp({ quality });
          break;
        case "avif":
          sharpInstance = sharpInstance.avif({ quality });
          break;
      }

      // Generar thumbnail adicional si se solicitó
      if (params.options.thumbnail) {
        // Este es solo un ejemplo, en producción podrías retornar
        // múltiples buffers (original + thumbnail)
        sharpInstance = sharpInstance.resize({
          width: params.options.thumbnail.width,
          height: params.options.thumbnail.height,
          fit: "cover",
        });
      }

      // TODO: Implementar watermark con Sharp composite
      // if (params.options.watermark) { ... }

      // Procesar
      const buffer = await sharpInstance.toBuffer();
      const metadata = await sharp(buffer).metadata();

      return {
        buffer,
        format: metadata.format || format,
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: buffer.length,
      };
    } catch (error: any) {
      logger.error({ error }, "[AzureBlobStorageAdapter] Image processing error");
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  /**
   * Lista archivos en un container
   */
  async listFiles(params: ListFilesParams): Promise<FileMetadata[]> {
    try {
      const containerName = this.getContainerName(params.container);
      const containerClient =
        this.blobServiceClient.getContainerClient(containerName);

      const files: FileMetadata[] = [];
      const maxResults = params.maxResults || 100;

      for await (const blob of containerClient.listBlobsFlat({
        prefix: params.prefix,
      })) {
        if (files.length >= maxResults) break;

        const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
        const url = this.config.cdnEndpoint
          ? `${this.config.cdnEndpoint}/${containerName}/${blob.name}`
          : blockBlobClient.url;

        files.push({
          blobName: blob.name,
          url,
          size: blob.properties.contentLength || 0,
          mimeType: blob.properties.contentType || "application/octet-stream",
          lastModified: blob.properties.lastModified || new Date(),
          metadata: blob.metadata,
        });
      }

      return files;
    } catch (error: any) {
      logger.error({ error, container: params.container }, "[AzureBlobStorageAdapter] List files error");
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Verifica si un archivo existe
   */
  async fileExists(blobName: string, container: string): Promise<boolean> {
    try {
      const containerName = this.getContainerName(container);
      const containerClient =
        this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      return await blockBlobClient.exists();
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene metadata de un archivo
   */
  async getFileMetadata(
    blobName: string,
    container: string,
  ): Promise<FileMetadata> {
    try {
      const containerName = this.getContainerName(container);
      const containerClient =
        this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const properties = await blockBlobClient.getProperties();
      const url = this.config.cdnEndpoint
        ? `${this.config.cdnEndpoint}/${containerName}/${blobName}`
        : blockBlobClient.url;

      return {
        blobName,
        url,
        size: properties.contentLength || 0,
        mimeType: properties.contentType || "application/octet-stream",
        lastModified: properties.lastModified || new Date(),
        metadata: properties.metadata,
      };
    } catch (error: any) {
      logger.error({ error, blobName }, "[AzureBlobStorageAdapter] Get metadata error");
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Verifica si el proveedor está configurado correctamente
   */
  async isConfigured(
    tenantId: string,
    businessUnitId: string,
  ): Promise<boolean> {
    try {
      // Intenta listar containers para validar las credenciales
      const iterator = this.blobServiceClient.listContainers();
      const result = await iterator.next();
      return !result.done;
    } catch (error) {
      logger.error({ error, tenantId, businessUnitId }, "[AzureBlobStorageAdapter] Configuration check failed");
      return false;
    }
  }

  /**
   * Obtiene el nombre del container con prefijo si está configurado
   */
  private getContainerName(container: string): string {
    if (this.config.containerPrefix) {
      return `${this.config.containerPrefix}-${container}`;
    }
    return container;
  }

  /**
   * Genera un nombre único para el blob con estructura multi-tenant
   * Estructura: tenant-{id}/business-unit-{id}/{folder}/{filename}
   */
  private generateBlobName(
    fileName: string,
    tenantId: string,
    businessUnitId: string,
    folder?: string,
  ): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = fileName.split(".").pop();
    const nameWithoutExt = fileName.replace(`.${extension}`, "");
    const sanitizedName = nameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");

    const uniqueFileName = `${sanitizedName}-${timestamp}-${random}.${extension}`;

    // Estructura multi-tenant obligatoria
    const tenantPath = `tenant-${tenantId}`;
    const businessUnitPath = `business-unit-${businessUnitId}`;

    // Construir path completo
    const pathParts = [tenantPath, businessUnitPath];
    if (folder) {
      pathParts.push(folder);
    }
    pathParts.push(uniqueFileName);

    return pathParts.join("/");
  }

  /**
   * Convierte un stream a buffer
   */
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
