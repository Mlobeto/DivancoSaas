/**
 * Supply Category Import Service
 * Handles CSV import for supply categories
 */

import { PrismaClient } from "@prisma/client";
import { CSVImportService, ImportResult } from "./csv-import.service";

export class SupplyCategoryImportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Import supply categories from CSV buffer
   *
   * Expected CSV format:
   * code,name,type,description,color,icon,requiresStockControl,allowNegativeStock
   */
  async importFromCSV(
    tenantId: string,
    businessUnitId: string,
    buffer: Buffer,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      created: 0,
      errors: [],
      summary: "",
    };

    try {
      // Parse CSV
      const records = await CSVImportService.parseCSV(buffer);

      if (records.length === 0) {
        result.success = false;
        result.summary = "CSV file is empty";
        return result;
      }

      // Validate and import each record
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const rowNumber = i + 2; // +2 because CSV has header row and index starts at 0

        try {
          // Validate required fields
          const validationError = CSVImportService.validateRequiredFields(
            record,
            ["code", "name", "type"],
          );

          if (validationError) {
            result.errors.push({
              row: rowNumber,
              error: validationError,
              data: record,
            });
            continue;
          }

          // Validate type enum
          const validTypes = [
            "CONSUMABLE",
            "SPARE_PART",
            "RAW_MATERIAL",
            "FINISHED_PRODUCT",
            "TOOL",
            "OTHER",
          ];
          if (!validTypes.includes(record.type)) {
            result.errors.push({
              row: rowNumber,
              error: `Invalid type '${record.type}'. Valid values: ${validTypes.join(", ")}`,
              data: record,
            });
            continue;
          }

          // Check if category already exists
          const existing = await this.prisma.supplyCategory.findFirst({
            where: {
              businessUnitId,
              code: record.code,
            },
          });

          if (existing) {
            result.errors.push({
              row: rowNumber,
              error: `Category with code '${record.code}' already exists`,
              data: record,
            });
            continue;
          }

          // Create category
          await this.prisma.supplyCategory.create({
            data: {
              tenantId,
              businessUnitId,
              code: record.code,
              name: record.name,
              type: record.type,
              description: record.description || undefined,
              color: record.color || undefined,
              icon: record.icon || undefined,
              requiresStockControl: CSVImportService.parseBoolean(
                record.requiresStockControl,
                true,
              ),
              allowNegativeStock: CSVImportService.parseBoolean(
                record.allowNegativeStock,
                false,
              ),
            },
          });

          result.created++;
        } catch (error: any) {
          result.errors.push({
            row: rowNumber,
            error: error.message || "Unknown error",
            data: record,
          });
        }
      }

      // Generate summary
      result.success = result.errors.length === 0;
      result.summary = `Imported ${result.created} of ${records.length} categories. ${result.errors.length} errors.`;

      return result;
    } catch (error: any) {
      result.success = false;
      result.summary = `Failed to parse CSV: ${error.message}`;
      return result;
    }
  }
}
