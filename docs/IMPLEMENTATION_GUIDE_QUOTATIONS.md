# Guía de Implementación - Sistema de Cotizaciones

## ✅ Completado

### 1. Documentación

- [x] [QUOTATIONS_SIGNATURES_CONTRACTS.md](./QUOTATIONS_SIGNATURES_CONTRACTS.md) - Documentación completa del sistema

### 2. Contratos (CORE)

- [x] `core/contracts/digital-signature.provider.ts` - Contrato para proveedores de firma digital
- [x] Interfaz `DigitalSignatureProvider` con todos los métodos
- [x] Tipos: `SignatureRequest`, `SignatureStatus`, `SignatureWebhookEvent`

### 3. Adapters

- [x] `integrations/adapters/digital-signature/signow.adapter.ts` - Implementación SignNow
- [x] `integrations/adapters/digital-signature/digital-signature.resolver.ts` - Resolver de proveedores
- [x] Soporte para webhooks con verificación de firma

### 4. Sistema de Plantillas (SHARED)

- [x] `shared/templates/template.service.ts` - Servicio de plantillas
- [x] Integración con Handlebars
- [x] Generación de PDF con Puppeteer
- [x] Helpers personalizados (formatCurrency, formatDate, etc.)

### 5. Base de Datos

- [x] Schema Prisma actualizado con:
  - Enum `DIGITAL_SIGNATURE` en `IntegrationType`
  - Modelo `Template`
  - Modelo `Quotation`
  - Modelo `QuotationItem`
  - Modelo `QuotationContract`
  - Relaciones actualizadas en todos los modelos afectados

### 6. Módulo Rental

- [x] `modules/rental/services/quotation.service.ts` - Servicio completo
- [x] `modules/rental/controllers/quotation.controller.ts` - Controller
- [x] `modules/rental/rental.routes.ts` - Rutas API
- [x] `modules/rental/rental.module.ts` - Configuración del módulo
- [x] `modules/rental/README.md` - Documentación del módulo

---

## 🚀 Pasos para Implementar

### 1. Instalar Dependencias

```bash
cd backend
npm install handlebars puppeteer axios
npm install --save-dev @types/puppeteer
```

### 2. Ejecutar Migración de Prisma

```bash
npx prisma migrate dev --name add_quotations_and_digital_signatures
```

Esto creará la migración con los nuevos modelos:

- Template
- Quotation
- QuotationItem
- QuotationContract

### 3. Configurar Variables de Entorno

Agregar a `.env`:

```bash
# Digital Signature - SignNow
SIGNOW_API_KEY=your_api_key_here
SIGNOW_ENVIRONMENT=sandbox
SIGNOW_WEBHOOK_SECRET=your_webhook_secret_here
```

### 4. Registrar Módulo en App

Agregar en `backend/src/app.ts`:

```typescript
import rentalModule from "./modules/rental/rental.module";

// Registrar rutas del módulo
app.use("/api/v1/rental", rentalModule.routes);
```

### 5. Configurar Proveedor en BusinessUnit

```http
POST /api/v1/business-units/:businessUnitId/integrations
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "DIGITAL_SIGNATURE",
  "provider": "signow",
  "credentials": {
    "apiKey": "tu_api_key"
  },
  "config": {
    "environment": "sandbox"
  },
  "isActive": true
}
```

### 6. Crear Plantilla de Cotización

```http
POST /api/v1/templates
Authorization: Bearer <token>
Content-Type: application/json

{
  "businessUnitId": "<bu_id>",
  "name": "Cotización de Alquiler v1",
  "type": "quotation",
  "content": "<!DOCTYPE html>...",
  "logoUrl": "https://tu-empresa.com/logo.png",
  "variables": [
    {
      "name": "clientName",
      "label": "Nombre del Cliente",
      "type": "text",
      "required": true
    }
  ]
}
```

Ver plantilla de ejemplo en la [documentación](./QUOTATIONS_SIGNATURES_CONTRACTS.md#ejemplo-de-plantilla-de-cotización).

---

## 📋 Checklist de Verificación

Antes de usar en producción, verificar:

- [ ] Prisma migration ejecutada correctamente
- [ ] Dependencias instaladas (handlebars, puppeteer, axios)
- [ ] Variables de entorno configuradas
- [ ] Proveedor de firma digital configurado en BU
- [ ] Al menos una plantilla de cotización creada
- [ ] Azure Blob Storage configurado para PDFs
- [ ] Webhook URL configurada en panel de SignNow
- [ ] Probar flujo completo en ambiente de desarrollo

---

## 🧪 Prueba Rápida

### 1. Crear Cotización de Prueba

```bash
curl -X POST http://localhost:3000/api/v1/rental/quotations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessUnitId": "bu-123",
    "clientId": "client-456",
    "validUntil": "2026-03-15T23:59:59Z",
    "items": [
      {
        "description": "Retroexcavadora CAT 420F",
        "quantity": 1,
        "unitPrice": 5000.00,
        "rentalDays": 30
      }
    ],
    "taxRate": 19
  }'
```

### 2. Generar PDF

```bash
curl -X POST http://localhost:3000/api/v1/rental/quotations/QUOTATION_ID/generate-pdf \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Solicitar Firma

```bash
curl -X POST http://localhost:3000/api/v1/rental/quotations/QUOTATION_ID/request-signature \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "signers": [
      {
        "name": "Juan Pérez",
        "email": "juan@cliente.com"
      }
    ]
  }'
```

---

## 🎯 Próximos Pasos

1. **Integrar con Azure Blob Storage**
   - Reemplazar URLs dummy por subida real a Azure
   - Configurar SAS tokens con expiración

2. **Implementar Motor de Intenciones**
   - Crear intent `SEND_QUOTATION_EMAIL`
   - Crear intent `SEND_QUOTATION_WHATSAPP`

3. **Conectar con Sistema de Pagos**
   - Usar adapters de pago existentes
   - Webhook de pago confirmado → crear contrato

4. **Crear Plantilla de Contrato**
   - Similar a plantilla de cotización
   - Con términos y condiciones legales

5. **Implementar UI en Frontend**
   - Pantalla de creación de cotizaciones
   - Editor de plantillas WYSIWYG
   - Vista de cotizaciones con estados
   - Dashboard de contratos activos

---

## 📚 Referencias

- [Documentación Completa](./QUOTATIONS_SIGNATURES_CONTRACTS.md)
- [ARQUITECTURA.md](./ARQUITECTURA.md)
- [GUARD_RAILS.md](./GUARD_RAILS.md)
- [SignNow API Docs](https://docs.signnow.com/)
- [Puppeteer Docs](https://pptr.dev/)
- [Handlebars Docs](https://handlebarsjs.com/)

---

**Fecha:** Febrero 10, 2026  
**Estado:** ✅ Sistema completo y listo para testing  
**Autor:** Equipo DivancoSaaS
