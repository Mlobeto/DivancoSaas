# GUÍA DE IMPLEMENTACIÓN DE TIMEZONE

## 📋 Resumen del Problema

Tu sistema tenía configuración de timezone en el frontend, pero:

1. ❌ Frontend llamaba al endpoint incorrecto (`PUT /business-units/:id` en lugar de `PUT /business-units/:id/rental-settings`)
2. ❌ El timezone NO se aplicaba en ninguna operación del backend
3. ❌ Todas las fechas se creaban con `new Date()` usando timezone del servidor

## ✅ Cambios Aplicados

### 1. **Frontend Corregido**

**Archivos modificados:**

- `web/src/core/services/businessUnit.service.ts` - Agregados métodos `updateRentalSettings()` y `getRentalSettings()`
- `web/src/core/pages/settings/TimezonePage.tsx` - Actualizado para usar los endpoints correctos

**Ahora funciona:**

```typescript
// Guardar timezone
await businessUnitService.updateRentalSettings(buId, {
  timezone: "America/Bogota",
});

// Leer timezone
const settings = await businessUnitService.getRentalSettings(buId);
console.log(settings.timezone); // "America/Bogota"
```

### 2. **Utilidades de Timezone Creadas**

**Nuevo archivo:** `backend/src/core/utils/timezone-utils.ts`

Funciones disponibles:

- `getBusinessUnitTimezone(businessUnitId)` - Obtiene el timezone configurado
- `formatDateInBUTimezone(date, businessUnitId, options)` - Formatea fechas
- `parseDateInBUTimezone(dateString, businessUnitId)` - Parsea strings de fecha
- `nowInBUTimezone(businessUnitId)` - Obtiene fecha/hora actual en timezone de BU
- `daysDifferenceInBUTimezone(start, end, businessUnitId)` - Calcula diferencia de días
- `addDaysInBUTimezone(date, days, businessUnitId)` - Suma días considerando timezone
- `formatDateForUser(date, businessUnitId)` - Formato amigable para usuarios
- `formatDateOnlyForUser(date, businessUnitId)` - Solo fecha sin hora

**Cache integrado:** Las consultas de timezone se cachean 5 minutos para evitar queries repetidas a la DB.

## 🔧 Dónde Aplicar los Cambios

### Lugares Críticos que Necesitan Actualización:

#### 1. **Cotizaciones** (`modules/rental/services/quotation.service.ts`)

**ANTES:**

```typescript
const validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
```

**DESPUÉS:**

```typescript
import {
  addDaysInBUTimezone,
  nowInBUTimezone,
} from "@core/utils/timezone-utils";

const now = await nowInBUTimezone(params.businessUnitId);
const validUntil = await addDaysInBUTimezone(
  now,
  validityDays,
  params.businessUnitId,
);
```

#### 2. **Contratos** (`modules/rental/services/quotation.service.ts` - método `createContractFromQuotation`)

**ANTES:**

```typescript
const startDate = quotation.items[0]?.rentalStartDate || new Date();
const endDate =
  quotation.items[0]?.rentalEndDate ||
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
```

**DESPUÉS:**

```typescript
import {
  nowInBUTimezone,
  addDaysInBUTimezone,
} from "@core/utils/timezone-utils";

const now = await nowInBUTimezone(quotation.businessUnitId);
const startDate = quotation.items[0]?.rentalStartDate || now;
const endDate =
  quotation.items[0]?.rentalEndDate ||
  (await addDaysInBUTimezone(now, 30, quotation.businessUnitId));
```

#### 3. **Emails de Cotizaciones** (`modules/rental/services/quotation-email.service.ts`)

**ANTES:**

```typescript
${new Date(quotation.quotationDate).toLocaleDateString("es-MX")}
```

**DESPUÉS:**

```typescript
import { formatDateOnlyForUser } from "@core/utils/timezone-utils";

${await formatDateOnlyForUser(new Date(quotation.quotationDate), quotation.businessUnitId)}
```

#### 4. **Reportes de Uso** (`modules/rental/controllers/usage-report.controller.ts`)

Todos los campos de fecha deben parsearse con:

```typescript
import { parseDateInBUTimezone } from "@core/utils/timezone-utils";

const reportDate = await parseDateInBUTimezone(req.body.date, businessUnitId);
```

#### 5. **Dashboard y Reportes** (`core/services/dashboard.service.ts`)

Al calcular métricas por fecha:

```typescript
import {
  nowInBUTimezone,
  daysDifferenceInBUTimezone,
} from "@core/utils/timezone-utils";

const today = await nowInBUTimezone(businessUnitId);
const daysSince = await daysDifferenceInBUTimezone(
  contractStart,
  today,
  businessUnitId,
);
```

#### 6. **Auditoría** (si tienes sistema de auditoría)

Al registrar eventos:

```typescript
import { formatDateForUser } from "@core/utils/timezone-utils";

const eventTimestamp = await formatDateForUser(new Date(), businessUnitId);
```

