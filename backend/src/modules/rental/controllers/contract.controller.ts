/**
 * CONTRACT CONTROLLER
 * Controller para gestión de contratos
 */

import { Request, Response } from "express";
import { quotationService } from "../services/quotation.service";

export class ContractController {
  /**
   * Listar contratos
   * GET /api/v1/rental/contracts
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { businessUnitId, status, quotationId } = req.query;

      const contracts = await quotationService.listContracts({
        businessUnitId: businessUnitId as string,
        status: status as string,
        quotationId: quotationId as string,
      });

      res.json({
        success: true,
        data: contracts,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Obtener contrato por ID
   * GET /api/v1/rental/contracts/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const contract = await quotationService.getContractById(id as string);

      if (!contract) {
        res.status(404).json({
          success: false,
          error: "Contract not found",
        });
        return;
      }

      res.json({
        success: true,
        data: contract,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export const contractController = new ContractController();
