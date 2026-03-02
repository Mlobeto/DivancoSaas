# Contract Template System v2.0 - API Documentation

## Overview

El sistema de templates v2.0 permite crear contratos modulares con secciones predefinidas que heredan automáticamente datos de cotizaciones aprobadas, incluyen cláusulas dinámicas por tipo de activo, y soportan comprobantes de pago y firmas digitales.

---

## Arquitectura

### Componentes Principales

1. **ContractTemplateService**: Servicio de renderizado modular
2. **ContractTemplateController**: Endpoints para gestión de templates
3. **ContractController (Payment Proof)**: Endpoints para comprobantes de pago
4. **Prisma Schema**: RentalContract + Template con campos v2.0

### Modelos de Base de Datos

#### RentalContract (Campos Nuevos)

```prisma
model RentalContract {
  // ... campos existentes ...

  // Payment Proof Fields
  paymentType       String?   // "online" | "local" | null
  paymentProofUrl   String?   // Azure Blob URL
  paymentDetails    Json?     // { transactionRef, paymentDate, paidAt, notes, receivedBy }
  paymentVerifiedBy String?   // userId
  paymentVerifiedAt DateTime?
}
```

#### Template (Campos Nuevos)

```prisma
model Template {
  // ... campos existentes ...

  version              String  @default("1.0")
  content              Json    // Estructura modular v2.0
  requiresSignature    Boolean @default(false)
  requiresPaymentProof Boolean @default(false)
  allowLocalPayment    Boolean @default(true)
}
```

---

## API Endpoints

### 1. Template Rendering

#### POST `/api/v1/rental/contracts/templates/render`

Renderiza un contrato completo desde un template v2.0.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "contractId": "uuid",
  "templateId": "uuid",
  "variables": {
    "customField1": "value1",
    "customField2": "value2"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "html": "<html>...</html>",
    "contractId": "uuid",
    "templateId": "uuid"
  }
}
```

**Use Case:**

- Generar PDF de contrato para envío a firma
- Preview de contrato antes de aprobación
- Exportar contrato para email/download

---

### 2. Create Template v2.0

#### POST `/api/v1/rental/contracts/templates`

Crea un nuevo template modular.

**Request Body:**

```json
{
  "name": "Contrato de Alquiler - Maquinaria",
  "businessUnitId": "uuid",
  "requiresSignature": true,
  "requiresPaymentProof": true,
  "allowLocalPayment": true,
  "template": {
    "version": "2.0",
    "sections": [
      {
        "id": "header",
        "type": "header",
        "order": 1,
        "title": "Encabezado",
        "isRequired": true,
        "config": {
          "title": "CONTRATO DE ARRENDAMIENTO DE MAQUINARIA",
          "showCompanyInfo": true
        }
      },
      {
        "id": "quotation_summary",
        "type": "quotation_summary",
        "order": 2,
        "title": "Resumen de Cotización Aprobada",
        "isRequired": true,
        "config": {
          "showItems": true
        }
      },
      {
        "id": "contract_terms",
        "type": "contract_terms",
        "order": 3,
        "title": "Términos del Contrato",
        "isRequired": true,
        "config": {
          "terms": [
            "El presente contrato rige la relación de alquiler...",
            "El cliente se compromete a pagar conforme a la cotización..."
          ]
        }
      },
      {
        "id": "asset_clauses",
        "type": "asset_clauses",
        "order": 4,
        "title": "Cláusulas Específicas por Activo",
        "isRequired": true,
        "config": {}
      },
      {
        "id": "payment_proof",
        "type": "payment_proof",
        "order": 5,
        "title": "Comprobante de Pago",
        "isRequired": true,
        "config": {
          "instructions": "Debe cargar el comprobante de pago antes de la firma.",
          "allowLocalPayment": true
        }
      },
      {
        "id": "signatures",
        "type": "signatures",
        "order": 6,
        "title": "Firmas",
        "isRequired": true,
        "config": {
          "signNowEnabled": true,
          "signatories": [
            { "role": "Arrendador", "name": "{{tenant.name}}" },
            { "role": "Arrendatario", "name": "{{client.fullName}}" }
          ]
        }
      }
    ]
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "template-uuid",
    "tenantId": "uuid",
    "businessUnitId": "uuid",
    "name": "Contrato de Alquiler - Maquinaria",
    "version": "2.0",
    "content": { ... },
    "requiresSignature": true,
    "requiresPaymentProof": true,
    "allowLocalPayment": true,
    "isActive": true,
    "createdAt": "2026-03-02T18:00:00Z",
    "updatedAt": "2026-03-02T18:00:00Z"
  }
}
```

---

### 3. Migrate Template to v2.0

#### POST `/api/v1/rental/contracts/templates/:id/migrate-v2`

Migra un template legacy (HTML) al formato v2.0.

**Response (200 OK):**

```json
{
  "success": true,
  "data": { ... },
  "message": "Template migrated to v2.0 successfully"
}
```

---

### 4. Get Template Metadata

#### GET `/api/v1/rental/contracts/templates/:id/metadata`

Obtiene la metadata de un template sin el contenido completo.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Contrato de Alquiler - Maquinaria",
    "version": "2.0",
    "requiresSignature": true,
    "requiresPaymentProof": true,
    "allowLocalPayment": true,
    "isActive": true,
    "sectionsSummary": [
      {
        "id": "header",
        "type": "header",
        "title": "Encabezado",
        "order": 1,
        "isRequired": true
      },
      { ... }
    ],
    "createdAt": "2026-03-02T18:00:00Z",
    "updatedAt": "2026-03-02T18:00:00Z"
  }
}
```

