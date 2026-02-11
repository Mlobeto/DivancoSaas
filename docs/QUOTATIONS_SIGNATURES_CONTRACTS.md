# COTIZACIONES, FIRMA DIGITAL Y CONTRATOS

## 📋 INTRODUCCIÓN

Este documento describe el flujo completo para gestionar cotizaciones con firma digital y su transformación en contratos, aplicable a múltiples rubros de negocio (alquiler de maquinaria, servicios, proyectos, etc.).

**Fecha:** Febrero 2026  
**Versión:** 1.0.0

---

## 🎯 CASO DE USO: Alquiler de Maquinaria

### Flujo de Negocio

```
1. COTIZACIÓN → 2. ENVÍO → 3. FIRMA → 4. PAGO → 5. CONTRATO ACTIVO

Cliente solicita     Se envía por      Cliente firma    Se procesa     Se genera
  cotización      email/WhatsApp      digitalmente      el pago       contrato
      ↓                  ↓                  ↓               ↓              ↓
  PDF generado    Link de acceso    Estado "signed"   Confirmado    Contrato PDF
  con plantilla   personalizado     con webhook       por provider   firmado
```

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Principios Aplicados

✅ **Multitenant y Business Units**: Todo aislado por tenant y BU  
✅ **Módulo Independiente**: `rental` como módulo activable  
✅ **Adapters Intercambiables**: Firma digital y pagos desacoplados  
✅ **Plantillas Configurables**: Cada BU personaliza sus documentos  
✅ **Sistema de Intenciones**: Comunicación multicanal unificada  
✅ **Workflows Dinámicos**: Estados configurables por BU

---

## 📐 COMPONENTES DEL SISTEMA

### 1. Contrato de Firma Digital (CORE)

**Ubicación:** `core/contracts/digital-signature.provider.ts`

```typescript
export interface DigitalSignatureProvider {
  readonly name: string;

  /**
   * Crear solicitud de firma
   */
  createSignatureRequest(
    params: SignatureRequestParams,
  ): Promise<SignatureRequest>;

  /**
   * Obtener estado de firma
   */
  getSignatureStatus(requestId: string): Promise<SignatureStatus>;

  /**
   * Descargar documento firmado
   */
  downloadSignedDocument(requestId: string): Promise<Buffer>;

  /**
   * Cancelar solicitud de firma
   */
  cancelSignatureRequest(requestId: string): Promise<void>;

  /**
   * Parsear webhook del proveedor
   */
  parseWebhook(
    rawPayload: any,
    signature?: string,
  ): Promise<SignatureWebhookEvent | null>;
}

export interface SignatureRequestParams {
  tenantId: string;
  businessUnitId: string;
  documentName: string;
  documentUrl: string; // URL del PDF en Azure Blob Storage
  signers: SignerInfo[];
  message?: string;
  expiresInDays?: number;
  metadata?: Record<string, any>;
}

export interface SignerInfo {
  name: string;
  email: string;
  role?: string;
  order?: number; // Para firma secuencial
  requiredFields?: SignatureField[];
}

export interface SignatureField {
  type: "signature" | "initials" | "date" | "text" | "checkbox";
  label: string;
  required: boolean;
  page?: number;
  x?: number;
  y?: number;
}

export interface SignatureRequest {
  id: string; // ID del proveedor
  internalId?: string; // ID interno del sistema
  status: SignatureStatus;
  signUrl: string; // URL donde el cliente firma
  expiresAt: Date;
  createdAt: Date;
}

export type SignatureStatus =
  | "pending" // Enviado, esperando firma
  | "viewed" // Documento visto por el firmante
  | "signed" // Firmado completamente
  | "partially_signed" // Firmado por algunos (firma múltiple)
  | "declined" // Rechazado por el firmante
  | "expired" // Tiempo límite excedido
  | "cancelled"; // Cancelado por el solicitante

export interface SignatureWebhookEvent {
  requestId: string;
  status: SignatureStatus;
  signedAt?: Date;
  signedBy?: string;
  declinedReason?: string;
  documentUrl?: string; // URL del documento firmado
}
```

---

### 2. Sistema de Plantillas (SHARED)

**Ubicación:** `shared/templates/`

