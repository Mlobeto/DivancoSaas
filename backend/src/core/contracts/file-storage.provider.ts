/**
 * FILE STORAGE PROVIDER CONTRACT (CORE)
 * Contrato para proveedores de almacenamiento (S3, Cloudinary, etc.)
 */

export interface FileStorageProvider {
  readonly name: string;

  /**
   * Subir archivo
   */
  upload(params: UploadParams): Promise<UploadResult>;

  /**
   * Obtener URL pública o firmada
   */
  getUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * Eliminar archivo
   */
  delete(key: string): Promise<boolean>;

  /**
   * Listar archivos
   */
  list(prefix: string): Promise<string[]>;
}

export interface UploadParams {
  file: Buffer | ReadableStream;
  key: string;
  contentType?: string;
  metadata?: Record<string, string>;
  isPublic?: boolean;
}

export interface UploadResult {
  success: boolean;
  key: string;
  url: string;
  size?: number;
  error?: string;
}
