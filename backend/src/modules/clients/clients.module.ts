import { Router } from "express";
import { logger } from "../../core/utils/logger";
import clientsRouter from "./routes/clients.routes";

export class ClientsModule {
  private readonly MODULE_NAME = "clients";
  private readonly VERSION = "1.0.0";

  initialize(): void {
    try {
      logger.info(`[Module] ${this.MODULE_NAME} v${this.VERSION} initialized`);
    } catch (error) {
      logger.error(
        { error, module: this.MODULE_NAME },
        `Failed to initialize ${this.MODULE_NAME} module`,
      );
      throw error;
    }
  }

  getRoutes(): Router {
    return clientsRouter;
  }
}
