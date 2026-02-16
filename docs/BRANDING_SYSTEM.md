# Business Unit Branding System

## Overview

Sistema de branding personalizado por **Business Unit** (no por tenant, no por documento). Cada unidad de negocio tiene su propia identidad visual que se aplica automáticamente a todos sus documentos.

## Architecture

### Database Model

```prisma
model BusinessUnitBranding {
  id             String @id @default(uuid())
  businessUnitId String @unique

  // Visual Identity
  logoUrl        String?
  primaryColor   String  @default("#1E40AF")
  secondaryColor String  @default("#64748B")
  fontFamily     String  @default("Inter")

  // Header Configuration (JSON)
  headerConfig Json @default("{\"showLogo\":true,\"logoAlign\":\"left\",\"showBusinessName\":true,\"showTaxInfo\":false,\"height\":80}")

  // Footer Configuration (JSON)
  footerConfig Json @default("{\"showContactInfo\":true,\"showDisclaimer\":false,\"height\":60}")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  businessUnit BusinessUnit @relation(fields: [businessUnitId], references: [id], onDelete: Cascade)
}
```

### Backend Services

#### 1. BrandingService (`src/core/services/branding.service.ts`)

- `get(businessUnitId)` - Get branding configuration
- `getOrCreateDefault(businessUnitId)` - Get or create with defaults
- `create(data)` - Create new branding
- `update(businessUnitId, data)` - Update branding
- `delete(businessUnitId)` - Delete branding

#### 2. DocumentBuilderService (`src/core/services/document-builder.service.ts`)

- `buildHeader(branding, businessUnit)` - Generate HTML header
- `buildFooter(branding, businessUnit)` - Generate HTML footer
- `buildDocument(branding, businessUnit, content, type)` - Complete HTML document
- `buildQuotationContent(data)` - Quotation-specific content
- `buildContractContent(data)` - Contract-specific content
- `buildReceiptContent(data)` - Receipt-specific content

#### 3. PDFGeneratorService (`src/core/services/pdf-generator.service.ts`)

- `generatePDF(html, options)` - Generate PDF from HTML
- `generateAndUpload(html, options)` - Generate and upload to Azure
- `generateTestPDF(html, format)` - Generate preview PDF
- Supports **A4** (documents) and **ticket** (receipts) formats

### API Endpoints

```typescript
// Get branding for business unit
GET /api/v1/branding/:businessUnitId

// Create branding
POST /api/v1/branding
Body: {
  businessUnitId: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  fontFamily?: string
  headerConfig?: Partial<HeaderConfig>
  footerConfig?: Partial<FooterConfig>
}

// Update branding
PUT /api/v1/branding/:businessUnitId
Body: { /* same as create */ }

// Delete branding
DELETE /api/v1/branding/:businessUnitId

// Generate preview PDF
POST /api/v1/branding/:businessUnitId/preview
Body: {
  documentType?: "quotation" | "contract" | "receipt" | "note" | "report"
  format?: "A4" | "ticket"
  sampleData?: any
}

// Get test HTML (for development)
POST /api/v1/branding/:businessUnitId/test-html
Body: {
  documentType?: string
  sampleData?: any
}
```

### Document Generation Flow

```
1. Get Branding
   ↓
   const branding = await brandingService.get(businessUnitId)

2. Build Components
   ↓
   const header = buildHeader(branding, businessUnit)
   const footer = buildFooter(branding, businessUnit)
   const content = buildQuotationContent(data) // or other type

3. Assemble Document
   ↓
   const html = buildDocument(branding, businessUnit, content, "quotation")

4. Generate PDF
   ↓
   const pdf = await pdfGeneratorService.generatePDF(html, { format: "A4" })

5. Upload (optional)
   ↓
   const url = await pdfGeneratorService.generateAndUpload(html, options)
```

## Frontend Implementation Plan

### 1. Types & API Client

Create `web/src/core/types/branding.types.ts`:

```typescript
export interface HeaderConfig {
  showLogo: boolean;
  logoAlign: "left" | "center" | "right";
  showBusinessName: boolean;
  showTaxInfo: boolean;
  height: number;
}

export interface FooterConfig {
  showContactInfo: boolean;
  showDisclaimer: boolean;
  disclaimerText?: string;
  height: number;
}

export interface Branding {
  id: string;
  businessUnitId: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerConfig: HeaderConfig;
  footerConfig: FooterConfig;
  createdAt: string;
  updatedAt: string;
}
```

Create API client `web/src/api/branding.api.ts`:

