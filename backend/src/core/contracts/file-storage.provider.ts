/**
 * File Storage Provider Contract
 * Define la interfaz para integrar servicios de almacenamiento de archivos
 * Implementaciones: Azure Blob Storage, AWS S3, Google Cloud Storage, etc.
 */

export interface UploadFileParams {
  file: Buffer;
  fileName: string;
  mimeType: string;
  container: string; // Nombre del container/bucket
  folder?: string; // Carpeta dentro del container
  tenantId: string;
  businessUnitId: string;
  metadata?: Record<string, string>;
}

export interface UploadFileResult {
  url: string; // URL pública o firmada del archivo
  blobName: string; // Nombre único del blob/archivo en el storage
  size: number; // Tamaño en bytes
  mimeType: string;
  uploadedAt: Date;
}

export interface DownloadFileParams {
  blobName: string;
  container: string;
  tenantId: string;
  businessUnitId: string;
}

export interface DownloadFileResult {
  buffer: Buffer;
  mimeType: string;
  size: number;
}

export interface DeleteFileParams {
  blobName: string;
  container: string;
  tenantId: string;
  businessUnitId: string;
}

export interface GenerateSasTokenParams {
  blobName: string;
  container: string;
  expiresIn: number; // Duración en segundos
  permissions?: "read" | "write" | "delete" | "list";
  tenantId: string;
  businessUnitId: string;
}

export interface ProcessImageParams {
  file: Buffer;
  options: ImageProcessingOptions;
}

export interface ImageProcessingOptions {
  resize?: {
    width?: number;
    height?: number;
    fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  };
  format?: "jpeg" | "png" | "webp" | "avif";
  quality?: number; // 1-100
  thumbnail?: {
    width: number;
    height: number;
  };
  watermark?: {
    text: string;
    position:
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | "center";
    opacity?: number;
  };
}

export interface ProcessedImageResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
}

export interface ListFilesParams {
  container: string;
  prefix?: string; // Filtrar por prefijo (carpeta)
  maxResults?: number;
  tenantId: string;
  businessUnitId: string;
}

export interface FileMetadata {
  blobName: string;
  url: string;
  size: number;
  mimeType: string;
  lastModified: Date;
  metadata?: Record<string, string>;
}

/**
 * Interfaz principal del proveedor de almacenamiento
 */
export interface FileStorageProvider {
  /**
   * Sube un archivo al storage
   */
  uploadFile(params: UploadFileParams): Promise<UploadFileResult>;

  /**
   * Descarga un archivo del storage
   */
  downloadFile(params: DownloadFileParams): Promise<DownloadFileResult>;

  /**
   * Elimina un archivo del storage
   */
  deleteFile(params: DeleteFileParams): Promise<void>;

  /**
   * Genera una URL firmada temporal (SAS token)
   */
  generateSasToken(params: GenerateSasTokenParams): Promise<string>;

  /**
   * Procesa una imagen (compresión, redimensionamiento, etc.)
   * Se ejecuta antes de subir al storage
   */
  processImage(params: ProcessImageParams): Promise<ProcessedImageResult>;

  /**
   * Lista archivos en un container
   */
  listFiles(params: ListFilesParams): Promise<FileMetadata[]>;

  /**
   * Verifica si un archivo existe
   */
  fileExists(blobName: string, container: string): Promise<boolean>;

  /**
   * Obtiene metadata de un archivo sin descargarlo
   */
  getFileMetadata(blobName: string, container: string): Promise<FileMetadata>;

  /**
   * Verifica si el proveedor está configurado correctamente
   */
  isConfigured(tenantId: string, businessUnitId: string): Promise<boolean>;
}

/**
 * Configuración específica para Azure Blob Storage
 */
export interface AzureBlobStorageConfig {
  accountName: string;
  accountKey: string;
  containerPrefix?: string; // Prefijo para nombres de containers
  cdnEndpoint?: string; // URL del CDN si está configurado
  defaultSasExpiration?: number; // Segundos por defecto para SAS tokens (default: 3600)
}

/**
 * Configuración almacenada por BusinessUnit
 */
export interface FileStorageConfiguration {
  provider: "azure-blob-storage" | "aws-s3" | "google-cloud-storage";
  config: AzureBlobStorageConfig | Record<string, any>;
  enabled: boolean;
  tenantId: string;
  businessUnitId: string;
}