```typescript
// shared/templates/template.service.ts

export interface Template {
  id: string;
  tenantId: string;
  businessUnitId: string;
  name: string;
  type: TemplateType;
  content: string; // HTML con {variables}
  styles?: string; // CSS personalizado
  variables: TemplateVariable[];
  logoUrl?: string;
  headerHtml?: string;
  footerHtml?: string;
  isActive: boolean;
}

export type TemplateType =
  | "quotation"
  | "contract"
  | "invoice"
  | "receipt"
  | "report"
  | "certificate";

export interface TemplateVariable {
  name: string; // ej: "clientName"
  label: string; // ej: "Nombre del Cliente"
  type: "text" | "number" | "date" | "currency" | "boolean";
  required: boolean;
  defaultValue?: any;
}

export interface RenderTemplateParams {
  templateId: string;
  data: Record<string, any>;
  options?: RenderOptions;
}

export interface RenderOptions {
  locale?: string;
  timezone?: string;
  dateFormat?: string;
  currencySymbol?: string;
}

export interface PDFGenerationOptions {
  format?: "A4" | "Letter" | "Legal";
  orientation?: "portrait" | "landscape";
  margin?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}
```

#### Ejemplo de Plantilla de Cotización

```html
<!-- Template Content (HTML) -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: Arial, sans-serif;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
      }
      .logo {
        max-width: 200px;
      }
      .info-section {
        margin: 20px 0;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
      }
      .table th,
      .table td {
        border: 1px solid #ddd;
        padding: 8px;
      }
      .table th {
        background-color: #f2f2f2;
      }
      .total {
        font-size: 1.2em;
        font-weight: bold;
        text-align: right;
      }
    </style>
  </head>
  <body>
    <div class="header">
      {{#if logoUrl}}
      <img src="{{logoUrl}}" class="logo" alt="Logo" />
      {{/if}}
      <h1>COTIZACIÓN {{quotationCode}}</h1>
    </div>

    <div class="info-section">
      <h3>Información del Cliente</h3>
      <p><strong>Nombre:</strong> {{clientName}}</p>
      <p><strong>Email:</strong> {{clientEmail}}</p>
      <p><strong>Teléfono:</strong> {{clientPhone}}</p>
    </div>

    <div class="info-section">
      <h3>Detalles de la Cotización</h3>
      <p><strong>Fecha:</strong> {{quotationDate}}</p>
      <p><strong>Válida hasta:</strong> {{validUntil}}</p>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Descripción</th>
          <th>Cantidad</th>
          <th>Precio Unitario</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {{#each items}}
        <tr>
          <td>{{this.description}}</td>
          <td>{{this.quantity}}</td>
          <td>{{formatCurrency this.unitPrice}}</td>
          <td>{{formatCurrency this.total}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>

    <div class="total">
      <p>Subtotal: {{formatCurrency subtotal}}</p>
      <p>IVA ({{taxRate}}%): {{formatCurrency taxAmount}}</p>
      <p>Total: {{formatCurrency totalAmount}}</p>
    </div>

    <div class="info-section">
      <h3>Términos y Condiciones</h3>
      <p>{{termsAndConditions}}</p>
    </div>
  </body>
</html>
```

---

### 3. Módulo Rental

**Ubicación:** `modules/rental/`

