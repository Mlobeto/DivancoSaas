/**
 * CSV Import Service
 * Handles CSV file parsing and bulk import operations
 */

import { Readable } from "stream";
import { parse } from "csv-parse";

export interface ImportResult {
  success: boolean;
  created: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  summary: string;
}

export class CSVImportService {
  /**
   * Parse CSV file from buffer
   */
  static async parseCSV(
    buffer: Buffer,
    options: {
      columns?: boolean;
      skip_empty_lines?: boolean;
      trim?: boolean;
    } = {},
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const records: any[] = [];
      const stream = Readable.from(buffer);

      stream
        .pipe(
          parse({
            columns: options.columns ?? true,
            skip_empty_lines: options.skip_empty_lines ?? true,
            trim: options.trim ?? true,
            bom: true, // Handle BOM for UTF-8
          }),
        )
        .on("data", (record) => {
          records.push(record);
        })
        .on("end", () => {
          resolve(records);
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  }

  /**
   * Validate required fields in a record
   */
  static validateRequiredFields(
    record: any,
    requiredFields: string[],
  ): string | null {
    for (const field of requiredFields) {
      if (!record[field] || String(record[field]).trim() === "") {
        return `Missing required field: ${field}`;
      }
    }
    return null;
  }

  /**
   * Parse boolean value from CSV
   */
  static parseBoolean(value: any, defaultValue = false): boolean {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }
    const str = String(value).toLowerCase().trim();
    return str === "true" || str === "1" || str === "yes" || str === "si";
  }

  /**
   * Parse integer value from CSV
   */
  static parseInt(value: any, defaultValue?: number): number | undefined {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Parse decimal value from CSV
   */
  static parseDecimal(value: any, defaultValue?: number): number | undefined {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Parse JSON object from pipe-separated key:value pairs
   * Example: "key1:value1|key2:value2" -> {key1: "value1", key2: "value2"}
   */
  static parseCustomFields(value: any): Record<string, any> | undefined {
    if (!value || String(value).trim() === "") {
      return undefined;
    }

    try {
      const pairs = String(value).split("|");
      const result: Record<string, any> = {};

      for (const pair of pairs) {
        const [key, ...valueParts] = pair.split(":");
        if (key && valueParts.length > 0) {
          result[key.trim()] = valueParts.join(":").trim();
        }
      }

      return Object.keys(result).length > 0 ? result : undefined;
    } catch (error) {
      return undefined;
    }
  }
}
