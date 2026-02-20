# Template de Cotización con Puppeteer - Dual Type

## 📋 Resumen

Este template de Handlebars soporta **dos tipos de cotización**:

1. **TIME_BASED** - Alquiler por tiempo (rental)
2. **SERVICE_BASED** - Servicios/proyectos a precio fijo

El PDF se genera automáticamente con Puppeteer y se sube a Azure Blob Storage.

## 🎯 Características Implementadas

### Time-Based (Rental)

- ✅ Período de alquiler estimado (inicio, fin, días)
- ✅ Tipo de período por item (hourly, daily, weekly, monthly)
- ✅ Standby hours (horas mínimas garantizadas para MACHINERY)
- ✅ Operador incluido/no incluido con tipo de cargo (PER_DAY/PER_HOUR)
- ✅ Desglose detallado de precios (base, operador, mantenimiento)
- ✅ Indicador visual de precios ajustados manualmente
- ✅ Descuentos con razón explicada

### Service-Based (Servicios/Proyectos)

- ✅ Descripción del servicio/proyecto
- ✅ Items simples con cantidad y precio
- ✅ Totales fijos sin desglose de rental
- ✅ Descuentos opcionales

### Comunes

- ✅ Logo del BusinessUnit
- ✅ Información del cliente
- ✅ Totales con IVA
- ✅ Notas importantes
- ✅ Términos y condiciones
- ✅ Footer con información adicional

## 🔧 Uso

### 1. Crear Template en la Base de Datos

```typescript
// Crear template para tu BusinessUnit
const template = await prisma.template.create({
  data: {
    tenantId: "tu-tenant-id",
    businessUnitId: "tu-bu-id",
    name: "Cotización Dual Type",
    type: "quotation",
    content: fs.readFileSync("./quotation-template-dual-type.hbs", "utf-8"),
    isActive: true,
    variables: [
      {
        name: "quotationType",
        label: "Tipo de Cotización",
        type: "text",
        required: true,
      },
      {
        name: "estimatedDays",
        label: "Días Estimados",
        type: "number",
        required: false,
      },
      // ... más variables según necesites
    ],
  },
});
```

### 2. Generar PDF desde el Servicio

El servicio `quotation.service.ts` ya está actualizado:

```typescript
// Simplemente llama al método
const pdfUrl = await quotationService.generateQuotationPDF(quotationId);

// El PDF se genera automáticamente y se sube a Azure
console.log("PDF generado:", pdfUrl);
// https://storage.divancosaas.com/tenant-xxx/quotations/QUO-2026-001.pdf
```

### 3. Variables Disponibles en el Template

#### Básicas

- `quotationCode` - Código único (ej: QUO-2026-001)
- `quotationDate` - Fecha de emisión
- `validUntil` - Fecha de vencimiento
- `quotationType` - "time_based" | "service_based"
- `isTimeBased` - Boolean helper
- `isServiceBased` - Boolean helper
- `currency` - Moneda (ej: USD, MXN)

#### Cliente

- `clientName`
- `clientEmail`
- `clientPhone`

#### Time-Based Específico

- `estimatedStartDate` - Fecha de inicio estimada
- `estimatedEndDate` - Fecha de fin estimada
- `estimatedDays` - Días totales estimados

#### Service-Based Específico

- `serviceDescription` - Descripción del servicio/proyecto

#### Items (Array)

Cada item tiene:

- `description` - Descripción del item
- `quantity` - Cantidad
- `unitPrice` - Precio unitario
- `total` - Total del item
- `assetName` - Nombre del asset (si aplica)
- `assetCategory` - Categoría (MACHINERY, VEHICLE, etc.)
- `priceOverridden` - Boolean, si precio fue ajustado
- `discount` - Monto de descuento
- `discountReason` - Razón del descuento

**Solo para Time-Based:**

- `rentalDays` - Días de alquiler
- `rentalStartDate` - Fecha inicio
- `rentalEndDate` - Fecha fin
- `rentalPeriodType` - "hourly" | "daily" | "weekly" | "monthly"
- `standbyHours` - Horas standby (MACHINERY)
- `operatorIncluded` - Boolean
- `operatorCostType` - "PER_DAY" | "PER_HOUR"
- `operatorCost` - Costo del operador
- `basePrice` - Precio base del asset
- `operatorCostAmount` - Monto del operador
- `maintenanceCost` - Costo de mantenimiento
- `calculatedUnitPrice` - Precio calculado automáticamente
- `calculatedOperatorCost` - Costo operador calculado

#### Totales

- `subtotal`
- `taxRate` - Porcentaje de impuesto
- `taxAmount` - Monto del impuesto
- `totalAmount` - Total final

#### Otros

- `notes` - Notas importantes
- `termsAndConditions` - Términos y condiciones
- `logoUrl` - URL del logo del BusinessUnit
- `businessUnitName` - Nombre del BusinessUnit

## 🎨 Personalización del Template

