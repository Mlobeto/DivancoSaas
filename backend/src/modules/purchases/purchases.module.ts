/**
 * PURCHASES MODULE
 * Módulo reutilizable para gestión de compras y proveedores
 *
 * Capacidades:
 * - Gestión de proveedores con contactos
 * - Cuenta corriente con proveedores
 * - Cotizaciones de insumos
 * - Órdenes de compra
 * - Recepción de mercadería y actualización de stock
 * - Trazabilidad completa de transacciones
 */

import { Application } from "express";
import purchasesRouter from "./routes/purchases.routes";
import { logger } from "../../core/utils/logger";

export class PurchasesModule {
  private readonly MODULE_NAME = "purchases";
  private readonly VERSION = "1.0.0";

  /**
   * Inicializar el módulo
   */
  initialize(app?: Application): void {
    try {
      // Si se proporciona una app de Express, registrar las rutas
      if (app) {
        app.use(`/api/v1/modules/purchases`, purchasesRouter);
        logger.info(
          `[Module] ${this.MODULE_NAME} v${this.VERSION} initialized`,
        );
      }

      // Aquí podrían agregarse otras inicializaciones:
      // - Tareas programadas (ej: desactivar cotizaciones vencidas)
      // - Listeners de eventos
      // - Validaciones de integridad
    } catch (error) {
      logger.error(
        { error, module: this.MODULE_NAME },
        `Failed to initialize ${this.MODULE_NAME} module`,
      );
      throw error;
    }
  }

  /**
   * Obtener información del módulo
   */
  getInfo() {
    return {
      name: this.MODULE_NAME,
      version: this.VERSION,
      description: "Purchases and suppliers management module",
      features: [
        "Supplier management",
        "Supplier contacts",
        "Supplier account (current account)",
        "Supply quotes comparison",
        "Purchase orders",
        "Goods reception",
        "Stock transactions",
      ],
      routes: [
        "GET    /api/v1/modules/purchases/suppliers",
        "POST   /api/v1/modules/purchases/suppliers",
        "GET    /api/v1/modules/purchases/quotes",
        "POST   /api/v1/modules/purchases/quotes",
        "GET    /api/v1/modules/purchases/purchase-orders",
        "POST   /api/v1/modules/purchases/purchase-orders",
      ],
    };
  }
}
