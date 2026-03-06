/**
 * EJEMPLO: Aplicación de Timezone Utils en Quotation Service
 *
 * Este archivo muestra cómo migrar quotation.service.ts para usar
 * las utilidades de timezone correctamente.
 *
 * NO copiar/pegar directamente - adaptar a tu código real.
 *
 * NOTA: Este archivo contiene código de ejemplo y no se compila.
 * Los imports son ilustrativos.
 */

// Estos imports son de ejemplo - ajustar según tu estructura real
// import { prisma } from "@config/database";
// import {
//   nowInBUTimezone,
//   addDaysInBUTimezone,
//   formatDateForUser,
//   parseDateInBUTimezone,
//   daysDifferenceInBUTimezone,
// } from "@core/utils/timezone-utils";

// Tipos de ejemplo
type CreateQuotationParams = {
  businessUnitId: string;
  validityDays?: number;
  // ... otros campos
};

// Variables de ejemplo
declare const prisma: any;
declare function nowInBUTimezone(businessUnitId: string): Promise<Date>;
declare function addDaysInBUTimezone(
  date: Date,
  days: number,
  businessUnitId: string,
): Promise<Date>;
declare function formatDateForUser(
  date: Date,
  businessUnitId: string,
): Promise<string>;
declare function parseDateInBUTimezone(
  dateString: string,
  businessUnitId: string,
): Promise<Date>;
declare function daysDifferenceInBUTimezone(
  start: Date,
  end: Date,
  businessUnitId: string,
): Promise<number>;

// EJEMPLO 1: Crear Cotización
// =============================================================================
// ANTES - Timezone incorrecto del servidor
async function createQuotation_BEFORE(params: CreateQuotationParams) {
  const validityDays = params.validityDays || 30;
  const validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
  const quotationDate = new Date();

  return prisma.quotation.create({
    data: {
      quotationDate,
      validUntil,
      // ... otros campos
    },
  });
}

// DESPUÉS - Timezone correcto de la Business Unit
async function createQuotation_AFTER(params: CreateQuotationParams) {
  const validityDays = params.validityDays || 30;
  const now = await nowInBUTimezone(params.businessUnitId);
  const validUntil = await addDaysInBUTimezone(
    now,
    validityDays,
    params.businessUnitId,
  );

  return prisma.quotation.create({
    data: {
      quotationDate: now,
      validUntil,
      // ... otros campos
    },
  });
}

// EJEMPLO 2: Calcular Días de Alquiler
// =============================================================================
// ANTES - Cálculo sin considerar timezone
function calculateRentalDays_BEFORE(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// DESPUÉS - Cálculo considerando timezone de la BU
async function calculateRentalDays_AFTER(
  startDate: Date,
  endDate: Date,
  businessUnitId: string,
): Promise<number> {
  return await daysDifferenceInBUTimezone(startDate, endDate, businessUnitId);
}

// EJEMPLO 3: Procesar Fechas del Frontend
// =============================================================================
// ANTES - Fecha parseada sin timezone
async function processQuotationItem_BEFORE(item: any, businessUnitId: string) {
  const rentalStartDate = item.startDate ? new Date(item.startDate) : null;
  const rentalEndDate = item.endDate ? new Date(item.endDate) : null;

  return {
    rentalStartDate,
    rentalEndDate,
    // ... resto del item
  };
}

// DESPUÉS - Fecha parseada CON timezone de la BU
async function processQuotationItem_AFTER(item: any, businessUnitId: string) {
  const rentalStartDate = item.startDate
    ? await parseDateInBUTimezone(item.startDate, businessUnitId)
    : null;
  const rentalEndDate = item.endDate
    ? await parseDateInBUTimezone(item.endDate, businessUnitId)
    : null;

  return {
    rentalStartDate,
    rentalEndDate,
    // ... resto del item
  };
}

// EJEMPLO 4: Crear Contrato desde Cotización
// =============================================================================
// ANTES - Fechas calculadas incorrectamente
async function createContractFromQuotation_BEFORE(quotationId: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
  });

  const startDate = quotation.items[0]?.rentalStartDate || new Date();
  const endDate =
    quotation.items[0]?.rentalEndDate ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return prisma.quotationContract.create({
    data: {
      startDate,
      endDate,
      // ... otros campos
    },
  });
}

// DESPUÉS - Fechas calculadas en timezone de la BU
async function createContractFromQuotation_AFTER(quotationId: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { items: true },
  });

  const now = await nowInBUTimezone(quotation.businessUnitId);
  const startDate = quotation.items[0]?.rentalStartDate || now;
  const endDate =
    quotation.items[0]?.rentalEndDate ||
    (await addDaysInBUTimezone(now, 30, quotation.businessUnitId));

  return prisma.quotationContract.create({
    data: {
      startDate,
      endDate,
      // ... otros campos
    },
  });
}

