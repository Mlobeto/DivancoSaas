/**
 * RENTAL CONTROLLER
 * Controller para gestión de rentals activos (AssetRental)
 */

import { Request, Response } from "express";
import prisma from "@config/database";

export class RentalController {
  /**
   * @swagger
   * /api/v1/rental/rentals/{id}:
   *   get:
   *     tags: [Rentals]
   *     summary: Obtener rental con detalles y reportes
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Rental encontrado
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const rental = await prisma.assetRental.findUnique({
        where: { id: id as string },
        include: {
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
              trackingType: true,
              minDailyHours: true,
            },
          },
          contract: {
            select: {
              id: true,
              code: true,
              status: true,
            },
          },
          usageReports: {
            orderBy: { date: "desc" },
            take: 30, // Últimos 30 reportes
            include: {
              reportedBy: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!rental) {
        res.status(404).json({
          success: false,
          error: {
            code: "RENTAL_NOT_FOUND",
            message: `Rental with id '${id}' not found`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: rental,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "RENTAL_FETCH_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/rentals:
   *   get:
   *     tags: [Rentals]
   *     summary: Listar rentals activos
   *     parameters:
   *       - in: query
   *         name: contractId
   *         schema:
   *           type: string
   *       - in: query
   *         name: trackingType
   *         schema:
   *           type: string
   *           enum: [MACHINERY, TOOL]
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, returned]
   *     responses:
   *       200:
   *         description: Lista de rentals
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { contractId, trackingType, status } = req.query;

      const where: any = {};

      if (contractId) {
        where.contractId = contractId as string;
      }

      if (trackingType) {
        where.trackingType = trackingType as string;
      }

      if (status) {
        if (status === "active") {
          where.actualReturnDate = null;
        } else if (status === "returned") {
          where.actualReturnDate = { not: null };
        }
      }

      const rentals = await prisma.assetRental.findMany({
        where,
        include: {
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
              trackingType: true,
            },
          },
          contract: {
            select: {
              id: true,
              code: true,
              status: true,
            },
          },
        },
        orderBy: { withdrawalDate: "desc" },
      });

      // Calcular días activos para cada rental
      const rentalsWithDays = rentals.map((rental) => {
        const endDate = rental.actualReturnDate || new Date();
        const daysActive = Math.ceil(
          (endDate.getTime() - rental.withdrawalDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        return {
          ...rental,
          daysActive,
        };
      });

      res.json({
        success: true,
        data: {
          rentals: rentalsWithDays,
          total: rentalsWithDays.length,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "RENTALS_LIST_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/rentals/{id}/costs:
   *   get:
   *     tags: [Rentals]
   *     summary: Desglose detallado de costos
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Desglose de costos
   */
  async getCosts(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const rental = await prisma.assetRental.findUnique({
        where: { id: id as string },
        include: {
          asset: {
            select: {
              code: true,
              name: true,
              minDailyHours: true,
            },
          },
          usageReports: {
            where: { status: "processed" },
            orderBy: { date: "asc" },
          },
        },
      });

      if (!rental) {
        res.status(404).json({
          success: false,
          error: {
            code: "RENTAL_NOT_FOUND",
            message: `Rental with id '${id}' not found`,
          },
        });
        return;
      }

      // Calcular período
      const endDate = rental.actualReturnDate || new Date();
      const daysActive = Math.ceil(
        (endDate.getTime() - rental.withdrawalDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // Calcular horas totales
      const totalHoursWorked = rental.usageReports.reduce(
        (sum, r) => sum + Number(r.hoursWorked || 0),
        0,
      );
      const totalHoursBilled = rental.usageReports.reduce(
        (sum, r) => sum + Number(r.hoursBilled || 0),
        0,
      );
      const standbyHours = totalHoursBilled - totalHoursWorked;

      // Preparar respuesta
      const costs: any = {
        rentalId: id,
        asset: rental.asset,
        period: {
          start: rental.withdrawalDate,
          end: rental.actualReturnDate,
          daysActive,
        },
        costs: {
          totalCost: Number(rental.totalCost),
        },
      };

      if (rental.trackingType === "MACHINERY") {
        costs.costs.machinery = {
          hourlyRate: Number(rental.hourlyRate),
          totalHoursWorked,
          totalHoursBilled,
          standbyHours,
          totalCost: Number(rental.totalMachineryCost),
        };

        costs.costs.operator = {
          costType: rental.operatorCostType,
          rate: Number(rental.operatorCostRate),
          days: daysActive,
          totalCost: Number(rental.totalOperatorCost),
        };
      } else if (rental.trackingType === "TOOL") {
        costs.costs.tool = {
          dailyRate: Number(rental.dailyRate),
          daysElapsed: rental.daysElapsed,
          totalCost: Number(rental.totalCost),
        };
      }

      res.json({
        success: true,
        data: costs,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "COSTS_FETCH_ERROR",
          message: error.message,
        },
      });
    }
  }
}

export const rentalController = new RentalController();
