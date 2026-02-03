import pino from "pino";
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

// Configure pino logger
const isDevelopment = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  base: {
    env: process.env.NODE_ENV,
  },
});

/**
 * Express middleware to attach request ID and logger to each request
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = randomUUID();

  // Attach request ID to request object
  (req as any).requestId = requestId;

  // Create child logger with request context
  (req as any).log = logger.child({
    requestId,
    method: req.method,
    url: req.url,
    tenantId: (req as any).context?.tenantId,
    userId: (req as any).context?.userId,
  });

  // Log incoming request
  (req as any).log.info({ ip: req.ip }, "Incoming request");

  // Log response
  const startTime = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    (req as any).log.info(
      {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      },
      "Request completed",
    );
  });

  next();
}

// Export typed logger
export default logger;
