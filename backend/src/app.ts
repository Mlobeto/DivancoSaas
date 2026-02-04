import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import "express-async-errors";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "@config/swagger";

import { config } from "@config/index";
import {
  errorHandler,
  notFoundHandler,
} from "@core/middlewares/error.middleware";
import { auditLogger } from "@core/middlewares/audit.middleware";
import { apiLimiter } from "@core/middlewares/rate-limit.middleware";
import { requestLogger } from "@core/utils/logger";

// Bootstrap / Dependency Injection
// AQUÍ es donde se instancian los adapters (NO en el core)
import { paymentProviderResolver } from "./bootstrap/payment-resolver.bootstrap";
import billingRouter, {
  setPaymentProviderResolver as setBillingResolver,
} from "@core/routes/billing.routes";
import webhookRouter, {
  setPaymentProviderResolver as setWebhookResolver,
} from "@core/routes/webhook.routes";

// WhatsApp adapter injection
import { MetaWhatsAppAdapter } from "./integrations/adapters/whatsapp/meta-whatsapp.adapter";
import { setWhatsAppProviderFactory } from "@core/services/whatsapp.service";

// File storage adapter injection
import { AzureBlobStorageAdapter } from "./integrations/adapters/storage/azure-blob-storage.adapter";
import { setFileStorageProviderFactory } from "@core/services/file-storage.service";

// Invoice adapter injection
import { invoiceProviderResolver } from "./bootstrap/invoice-resolver.bootstrap";
import { setInvoiceProviderFactory } from "@core/services/invoice.service";

// Shipping adapter injection
import { shippingProviderResolver } from "./bootstrap/shipping-resolver.bootstrap";
import { setShippingProviderFactory } from "@core/services/shipping.service";

// Core Routers
import authRouter from "@core/routes/auth.routes";
import tenantRouter from "@core/routes/tenant.routes";
import userRouter from "@core/routes/user.routes";
import businessUnitRouter from "@core/routes/business-unit.routes";
import businessUnitIntegrationsRouter from "@core/routes/business-unit-integrations.routes";
import moduleRouter from "@core/routes/module.routes";
import workflowRouter from "@core/routes/workflow.routes";
import integrationRouter from "@core/routes/integration.routes";
import whatsappRouter from "@core/routes/whatsapp.routes";
import { fileRouter } from "@core/routes/file.routes";
import { intentRouter } from "@core/routes/intent.routes";
import { channelRouter } from "@core/routes/channel.routes";
import userChannelIdentityRouter from "@core/routes/user-channel-identity.routes";
import eventQueueRouter from "@core/routes/event-queue.routes";
import invoiceRouter from "@core/routes/invoice.routes";
import shippingRouter from "@core/routes/shipping.routes";
import dashboardRouter from "@core/routes/dashboard.routes";
import equipmentRouter from "@core/routes/equipment.routes";

// Business Modules
import { AssetsModule } from "./modules/assets/assets.module";

export function createApp(): Application {
  const app = express();

  // Initialize business modules
  const assetsModule = new AssetsModule();
  assetsModule.initialize();

  // DEPENDENCY INJECTION: Inyectar resolvers/factories en el core
  // El core nunca importa adapters, recibe las dependencias desde aquí
  setBillingResolver(paymentProviderResolver);
  setWebhookResolver(paymentProviderResolver);

  // Inyectar factory para WhatsApp
  setWhatsAppProviderFactory((config) => new MetaWhatsAppAdapter(config));

  // Inyectar factory para File Storage
  setFileStorageProviderFactory(
    (config) => new AzureBlobStorageAdapter(config),
  );

  // Inyectar factory para Facturación
  setInvoiceProviderFactory((provider, config) =>
    invoiceProviderResolver(provider, config),
  );

  // Inyectar factory para Envíos
  setShippingProviderFactory((provider, config) =>
    shippingProviderResolver(provider, config),
  );

  // Trust proxy - CRÍTICO para Railway/Vercel/cualquier proxy
  // Permite confiar en X-Forwarded-For para rate limiting y IPs correctas
  app.set("trust proxy", 1);

  // Security
  app.use(helmet());
  app.use(cors(config.cors));

  // Request logging with correlation ID
  app.use(requestLogger);

  // Rate limiting (aplicar a todas las rutas excepto /health)
  app.use(apiLimiter);

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Auditoría
  app.use(auditLogger);

  // swagger
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
  app.use("/api/v1/business-units", businessUnitIntegrationsRouter); // Rutas de integraciones
  app.use("/api/v1/modules", moduleRouter);
  app.use("/api/v1/workflows", workflowRouter);
  app.use("/api/v1/billing", billingRouter);
  app.use("/api/v1/integrations", integrationRouter);
  app.use("/api/v1/whatsapp", whatsappRouter);
  app.use("/api/v1/files", fileRouter);
  app.use("/api/v1/intents", intentRouter);
  app.use("/api/v1/channels", channelRouter);
  app.use("/api/v1/user-identities", userChannelIdentityRouter);
  app.use("/api/v1/events", eventQueueRouter);
  app.use("/api/v1/equipment", equipmentRouter);
  app.use("/api/v1/invoices", invoiceRouter);
  app.use("/api/v1/shipping", shippingRouter);
  app.use("/api/v1/dashboard", dashboardRouter);

  // Business Module routes
  app.use("/api/v1/modules/assets", assetsModule.getRoutes());

  // TODO: Cargar rutas de módulos dinámicamente
  // loadModuleRoutes(app);

  // Error handlers (deben ir al final)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