// EJEMPLO 5: Formatear Fechas para Email/PDF
// =============================================================================
// ANTES - Formato hardcoded
async function generateQuotationEmailHTML_BEFORE(
  quotation: any,
): Promise<string> {
  const dateStr = new Date(quotation.quotationDate).toLocaleDateString("es-MX");
  const validUntilStr = new Date(quotation.validUntil).toLocaleDateString(
    "es-MX",
  );

  return `
    <p>Fecha: ${dateStr}</p>
    <p>Válida hasta: ${validUntilStr}</p>
  `;
}

// DESPUÉS - Formato con timezone de la BU
async function generateQuotationEmailHTML_AFTER(
  quotation: any,
): Promise<string> {
  const dateStr = await formatDateForUser(
    new Date(quotation.quotationDate),
    quotation.businessUnitId,
  );
  const validUntilStr = await formatDateForUser(
    new Date(quotation.validUntil),
    quotation.businessUnitId,
  );

  return `
    <p>Fecha: ${dateStr}</p>
    <p>Válida hasta: ${validUntilStr}</p>
  `;
}

// EJEMPLO 6: Verificar Vigencia de Cotización
// =============================================================================
// ANTES - Comparación sin timezone
function isQuotationValid_BEFORE(quotation: any): boolean {
  return new Date() < new Date(quotation.validUntil);
}

// DESPUÉS - Comparación con timezone de la BU
async function isQuotationValid_AFTER(quotation: any): Promise<boolean> {
  const now = await nowInBUTimezone(quotation.businessUnitId);
  return now < new Date(quotation.validUntil);
}

// EJEMPLO 7: Procesar Array de Items con Fechas
// =============================================================================
// ANTES - Loop sin timezone
async function processQuotationItems_BEFORE(
  items: any[],
  businessUnitId: string,
) {
  return Promise.all(
    items.map(async (item) => {
      const startDate = item.startDate ? new Date(item.startDate) : null;
      const endDate = item.endDate ? new Date(item.endDate) : null;
      let rentalDays = item.rentalDays;

      if (startDate && endDate && !rentalDays) {
        const diffTime = endDate.getTime() - startDate.getTime();
        rentalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        ...item,
        rentalStartDate: startDate,
        rentalEndDate: endDate,
        rentalDays,
      };
    }),
  );
}

// DESPUÉS - Loop CON timezone
async function processQuotationItems_AFTER(
  items: any[],
  businessUnitId: string,
) {
  return Promise.all(
    items.map(async (item) => {
      const startDate = item.startDate
        ? await parseDateInBUTimezone(item.startDate, businessUnitId)
        : null;
      const endDate = item.endDate
        ? await parseDateInBUTimezone(item.endDate, businessUnitId)
        : null;
      let rentalDays = item.rentalDays;

      if (startDate && endDate && !rentalDays) {
        rentalDays = await daysDifferenceInBUTimezone(
          startDate,
          endDate,
          businessUnitId,
        );
      }

      return {
        ...item,
        rentalStartDate: startDate,
        rentalEndDate: endDate,
        rentalDays,
      };
    }),
  );
}

// EJEMPLO 8: Agregar Días a Fecha de Inicio
// =============================================================================
// ANTES - Suma manual de milisegundos
function calculateEndDate_BEFORE(startDate: Date, days: number): Date {
  return new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
}

// DESPUÉS - Suma con timezone
async function calculateEndDate_AFTER(
  startDate: Date,
  days: number,
  businessUnitId: string,
): Promise<Date> {
  return await addDaysInBUTimezone(startDate, days, businessUnitId);
}

// =============================================================================
// PATRÓN GENERAL DE MIGRACIÓN
// =============================================================================

/**
 * Checklist para migrar un servicio:
 *
 * 1. ✅ Importar utilidades de timezone en la parte superior del archivo
 * 2. ✅ Buscar todos los `new Date()` y reemplazar con `await nowInBUTimezone(businessUnitId)`
 * 3. ✅ Buscar todos los `Date.now() +` y reemplazar con `await addDaysInBUTimezone(...)`
 * 4. ✅ Buscar todos los `.toLocaleDateString()` y reemplazar con `await formatDateForUser(...)`
 * 5. ✅ Buscar cálculos de diferencia de fechas y reemplazar con `await daysDifferenceInBUTimezone(...)`
 * 6. ✅ Marcar funciones como `async` cuando usen await
 * 7. ✅ Propagar `businessUnitId` a todas las funciones que manejen fechas
 * 8. ✅ Actualizar llamadas a estas funciones para usar await
 * 9. ✅ Probar con diferentes timezones
 */

export {};