---

## Payment Proof Endpoints

### 5. Upload Payment Proof

#### POST `/api/v1/rental/contracts/:id/payment-proof`

Sube un comprobante de pago (imagen/PDF).

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**

```
file: <binary>
transactionRef: "TRANS-123456"
paymentDate: "2026-03-02"
notes: "Pago realizado por transferencia bancaria"
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "contract-uuid",
    "paymentType": "online",
    "paymentProofUrl": "https://storage.blob.core.windows.net/...",
    "paymentDetails": {
      "transactionRef": "TRANS-123456",
      "paymentDate": "2026-03-02T00:00:00Z",
      "uploadedBy": "user-uuid",
      "uploadedAt": "2026-03-02T18:30:00Z",
      "notes": "Pago realizado por transferencia bancaria",
      "originalFilename": "comprobante.pdf",
      "fileSize": 524288
    }
  },
  "message": "Payment proof uploaded successfully"
}
```

---

### 6. Mark Local Payment

#### POST `/api/v1/rental/contracts/:id/payment-proof/local`

Marca el pago como realizado en efectivo/presencial (sin comprobante digital).

**Request Body:**

```json
{
  "receivedBy": "user-uuid",
  "paymentDate": "2026-03-02",
  "notes": "Pago recibido en efectivo en oficina central"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "contract-uuid",
    "paymentType": "local",
    "paymentProofUrl": null,
    "paymentDetails": {
      "paymentDate": "2026-03-02T00:00:00Z",
      "receivedBy": "user-uuid",
      "markedBy": "user-uuid",
      "markedAt": "2026-03-02T18:45:00Z",
      "notes": "Pago recibido en efectivo en oficina central",
      "method": "cash/local"
    }
  },
  "message": "Payment marked as local successfully"
}
```

---

### 7. Get Payment Proof

#### GET `/api/v1/rental/contracts/:id/payment-proof`