```typescript
import { api } from "./client";
import type { Branding } from "@/core/types/branding.types";

export const brandingApi = {
  get: (businessUnitId: string) =>
    api.get<Branding>(`/branding/${businessUnitId}`),

  create: (data: Partial<Branding>) => api.post<Branding>("/branding", data),

  update: (businessUnitId: string, data: Partial<Branding>) =>
    api.put<Branding>(`/branding/${businessUnitId}`, data),

  delete: (businessUnitId: string) => api.delete(`/branding/${businessUnitId}`),

  preview: (
    businessUnitId: string,
    options: {
      documentType?: string;
      format?: "A4" | "ticket";
      sampleData?: any;
    },
  ) =>
    api.post(`/branding/${businessUnitId}/preview`, options, {
      responseType: "blob",
    }),
};
```

### 2. Branding Configuration Page

Create `web/src/modules/settings/pages/BrandingPage.tsx`:

```typescript
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { brandingApi } from "@/api/branding.api";
import { useAuthStore } from "@/store/auth.store";

export function BrandingPage() {
  const { businessUnit } = useAuthStore();
  const [previewFormat, setPreviewFormat] = useState<"A4" | "ticket">("A4");

  // Get current branding
  const { data: branding, refetch } = useQuery({
    queryKey: ["branding", businessUnit?.id],
    queryFn: () => brandingApi.get(businessUnit!.id),
    enabled: !!businessUnit?.id,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      brandingApi.update(businessUnit!.id, data),
    onSuccess: () => {
      refetch();
      alert("Branding actualizado");
    },
  });

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: () =>
      brandingApi.preview(businessUnit!.id, {
        documentType: "quotation",
        format: previewFormat,
      }),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    },
  });

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Left: Preview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Vista Previa</h2>

        <div className="border-2 border-gray-300 rounded p-4 aspect-[1/1.414] overflow-auto">
          {/* A4 Preview Simulation */}
          <div className="bg-white" style={{
            fontFamily: branding?.fontFamily,
          }}>
            {/* Header Preview */}
            <div
              className="border-b-2 p-4"
              style={{
                borderColor: branding?.primaryColor,
                minHeight: `${branding?.headerConfig.height}px`,
              }}
            >
              {branding?.headerConfig.showLogo && branding?.logoUrl && (
                <img src={branding.logoUrl} alt="Logo" className="h-12 mb-2" />
              )}
              {branding?.headerConfig.showBusinessName && (
                <h1 style={{ color: branding?.primaryColor }}>
                  {businessUnit?.name}
                </h1>
              )}
            </div>

            {/* Content Preview */}
            <div className="p-8">
              <h2>Documento de Ejemplo</h2>
              <p>Contenido del documento...</p>
            </div>

            {/* Footer Preview */}
            <div
              className="border-t p-4 text-sm"
              style={{
                borderColor: branding?.secondaryColor,
                minHeight: `${branding?.footerConfig.height}px`,
              }}
            >
              {branding?.footerConfig.showContactInfo && (
                <p>Información de contacto</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <select
            value={previewFormat}
            onChange={(e) => setPreviewFormat(e.target.value as any)}
            className="border rounded px-3 py-2"
          >
            <option value="A4">A4 (Documento)</option>
            <option value="ticket">Ticket (Recibo)</option>
          </select>
          <button
            onClick={() => previewMutation.mutate()}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Generar PDF de Prueba
          </button>
        </div>
      </div>

      {/* Right: Configuration Panel */}
      <div className="space-y-6">
        {/* Logo Upload */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-3">Logo</h3>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              // Handle file upload to Azure
              // Then update logoUrl
            }}
            className="border rounded w-full p-2"
          />
        </div>

        {/* Colors */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-3">Colores</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Color Principal</label>
              <input
                type="color"
                value={branding?.primaryColor}
                onChange={(e) => {
                  // Update branding
                }}
                className="w-full h-10"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Color Secundario</label>
              <input
                type="color"
                value={branding?.secondaryColor}
                onChange={(e) => {
                  // Update branding
                }}
                className="w-full h-10"
              />
            </div>
          </div>
        </div>

        {/* Font Family */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-3">Fuente</h3>
          <select
            value={branding?.fontFamily}
            onChange={(e) => {
              // Update branding
            }}
            className="border rounded w-full p-2"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Arial">Arial</option>
          </select>
        </div>

        {/* Header Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-3">Encabezado</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={branding?.headerConfig.showLogo} />
              Mostrar logo
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={branding?.headerConfig.showBusinessName} />
              Mostrar nombre
            </label>
            <div>
              <label className="block text-sm mb-1">Altura (px)</label>
              <input
                type="number"
                value={branding?.headerConfig.height}
                className="border rounded w-full p-2"
              />
            </div>
          </div>
        </div>

        {/* Footer Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-3">Pie de Página</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={branding?.footerConfig.showContactInfo} />
              Mostrar contacto
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={branding?.footerConfig.showDisclaimer} />
              Mostrar disclaimer
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={() => updateMutation.mutate(branding)}
          className="w-full bg-green-600 text-white py-3 rounded font-semibold"
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}
```