```typescript
// modules/rental/services/quotation.service.ts

export class QuotationService {
  /**
   * Crear cotización
   */
  async createQuotation(params: CreateQuotationParams): Promise<Quotation> {
    // 1. Validar tenant y businessUnit
    // 2. Generar código único (QU-2026-001)
    // 3. Calcular totales
    // 4. Guardar en DB
    // 5. Crear workflow inicial
  }

  /**
   * Generar PDF de cotización
   */
  async generateQuotationPDF(quotationId: string): Promise<string> {
    // 1. Obtener cotización y datos relacionados
    // 2. Obtener plantilla activa de la BU
    // 3. Preparar variables para renderizado
    // 4. Renderizar HTML con TemplateService
    // 5. Generar PDF con Puppeteer
    // 6. Subir a Azure Blob Storage
    // 7. Actualizar quotation.pdfUrl
    // 8. Retornar URL pública
  }

  /**
   * Enviar cotización por múltiples canales
   */
  async sendQuotation(
    quotationId: string,
    channels: ("email" | "whatsapp")[],
  ): Promise<void> {
    // Usa Motor de Intenciones:
    // - SEND_QUOTATION_EMAIL
    // - SEND_QUOTATION_WHATSAPP
  }

  /**
   * Solicitar firma digital
   */
  async requestSignature(
    quotationId: string,
    signers: SignerInfo[],
  ): Promise<SignatureRequest> {
    // 1. Obtener cotización y PDF generado
    // 2. Resolver DigitalSignatureProvider para la BU
    // 3. Crear solicitud en proveedor externo
    // 4. Guardar requestId en quotation
    // 5. Actualizar estado workflow
    // 6. Retornar URL de firma
  }

  /**
   * Procesar webhook de firma completada
   */
  async handleSignatureWebhook(event: SignatureWebhookEvent): Promise<void> {
    // 1. Buscar quotation por signatureRequestId
    // 2. Validar evento y firma
    // 3. Descargar documento firmado
    // 4. Guardar en Azure Blob Storage
    // 5. Actualizar quotation.signedPdfUrl y status
    // 6. Emitir evento "quotation.signed"
    // 7. Notificar al vendedor
  }

  /**
   * Procesar pago de cotización
   */
  async processPayment(
    quotationId: string,
    paymentParams: PaymentParams,
  ): Promise<PaymentResult> {
    // 1. Validar que cotización esté firmada
    // 2. Resolver PaymentProvider para la BU
    // 3. Crear intención de pago
    // 4. Retornar URL de pago o confirmación
  }

  /**
   * Transformar cotización en contrato (después del pago)
   */
  async createContractFromQuotation(
    quotationId: string,
  ): Promise<RentalContract> {
    // 1. Validar que pago esté confirmado
    // 2. Generar código de contrato (CON-2026-001)
    // 3. Usar plantilla de contrato
    // 4. Generar PDF de contrato
    // 5. Crear registro RentalContract
    // 6. Actualizar estado workflow
    // 7. Notificar partes involucradas
  }
}
```

---

## 🗄️ MODELO DE DATOS (PRISMA)

```prisma
// ============================================
// PLANTILLAS (SHARED)
// ============================================

model Template {
  id             String   @id @default(uuid())
  tenantId       String
  businessUnitId String
  name           String
  type           String   // "quotation", "contract", "invoice"
  content        String   @db.Text // HTML con variables
  styles         String?  @db.Text // CSS personalizado
  variables      Json     // Array de TemplateVariable
  logoUrl        String?
  headerHtml     String?  @db.Text
  footerHtml     String?  @db.Text
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  tenant       Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  businessUnit BusinessUnit @relation(fields: [businessUnitId], references: [id], onDelete: Cascade)

  quotations Quotation[]
  contracts  RentalContract[]

  @@index([tenantId, businessUnitId, type])
  @@index([businessUnitId, isActive])
}

// ============================================
// COTIZACIONES (MÓDULO RENTAL)
// ============================================

model Quotation {
  id                   String    @id @default(uuid())
  tenantId             String
  businessUnitId       String
  code                 String    // QU-2026-001
  clientId             String
  assignedUserId       String?   // Vendedor/gestor
  status               String    // Workflow dinámico

  // Montos
  subtotal             Decimal   @db.Decimal(12, 2)
  taxRate              Decimal   @db.Decimal(5, 2) @default(0)
  taxAmount            Decimal   @db.Decimal(12, 2)
  totalAmount          Decimal   @db.Decimal(12, 2)
  currency             String    @default("USD")

  // Validez
  quotationDate        DateTime  @default(now())
  validUntil           DateTime

  // Documentos
  templateId           String?
  pdfUrl               String?   // PDF generado
  signedPdfUrl         String?   // PDF firmado

  // Firma digital
  signatureRequestId   String?   // ID en SignNow/DocuSign
  signatureStatus      String?   // "pending", "signed", etc.
  signatureProvider    String?   // "signow", "docusign"
  signedAt             DateTime?
  signedBy             String?

  // Pago
  paymentStatus        String    @default("pending")
  paymentIntentId      String?
  paidAt               DateTime?

  // Metadata
  notes                String?   @db.Text
  termsAndConditions   String?   @db.Text
  metadata             Json?

  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  createdBy            String

  // Relaciones
  tenant         Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  businessUnit   BusinessUnit    @relation(fields: [businessUnitId], references: [id], onDelete: Cascade)
  client         Client          @relation(fields: [clientId], references: [id])
  assignedUser   User?           @relation("AssignedQuotations", fields: [assignedUserId], references: [id])
  template       Template?       @relation(fields: [templateId], references: [id])
  creator        User            @relation("CreatedQuotations", fields: [createdBy], references: [id])

  items          QuotationItem[]
  contract       RentalContract?
  auditLogs      AuditLog[]

  @@unique([tenantId, code])
  @@index([tenantId, businessUnitId, status])
  @@index([clientId])
  @@index([signatureRequestId])
  @@index([createdAt])
}

model QuotationItem {
  id                String   @id @default(uuid())
  quotationId       String
  assetId           String?  // Para alquiler de maquinaria
  productId         String?  // Para otros rubros
  description       String
  quantity          Int
  unitPrice         Decimal  @db.Decimal(10, 2)
  total             Decimal  @db.Decimal(10, 2)

  // Específico de rental
  rentalDays        Int?
  rentalStartDate   DateTime?
  rentalEndDate     DateTime?

  metadata          Json?
  sortOrder         Int      @default(0)

  quotation Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  asset     Asset?    @relation(fields: [assetId], references: [id])

  @@index([quotationId])
}

// ============================================
// CONTRATOS (MÓDULO RENTAL)
// ============================================

model RentalContract {
  id                String   @id @default(uuid())
  tenantId          String
  businessUnitId    String
  quotationId       String   @unique
  code              String   // CON-2026-001
  status            String   // "active", "completed", "cancelled", "suspended"

  // Período
  startDate         DateTime
  endDate           DateTime

  // Documentos
  templateId        String?
  pdfUrl            String
  signedPdfUrl      String

  // Renovación
  autoRenew         Boolean  @default(false)
  renewalNotified   Boolean  @default(false)

  // Montos (copiados de quotation)
  totalAmount       Decimal  @db.Decimal(12, 2)
  currency          String   @default("USD")

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  tenant       Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  businessUnit BusinessUnit    @relation(fields: [businessUnitId], references: [id], onDelete: Cascade)
  quotation    Quotation       @relation(fields: [quotationId], references: [id])
  template     Template?       @relation(fields: [templateId], references: [id])

  @@unique([tenantId, code])
  @@index([tenantId, businessUnitId, status])
  @@index([startDate, endDate])
}

// ============================================
// CONFIGURACIÓN DE FIRMA DIGITAL (BU)
// ============================================

enum IntegrationType {
  // ... existing types
  DIGITAL_SIGNATURE
}

// Usar tabla existente BusinessUnitIntegration
// provider: "signow" | "docusign" | "hellosign"
// credentials: { apiKey, environment, etc. }
```

