/**
 * CONTRACT CONTROLLER
 * Controller para gestión de contratos de renta
 */

import { Request, Response } from "express";
import prisma from "@config/database";
import { quotationService } from "../services/quotation.service";
import { contractService } from "../services/contract.service";
import { autoChargeService } from "../services/auto-charge.service";

export class ContractController {
  /**
   * @swagger
   * /api/v1/rental/contracts:
   *   get:
   *     tags: [Contracts]
   *     summary: Listar contratos con filtros
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, suspended, completed, cancelled]
   *       - in: query
   *         name: clientId
   *         schema:
   *           type: string
   *       - in: query
   *         name: businessUnitId
   *         schema:
   *           type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Lista de contratos
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, businessUnitId: userBUId } = req.context || {};
      const {
        status,
        clientId,
        businessUnitId,
        page = 1,
        limit = 20,
      } = req.query;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const contracts = await contractService.listContracts({
        tenantId,
        businessUnitId: (businessUnitId as string) || userBUId,
        status: status as string,
        clientId: clientId as string,
      });

      res.json({
        success: true,
        data: contracts,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "CONTRACTS_LIST_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}:
   *   get:
   *     tags: [Contracts]
   *     summary: Obtener contrato con detalles completos
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Contrato encontrado
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const contract = await contractService.getContractById(id as string);

      if (!contract) {
        res.status(404).json({
          success: false,
          error: {
            code: "CONTRACT_NOT_FOUND",
            message: `Contract with id '${id}' not found`,
          },
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
        error: {
          code: "CONTRACT_FETCH_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts:
   *   post:
   *     tags: [Contracts]
   *     summary: Crear contrato de renta
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - quotationId
   *               - clientId
   *               - startDate
   *             properties:
   *               quotationId:
   *                 type: string
   *               clientId:
   *                 type: string
   *               startDate:
   *                 type: string
   *                 format: date
   *               estimatedEndDate:
   *                 type: string
   *                 format: date
   *               initialCredit:
   *                 type: number
   *               alertAmount:
   *                 type: number
   *               statementFrequency:
   *                 type: string
   *                 enum: [weekly, biweekly, monthly, manual]
   *     responses:
   *       201:
   *         description: Contrato creado exitosamente
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, businessUnitId, userId } = req.context || {};

      if (!tenantId || !userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing context" },
        });
        return;
      }
      const data = req.body;

      const result = await contractService.createContract({
        ...data,
        tenantId,
        businessUnitId,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: error.code || "CONTRACT_CREATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * POST /api/v1/rental/contracts/master
   * Crear Contrato Marco (v7.0) desde una cotización aprobada.
   * El admin selecciona cláusulas y fechas; el contrato se crea sin items específicos.
   */
  async createMasterContract(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, businessUnitId, userId } = req.context || {};