Obtiene la información del comprobante de pago.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "hasProof": true,
    "type": "online",
    "url": "https://storage.blob.core.windows.net/...",
    "details": { ... },
    "verifiedBy": "admin-uuid",
    "verifiedAt": "2026-03-02T19:00:00Z",
    "isVerified": true
  }
}
```

---

### 8. Verify Payment Proof (Admin)

#### POST `/api/v1/rental/contracts/:id/payment-proof/verify`

Verifica y aprueba un comprobante de pago.

**Request Body:**

```json
{
  "notes": "Comprobante verificado, pago recibido en cuenta bancaria"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "contract-uuid",
    "paymentVerifiedBy": "admin-uuid",
    "paymentVerifiedAt": "2026-03-02T19:00:00Z",
    "paymentDetails": {
      ...
      "verificationNotes": "Comprobante verificado, pago recibido en cuenta bancaria",
      "verifiedAt": "2026-03-02T19:00:00Z"
    }
  },
  "message": "Payment proof verified successfully"
}
```

---

## Section Types Reference

### 1. `header`

**Purpose:** Encabezado del contrato con logo, título y datos básicos.

**Config:**

```json
{
  "title": "CONTRATO DE ARRENDAMIENTO",
  "showCompanyInfo": true
}
```

**Variables disponibles:**

- `{{tenant.name}}` - Nombre del tenant
- `{{tenant.logoUrl}}` - Logo del tenant
- `{{tenant.taxId}}` - NIF/RUC
- `{{contract.code}}` - Código del contrato
- `{{contract.startDate}}` - Fecha de inicio

---

### 2. `quotation_summary`

**Purpose:** Resumen de la cotización aprobada (herencia automática).

**Config:**

```json
{
  "showItems": true
}
```

**Variables disponibles:**

- `{{quotation.code}}` - Código de cotización
- `{{quotation.total}}` - Total estimado
- `{{quotationItems}}` - Array de items
  - `{{item.asset.name}}`
  - `{{item.quantity}}`
  - `{{item.unitPrice}}`
  - `{{item.subtotal}}`

---

### 3. `contract_terms`

**Purpose:** Términos y condiciones estándar del contrato.

**Config:**

```json
{
  "template": "<h2>Términos</h2><ol>...</ol>",
  "terms": ["Término 1...", "Término 2..."]
}
```

---

### 4. `asset_clauses`

**Purpose:** Cláusulas dinámicas específicas por tipo de activo.

**Config:**

```json
{}
```

**Comportamiento:**

- Lee todas las `ContractClause` activas del tenant
- Filtra por `applicableAssetTypes` según los activos de la cotización
- Agrupa por categoría (general, mantenimiento, seguridad, etc.)
- Renderiza automáticamente

---

### 5. `payment_proof`

**Purpose:** Sección para comprobante de pago o marca de pago local.

**Config:**

```json
{
  "instructions": "Debe cargar el comprobante antes de la firma.",
  "allowLocalPayment": true
}
```

**Estados:**

- Sin comprobante: Muestra placeholder e instrucciones
- Con comprobante online: Muestra link de descarga
- Con pago local: Muestra confirmación

---

### 6. `signatures`

**Purpose:** Sección de firmas digitales (integración con SignNow).

**Config:**

```json
{
  "signNowEnabled": true,
  "signatories": [
    { "role": "Arrendador", "name": "{{tenant.name}}" },
    { "role": "Arrendatario", "name": "{{client.fullName}}" }
  ]
}
```

---

### 7. `custom_html`

**Purpose:** HTML personalizado con interpolación de variables.

**Config:**

```json
{
  "html": "<div>...</div>"
}
```

**Supports Handlebars templating:**

```handlebars
<h3>Cliente: {{client.fullName}}</h3>
<p>Total: {{currency contract.estimatedTotal}}</p>
<p>Fecha: {{date contract.startDate}}</p>
```

---

## Handlebars Helpers

### `currency`

Formatea un número como moneda (COP).

```handlebars
{{currency quotation.total}}
```

Output: `$2.500.000`

### `date`

Formatea una fecha (formato largo).

```handlebars
{{date contract.startDate}}
```

Output: `2 de marzo de 2026`

### `shortDate`

Formatea una fecha (formato corto).

```handlebars
{{shortDate contract.startDate}}
```

Output: `02/03/2026`

### `eq`

Comparación condicional.

```handlebars
{{#if (eq contract.status "active")}}
  Activo
{{/if}}
```

### `quantity`

Muestra cantidad con unidad automática (singular/plural).

```handlebars
{{quantity item.quantity "día"}}
```

Output: `5 días`

---

## Workflow Example

### 1. Crear Cotización

```
POST /api/v1/rental/quotations
```

### 2. Aprobar Cotización (Cliente)

```
POST /api/v1/rental/quotations/:id/approve
```

### 3. Crear Contrato desde Cotización

```
POST /api/v1/rental/contracts
{
  "quotationId": "uuid",
  "templateId": "template-uuid"
}
```

### 4. Subir Comprobante de Pago

```
POST /api/v1/rental/contracts/:id/payment-proof
FormData: { file, transactionRef, paymentDate }
```

### 5. Verificar Pago (Admin)

```
POST /api/v1/rental/contracts/:id/payment-proof/verify
```

### 6. Renderizar Contrato Final

```
POST /api/v1/rental/contracts/templates/render
{
  "contractId": "uuid",
  "templateId": "uuid"
}
```

### 7. Enviar a Firma Digital

```
// TODO: Integración con SignNow
POST /api/v1/rental/contracts/:id/send-signature
```

---

## Error Codes

| Code               | Message                        | Status |
| ------------------ | ------------------------------ | ------ |
| `UNAUTHORIZED`     | Missing tenant context         | 401    |
| `NOT_FOUND`        | Template not found             | 404    |
| `NOT_FOUND`        | Contract not found             | 404    |
| `MISSING_FILE`     | Payment proof file is required | 400    |
| `UPLOAD_ERROR`     | Error uploading file           | 400    |
| `VERIFY_ERROR`     | No payment proof to verify     | 400    |
| `INVALID_TEMPLATE` | Invalid template structure     | 400    |

---

## Security Notes

- ✅ Todos los endpoints requieren autenticación (`authenticate` middleware)
- ✅ Permisos RBAC: `contracts:read`, `contracts:update`, `templates:create`, etc.
- ✅ Archivos de comprobante se suben a Azure Blob Storage (secure)
- ✅ Payment verification solo por usuarios con permisos de admin
- ✅ Todos los templates son scoped por `tenantId`

---

## Next Steps (Frontend)

1. **Template Editor UI**
   - Drag & drop section builder
   - Live preview con datos de muestra
   - Variable autocomplete

2. **Payment Proof Uploader**
   - Drag & drop file uploader
   - "Pago local" checkbox alternativo
   - Preview del comprobante subido

3. **Contract Preview**
   - PDF viewer embebido
   - Botón "Enviar a Firma"
   - Estado de verificación de pago

4. **SignNow Integration**
   - Botón "Solicitar Firma"
   - Webhook para notificaciones de firma completada
   - Descarga de contrato firmado

---

## Database Migration Applied

✅ Migration: `20260302_add_contract_payment_proof_and_template_v2`

**Changes:**

- Added 5 fields to `RentalContract` (payment proof tracking)
- Converted `Template.content` from TEXT to JSONB
- Added `Template.version`, `requiresSignature`, `requiresPaymentProof`, `allowLocalPayment`
- Migrated existing HTML templates to v2.0 structure (wrapped in `custom_html` section)

---

## Testing

### Test Template Creation

```bash
curl -X POST http://localhost:4000/api/v1/rental/contracts/templates \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Template",
    "template": {
      "version": "2.0",
      "sections": [
        {
          "id": "header",
          "type": "header",
          "order": 1,
          "title": "Header",
          "isRequired": true,
          "config": { "title": "TEST CONTRACT" }
        }
      ]
    }
  }'
```

### Test Contract Rendering

```bash
curl -X POST http://localhost:4000/api/v1/rental/contracts/templates/render \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": "contract-uuid",
    "templateId": "template-uuid"
  }'
```

### Test Payment Proof Upload

```bash
curl -X POST http://localhost:4000/api/v1/rental/contracts/:id/payment-proof \
  -H "Authorization: Bearer <token>" \
  -F "file=@comprobante.pdf" \
  -F "transactionRef=TRANS-123" \
  -F "paymentDate=2026-03-02"
```

---

## Support

Para más información, consultar:

- [CONTRACT_TEMPLATE_ARCHITECTURE.md](./CONTRACT_TEMPLATE_ARCHITECTURE.md) - Diseño arquitectónico completo
- [RENTAL_OPERATIONS_DELIVERY.md](./RENTAL_OPERATIONS_DELIVERY.md) - Sistema de entrega y operaciones

---

**Versión:** 2.0  
**Fecha:** 2 de marzo de 2026  
**Estado:** ✅ Backend implementado, Frontend pendiente
