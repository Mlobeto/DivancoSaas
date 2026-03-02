# 📄 ARQUITECTURA DE PLANTILLAS DE CONTRATO
**Versión**: 2.0  
**Fecha**: 2026-03-02  
**Estado**: 🟢 Propuesta de Mejora

---

## 🎯 OBJETIVO

Mejorar las plantillas de contrato para que:
1. **Hereden automáticamente** los datos de la cotización aprobada (no duplicar variables)
2. **Contengan cláusulas dinámicas** específicas según los activos a entregar
3. **Incluyan sección de firma digital** obligatoria
4. **Incluyan sección de comprobante de pago** con opción "Pago en local"

---

## 📋 ESTRUCTURA DEL CONTRATO

### Secciones del Contrato

```
┌─────────────────────────────────────────┐
│ 1. ENCABEZADO Y DATOS GENERALES        │
│    - Logo de la empresa                 │
│    - Número de contrato: CON-2026-001   │
│    - Fecha de emisión                   │
│    - Partes contratantes                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 2. DATOS DE LA COTIZACIÓN APROBADA     │
│    ✅ HEREDADOS AUTOMÁTICAMENTE         │
│    - Código de cotización: QU-2026-XXX  │
│    - Fecha de aprobación                │
│    - Monto total aprobado               │
│    - Items cotizados (tabla)            │
│    - Período estimado                   │
│    - Términos y condiciones             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 3. CLÁUSULAS ESPECÍFICAS DEL CONTRATO  │
│    ⚡ DINÁMICAS POR ACTIVO              │
│    - Cláusula 1: Vigencia del contrato  │
│    - Cláusula 2: Activos entregados     │
│      • Lista de activos con detalles    │
│      • Cláusulas específicas por tipo   │
│    - Cláusula 3: Responsabilidades      │
│    - Cláusula 4: Seguros y garantías    │
│    - Cláusula 5: Penalizaciones         │
│    - Cláusula 6: Terminación anticipada │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 4. SECCIÓN DE PAGO                      │
│    💰 COMPROBANTE REQUERIDO             │
│    ┌─────────────────────────────────┐  │
│    │ ☐ Pago en línea (adjuntar comp) │  │
│    │ ☐ Pago en local (efectivo/POS)  │  │
│    │                                  │  │
│    │ [Upload comprobante]             │  │
│    │ ○ Arrastrar archivo aquí         │  │
│    │ ○ Soporta: PDF, JPG, PNG         │  │
│    └─────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 5. FIRMAS DIGITALES                     │
│    ✍️ OBLIGATORIAS                      │
│    ┌─────────────────────────────────┐  │
│    │ FIRMA DEL CLIENTE:              │  │
│    │ [Espacio de firma - SignNow]    │  │
│    │                                  │  │
│    │ FIRMA DEL REPRESENTANTE:        │  │
│    │ [Espacio de firma - SignNow]    │  │
│    └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🏗️ ARQUITECTURA DE DATOS

### 1. Modelo: DocumentTemplate (Actualizado)

```prisma
model DocumentTemplate {
  id             String   @id @default(uuid())
  tenantId       String
  businessUnitId String
  
  // Metadata
  name           String   // "Contrato Estándar de Alquiler"
  type           String   // "contract"
  version        String   @default("1.0")
  isActive       Boolean  @default(true)
  
  // Contenido modular
  content        Json     // Estructura secciones (ver abajo)
  styles         String?  @db.Text
  
  // Configuración
  requiresSignature     Boolean @default(true)
  requiresPaymentProof  Boolean @default(true)
  allowLocalPayment     Boolean @default(true)
  
  // Assets
  logoUrl        String?
  headerHtml     String?  @db.Text
  footerHtml     String?  @db.Text
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  tenant         Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  businessUnit   BusinessUnit @relation(fields: [businessUnitId], references: [id])
  
  @@index([tenantId, businessUnitId, type, isActive])
}
```

### 2. Estructura de `content` (JSON)

```typescript
interface ContractTemplateContent {
  version: string; // "2.0"
  sections: ContractSection[];
}

interface ContractSection {
  id: string;
  type: SectionType;
  order: number;
  title: string;
  isRequired: boolean;
  config: SectionConfig;
}

