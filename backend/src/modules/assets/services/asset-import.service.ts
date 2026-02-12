/**
 * Asset Import Service
 * Handles CSV bulk import for assets (implementos, maquinaria)
 */

import { PrismaClient } from "@prisma/client";
import {
  CSVImportService,
  ImportResult,
} from "../../purchases/services/csv-import.service";

interface AssetCSVRow {
  code?: string;
  name: string;
  templateName: string; // Changed from templateCode to match AssetTemplate by name
  acquisitionCost?: string;
  origin?: string;
  currentLocation?: string;
  notes?: string;
}

export class AssetImportService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Generate next sequential asset code if not provided
   * Format: AST-XXXX (AST = Asset)
   */
  private async getNextAssetCode(
    tenantId: string,
    businessUnitId: string,
  ): Promise<string> {
    const latestAsset = await this.prisma.asset.findFirst({
      where: {
        tenantId,
        businessUnitId,
        code: {
          startsWith: "AST-",
        },
      },
      orderBy: {
        code: "desc",
      },
      select: {
        code: true,
      },
    });

    if (!latestAsset) {
      return "AST-0001";
    }

    // Extract number from code (e.g., "AST-0042" -> 42)
    const match = latestAsset.code.match(/AST-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10) + 1;
      return `AST-${num.toString().padStart(4, "0")}`;
    }

    return "AST-0001";
  }

  /**
   * Import assets from CSV file
   * CSV columns: code, name, templateName, acquisitionCost, origin, currentLocation, notes
   */
  async importFromCSV(
    buffer: Buffer,
    tenantId: string,
    businessUnitId: string,
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
        return {
          success: false,
          created: 0,
          errors: [{ row: 0, error: "El archivo CSV está vacío" }],
          summary: "No se encontraron registros para importar",
        };
      }

      // Validate required columns
      const requiredColumns = ["name", "templateName"];
      const validationError = CSVImportService.validateRequiredFields(
        records[0],
        requiredColumns,
      );

      if (validationError) {
        return {
          success: false,
          created: 0,
          errors: [
            {
              row: 0,
              error: validationError,
            },
          ],
          summary: "Formato de CSV inválido",
        };
      }

      // Get all template names for validation
      const templateNames = [
        ...new Set(records.map((r: AssetCSVRow) => r.templateName)),
      ];
      const templates = await this.prisma.assetTemplate.findMany({
        where: {
          businessUnitId,
          name: {
            in: templateNames,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      const templateMap = new Map(templates.map((t) => [t.name, t.id]));

      // Validate codes are unique (if provided)
      const providedCodes = records
        .filter((r: AssetCSVRow) => r.code && r.code.trim())
        .map((r: AssetCSVRow) => r.code!.trim().toUpperCase());

      const duplicateCodes = providedCodes.filter(
        (code, index) => providedCodes.indexOf(code) !== index,
      );

      if (duplicateCodes.length > 0) {
        return {
          success: false,
          created: 0,
          errors: [
            {
              row: 0,
              error: `Códigos duplicados en el CSV: ${[...new Set(duplicateCodes)].join(", ")}`,
            },
          ],
          summary: "CSV contiene códigos duplicados",
        };
      }

      // Check if codes already exist in database
      if (providedCodes.length > 0) {
        const existingAssets = await this.prisma.asset.findMany({
          where: {
            tenantId,
            businessUnitId,
            code: {
              in: providedCodes,
            },
          },
          select: {
            code: true,
          },
        });

        if (existingAssets.length > 0) {
          return {
            success: false,
            created: 0,
            errors: [
              {
                row: 0,
                error: `Los siguientes códigos ya existen: ${existingAssets.map((a) => a.code).join(", ")}`,
              },
            ],
            summary: "Códigos duplicados en la base de datos",
          };
        }
      }

      // Process each row
      for (let i = 0; i < records.length; i++) {
        const row: AssetCSVRow = records[i];
        const rowNumber = i + 2; // +2 because CSV is 1-indexed and has header

        try {
          // Validate template exists
          const templateId = templateMap.get(row.templateName);
          if (!templateId) {
            result.errors.push({
              row: rowNumber,
              error: `Template con nombre "${row.templateName}" no encontrado`,
              data: row,
            });
            continue;
          }

          // Generate code if not provided
          const assetCode =
            row.code && row.code.trim()
              ? row.code.trim().toUpperCase()
              : await this.getNextAssetCode(tenantId, businessUnitId);

          // Parse numeric values
          const acquisitionCost = row.acquisitionCost
            ? CSVImportService.parseDecimal(row.acquisitionCost)
            : undefined;

          // Create asset
          const createdAsset = await this.prisma.asset.create({
            data: {
              tenantId,
              businessUnitId,
              code: assetCode,
              name: row.name.trim(),
              assetType: "implement", // Default type for bulk import
              templateId,
              acquisitionCost,
              origin: row.origin?.trim() || "Inventario inicial",
              currentLocation: row.currentLocation?.trim(),
              // Store notes in customData
              customData: row.notes
                ? {
                    notes: row.notes.trim(),
                  }
                : undefined,
            },
          });

          // Create asset event
          await this.prisma.assetEvent.create({
            data: {
              tenantId,
              businessUnitId,
              assetId: createdAsset.id,
              eventType: "asset.imported",
              source: "csv_import",
              payload: {
                code: assetCode,
                name: row.name,
                templateName: row.templateName,
              },
            },
          });

          result.created++;
        } catch (error: any) {
          result.errors.push({
            row: rowNumber,
            error: error.message || "Error desconocido al crear asset",
            data: row,
          });
        }
      }

      // Build summary
      if (result.errors.length === 0) {
        result.summary = `✅ ${result.created} asset${result.created !== 1 ? "s" : ""} importado${result.created !== 1 ? "s" : ""} exitosamente`;
      } else if (result.created > 0) {
        result.summary = `⚠️ ${result.created} asset${result.created !== 1 ? "s" : ""} importado${result.created !== 1 ? "s" : ""}, ${result.errors.length} error${result.errors.length !== 1 ? "es" : ""}`;
        result.success = false;
      } else {
        result.summary = `❌ No se importaron assets. ${result.errors.length} error${result.errors.length !== 1 ? "es" : ""} encontrado${result.errors.length !== 1 ? "s" : ""}`;
        result.success = false;
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        created: 0,
        errors: [
          {
            row: 0,
            error: error.message || "Error al procesar el archivo CSV",
          },
        ],
        summary: "Error al procesar el archivo",
      };
    }
  }
}
