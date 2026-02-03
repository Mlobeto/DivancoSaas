/**
 * Encryption Service
 * Servicio para encriptar y desencriptar datos sensibles (credenciales de integraciones)
 * Utiliza AES-256-GCM para encriptación simétrica
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // Para GCM
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32; // 256 bits

export class EncryptionService {
  private masterKey: string;

  constructor() {
    // La clave maestra debe estar en variables de entorno
    this.masterKey = process.env.ENCRYPTION_MASTER_KEY || "";

    if (!this.masterKey || this.masterKey.length < 32) {
      console.warn(
        "[EncryptionService] WARNING: ENCRYPTION_MASTER_KEY not set or too short. Using default (INSECURE for production)",
      );
      // En desarrollo, usar una clave por defecto (NUNCA en producción)
      this.masterKey = "dev-master-key-CHANGE-THIS-IN-PRODUCTION-12345678";
    }
  }

  /**
   * Deriva una clave a partir de la master key y un salt usando PBKDF2
   */
  private deriveKey(salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      100000,
      KEY_LENGTH,
      "sha512",
    );
  }

  /**
   * Encripta un objeto JSON y retorna un string base64
   * Formato: salt.iv.authTag.encryptedData (todo en base64 separado por puntos)
   */
  encrypt(data: any): string {
    try {
      // Convertir objeto a JSON string
      const plaintext = JSON.stringify(data);

      // Generar salt e IV aleatorios
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);

      // Derivar clave de encriptación
      const key = this.deriveKey(salt);

      // Crear cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

      // Encriptar
      let encrypted = cipher.update(plaintext, "utf8", "base64");
      encrypted += cipher.final("base64");

      // Obtener authentication tag (GCM)
      const authTag = cipher.getAuthTag();

      // Retornar todo concatenado y en base64
      return `${salt.toString("base64")}.${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted}`;
    } catch (error: any) {
      console.error("[EncryptionService] Encryption error:", error.message);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Desencripta un string encriptado y retorna el objeto original
   */
  decrypt(encryptedData: string): any {
    try {
      // Separar los componentes
      const parts = encryptedData.split(".");
      if (parts.length !== 4) {
        throw new Error("Invalid encrypted data format");
      }

      // Validar que todas las partes existan
      if (!parts[0] || !parts[1] || !parts[2] || !parts[3]) {
        throw new Error("Invalid encrypted data: missing components");
      }

      const salt = Buffer.from(parts[0], "base64");
      const iv = Buffer.from(parts[1], "base64");
      const authTag = Buffer.from(parts[2], "base64");
      const encrypted = parts[3];

      // Derivar la misma clave
      const key = this.deriveKey(salt);

      // Crear decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // Desencriptar
      let decrypted = decipher.update(encrypted, "base64", "utf8");
      decrypted += decipher.final("utf8");

      // Parsear JSON
      return JSON.parse(decrypted);
    } catch (error: any) {
      console.error("[EncryptionService] Decryption error:", error.message);
      throw new Error("Failed to decrypt data");
    }
  }

  /**
   * Hash de un string usando SHA-256 (para comparaciones sin desencriptar)
   */
  hash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Genera un token aleatorio seguro (para webhook verify tokens, etc.)
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Valida que la master key esté configurada correctamente
   */
  isConfigured(): boolean {
    return (
      this.masterKey.length >= 32 &&
      this.masterKey !== "dev-master-key-CHANGE-THIS-IN-PRODUCTION-12345678"
    );
  }
}

// Singleton
export const encryptionService = new EncryptionService();