---

## 🔌 IMPLEMENTACIÓN DE ADAPTERS

### SignNow Adapter

```typescript
// integrations/adapters/digital-signature/signow.adapter.ts

import {
  DigitalSignatureProvider,
  SignatureRequestParams,
  SignatureRequest,
  SignatureStatus,
  SignatureWebhookEvent,
} from "@core/contracts/digital-signature.provider";

interface SignNowConfig {
  apiKey: string;
  clientId?: string;
  environment: "sandbox" | "production";
}

export class SignNowAdapter implements DigitalSignatureProvider {
  readonly name = "signow";
  private apiKey: string;
  private baseUrl: string;

  constructor(config: SignNowConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl =
      config.environment === "sandbox"
        ? "https://api-eval.signnow.com"
        : "https://api.signnow.com";
  }

  async createSignatureRequest(
    params: SignatureRequestParams,
  ): Promise<SignatureRequest> {
    try {
      // 1. Subir documento a SignNow
      const uploadResponse = await this.uploadDocument(
        params.documentUrl,
        params.documentName,
      );

      // 2. Crear invitación de firma
      const inviteResponse = await this.createInvite(
        uploadResponse.documentId,
        params,
      );

      return {
        id: inviteResponse.id,
        status: "pending",
        signUrl: inviteResponse.link,
        expiresAt: new Date(
          Date.now() + (params.expiresInDays || 30) * 24 * 60 * 60 * 1000,
        ),
        createdAt: new Date(),
      };
    } catch (error) {
      throw new Error(`SignNow error: ${error.message}`);
    }
  }

  async getSignatureStatus(requestId: string): Promise<SignatureStatus> {
    // Implementar llamada a API de SignNow
    // GET /document/{documentId}/status
  }

  async downloadSignedDocument(requestId: string): Promise<Buffer> {
    // Implementar descarga de documento firmado
    // GET /document/{documentId}/download
  }

  async cancelSignatureRequest(requestId: string): Promise<void> {
    // Implementar cancelación
    // DELETE /invite/{inviteId}
  }

  async parseWebhook(
    rawPayload: any,
    signature?: string,
  ): Promise<SignatureWebhookEvent | null> {
    // 1. Verificar firma del webhook
    // 2. Parsear evento
    // 3. Normalizar a SignatureWebhookEvent

    return {
      requestId: rawPayload.document_id,
      status: this.mapSignNowStatus(rawPayload.status),
      signedAt: rawPayload.signed_at
        ? new Date(rawPayload.signed_at)
        : undefined,
      signedBy: rawPayload.signer_email,
      documentUrl: rawPayload.download_url,
    };
  }

  private mapSignNowStatus(status: string): SignatureStatus {
    const statusMap: Record<string, SignatureStatus> = {
      pending: "pending",
      waiting: "pending",
      completed: "signed",
      declined: "declined",
      expired: "expired",
      cancelled: "cancelled",
    };
    return statusMap[status] || "pending";
  }

  private async uploadDocument(
    documentUrl: string,
    documentName: string,
  ): Promise<{ documentId: string }> {
    // Implementar upload a SignNow
  }

  private async createInvite(
    documentId: string,
    params: SignatureRequestParams,
  ): Promise<{ id: string; link: string }> {
    // Implementar creación de invitación
  }
}
```

