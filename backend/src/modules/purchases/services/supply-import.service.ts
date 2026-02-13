/**
 * Supply Import Service
 * Handles CSV import for supplies
 */

import { PrismaClient } from "@prisma/client";
import { CSVImportService, ImportResult } from "./csv-import.service";

export class SupplyImportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate next available supply code
   */
  private async getNextSupplyCode(
    tenantId: string,
    businessUnitId: string,
  ): Promise<string> {
    const lastSupply = await this.prisma.supply.findFirst({
      where: {
        businessUnitId,
        code: {
          startsWith: "SUM-",
        },
      },
      orderBy: {
        code: "desc",
      },
    });

    if (!lastSupply || !lastSupply.code) {
      return "SUM-0001";
    }

    const codeParts = lastSupply.code.split("-");
    if (codeParts.length !== 2) {
      return "SUM-0001";
    }

    const lastNumber = parseInt(codeParts[1]);
    if (isNaN(lastNumber)) {
      return "SUM-0001";
    }

    const nextNumber = lastNumber + 1;
    return `SUM-${String(nextNumber).padStart(4, "0")}`;
  }

  /**
   * Import supplies from CSV buffer
   *
   * Expected CSV format:
   * code,name,categoryCode,sku,barcode,unit,costPerUnit,currentStock,minStock,maxStock,description
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
        const rowNumber = i + 2;

        try {
          // Validate required fields
          const validationError = CSVImportService.validateRequiredFields(
            record,
            ["name", "categoryCode"],
          );

          if (validationError) {
            result.errors.push({
              row: rowNumber,
              error: validationError,
              data: record,
            });
            continue;
          }

          // Find category by code
          const category = await this.prisma.supplyCategory.findFirst({
            where: {
              businessUnitId,
              code: record.categoryCode,
            },
          });

          if (!category) {
            result.errors.push({
              row: rowNumber,
              error: `Category with code '${record.categoryCode}' not found`,
              data: record,
            });
            continue;
          }

          // Generate or validate code
          let code = record.code;
          if (!code || code.trim() === "") {
            code = await this.getNextSupplyCode(tenantId, businessUnitId);
          } else {
            // Check if code already exists
            const existing = await this.prisma.supply.findFirst({
              where: {
                businessUnitId,
                code: code,
              },
            });

            if (existing) {
              result.errors.push({
                row: rowNumber,
                error: `Supply with code '${code}' already exists`,
                data: record,
              });
              continue;
            }
          }

          // Parse numeric values
          const costPerUnit = CSVImportService.parseDecimal(
            record.costPerUnit,
            0,
          );
          const currentStock = CSVImportService.parseDecimal(
            record.currentStock,
            0,
          );
          const minStock = CSVImportService.parseDecimal(
            record.minStock,
            undefined,
          );
          const maxStock = CSVImportService.parseDecimal(
            record.maxStock,
            undefined,
          );

          // Validate stock values
          if (currentStock! < 0) {
            result.errors.push({
              row: rowNumber,
              error: "currentStock cannot be negative",
              data: record,
            });
            continue;
          }

          if (
            minStock !== undefined &&
            maxStock !== undefined &&
            minStock > maxStock
          ) {
            result.errors.push({
              row: rowNumber,
              error: "minStock cannot be greater than maxStock",
              data: record,
            });
            continue;
          }

          // Create supply
          await this.prisma.supply.create({
            data: {
              tenantId,
              businessUnitId,
              code,
              name: record.name,
              categoryId: category.id,
              sku: record.sku || undefined,
              barcode: record.barcode || undefined,
              unit: record.unit || undefined,
              costPerUnit: costPerUnit,
              stock: currentStock,
              minStock: minStock,
              maxStock: maxStock,
              description: record.description || undefined,
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
      result.summary = `Imported ${result.created} of ${records.length} supplies. ${result.errors.length} errors.`;

      return result;
    } catch (error: any) {
      result.success = false;
      result.summary = `Failed to parse CSV: ${error.message}`;
      return result;
    }
  }
}
