import rateLimit from "express-rate-limit";
import type { Request } from "express";
import { isIP } from "node:net";

/**
 * Rate limiting middleware
 * Limita el número de requests por IP en una ventana de tiempo
 */

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "100");
const RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || "900000",
); // 15 min default

/**
 * Azure puede enviar IPs con puerto (e.g. "181.0.205.126:18223")
 * o con prefijo IPv6-mapped (e.g. "::ffff:10.0.0.1").
 * Extraemos solo la IP limpia y validamos con isIP() de Node.
 */
function extractCleanIp(req: Request): string {
  const raw =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    "";

  // Strip IPv6-mapped prefix
  let ip = raw.replace(/^::ffff:/, "");

  // Strip port suffix from IPv4 (e.g. "181.0.205.126:18223" → "181.0.205.126")
  if (ip.match(/^\d+\.\d+\.\d+\.\d+:\d+$/)) {
    ip = ip.split(":")[0];
  }

  // Validación final: acepta IPv4 e IPv6
  if (!isIP(ip)) {
    return "0.0.0.0";
  }

  return ip;
}

const rateLimitOptions = {
  validate: false as const,
  keyGenerator: extractCleanIp,
};

export const apiLimiter = rateLimit({
  ...rateLimitOptions,
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests from this IP, please try again later.",
    },
  },
  skip: (req) => req.path === "/health",
});

/**
 * Stricter rate limit for auth endpoints
 */
export const authLimiter = rateLimit({
  ...rateLimitOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_AUTH_ATTEMPTS",
      message:
        "Too many authentication attempts, please try again after 15 minutes.",
    },
  },
});

/**
 * Very strict rate limit for password reset
 */
export const passwordResetLimiter = rateLimit({
  ...rateLimitOptions,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_RESET_ATTEMPTS",
      message:
        "Too many password reset attempts, please try again after 1 hour.",
    },
  },
});
