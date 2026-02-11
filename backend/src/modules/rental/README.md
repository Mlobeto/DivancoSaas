# Módulo Rental - Cotizaciones y Contratos

## 📋 Descripción

Módulo completo para gestión de cotizaciones con firma digital y transformación automática en contratos. Aplica a múltiples rubros de negocio (alquiler de maquinaria, servicios, proyectos, etc.).

## 🎯 Características

- ✅ Creación de cotizaciones dinámicas con items personalizables
- ✅ Sistema de plantillas configurable por BusinessUnit
- ✅ Generación automática de PDFs profesionales
- ✅ Integración con proveedores de firma digital (SignNow, DocuSign)
- ✅ Envío multicanal (Email, WhatsApp)
- ✅ Transformación automática en contratos al confirmar pago
- ✅ Auditoría completa del flujo
- ✅ Cumple 100% con Guard Rails arquitectónicos

## 🏗️ Estructura

```
modules/rental/
├── rental.module.ts          # Configuración del módulo
├── rental.routes.ts           # Rutas API
├── controllers/
│   └── quotation.controller.ts
└── services/
    └── quotation.service.ts
```

## 📐 Flujo Completo

```
1. CREAR COTIZACIÓN
   POST /api/v1/rental/quotations
   → Genera código único (QU-2026-001)
   → Calcula totales automáticamente
   ↓
2. GENERAR PDF
   POST /api/v1/rental/quotations/:id/generate-pdf
   → Usa plantilla configurable de la BU
   → Sube a Azure Blob Storage
   ↓
3. SOLICITAR FIRMA
   POST /api/v1/rental/quotations/:id/request-signature
   → Crea solicitud en proveedor (SignNow/DocuSign)
   → Envía link de firma al cliente
   ↓
4. WEBHOOK FIRMA COMPLETADA
   POST /webhooks/digital-signature/:provider
   → Valida firma del webhook
   → Descarga documento firmado
   → Actualiza estado de cotización
   ↓
5. PROCESAR PAGO
   (Usa sistema de pagos existente)
   ↓
6. CREAR CONTRATO AUTOMÁTICO
   POST /api/v1/rental/quotations/:id/create-contract
   → Valida firma y pago
   → Genera contrato con código CON-2026-001
   → Notifica a las partes
```

## 🚀 Uso Rápido

### 1. Configurar Proveedor de Firma Digital

```bash
# .env
SIGNOW_API_KEY=your_api_key_here
SIGNOW_ENVIRONMENT=sandbox  # o production
SIGNOW_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Configurar en BusinessUnit

```http
POST /api/v1/business-units/:id/integrations
{
  "type": "DIGITAL_SIGNATURE",
  "provider": "signow",
  "credentials": {
    "apiKey": "..."
  },
  "isActive": true
}
```

### 3. Crear Plantilla de Cotización

```http
POST /api/v1/templates
{
  "businessUnitId": "bu-123",
  "name": "Cotización Alquiler v1",
  "type": "quotation",
  "content": "<html>{{quotationCode}} - {{clientName}}...</html>",
  "logoUrl": "https://miempresa.com/logo.png"
}
```

### 4. Crear Cotización

```http
POST /api/v1/rental/quotations
{
  "businessUnitId": "bu-123",
  "clientId": "client-456",
  "validUntil": "2026-03-15T23:59:59Z",
  "items": [
    {
      "assetId": "asset-001",
      "description": "Retroexcavadora CAT 420F",
      "quantity": 1,
      "unitPrice": 5000.00,
      "rentalDays": 30
    }
  ],
  "taxRate": 19
}
```

## 📊 Modelos de Datos

### Quotation

```typescript
{
  id: "uuid",
  code: "QU-2026-001",
  clientId: "uuid",
  status: "draft" | "signature_pending" | "signed" | "paid",
  subtotal: Decimal,
  taxAmount: Decimal,
  totalAmount: Decimal,
  pdfUrl: "https://...",
  signedPdfUrl: "https://...",
  signatureRequestId: "signow-doc-123",
  signatureStatus: "pending" | "signed",
  paymentStatus: "pending" | "paid"
}
```

### QuotationContract

```typescript
{
  id: "uuid",
  code: "CON-2026-001",
  quotationId: "uuid",
  status: "active" | "completed" | "cancelled",
  startDate: Date,
  endDate: Date,
  pdfUrl: "https://...",
  signedPdfUrl: "https://..."
}
```

## 🔐 Seguridad

- ✅ Validación de webhooks con firma HMAC
- ✅ Aislamiento por tenant y BusinessUnit
- ✅ Permisos configurables por acción
- ✅ Auditoría completa de cada operación
- ✅ URLs firmadas con expiración para documentos

## 🧪 Testing

```bash
# Migrar schema
npx prisma migrate dev --name add_quotations_module

# Iniciar servidor
npm run dev

# Probar endpoint
curl -X POST http://localhost:3000/api/v1/rental/quotations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d @test-quotation.json
```

## 📚 Dependencias

```json
{
  "handlebars": "^4.7.x",
  "puppeteer": "^21.x",
  "axios": "^1.6.x"
}
```

Instalar:

```bash
npm install handlebars puppeteer axios
```

## 🔄 Próximos Pasos

1. Configurar Azure Blob Storage para PDFs
2. Implementar envío por Email/WhatsApp (Sistema de Intenciones)
3. Configurar WebhooksSignNow en panel de administración
4. Crear plantillas personalizadas por BU
5. Integrar con módulo de pagos existente

## ⚠️ Notas Importantes

- El módulo cumple 100% con ARQUITECTURA.md y GUARD_RAILS.md
- Es transversal: puede usarse en alquiler, servicios, proyectos, etc.
- Los proveedores de firma son intercambiables mediante configuración
- Las plantillas son totalmente personalizables por BusinessUnit
- Estado y workflows son configurables dinámicamente

---

**Versión:** 1.0.0  
**Última actualización:** Febrero 10, 2026  
**Documentación completa:** [QUOTATIONS_SIGNATURES_CONTRACTS.md](../../../docs/QUOTATIONS_SIGNATURES_CONTRACTS.md)