enum SectionType {
  HEADER = "header",
  QUOTATION_SUMMARY = "quotation_summary",  // ✅ Hereda de cotización
  CONTRACT_TERMS = "contract_terms",
  ASSET_CLAUSES = "asset_clauses",          // ⚡ Dinámico por activos
  PAYMENT_PROOF = "payment_proof",          // 💰 Upload + local option
  SIGNATURES = "signatures"                  // ✍️ Firma digital
}

// ========================
// SECCIÓN 1: HEADER
// ========================
interface HeaderSectionConfig {
  showLogo: boolean;
  showContractCode: boolean;
  showDate: boolean;
  showParties: boolean;
  customHtml?: string;
}

// ========================
// SECCIÓN 2: QUOTATION SUMMARY
// ========================
interface QuotationSummarySectionConfig {
  showApprovedQuotation: boolean;  // ✅ TRUE
  showQuotationCode: boolean;
  showApprovalDate: boolean;
  showItems: boolean;              // Tabla de items
  showTotals: boolean;
  showTermsAndConditions: boolean;
  
  // Variables disponibles automáticas:
  // {{quotation.code}}
  // {{quotation.approvalDate}}
  // {{quotation.subtotal}}
  // {{quotation.total}}
  // {{quotation.items}} - array para iterar
  // {{quotation.termsAndConditions}}
}

// ========================
// SECCIÓN 3: CONTRACT TERMS
// ========================
interface ContractTermsSectionConfig {
  clauses: ContractClause[];
}

interface ContractClause {
  id: string;
  number: string;        // "1", "2.1", etc.
  title: string;         // "VIGENCIA DEL CONTRATO"
  content: string;       // HTML con variables
  condition?: string;    // JS expression: "hasInsurance === true"
  isEditable: boolean;
}

// ========================
// SECCIÓN 4: ASSET CLAUSES (DINÁMICO)
// ========================
interface AssetClausesSectionConfig {
  title: string;         // "ACTIVOS ENTREGADOS Y CONDICIONES ESPECÍFICAS"
  showAssetList: boolean;
  
  clausesByAssetType: AssetTypeClause[];
  
  // Variables disponibles:
  // {{contract.assets}} - array de activos del contrato
  // {{asset.name}}, {{asset.code}}, {{asset.category}}
}

interface AssetTypeClause {
  assetType: string;     // "excavadora", "retroexcavadora", "camion_volteo"
  clauseTemplate: string; // HTML template con variables
  
  // Ejemplo:
  // "El activo {{asset.name}} ({{asset.code}}) debe ser operado únicamente 
  //  por personal calificado. Requiere mantenimiento cada {{asset.maintenanceInterval}} 
  //  horas. Cliente debe reportar cualquier falla inmediatamente."
}

// ========================
// SECCIÓN 5: PAYMENT PROOF
// ========================
interface PaymentProofSectionConfig {
  title: string;         // "COMPROBANTE DE PAGO"
  description: string;
  allowLocalPayment: boolean;  // ✅ TRUE - Checkbox "Pago en local"
  allowOnlineUpload: boolean;  // Upload file
  acceptedFormats: string[];   // ["pdf", "jpg", "png"]
  maxFileSizeMB: number;
  
  localPaymentNote?: string;   // "* Pagó en efectivo/POS en oficina"
}

// ========================
// SECCIÓN 6: SIGNATURES
// ========================
interface SignaturesSectionConfig {
  provider: "signow" | "docusign" | "manual";
  signatories: Signatory[];
  sendSequentially: boolean;   // Cliente primero → Representante después
}

interface Signatory {
  id: string;
  role: string;              // "client", "company_representative"
  label: string;             // "FIRMA DEL CLIENTE"
  required: boolean;
  emailField?: string;       // Variable del email: "{{client.email}}"
  order: number;
}
```

---

## 🔧 IMPLEMENTACIÓN

### 1. Servicio: Template Rendering

```typescript
// backend/src/modules/rental/services/contract-template.service.ts

export class ContractTemplateService {
  