### DocuSign Adapter (Opcional)

```typescript
// integrations/adapters/digital-signature/docusign.adapter.ts

export class DocuSignAdapter implements DigitalSignatureProvider {
  readonly name = "docusign";
  // Implementación similar con API de DocuSign
}
```

### Resolver

```typescript
// integrations/adapters/digital-signature/digital-signature.resolver.ts

export class DigitalSignatureResolver {
  private providers: Map<string, DigitalSignatureProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    if (process.env.SIGNOW_API_KEY) {
      this.providers.set(
        "signow",
        new SignNowAdapter({
          apiKey: process.env.SIGNOW_API_KEY,
          environment:
            (process.env.SIGNOW_ENVIRONMENT as "sandbox" | "production") ||
            "sandbox",
        }),
      );
    }

    if (process.env.DOCUSIGN_API_KEY) {
      this.providers.set(
        "docusign",
        new DocuSignAdapter({
          /* config */
        }),
      );
    }
  }

  async resolveProvider(
    businessUnitId: string,
  ): Promise<DigitalSignatureProvider> {
    const integration = await prisma.businessUnitIntegration.findFirst({
      where: {
        businessUnitId,
        type: "DIGITAL_SIGNATURE",
        isActive: true,
      },
    });

    if (!integration) {
      throw new Error(
        `No digital signature provider configured for BU ${businessUnitId}`,
      );
    }

    const provider = this.providers.get(integration.provider);
    if (!provider) {
      throw new Error(
        `Digital signature provider ${integration.provider} not available`,
      );
    }

    return provider;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

export const digitalSignatureResolver = new DigitalSignatureResolver();
```

---

## 🔄 FLUJO COMPLETO - EJEMPLOS DE API

### 1. Crear Cotización

```http
POST /api/v1/rental/quotations
Authorization: Bearer <token>
Content-Type: application/json

{
  "businessUnitId": "bu-123",
  "clientId": "client-456",
  "assignedUserId": "user-789",
  "validUntil": "2026-03-15T23:59:59Z",
  "items": [
    {
      "assetId": "asset-001",
      "description": "Retroexcavadora CAT 420F",
      "quantity": 1,
      "rentalDays": 30,
      "unitPrice": 5000.00,
      "rentalStartDate": "2026-02-15",
      "rentalEndDate": "2026-03-17"
    },
    {
      "assetId": "asset-002",
      "description": "Operario certificado",
      "quantity": 1,
      "rentalDays": 30,
      "unitPrice": 3000.00
    }
  ],
  "taxRate": 19,
  "currency": "USD",
  "notes": "Incluye transporte y mantenimiento",
  "termsAndConditions": "Pago 50% anticipo, 50% al finalizar..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "quot-uuid",
    "code": "QU-2026-001",
    "tenantId": "tenant-123",
    "businessUnitId": "bu-123",
    "clientId": "client-456",
    "status": "draft",
    "subtotal": 8000.0,
    "taxAmount": 1520.0,
    "totalAmount": 9520.0,
    "currency": "USD",
    "quotationDate": "2026-02-10T10:00:00Z",
    "validUntil": "2026-03-15T23:59:59Z",
    "createdAt": "2026-02-10T10:00:00Z"
  }
}
```

