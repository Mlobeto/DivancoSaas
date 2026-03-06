# Cambios de Timezone Aplicados

## Resumen

Se aplicaron las utilidades de timezone a todos los módulos principales del backend para que las cotizaciones, contratos, informes de cuenta, mensajes y notificaciones utilicen la hora correcta según el timezone configurado en cada Business Unit.

## Archivos Modificados

### 1. `src/modules/rental/services/quotation.service.ts`

**Cambios aplicados:**

- ✅ Importadas utilidades: `nowInBUTimezone`, `parseDateInBUTimezone`, `addDaysInBUTimezone`
- ✅ `createQuotation()`: Parsing de `rentalStartDate` y `rentalEndDate` de items usando `parseDateInBUTimezone()`
- ✅ `updateQuotation()`:
  - Parsing de fechas de items usando `parseDateInBUTimezone()`
  - Metadata `lastUpdatedAt` usando `nowInBUTimezone()`
- ✅ `handleSignatureCompleted()`: Campo `signedAt` usando `nowInBUTimezone()`
- ✅ `createContractFromQuotation()`:
  - Fecha de inicio de contrato usando `nowInBUTimezone()`
  - Fecha de fin usando `addDaysInBUTimezone()`
- ✅ `generateQuotationCode()`: Obtención del año usando `nowInBUTimezone()`
- ✅ `generateContractCode()`: Obtención del año usando `nowInBUTimezone()`

**Impacto:**

- Las cotizaciones ahora se crean con fechas en el timezone correcto del BU
- Los códigos de cotización y contrato usan el año del timezone del BU
- Las fechas de firma y actualización respetan el timezone configurado

---

### 2. `src/modules/rental/services/quotation-email.service.ts`

**Cambios aplicados:**

- ✅ Importadas utilidades: `formatDateOnlyForUser`, `nowInBUTimezone`
- ✅ `injectBrandingInEmailHtml()`:
  - Función convertida a `async`
  - Footer con año usando `nowInBUTimezone()`
  - Agregado parámetro `businessUnitId` al options
- ✅ `sendQuotationEmail()`:
  - Fechas de cotización formateadas con `formatDateOnlyForUser()`
  - Campo `quotationDate` usando timezone del BU
  - Campo `validUntil` usando timezone del BU
  - Fechas estimadas (`estimatedStartDate`, `estimatedEndDate`) usando timezone del BU
  - Llamada a `injectBrandingInEmailHtml()` con await y `businessUnitId`
  - Campo `updatedAt` usando `nowInBUTimezone()`

**Impacto:**

- Los emails de cotización muestran fechas en el timezone correcto del BU
- Los clientes ven las fechas correctas en sus emails (ya no hardcoded a "es-MX")
- El año en el footer del email respeta el timezone del BU

---

### 3. `src/modules/rental/services/contract.service.ts`

**Cambios aplicados:**

- ✅ Importada utilidad: `nowInBUTimezone`
- ✅ `withdrawAsset()`: Campo `withdrawalDate` usando `nowInBUTimezone()`
- ✅ `completeContract()`: Campo `actualEndDate` usando `nowInBUTimezone()`
- ✅ `generateContractCode()`: Obtención del año usando `nowInBUTimezone()`

**Impacto:**

- Las fechas de retiro de activos reflejan el momento correcto en el timezone del BU
- Las fechas de finalización de contratos son precisas según el timezone configurado
- Los códigos de contrato usan el año del timezone del BU

---

### 4. `src/modules/rental/services/account.service.ts`

**Cambios aplicados:**

- ✅ Importada utilidad: `nowInBUTimezone`
- ✅ `checkAlerts()`:
  - Obtención del `businessUnitId` del cliente
  - Campo `lastAlertSent` usando `nowInBUTimezone()`

**Impacto:**

- Las alertas de balance bajo se registran con el timestamp correcto del timezone del BU
- Los informes de cuenta reflejan las fechas correctas de las alertas

---

### 5. `src/core/services/notification.service.ts`

**Cambios aplicados:**

- ✅ Importada utilidad: `nowInBUTimezone`
- ✅ `markRead()`:
  - Obtención del `businessUnitId` de la notificación
  - Campo `readAt` usando `nowInBUTimezone()` (fallback a `new Date()` si no hay BU)
- ✅ `markAllRead()`: Campo `readAt` usando `nowInBUTimezone()` si se provee `businessUnitId`