  /**
   * Generar HTML del contrato desde template
   * HEREDA datos de la cotización automáticamente
   */
  async renderContractFromTemplate(params: {
    templateId: string;
    contractId: string;
    quotationId: string;  // ✅ Clave: trae data de cotización
  }): Promise<string> {
    
    // 1. Obtener template
    const template = await prisma.documentTemplate.findUnique({
      where: { id: params.templateId }
    });
    
    // 2. Obtener contrato
    const contract = await prisma.rentalContract.findUnique({
      where: { id: params.contractId },
      include: {
        client: true,
        businessUnit: true,
        tenant: true,
        activeRentals: {
          include: { asset: true }
        }
      }
    });
    
    // 3. ✅ Obtener cotización APROBADA (herencia automática)
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.quotationId },
      include: {
        items: {
          include: { asset: true }
        }
      }
    });
    
    // 4. Construir contexto de variables
    const context = {
      // Datos del contrato
      contract: {
        code: contract.code,
        startDate: contract.startDate,
        estimatedEndDate: contract.estimatedEndDate,
        status: contract.status,
        assets: contract.activeRentals.map(r => ({
          id: r.asset.id,
          name: r.asset.name,
          code: r.asset.internalCode,
          category: r.asset.category,
          // Metadata para cláusulas específicas
          maintenanceInterval: r.asset.metadata?.maintenanceInterval,
          requiresOperator: r.asset.metadata?.requiresOperator,
        }))
      },
      
      // ✅ DATOS HEREDADOS DE LA COTIZACIÓN
      quotation: {
        code: quotation.code,
        approvalDate: quotation.signedAt,
        subtotal: quotation.subtotal.toNumber(),
        taxAmount: quotation.taxAmount.toNumber(),
        total: quotation.totalAmount.toNumber(),
        currency: quotation.currency,
        items: quotation.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toNumber(),
          total: item.total.toNumber(),
          rentalDays: item.rentalDays,
        })),
        termsAndConditions: quotation.termsAndConditions,
      },
      
      // Cliente
      client: {
        name: contract.client.name,
        email: contract.client.email,
        phone: contract.client.phone,
        documentId: contract.client.documentId,
      },
      
      // Empresa
      tenant: {
        name: contract.tenant.name,
        legalName: contract.tenant.legalName,
        taxId: contract.tenant.taxId,
        address: contract.tenant.metadata?.address,
      },
      
      // Fechas
      today: new Date().toLocaleDateString('es-CO'),
      year: new Date().getFullYear(),
    };
    
    // 5. Renderizar cada sección
    const content = template.content as ContractTemplateContent;
    const renderedSections = [];
    
    for (const section of content.sections.sort((a, b) => a.order - b.order)) {
      const rendered = await this.renderSection(section, context);
      renderedSections.push(rendered);
    }
    
    // 6. Ensamblar HTML final
    const html = this.assembleHTML({
      header: template.headerHtml,
      footer: template.footerHtml,
      sections: renderedSections,
      styles: template.styles,
      logo: template.logoUrl,
    });
    
    return html;
  }
  
  /**
   * Renderizar una sección específica
   */
  private async renderSection(
    section: ContractSection, 
    context: any
  ): Promise<string> {
    
    switch (section.type) {
      
      case 'quotation_summary':
        return this.renderQuotationSummary(section, context);
      
      case 'asset_clauses':
        return this.renderAssetClauses(section, context);
      
      case 'payment_proof':
        return this.renderPaymentProof(section, context);
      
      case 'signatures':
        return this.renderSignatures(section, context);
      
      default:
        // Render genérico con Handlebars
        return Handlebars.compile(section.config.content)(context);
    }
  }
  
  /**
   * ✅ Renderizar sección de cotización (heredada)
   */
  private renderQuotationSummary(
    section: ContractSection, 
    context: any
  ): string {
    const config = section.config as QuotationSummarySectionConfig;
    
    return `
      <section class="quotation-summary">
        <h2>${section.title}</h2>
        
        ${config.showQuotationCode ? `
          <p><strong>Cotización Aprobada:</strong> ${context.quotation.code}</p>
          <p><strong>Fecha de Aprobación:</strong> ${context.quotation.approvalDate}</p>
        ` : ''}
        
        ${config.showItems ? `
          <h3>Items Cotizados</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Días</th>
                <th>Precio Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${context.quotation.items.map((item: any) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>${item.rentalDays || 'N/A'}</td>
                  <td>${this.formatCurrency(item.unitPrice, context.quotation.currency)}</td>
                  <td>${this.formatCurrency(item.total, context.quotation.currency)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
        
        ${config.showTotals ? `
          <div class="totals">
            <p><strong>Subtotal:</strong> ${this.formatCurrency(context.quotation.subtotal, context.quotation.currency)}</p>
            <p><strong>Impuestos:</strong> ${this.formatCurrency(context.quotation.taxAmount, context.quotation.currency)}</p>
            <p class="total"><strong>TOTAL:</strong> ${this.formatCurrency(context.quotation.total, context.quotation.currency)}</p>
          </div>
        ` : ''}
        
        ${config.showTermsAndConditions && context.quotation.termsAndConditions ? `
          <div class="terms">
            <h3>Términos y Condiciones de la Cotización</h3>
            <div>${context.quotation.termsAndConditions}</div>
          </div>
        ` : ''}
      </section>
    `;
  }
  
  /**
   * ⚡ Renderizar cláusulas dinámicas por activo
   */
  private renderAssetClauses(
    section: ContractSection, 
    context: any
  ): string {
    const config = section.config as AssetClausesSectionConfig;
    
    // Agrupar activos por tipo
    const assetsByType = context.contract.assets.reduce((acc: any, asset: any) => {
      if (!acc[asset.category]) acc[asset.category] = [];
      acc[asset.category].push(asset);
      return acc;
    }, {});
    
    let html = `<section class="asset-clauses"><h2>${config.title}</h2>`;
    
    if (config.showAssetList) {
      html += `
        <h3>Listado de Activos Entregados</h3>
        <ul class="asset-list">
          ${context.contract.assets.map((asset: any) => `
            <li>
              <strong>${asset.name}</strong> 
              (Código: ${asset.code}) 
              - ${asset.category}
            </li>
          `).join('')}
        </ul>
      `;
    }
    
    // Renderizar cláusulas específicas por tipo de activo
    for (const [assetType, assets] of Object.entries(assetsByType)) {
      const clauseConfig = config.clausesByAssetType.find(
        c => c.assetType === assetType
      );
      
      if (clauseConfig) {
        html += `<div class="asset-type-clauses">`;
        html += `<h3>Condiciones para ${assetType}:</h3>`;
        
        // Renderizar template de cláusula para cada activo
        for (const asset of (assets as any[])) {
          const rendered = Handlebars.compile(clauseConfig.clauseTemplate)({ asset });
          html += `<div class="clause">${rendered}</div>`;
        }
        
        html += `</div>`;
      }
    }
    
    html += `</section>`;
    return html;
  }
  
  /**
   * 💰 Renderizar sección de comprobante de pago
   */
  private renderPaymentProof(
    section: ContractSection, 
    context: any
  ): string {
    const config = section.config as PaymentProofSectionConfig;
    
    return `
      <section class="payment-proof">
        <h2>${config.title}</h2>
        <p>${config.description}</p>
        
        <div class="payment-options">
          ${config.allowOnlineUpload ? `
            <div class="option">
              <input type="radio" id="payment-online" name="payment-type" value="online">
              <label for="payment-online">
                <strong>Pago en línea</strong> - Adjuntar comprobante
              </label>
              <div class="upload-area" data-show-if="payment-online">
                <p>Formatos aceptados: ${config.acceptedFormats.join(', ')}</p>
                <p>Tamaño máximo: ${config.maxFileSizeMB} MB</p>
                <button type="button" class="upload-btn">Subir Comprobante</button>
                <input type="file" hidden accept="${config.acceptedFormats.map(f => '.' + f).join(',')}" />
              </div>
            </div>
          ` : ''}
          
          ${config.allowLocalPayment ? `
            <div class="option">
              <input type="radio" id="payment-local" name="payment-type" value="local">
              <label for="payment-local">
                <strong>Pago en local</strong> - Efectivo/POS en oficina
              </label>
              ${config.localPaymentNote ? `
                <p class="note">${config.localPaymentNote}</p>
              ` : ''}
            </div>
          ` : ''}
        </div>
        
        <div class="verification">
          <label>
            <input type="checkbox" required />
            Confirmo que he realizado el pago correspondiente
          </label>
        </div>
      </section>
    `;
  }
  
  /**
   * ✍️ Renderizar sección de firmas digitales
   */
  private renderSignatures(
    section: ContractSection, 
    context: any
  ): string {
    const config = section.config as SignaturesSectionConfig;
    
    let html = `<section class="signatures"><h2>FIRMAS</h2>`;
    
    for (const signatory of config.signatories.sort((a, b) => a.order - b.order)) {
      // Resolver email dinámicamente
      const email = signatory.emailField 
        ? this.resolveVariable(signatory.emailField, context)
        : null;
      
      html += `
        <div class="signature-block">
          <h3>${signatory.label}</h3>
          ${signatory.required ? '<span class="required">*</span>' : ''}
          
          ${config.provider === 'signow' ? `
            <div class="signature-area" data-signow-role="${signatory.role}" data-email="${email}">
              <p>Espacio para firma digital</p>
              <p class="text-sm text-gray-500">Se enviará solicitud de firma a: ${email}</p>
            </div>
          ` : `
            <div class="signature-area manual">
              <p>____________________________________________</p>
              <p class="signer-info">
                Nombre: _______________________________<br>
                Documento: ____________________________<br>
                Fecha: ________________________________
              </p>
            </div>
          `}
        </div>
      `;
    }
    
    html += `</section>`;
    return html;
  }
  
  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
  
  private resolveVariable(path: string, context: any): any {
    // Resolver "{{client.email}}" → context.client.email
    const keys = path.replace(/[{}]/g, '').split('.');
    return keys.reduce((obj, key) => obj?.[key], context);
  }
}
```

---

## 📱 FLUJO DE USUARIO

### 1. Creación del Contrato

```typescript
// 1. Usuario aprueba cotización
POST /api/v1/quotations/:id/approve

// 2. Sistema crea contrato automáticamente
const contract = await contractService.createFromQuotation({
  quotationId: approvedQuotation.id,
  startDate: new Date(),
});

// 3. Sistema genera PDF del contrato usando template
const contractPDF = await contractTemplateService.renderContractFromTemplate({
  templateId: businessUnit.defaultContractTemplateId,
  contractId: contract.id,
  quotationId: approvedQuotation.id,  // ✅ Hereda datos
});

// 4. Sistema envía para firma digital
const signatureRequest = await signatureService.sendForSignature({
  documentPdf: contractPDF,
  signatories: [
    { role: 'client', email: client.email },
    { role: 'company_rep', email: businessUnit.managerEmail }
  ]
});
```

### 2. Carga de Comprobante de Pago

```typescript
// Opción A: Upload de archivo
POST /api/v1/contracts/:id/payment-proof
Content-Type: multipart/form-data

{
  file: [archivo PDF/JPG],
  paymentType: "online",
  paymentDate: "2026-03-02",
  transactionRef: "TRX-12345"
}

// Opción B: Marcar pago en local
POST /api/v1/contracts/:id/payment-proof
Content-Type: application/json

{
  paymentType: "local",
  paymentDate: "2026-03-02",
  paidAt: "office",
  receivedBy: "userId",
  notes: "Pago en efectivo en oficina central"
}
```

---

## 🎨 EJEMPLO DE TEMPLATE COMPLETO (JSON)

```json
{
  "version": "2.0",
  "sections": [
    {
      "id": "header",
      "type": "header",
      "order": 1,
      "title": "Encabezado",
      "isRequired": true,
      "config": {
        "showLogo": true,
        "showContractCode": true,
        "showDate": true,
        "showParties": true
      }
    },
    {
      "id": "quotation_summary",
      "type": "quotation_summary",
      "order": 2,
      "title": "DATOS DE LA COTIZACIÓN APROBADA",
      "isRequired": true,
      "config": {
        "showApprovedQuotation": true,
        "showQuotationCode": true,
        "showApprovalDate": true,
        "showItems": true,
        "showTotals": true,
        "showTermsAndConditions": true
      }
    },
    {
      "id": "contract_terms",
      "type": "contract_terms",
      "order": 3,
      "title": "TÉRMINOS Y CONDICIONES DEL CONTRATO",
      "isRequired": true,
      "config": {
        "clauses": [
          {
            "id": "vigencia",
            "number": "1",
            "title": "VIGENCIA DEL CONTRATO",
            "content": "<p>El presente contrato tendrá vigencia desde el {{contract.startDate}} hasta el {{contract.estimatedEndDate}}, renovable automáticamente si no se notifica lo contrario con 15 días de anticipación.</p>",
            "isEditable": false
          },
          {
            "id": "responsabilidades",
            "number": "2",
            "title": "RESPONSABILIDADES DEL ARRENDATARIO",
            "content": "<p>El arrendatario se compromete a:<br>a) Mantener los activos en buen estado<br>b) Reportar cualquier daño o falla inmediatamente<br>c) No subarrendar los activos sin consentimiento escrito</p>",
            "isEditable": false
          }
        ]
      }
    },
    {
      "id": "asset_clauses",
      "type": "asset_clauses",
      "order": 4,
      "title": "ACTIVOS ENTREGADOS Y CONDICIONES ESPECÍFICAS",
      "isRequired": true,
      "config": {
        "showAssetList": true,
        "clausesByAssetType": [
          {
            "assetType": "excavadora",
            "clauseTemplate": "<div class='asset-clause'><h4>{{asset.name}}</h4><p>Este activo requiere:<ul><li>Operador certificado (Categoría A)</li><li>Mantenimiento cada {{asset.maintenanceInterval}} horas</li><li>Seguro todo riesgo</li><li>Inspección diaria pre-operacional</li></ul></p></div>"
          },
          {
            "assetType": "camion_volteo",
            "clauseTemplate": "<div class='asset-clause'><h4>{{asset.name}}</h4><p>Condiciones especiales:<ul><li>Licencia C2 requerida</li><li>Revisión técnico-mecánica vigente</li><li>SOAT al día</li><li>Límite de carga: 10 toneladas</li></ul></p></div>"
          }
        ]
      }
    },
    {
      "id": "payment_proof",
      "type": "payment_proof",
      "order": 5,
      "title": "COMPROBANTE DE PAGO",
      "isRequired": true,
      "config": {
        "description": "Para activar el contrato, debe cargar el comprobante de pago o indicar que realizó el pago en la oficina.",
        "allowLocalPayment": true,
        "allowOnlineUpload": true,
        "acceptedFormats": ["pdf", "jpg", "png"],
        "maxFileSizeMB": 5,
        "localPaymentNote": "* Si pagó en efectivo o con tarjeta en nuestra oficina, seleccione esta opción y nuestro personal verificará el pago."
      }
    },
    {
      "id": "signatures",
      "type": "signatures",
      "order": 6,
      "title": "FIRMAS",
      "isRequired": true,
      "config": {
        "provider": "signow",
        "sendSequentially": true,
        "signatories": [
          {
            "id": "client",
            "role": "client",
            "label": "FIRMA DEL CLIENTE",
            "required": true,
            "emailField": "{{client.email}}",
            "order": 1
          },
          {
            "id": "company_rep",
            "role": "company_representative",
            "label": "FIRMA DEL REPRESENTANTE LEGAL",
            "required": true,
            "emailField": "{{tenant.managerEmail}}",
            "order": 2
          }
        ]
      }
    }
  ]
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Backend

- [ ] Actualizar modelo `DocumentTemplate` con nuevos campos
- [ ] Crear `ContractTemplateService` con métodos de renderizado
- [ ] Implementar herencia automática de datos de cotización
- [ ] Crear sistema de cláusulas dinámicas por activo
- [ ] Implementar endpoints de upload de comprobante
- [ ] Agregar validación de "pago en local"

### Fase 2: Frontend

- [ ] Crear editor visual de plantillas de contrato
- [ ] Implementar preview en tiempo real con datos de ejemplo
- [ ] Crear componente `PaymentProofUpload`
- [ ] Integrar con SignNow para firmas
- [ ] Crear interfaz de gestión de templates

### Fase 3: Testing

- [ ] Probar herencia de cotización
- [ ] Validar cláusulas dinámicas con diferentes tipos de activos
- [ ] Probar flujo de firma digital completo
- [ ] Validar upload de comprobantes
- [ ] Verificar opción "pago en local"

---

## 🎯 RESULTADO ESPERADO

Con esta arquitectura:

✅ **No duplicas variables** - El contrato muestra automáticamente los datos de la cotización aprobada  
✅ **Cláusulas inteligentes** - Se adaptan según los activos específicos del contrato  
✅ **Firma obligatoria** - Integrado con SignNow, flujo secuencial  
✅ **Pago flexible** - Upload de comprobante O marcar "pagó en local"  
✅ **Escalable** - Fácil agregar nuevos tipos de secciones en el futuro