      if (!tenantId || !userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing context" },
        });
        return;
      }

      const {
        quotationId,
        startDate,
        estimatedEndDate,
        agreedCreditLimit,
        agreedTimeLimit,
        clauseIds,
        notes,
      } = req.body;

      if (!quotationId || !startDate) {
        res.status(400).json({
          success: false,
          error: {
            code: "MISSING_FIELDS",
            message: "quotationId y startDate son requeridos",
          },
        });
        return;
      }

      // Verificar que la cotización existe, pertenece al tenant y está aprobada
      const quotation = await prisma.quotation.findFirst({
        where: { id: quotationId, tenantId },
        include: { client: true },
      });

      if (!quotation) {
        res.status(404).json({
          success: false,
          error: {
            code: "QUOTATION_NOT_FOUND",
            message: "Cotización no encontrada",
          },
        });
        return;
      }

      if (quotation.clientResponse !== "approved") {
        res.status(400).json({
          success: false,
          error: {
            code: "QUOTATION_NOT_APPROVED",
            message: `La cotización debe estar aprobada por el cliente (estado actual: ${quotation.clientResponse || "pendiente"})`,
          },
        });
        return;
      }

      // Crear el Contrato Marco
      const contract = await contractService.createMasterContract({
        tenantId,
        businessUnitId: businessUnitId || quotation.businessUnitId,
        clientId: quotation.clientId,
        startDate: new Date(startDate),
        estimatedEndDate: estimatedEndDate
          ? new Date(estimatedEndDate)
          : undefined,
        agreedCreditLimit,
        agreedTimeLimit,
        notes,
        metadata: {
          quotationId,
          quotationCode: quotation.code,
          clauseIds: clauseIds || [],
          createdByWizard: true,
        },
        createdBy: userId,
      });

      // Actualizar la cotización para indicar que ya tiene contrato vinculado
      await prisma.quotation.update({
        where: { id: quotationId },
        data: {
          metadata: {
            ...((quotation.metadata as any) || {}),
            masterContractId: contract.id,
            masterContractCode: contract.code,
          },
        },
      });

      res.status(201).json({
        success: true,
        data: contract,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: error.code || "MASTER_CONTRACT_CREATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/withdraw:
   *   post:
   *     tags: [Contracts]
   *     summary: Retirar asset (MACHINERY o TOOL)
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - assetId
   *               - expectedReturnDate
   *             properties:
   *               assetId:
   *                 type: string
   *               expectedReturnDate:
   *                 type: string
   *                 format: date
   *               initialHourometer:
   *                 type: number
   *               initialOdometer:
   *                 type: number
   *               evidenceUrls:
   *                 type: array
   *                 items:
   *                   type: string
   *               notes:
   *                 type: string
   *     responses:
   *       201:
   *         description: Asset retirado exitosamente
   */
  async withdraw(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.context || {};
      const data = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing user context" },
        });
        return;
      }

      const result = await contractService.withdrawAsset({
        contractId: id as string,
        ...data,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode =
        error.code === "INSUFFICIENT_BALANCE"
          ? 409
          : error.code === "ASSET_NOT_AVAILABLE"
            ? 403
            : 400;

      res.status(statusCode).json({
        success: false,
        error: {
          code: error.code || "WITHDRAWAL_ERROR",
          message: error.message,
          details: error.details,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/return:
   *   post:
   *     tags: [Contracts]
   *     summary: Devolver asset
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - rentalId
   *             properties:
   *               rentalId:
   *                 type: string
   *               returnCondition:
   *                 type: string
   *                 enum: [good, damaged, maintenance_required]
   *               finalHourometer:
   *                 type: number
   *               finalOdometer:
   *                 type: number
   *               evidenceUrls:
   *                 type: array
   *                 items:
   *                   type: string
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Asset devuelto exitosamente
   */
  async return(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.context || {};
      const data = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing user context" },
        });
        return;
      }

      const result = await contractService.returnAsset({
        rentalId: id as string,
        ...data,
        createdBy: userId,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: error.code || "RETURN_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/suspend:
   *   patch:
   *     tags: [Contracts]
   *     summary: Suspender contrato (detiene cargos automáticos)
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reason:
   *                 type: string
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Contrato suspendido
   */
  async suspend(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason, notes } = req.body;

      const contract = await contractService.suspendContract(
        id as string,
        reason,
        notes,
      );

      res.json({
        success: true,
        data: contract,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "SUSPEND_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/reactivate:
   *   patch:
   *     tags: [Contracts]
   *     summary: Reactivar contrato suspendido
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Contrato reactivado
   */
  async reactivate(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.context || {};
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing user context" },
        });
        return;
      }

      const contract = await contractService.reactivateContract(
        id as string,
        userId,
      );

      res.json({
        success: true,
        data: contract,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "REACTIVATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/complete:
   *   patch:
   *     tags: [Contracts]
   *     summary: Completar contrato (debe NO tener assets activos)
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               actualEndDate:
   *                 type: string
   *                 format: date-time
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Contrato completado
   *       400:
   *         description: Contrato tiene assets activos
   */
  async complete(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.context || {};
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing user context" },
        });
        return;
      }

      const result = await contractService.completeContract(
        id as string,
        userId,
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.code === "ACTIVE_RENTALS_EXIST" ? 400 : 400;

      res.status(statusCode).json({
        success: false,
        error: {
          code: error.code || "COMPLETE_ERROR",
          message: error.message,
          details: error.details,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/projection:
   *   get:
   *     tags: [Contracts]
   *     summary: Proyectar consumo futuro
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: days
   *         schema:
   *           type: integer
   *           default: 30
   *     responses:
   *       200:
   *         description: Proyección de consumo
   */
  async getProjection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { days = 30 } = req.query;

      const projection = await autoChargeService.projectConsumption(
        id as string,
        parseInt(days as string),
      );

      res.json({
        success: true,
        data: projection,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "PROJECTION_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/payment-proof:
   *   post:
   *     tags: [Contracts]
   *     summary: Subir comprobante de pago (multipart/form-data)
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *               transactionRef:
   *                 type: string
   *               paymentDate:
   *                 type: string
   *                 format: date
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Comprobante subido correctamente
   */
  async uploadPaymentProof(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.context || {};
      const { id } = req.params;
      const { transactionRef, paymentDate, notes } = req.body;
      const file = (req as any).file; // Multer middleware adds this

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      if (!file) {
        res.status(400).json({
          success: false,
          error: {
            code: "MISSING_FILE",
            message: "Payment proof file is required",
          },
        });
        return;
      }

      // TODO: Upload to Azure Blob Storage
      // const blobUrl = await uploadToAzureBlob(file, tenantId, 'payment-proofs');
      const blobUrl = `https://placeholder.blob.core.windows.net/payment-proofs/${file.filename}`;

      const updatedContract = await contractService.uploadPaymentProof(id, {
        paymentType: "online",
        paymentProofUrl: blobUrl,
        paymentDetails: {
          transactionRef,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          uploadedBy: userId,
          uploadedAt: new Date(),
          notes,
          originalFilename: file.originalname,
          fileSize: file.size,
        },
      });

      res.json({
        success: true,
        data: updatedContract,
        message: "Payment proof uploaded successfully",
      });
    } catch (error: any) {
      console.error("Error uploading payment proof:", error);
      res.status(400).json({
        success: false,
        error: {
          code: "UPLOAD_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/payment-proof/local:
   *   post:
   *     tags: [Contracts]
   *     summary: Marcar pago como "local" (efectivo/presencial)
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               receivedBy:
   *                 type: string
   *                 description: User ID que recibió el pago
   *               paymentDate:
   *                 type: string
   *                 format: date
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Pago marcado como local
   */
  async markLocalPayment(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.context || {};
      const { id } = req.params;
      const { receivedBy, paymentDate, notes } = req.body;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const updatedContract = await contractService.uploadPaymentProof(id, {
        paymentType: "local",
        paymentProofUrl: null,
        paymentDetails: {
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          receivedBy: receivedBy || userId,
          markedBy: userId,
          markedAt: new Date(),
          notes,
          method: "cash/local",
        },
      });

      res.json({
        success: true,
        data: updatedContract,
        message: "Payment marked as local successfully",
      });
    } catch (error: any) {
      console.error("Error marking local payment:", error);
      res.status(400).json({
        success: false,
        error: {
          code: "LOCAL_PAYMENT_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/payment-proof:
   *   get:
   *     tags: [Contracts]
   *     summary: Obtener información del comprobante de pago
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Información del comprobante
   */
  async getPaymentProof(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const contract = await contractService.getContractById(id);

      if (!contract) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Contract not found" },
        });
        return;
      }

      const paymentProof = {
        hasProof: !!contract.paymentProofUrl || !!contract.paymentType,
        type: contract.paymentType,
        url: contract.paymentProofUrl,
        details: contract.paymentDetails,
        verifiedBy: contract.paymentVerifiedBy,
        verifiedAt: contract.paymentVerifiedAt,
        isVerified: !!contract.paymentVerifiedAt,
      };

      res.json({
        success: true,
        data: paymentProof,
      });
    } catch (error: any) {
      console.error("Error getting payment proof:", error);
      res.status(400).json({
        success: false,
        error: {
          code: "GET_PROOF_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/payment-proof/verify:
   *   post:
   *     tags: [Contracts]
   *     summary: Verificar comprobante de pago (admin)
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Comprobante verificado
   */
  async verifyPaymentProof(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.context || {};
      const { id } = req.params;
      const { notes } = req.body;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      // TODO: Check if user has permission to verify payments

      const updatedContract = await contractService.verifyPaymentProof(
        id,
        userId!,
        notes,
      );

      res.json({
        success: true,
        data: updatedContract,
        message: "Payment proof verified successfully",
      });
    } catch (error: any) {
      console.error("Error verifying payment proof:", error);
      res.status(400).json({
        success: false,
        error: {
          code: "VERIFY_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/request-signature:
   *   post:
   *     tags: [Contracts]
   *     summary: Enviar contrato a firma digital (SignNow)
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               signers:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     email:
   *                       type: string
   *                     name:
   *                       type: string
   *                     role:
   *                       type: string
   *     responses:
   *       200:
   *         description: Solicitud de firma enviada
   */
  async requestSignature(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};
      const { id } = req.params;
      const { signers } = req.body;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      if (!signers || !Array.isArray(signers) || signers.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Signers array is required",
          },
        });
        return;
      }

      const signatureRequest = await contractService.requestSignature(
        id,
        signers,
      );

      res.json({
        success: true,
        data: signatureRequest,
        message: "Signature request sent successfully",
      });
    } catch (error: any) {
      console.error("Error requesting signature:", error);
      res.status(400).json({
        success: false,
        error: {
          code: "SIGNATURE_REQUEST_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/signature-status:
   *   get:
   *     tags: [Contracts]
   *     summary: Obtener estado de firma digital
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Estado de firma
   */
  async getSignatureStatus(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const status = await contractService.getSignatureStatus(id);

      res.json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      console.error("Error getting signature status:", error);
      res.status(400).json({
        success: false,
        error: {
          code: "GET_STATUS_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/pdf:
   *   get:
   *     tags: [Contracts]
   *     summary: Descargar PDF del contrato
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: PDF del contrato
   *         content:
   *           application/pdf:
   *             schema:
   *               type: string
   *               format: binary
   */
  async downloadPdf(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const pdfBuffer = await contractService.getContractPdf(id);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="contrato-${id}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      res.status(400).json({
        success: false,
        error: {
          code: "PDF_DOWNLOAD_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/signed-pdf:
   *   get:
   *     tags: [Contracts]
   *     summary: Descargar PDF firmado del contrato
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: PDF firmado del contrato
   *         content:
   *           application/pdf:
   *             schema:
   *               type: string
   *               format: binary
   */
  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/generate-pdf:
   *   post:
   *     tags: [Contracts]
   *     summary: Genera y almacena el PDF del contrato con branding
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: URL temporal (SAS) al PDF generado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 pdfUrl:
   *                   type: string
   */
  async generatePdf(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const pdfUrl = await contractService.generateAndStorePdf(id, tenantId);

      res.json({
        success: true,
        data: { pdfUrl },
      });
    } catch (error: any) {
      console.error("Error generando PDF de contrato:", error);
      res.status(400).json({
        success: false,
        error: {
          code: "PDF_GENERATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  async downloadSignedPdf(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const contract = await prisma.rentalContract.findUnique({
        where: { id },
        select: {
          signedPdfUrl: true,
          signatureStatus: true,
        },
      });

      if (!contract) {
        res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Contract not found",
          },
        });
        return;
      }

      if (!contract.signedPdfUrl || contract.signatureStatus !== "signed") {
        res.status(400).json({
          success: false,
          error: {
            code: "NOT_SIGNED",
            message: "Contract has not been signed yet",
          },
        });
        return;
      }

      // Descargar desde Azure Blob Storage
      const axios = (await import("axios")).default;
      const response = await axios.get(contract.signedPdfUrl, {
        responseType: "arraybuffer",
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="contrato-${id}-firmado.pdf"`,
      );
      res.send(Buffer.from(response.data));
    } catch (error: any) {
      console.error("Error downloading signed PDF:", error);
      res.status(400).json({
        success: false,
        error: {
          code: "PDF_DOWNLOAD_ERROR",
          message: error.message,
        },
      });
    }
  }
}

export const contractController = new ContractController();
