/**
 * TIMEZONE UTILITIES
 *
 * Utilidades para manejar fechas con el timezone configurado de cada Business Unit.
 *
 * Todos los servicios que manejen fechas deben usar estas funciones para:
 * 1. Formatear fechas según el timezone de la BU
 * 2. Convertir fechas del frontend al timezone correcto
 * 3. Calcular diferencias de tiempo considerando el timezone
 *
 * IMPORTANTE: Evitar usar `new Date()` directamente sin considerar timezone.
 */

import { prisma } from "@config/database";

/**
 * Obtiene el timezone configurado de una Business Unit
 * @param businessUnitId ID de la Business Unit
 * @returns Timezone en formato IANA (ej: "America/Bogota")
 */
export async function getBusinessUnitTimezone(
  businessUnitId: string,
): Promise<string> {
  const businessUnit = await prisma.businessUnit.findUnique({
    where: { id: businessUnitId },
    select: { settings: true },
  });

  if (!businessUnit) {
    return "UTC"; // Fallback a UTC si no se encuentra la BU
  }

  const settings = (businessUnit.settings as any) || {};
  const rental = settings.rental || {};
  return rental.timezone || "America/Bogota"; // Default Colombia
}

/**
 * Formatea una fecha según el timezone de la Business Unit
 * @param date Fecha a formatear
 * @param businessUnitId ID de la Business Unit
 * @param options Opciones de formato Intl.DateTimeFormat
 * @returns Fecha formateada como string
 */
export async function formatDateInBUTimezone(
  date: Date,
  businessUnitId: string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  },
): Promise<string> {
  const timezone = await getBusinessUnitTimezone(businessUnitId);

  return new Intl.DateTimeFormat("es-CO", {
    ...options,
    timeZone: timezone,
  }).format(date);
}

/**
 * Convierte una fecha a un objeto Date en el timezone de la Business Unit
 * @param dateString Fecha en formato ISO o string
 * @param businessUnitId ID de la Business Unit
 * @returns Date object ajustado al timezone
 */
export async function parseDateInBUTimezone(
  dateString: string,
  businessUnitId: string,
): Promise<Date> {
  const timezone = await getBusinessUnitTimezone(businessUnitId);

  // Parsear la fecha asumiendo que viene en el timezone de la BU
  const date = new Date(dateString);

  // Si la fecha no tiene información de timezone, necesitamos ajustarla
  if (!dateString.includes("T") && !dateString.includes("Z")) {
    // La fecha viene como "2026-03-15", agregar hora local del timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: timezone,
    });

    const parts = formatter.formatToParts(date);
    const formatted = parts.reduce(
      (acc, part) => {
        if (part.type !== "literal") {
          acc[part.type] = part.value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    // Reconstruir la fecha con el timezone
    return new Date(
      `${formatted.year}-${formatted.month}-${formatted.day}T${formatted.hour}:${formatted.minute}:${formatted.second}`,
    );
  }

  return date;
}

/**
 * Obtiene la fecha/hora actual en el timezone de la Business Unit
 * @param businessUnitId ID de la Business Unit
 * @returns Date object con la hora actual ajustada al timezone
 */
export async function nowInBUTimezone(businessUnitId: string): Promise<Date> {
  const timezone = await getBusinessUnitTimezone(businessUnitId);
  const now = new Date();

  // Obtener los componentes en el timezone de la BU
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: timezone,
  });

  const parts = formatter.formatToParts(now);
  const formatted = parts.reduce(
    (acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  return new Date(
    `${formatted.year}-${formatted.month}-${formatted.day}T${formatted.hour}:${formatted.minute}:${formatted.second}`,
  );
}

/**
 * Calcula la diferencia en días entre dos fechas en el timezone de la BU
 * @param startDate Fecha de inicio
 * @param endDate Fecha de fin
 * @param businessUnitId ID de la Business Unit
 * @returns Número de días de diferencia
 */
export async function daysDifferenceInBUTimezone(
  startDate: Date,
  endDate: Date,
  businessUnitId: string,
): Promise<number> {
  const timezone = await getBusinessUnitTimezone(businessUnitId);

  // Convertir ambas fechas al timezone de la BU para calcular días correctamente
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  });

  const startFormatted = formatter.format(startDate);
  const endFormatted = formatter.format(endDate);

  const start = new Date(startFormatted);
  const end = new Date(endFormatted);

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Agrega días a una fecha en el timezone de la BU
 * @param date Fecha base
 * @param days Número de días a agregar
 * @param businessUnitId ID de la Business Unit
 * @returns Nueva fecha con los días agregados
 */
export async function addDaysInBUTimezone(
  date: Date,
  days: number,
  businessUnitId: string,
): Promise<Date> {
  const timezone = await getBusinessUnitTimezone(businessUnitId);

  // Convertir la fecha al timezone de la BU
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: timezone,
  });

  const parts = formatter.formatToParts(date);
  const formatted = parts.reduce(
    (acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  const localDate = new Date(
    `${formatted.year}-${formatted.month}-${formatted.day}T${formatted.hour}:${formatted.minute}:${formatted.second}`,
  );

  // Agregar los días
  localDate.setDate(localDate.getDate() + days);

  return localDate;
}

/**
 * Cache simple para evitar consultas repetidas al timezone
 * En producción, considerar usar Redis o similar
 */
const timezoneCache = new Map<
  string,
  { timezone: string; timestamp: number }
>();
const CACHE_TTL = 300000; // 5 minutos

/**
 * Obtiene el timezone con cache (versión optimizada para uso frecuente)
 */
export async function getBusinessUnitTimezoneCached(
  businessUnitId: string,
): Promise<string> {
  const cached = timezoneCache.get(businessUnitId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.timezone;
  }

  const timezone = await getBusinessUnitTimezone(businessUnitId);
  timezoneCache.set(businessUnitId, { timezone, timestamp: now });

  return timezone;
}

/**
 * Formatea una fecha para visualización al usuario final
 * Formato: "15 de marzo de 2026, 14:30"
 */
export async function formatDateForUser(
  date: Date,
  businessUnitId: string,
): Promise<string> {
  const timezone = await getBusinessUnitTimezoneCached(businessUnitId);

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
}

/**
 * Formatea solo la fecha (sin hora)
 * Formato: "15/03/2026"
 */
export async function formatDateOnlyForUser(
  date: Date,
  businessUnitId: string,
): Promise<string> {
  const timezone = await getBusinessUnitTimezoneCached(businessUnitId);

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  }).format(date);
}