## 📝 Patrón General de Migración

### Búsqueda de Código a Actualizar

Busca en tu código estos patrones problemáticos:

```bash
# Buscar new Date() sin timezone
grep -r "new Date()" backend/src/modules/

# Buscar Date.now() + cálculos
grep -r "Date.now()" backend/src/modules/

# Buscar toLocaleDateString hardcoded
grep -r "toLocaleDateString" backend/src/

# Buscar formatters de fecha hardcoded
grep -r "format.*date" backend/src/modules/ -i
```

### Reemplazo por Versión con Timezone

1. **Crear fecha actual:**

   ```typescript
   // ANTES
   const now = new Date();

   // DESPUÉS
   const now = await nowInBUTimezone(businessUnitId);
   ```

2. **Calcular fecha futura:**

   ```typescript
   // ANTES
   const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

   // DESPUÉS
   const futureDate = await addDaysInBUTimezone(
     new Date(),
     days,
     businessUnitId,
   );
   ```

3. **Formatear para mostrar:**

   ```typescript
   // ANTES
   date.toLocaleDateString("es-MX");

   // DESPUÉS
   await formatDateForUser(date, businessUnitId);
   ```

4. **Calcular diferencia:**

   ```typescript
   // ANTES
   Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

   // DESPUÉS
   await daysDifferenceInBUTimezone(startDate, endDate, businessUnitId);
   ```

## 🧪 Testing

### Test Manual

1. Cambia el timezone de tu BU a diferentes zonas:
   - `America/Bogota` (UTC-5)
   - `America/Mexico_City` (UTC-6)
   - `America/New_York` (UTC-4/5 según DST)
   - `Europe/Madrid` (UTC+1/2 según DST)

2. Crea cotizaciones, contratos y reportes en cada timezone

3. Verifica que las fechas se muestren correctamente

### Script de Prueba

```typescript
// backend/test-timezone.ts
import {
  getBusinessUnitTimezone,
  formatDateForUser,
  nowInBUTimezone,
  addDaysInBUTimezone,
} from "./src/core/utils/timezone-utils";

async function testTimezones() {
  const buId = "tu-business-unit-id";

  console.log("🕐 Timezone configurado:", await getBusinessUnitTimezone(buId));

  const now = await nowInBUTimezone(buId);
  console.log("🕐 Ahora en BU timezone:", await formatDateForUser(now, buId));

  const in7Days = await addDaysInBUTimezone(now, 7, buId);
  console.log("📅 En 7 días:", await formatDateForUser(in7Days, buId));
}

testTimezones();
```

## ⚠️ Consideraciones Importantes

1. **Performance:** Las utilidades usan cache de 5 minutos para evitar queries repetidas
2. **Fallback:** Si una BU no tiene timezone configurado, usa `America/Bogota` por defecto
3. **Cambio de Timezone:** Si cambias el timezone de una BU, las fechas ya guardadas en DB NO cambian (son UTC), pero se MOSTRARÁN en el nuevo timezone
4. **Horario de Verano (DST):** Los timezones IANA manejan automáticamente DST (Ej: America/New_York)

## 📚 Próximos Pasos Recomendados

1. ✅ **Ya hecho:** Arreglado frontend y creadas utilidades
2. ⏳ **Pendiente:** Aplicar utilidades en módulo de cotizaciones
3. ⏳ **Pendiente:** Aplicar utilidades en módulo de contratos
4. ⏳ **Pendiente:** Aplicar utilidades en reportes de uso
5. ⏳ **Pendiente:** Aplicar utilidades en dashboard
6. ⏳ **Pendiente:** Actualizar emails y PDFs generados
7. ⏳ **Pendiente:** Testing completo en diferentes timezones

## 🎯 Prioridad de Implementación

**Alta prioridad** (afecta operaciones diarias):

- ✅ Cotizaciones - fechas de validez
- ✅ Contratos - fechas de inicio/fin
- ✅ Reportes de uso - timestamp de operarios

**Media prioridad** (afecta reportes):

- Dashboard y métricas
- Emails automáticos
- PDFs generados

**Baja prioridad** (cosmético):

- Logs y auditoría
- Timestamps de creación/actualización en listados

## 💡 Tip: Middleware de Request Context

Considera agregar el timezone al request context para acceso más fácil:

```typescript
// En auth.middleware.ts
const businessUnit = await prisma.businessUnit.findFirst({
  where: { id: userBU.businessUnitId },
  select: { id: true, settings: true },
});

const settings = (businessUnit?.settings as any) || {};
const timezone = settings.rental?.timezone || "America/Bogota";

req.context = {
  ...req.context,
  timezone, // Agregar timezone al context
};
```

Luego en servicios:

```typescript
const timezone = req.context.timezone; // Disponible directamente
```

---

**¿Necesitas ayuda aplicando estos cambios?** Indícame qué módulo quieres actualizar primero y te ayudo con el código específico.