---

### 2. Generar PDF

```http
POST /api/v1/rental/quotations/quot-uuid/generate-pdf
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "pdfUrl": "https://divancostorage.blob.core.windows.net/tenant-123/quotations/QU-2026-001.pdf",
    "expiresAt": "2026-02-11T10:00:00Z"
  }
}
```

---

### 3. Enviar por Email y WhatsApp

```http
POST /api/v1/rental/quotations/quot-uuid/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "channels": ["email", "whatsapp"],
  "message": "Estimado cliente, adjunto encontrará la cotización solicitada."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "email": {
      "sent": true,
      "messageId": "msg-123"
    },
    "whatsapp": {
      "sent": true,
      "messageId": "wamid.456"
    }
  }
}
```

---

### 4. Solicitar Firma Digital

```http
POST /api/v1/rental/quotations/quot-uuid/request-signature
Authorization: Bearer <token>
Content-Type: application/json

{
  "signers": [
    {
      "name": "Juan Pérez",
      "email": "juan@cliente.com",
      "role": "Cliente",
      "order": 1
    }
  ],
  "message": "Por favor firme esta cotización para proceder con el alquiler.",
  "expiresInDays": 15
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "signatureRequestId": "signow-doc-789",
    "status": "pending",
    "signUrl": "https://app.signnow.com/sign/xyz123",
    "expiresAt": "2026-02-25T10:00:00Z"
  }
}
```

---

### 5. Webhook de Firma Completada

```http
POST /webhooks/digital-signature/signow
Content-Type: application/json
X-SignNow-Signature: <signature>

{
  "event": "document.signed",
  "document_id": "signow-doc-789",
  "status": "completed",
  "signed_at": "2026-02-12T15:30:00Z",
  "signer_email": "juan@cliente.com",
  "download_url": "https://signow.com/download/xyz"
}
```

**Sistema procesa:**

1. Valida webhook signature
2. Descarga documento firmado
3. Sube a Azure Blob Storage
4. Actualiza quotation:
   - `signatureStatus = "signed"`
   - `signedAt = 2026-02-12T15:30:00Z`
   - `signedPdfUrl = <azure_url>`
   - `status = "signed"` (workflow)
5. Emite evento interno `quotation.signed`
6. Notifica al vendedor por email

---

### 6. Procesar Pago

```http
POST /api/v1/rental/quotations/quot-uuid/process-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentProvider": "mercadopago",
  "returnUrl": "https://app.divancosaas.com/quotations/quot-uuid/success",
  "metadata": {
    "orderId": "ORD-123"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "paymentIntentId": "mp-intent-456",
    "paymentUrl": "https://www.mercadopago.com/checkout/v1/redirect?pref_id=xyz",
    "status": "pending",
    "expiresAt": "2026-02-13T10:00:00Z"
  }
}
```

---

### 7. Webhook de Pago Confirmado

Cuando MercadoPago confirma el pago, el sistema automáticamente:

1. Actualiza `quotation.paymentStatus = "paid"`
2. Ejecuta `createContractFromQuotation()`
3. Genera contrato con código `CON-2026-001`
4. Genera PDF de contrato usando otra plantilla
5. Envía contrato al cliente por email
6. Notifica al vendedor

---

### 8. Consultar Contrato Generado

```http
GET /api/v1/rental/contracts?quotationId=quot-uuid
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "contract-uuid",
    "code": "CON-2026-001",
    "quotationId": "quot-uuid",
    "status": "active",
    "startDate": "2026-02-15T00:00:00Z",
    "endDate": "2026-03-17T23:59:59Z",
    "pdfUrl": "https://divancostorage.blob.core.windows.net/tenant-123/contracts/CON-2026-001.pdf",
    "signedPdfUrl": "https://divancostorage.blob.core.windows.net/tenant-123/contracts/CON-2026-001-signed.pdf",
    "totalAmount": 9520.0,
    "currency": "USD",
    "autoRenew": false,
    "createdAt": "2026-02-12T16:00:00Z"
  }
}
```

---

## 🎨 SISTEMA DE PLANTILLAS - USO

### Crear Plantilla Personalizada

