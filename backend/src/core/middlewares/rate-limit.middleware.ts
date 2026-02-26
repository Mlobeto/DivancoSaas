import rateLimit from "express-rate-limit";

/**
 * Rate limiting middleware
 * Limita el número de requests por IP en una ventana de tiempo
 */

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "100");
const RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || "900000",
); // 15 min default

/**
 * Custom key generator that handles IP:PORT format from Azure
 * Azure App Service can send IPs with port like "181.0.214.91:6788"
 * Extracts clean IP for rate limiting
 */
const keyGenerator = (req: any): string => {
  let ip = req.ip || req.connection?.remoteAddress || "unknown";

  // Azure puede enviar "IP:PORT", extraer solo la IP
  // Buscamos el último ":" y verificamos si lo que sigue es un número (puerto)
  const lastColonIndex = ip.lastIndexOf(":");
  if (lastColonIndex !== -1) {
    const afterColon = ip.substring(lastColonIndex + 1);
    // Si después del último ":" hay solo números, es un puerto
    if (/^\d+$/.test(afterColon)) {
      ip = ip.substring(0, lastColonIndex);
    }
  }

  // Normalizar ::ffff: prefix para IPv4-mapped IPv6 addresses
  // Esto asegura que ::ffff:127.0.0.1 y 127.0.0.1 sean tratados igual
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7); // Remove "::ffff:" prefix
  }

  return ip;
};

export const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  keyGenerator,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests from this IP, please try again later.",
    },
  },
  // Skip rate limiting for health checks
  skip: (req) => req.path === "/health",
});

/**
 * Stricter rate limit for auth endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
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
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_RESET_ATTEMPTS",
      message:
        "Too many password reset attempts, please try again after 1 hour.",
    },
  },
});