### Estilos CSS

El template incluye estilos completos. Puedes modificar:

- Colores del header (`#0066cc`)
- Badges de tipo de cotización
- Tablas y espaciados
- Tamaños de fuente

### Agregar Helpers de Handlebars

Si necesitas helpers personalizados (como `eq` para comparaciones), regístralos en `template.service.ts`:

```typescript
// En template.service.ts
Handlebars.registerHelper("eq", (a, b) => a === b);
Handlebars.registerHelper("gt", (a, b) => a > b);
Handlebars.registerHelper("formatDate", (date) => {
  return new Date(date).toLocaleDateString("es-MX");
});
Handlebars.registerHelper("formatCurrency", (amount, currency) => {
  return `${currency} ${Number(amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
});
```

## 📦 Estructura del Flujo Completo

```
1. Usuario crea cotización en QuotationFormPage
   ↓
2. Frontend envía POST /quotations con items y configuración
   ↓
3. Backend crea Quotation y QuotationItems en la DB
   ↓
4. Usuario hace click en "Generar PDF"
   ↓
5. Backend llama a quotationService.generateQuotationPDF(id)
   ↓
6. Se obtiene el template activo de tipo "quotation"
   ↓
7. Se preparan los datos según quotationType (time_based o service_based)
   ↓
8. Handlebars compila el template con los datos
   ↓
9. Puppeteer genera el PDF A4 desde el HTML
   ↓
10. Se sube a Azure Blob Storage (carpeta "quotations")
    ↓
11. Se actualiza quotation.pdfUrl en la DB
    ↓
12. Se retorna la URL pública del PDF
```

## 🚀 Próximos Pasos

### Sprint 2: Agregar botón "Generar PDF" en el Frontend

```typescript
// En QuotationFormPage o QuotationDetailPage
const handleGeneratePDF = async () => {
  try {
    setLoading(true);
    const response = await api.post(`/quotations/${quotationId}/generate-pdf`);
    const pdfUrl = response.data.pdfUrl;

    // Abrir PDF en nueva pestaña
    window.open(pdfUrl, "_blank");

    toast.success("PDF generado exitosamente");
  } catch (error) {
    toast.error("Error al generar PDF");
  } finally {
    setLoading(false);
  }
};
```

### Sprint 2: Endpoint en el Backend

```typescript
// En quotation.controller.ts
router.post("/:id/generate-pdf", async (req, res) => {
  try {
    const { id } = req.params;
    const pdfUrl = await quotationService.generateQuotationPDF(id);

    res.json({
      success: true,
      pdfUrl,
      message: "PDF generado exitosamente",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
```

## 📝 Milestones (Service-Based)

Para cotizaciones de tipo `service_based`, los **milestones NO se muestran en este template** porque:

1. Los milestones se definen al crear el **contrato** (no en la cotización)
2. La cotización solo muestra el precio total del servicio
3. Los milestones se agregarán en el template de **contrato**

**Flujo correcto:**

```
Quotation (service_based) → muestra precio total fijo
   ↓
Cliente aprueba y firma
   ↓
Se crea RentalContract con milestones definidos
   ↓
Template de CONTRATO muestra los milestones
```

## 🧪 Testing

Para probar el template localmente:

```bash
# 1. Crear una cotización de prueba
cd backend
npm run dev

# 2. Usar Postman o curl para crear una quotation
POST http://localhost:3000/api/rental/quotations
{
  "quotationType": "time_based",
  "estimatedStartDate": "2026-03-01",
  "estimatedEndDate": "2026-03-15",
  "estimatedDays": 14,
  "items": [...]
}

# 3. Generar PDF
POST http://localhost:3000/api/rental/quotations/{id}/generate-pdf

# 4. El PDF se guardará en Azure y se retornará la URL
```

## 🎯 Ventajas de Esta Implementación

1. ✅ **Un solo template** para ambos tipos de cotización
2. ✅ **Condicionales claros** (`{{#if isTimeBased}}`)
3. ✅ **Desglose completo** de precios para rental
4. ✅ **Profesional y limpio** visualmente
5. ✅ **Fácil de mantener** - todo en un archivo
6. ✅ **Extensible** - agregar más campos es trivial
7. ✅ **Responsive** para impresión y pantalla
8. ✅ **Integrado con Azure** - storage automático

## 🔄 Versionado de Templates

Si necesitas cambiar el template sin afectar cotizaciones antiguas:

```typescript
// Crear una nueva versión
const newTemplate = await prisma.template.create({
  data: {
    ...templateData,
    name: "Cotización Dual Type v2",
    isActive: true,
  },
});

// Desactivar la versión anterior
await prisma.template.update({
  where: { id: oldTemplateId },
  data: { isActive: false },
});
```

Las cotizaciones antiguas seguirán referenciando su `templateId` original.

---

**Documentación creada:** 2026-02-20  
**Última actualización:** 2026-02-20  
**Versión:** 1.0.0