**Impacto:**

- Las notificaciones marcadas como leídas tienen el timestamp correcto del timezone del BU
- Los usuarios ven las fechas correctas en el historial de notificaciones

---

## Funciones de Timezone Utilizadas

### 1. `nowInBUTimezone(businessUnitId: string): Promise<Date>`

**Uso:** Obtener la fecha/hora actual en el timezone del Business Unit
**Reemplaza:** `new Date()`, `Date.now()`
**Ejemplos:**

- `signedAt: await nowInBUTimezone(quotation.businessUnitId)`
- `withdrawalDate: await nowInBUTimezone(contract.businessUnitId)`

### 2. `parseDateInBUTimezone(dateString: string, businessUnitId: string): Promise<Date>`

**Uso:** Parsear fechas que vienen del frontend respetando el timezone del BU
**Reemplaza:** `new Date(dateString)`
**Ejemplos:**

- `rentalStartDate: await parseDateInBUTimezone(item.rentalStartDate.toISOString(), params.businessUnitId)`

### 3. `addDaysInBUTimezone(date: Date, days: number, businessUnitId: string): Promise<Date>`

**Uso:** Sumar días a una fecha respetando el timezone del BU
**Reemplaza:** `new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)`
**Ejemplos:**

- `await addDaysInBUTimezone(await nowInBUTimezone(quotation.businessUnitId), 30, quotation.businessUnitId)`

### 4. `formatDateOnlyForUser(date: Date, businessUnitId: string): Promise<string>`

**Uso:** Formatear fecha para mostrar al usuario (sin hora)
**Reemplaza:** `new Date(...).toLocaleDateString("es-MX")`
**Ejemplos:**

- `quotationDate: await formatDateOnlyForUser(new Date(quotation.quotationDate), quotation.businessUnitId)`

---

## Testing Recomendado

### 1. Probar Cotizaciones

```bash
# Crear cotización en BU con timezone America/Mexico_City
POST /api/v1/rental/quotations
{
  "businessUnitId": "...",
  "validUntil": "2024-12-31",
  "items": [...]
}

# Verificar que validUntil se guarda correctamente en el timezone del BU
```

### 2. Probar Emails

```bash
# Enviar cotización por email
POST /api/v1/rental/quotations/:id/send-email

# Verificar que las fechas en el email están en el timezone correcto
```

### 3. Probar Contratos

```bash
# Crear contrato
POST /api/v1/rental/contracts
{
  "businessUnitId": "...",
  "startDate": "2024-01-01",
  ...
}

# Retirar activo y verificar que withdrawalDate usa timezone del BU
POST /api/v1/rental/contracts/:id/withdraw
```

### 4. Probar Notificaciones

```bash
# Marcar notificación como leída
PATCH /api/v1/notifications/:id/read

# Verificar que readAt tiene el timezone correcto del BU
```

---

## Configuración de Timezone

Los Business Units tienen su timezone configurado en:

```
BusinessUnit.settings.rental.timezone
```

Por defecto: `"America/Bogota"` (Colombia)

Para cambiar el timezone de un BU:

```bash
PUT /api/v1/business-units/:id/rental-settings
{
  "timezone": "America/Mexico_City"
}
```

---

## Notas Importantes

1. **Todas las fechas en DB siguen siendo UTC**: Las utilidades convierten de/hacia el timezone del BU según sea necesario
2. **Cache de timezone**: Las funciones usan cache de 5 minutos para reducir queries a la DB
3. **Fallbacks**: Si no se encuentra timezone configurado, se usa "America/Bogota" por defecto
4. **Backward compatibility**: Los endpoints siguen aceptando fechas en cualquier formato, las utilidades las convierten correctamente

---

## Próximos Pasos

- [ ] Verificar que otros módulos (purchases, dashboard) también usen timezone utilities si manejan fechas
- [ ] Crear tests automatizados para validar timezone en diferentes escenarios
- [ ] Documentar el comportamiento de timezone en la API documentation
- [ ] Considerar agregar timezone info en los responses de la API para que el frontend sepa qué timezone se está usando

---

## Referencias

- **Guía completa**: `docs/TIMEZONE_IMPLEMENTATION_GUIDE.md`
- **Ejemplos de código**: `docs/TIMEZONE_MIGRATION_EXAMPLES.ts`
- **Utilidades**: `backend/src/core/utils/timezone-utils.ts`
