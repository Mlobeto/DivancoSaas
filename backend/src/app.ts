import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import "express-async-errors";

import { config } from "@config/index";
import {
  errorHandler,
  notFoundHandler,
} from "@core/middlewares/error.middleware";
import { auditLogger } from "@core/middlewares/audit.middleware";

// Routers
import authRouter from "@core/routes/auth.routes";
import tenantRouter from "@core/routes/tenant.routes";
import userRouter from "@core/routes/user.routes";
import businessUnitRouter from "@core/routes/business-unit.routes";
import moduleRouter from "@core/routes/module.routes";
import workflowRouter from "@core/routes/workflow.routes";
import billingRouter from "@core/routes/billing.routes";
import webhookRouter from "@core/routes/webhook.routes";

export function createApp(): Application {
  const app = express();

  // Security
  app.use(helmet());
  app.use(cors(config.cors));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Auditoría
  app.use(auditLogger);

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Webhooks (ANTES de otros middlewares - necesita raw body)
  app.use("/api/v1/webhooks", webhookRouter);

  // Core routes
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/tenants", tenantRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/business-units", businessUnitRouter);
  app.use("/api/v1/modules", moduleRouter);
  app.use("/api/v1/workflows", workflowRouter);
  app.use("/api/v1/billing", billingRouter);

  // TODO: Cargar rutas de módulos dinámicamente
  // loadModuleRoutes(app);

  // Error handlers (deben ir al final)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