### 3. Usage in Document Generation

When generating any document:

```typescript
// In quotation generation, contract generation, etc.
import { brandingApi } from "@/api/branding.api";

async function generateDocument(businessUnitId: string, data: any) {
  // Backend will automatically use branding
  const response = await api.post(`/quotations/${quotationId}/generate-pdf`);

  // OR explicitly pass branding if needed
  const branding = await brandingApi.get(businessUnitId);
  // Use branding data for UI preview
}
```

## Usage Examples

### Backend: Generate Branded Quotation PDF

```typescript
import { brandingService } from "@/core/services/branding.service";
import { pdfGeneratorService } from "@/core/services/pdf-generator.service";
import {
  buildDocument,
  buildQuotationContent,
} from "@/core/services/document-builder.service";

async function generateQuotationPDF(quotation: any) {
  // 1. Get branding
  const branding = await brandingService.getOrCreateDefault(
    quotation.businessUnitId,
  );

  // 2. Build branding config
  const brandingConfig = {
    logoUrl: branding.logoUrl || undefined,
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    fontFamily: branding.fontFamily,
    headerConfig: branding.headerConfig,
    footerConfig: branding.footerConfig,
  };

  // 3. Get business unit info
  const businessUnit = branding.businessUnit;
  const businessUnitInfo = {
    name: businessUnit.name,
    taxId: businessUnit.settings?.taxId,
    email: businessUnit.settings?.email,
    phone: businessUnit.settings?.phone,
    address: businessUnit.settings?.address,
  };

  // 4. Build content
  const content = buildQuotationContent(quotation);

  // 5. Build complete HTML
  const html = buildDocument(
    brandingConfig,
    businessUnitInfo,
    content,
    "quotation",
    `Cotización ${quotation.code}`,
  );

  // 6. Generate and upload PDF
  const pdfUrl = await pdfGeneratorService.generateAndUpload(html, {
    format: "A4",
    filename: `quotation-${quotation.code}.pdf`,
    containerName: "quotations",
  });

  return pdfUrl;
}
```

### Backend: Generate Receipt (Ticket Format)

```typescript
async function generateReceipt(receipt: any) {
  const branding = await brandingService.getOrCreateDefault(
    receipt.businessUnitId,
  );

  const brandingConfig = {
    /* ... */
  };
  const businessUnitInfo = {
    /* ... */
  };
  const content = buildReceiptContent(receipt);

  const html = buildDocument(
    brandingConfig,
    businessUnitInfo,
    content,
    "receipt",
    `Recibo ${receipt.number}`,
  );

  // Use ticket format for receipts
  const pdfUrl = await pdfGeneratorService.generateAndUpload(html, {
    format: "ticket", // 80mm width
    filename: `receipt-${receipt.number}.pdf`,
  });

  return pdfUrl;
}
```

## Migration Steps

1. **Run Prisma Migration**

   ```bash
   cd backend
   npx prisma migrate dev --name add_business_unit_branding
   ```

2. **Generate Prisma Client**

   ```bash
   npx prisma generate
   ```

3. **Test Backend Endpoints**

   ```bash
   # Get/create default branding
   curl http://localhost:3000/api/v1/branding/:businessUnitId

   # Generate preview
   curl -X POST http://localhost:3000/api/v1/branding/:businessUnitId/preview \
     -H "Content-Type: application/json" \
     -d '{"documentType": "quotation", "format": "A4"}'
   ```

4. **Implement Frontend**
   - Create branding configuration page
   - Add preview component
   - Integrate with file upload service
   - Add navigation menu item

5. **Integrate with Existing Documents**
   - Update quotation generation to use branding
   - Update contract generation to use branding
   - Update any other document generation

## Benefits

✅ **One branding per Business Unit** - Not per tenant, not per document
✅ **Automatic application** - All documents use the same branding
✅ **Modular HTML builder** - Easy to maintain and extend
✅ **Multiple formats** - A4 for documents, ticket for receipts
✅ **Live preview** - See changes before generating PDF
✅ **Type-safe** - Full TypeScript support
✅ **Reusable** - Same system for all document types

## Next Steps

1. Implement frontend branding configuration page
2. Add file upload integration for logos
3. Create more document type templates
4. Add branding validation rules
5. Consider adding themes/templates presets
6. Add branding export/import for multi-BU setups

## Notes

- Branding is **cached per Business Unit** (not regenerated on every request)
- PDF generation uses **Puppeteer** (requires Chrome/Chromium)
- Files are uploaded to **Azure Blob Storage** automatically
- All operations are **multi-tenant safe** (business unit scoped)
- Header and footer configs are stored as **JSON** for flexibility