```http
POST /api/v1/templates
Authorization: Bearer <token>
Content-Type: application/json

{
  "businessUnitId": "bu-123",
  "name": "Cotización de Alquiler v2",
  "type": "quotation",
  "content": "<html>...</html>",
  "styles": "body { font-family: 'Roboto'; }",
  "logoUrl": "https://miempresa.com/logo.png",
  "variables": [
    {
      "name": "clientName",
      "label": "Nombre del Cliente",
      "type": "text",
      "required": true
    },
    {
      "name": "totalAmount",
      "label": "Monto Total",
      "type": "currency",
      "required": true
    }
  ]
}
```

---

## 🔐 SEGURIDAD Y VALIDACIONES

### Validaciones en cada paso:

1. **Crear Cotización:**
   - Usuario tiene permiso `quotations.create` en la BU
   - Cliente pertenece al mismo tenant
   - Assets existen y están disponibles

2. **Solicitar Firma:**
   - Cotización tiene PDF generado
   - Usuario tiene permiso `quotations.request-signature`
   - BU tiene integración de firma digital activa

3. **Procesar Pago:**
   - Cotización está firmada (`signatureStatus = "signed"`)
   - Usuario tiene permiso `quotations.process-payment`
   - BU tiene integración de pagos activa

4. **Webhooks:**
   - Verificar firma de webhook (HMAC)
   - Validar que el webhook es para un tenant válido
   - Idempotencia (no procesar mismo evento dos veces)

---

## 📊 AUDITORÍA

Toda acción crítica se registra en `AuditLog`:

```typescript
{
  tenantId: "tenant-123",
  businessUnitId: "bu-123",
  userId: "user-789",
  entity: "quotation",
  entityId: "quot-uuid",
  action: "signature_requested",
  oldData: null,
  newData: {
    signatureRequestId: "signow-doc-789",
    signers: [...]
  },
  metadata: {
    channel: "web",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0..."
  },
  timestamp: "2026-02-10T10:30:00Z"
}
```

---

## 🚀 PASOS DE IMPLEMENTACIÓN

### Fase 1: Infraestructura (Contratos y Adapters)

1. ✅ Crear contrato `digital-signature.provider.ts`
2. ✅ Implementar `SignNowAdapter`
3. ✅ Crear `DigitalSignatureResolver`
4. ✅ Actualizar `IntegrationType` en Prisma
5. ✅ Crear sistema de plantillas en `shared/templates`

### Fase 2: Módulo Rental

1. ✅ Actualizar Prisma schema con modelos
2. ✅ Crear `QuotationService`
3. ✅ Crear `ContractService`
4. ✅ Implementar `QuotationController`
5. ✅ Configurar rutas `/api/v1/rental/*`

### Fase 3: Integraciones

1. ✅ Webhooks de firma digital
2. ✅ Integración con sistema de pagos existente
3. ✅ Integración con motor de intenciones (email/WhatsApp)
4. ✅ Generación de PDF con Puppeteer

### Fase 4: Frontend

1. Pantalla de creación de cotizaciones
2. Editor de plantillas (WYSIWYG)
3. Vista de cotizaciones con estados
4. Vista de contratos activos

---

## 📦 DEPENDENCIAS NECESARIAS

```json
{
  "dependencies": {
    "@azure/storage-blob": "^12.x",
    "puppeteer": "^21.x",
    "handlebars": "^4.7.x",
    "axios": "^1.6.x"
  },
  "devDependencies": {
    "@types/puppeteer": "^7.x"
  }
}
```

---

## 🎯 MÉTRICAS DE ÉXITO

- ✅ Tiempo promedio de generación de cotización < 5 segundos
- ✅ Tasa de firma digital > 80%
- ✅ Tiempo de conversión cotización → contrato < 1 día
- ✅ 0 datos cruzados entre tenants (auditoría continua)

---

## 📚 RECURSOS Y DOCUMENTACIÓN

- [SignNow API Documentation](https://docs.signnow.com/)
- [DocuSign API Documentation](https://developers.docusign.com/)
- [Puppeteer Documentation](https://pptr.dev/)
- [Handlebars Documentation](https://handlebarsjs.com/)
- [Azure Blob Storage SDK](https://learn.microsoft.com/en-us/azure/storage/blobs/)

---

**Última actualización:** Febrero 10, 2026  
**Estado:** ✅ Documentación completa - Listo para implementación  
**Responsable:** Equipo DivancoSaaS
