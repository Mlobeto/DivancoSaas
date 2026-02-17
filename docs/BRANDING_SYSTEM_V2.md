# Sistema de Branding Modularizado - Divanco SaaS

Sistema completo y modularizado de personalización de identidad visual para Business Units, con soporte para logos, colores, fuentes y configuración de documentos PDF.

## 📋 Tabla de Contenido

1. [Arquitectura Modular](#arquitectura-modular)
2. [Modelos de Datos](#modelos-de-datos)
3. [Componentes Frontend](#componentes-frontend)
4. [API y Servicios](#api-y-servicios)
5. [Procesamiento de Imágenes con Sharp](#procesamiento-de-imágenes-con-sharp)
6. [Estructura de Carpetas en Azure](#estructura-de-carpetas-en-azure)
7. [Roadmap y Expansiones Futuras](#roadmap-y-expansiones-futuras)

---

## Arquitectura Modular

El sistema de branding ha sido completamente **refactorizado** siguiendo principios SOLID y mejores prácticas de React:

### Estructura Frontend (/web/src/core)

```
core/
├── hooks/
│   └── useBranding.ts                # Hook personalizado con toda la lógica
├── components/
│   └── branding/
│       ├── BrandingPreview.tsx      # Vista previa en tiempo real
│       ├── BrandingForm.tsx         # Formulario principal
│       ├── CollapsibleSection.tsx   # Sección colapsable reutilizable
│       ├── LogoSection.tsx          # Upload y gestión de logo
│       ├── ColorSection.tsx         # Selección de colores
│       ├── FontSection.tsx          # Selección de fuente
│       ├── HeaderSection.tsx        # Config de encabezado (colapsable)
│       ├── FooterSection.tsx        # Config de pie de página (colapsable)
│       └── index.ts                 # Barrel export
├── pages/
│   └── settings/
│       └── BrandingPage.tsx         # Página principal (solo orquestación)
├── services/
│   └── branding.api.ts              # Cliente API
└── types/
    └── branding.types.ts            # Tipos TypeScript
```

### Estructura Backend (/backend/src/core)

```
core/
├── controllers/
│   └── branding.controller.ts       # Controlador con Sharp procesamiento
├── services/
│   └── branding.service.ts          # Lógica de negocio
├── routes/
│   └── branding.routes.ts           # Rutas con Multer middleware
└── types/
    └── branding.types.ts            # Tipos compartidos

shared/
└── storage/
    └── azure-blob-storage.service.ts  # Servicio de Azure Storage
```

---

## Modelos de Datos

### BusinessUnitBranding (Existente)

```prisma
model BusinessUnitBranding {
  id             String @id @default(uuid())
  businessUnitId String @unique

  // Logo y Colores
  logoUrl        String?
  primaryColor   String  @default("#1E40AF")
  secondaryColor String  @default("#64748B")
  fontFamily     String  @default("Inter")

  // Configuración de Header (JSON)
  headerConfig   Json @default("{...}")

  // Configuración de Footer (JSON)
  footerConfig   Json @default("{...}")

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  businessUnit   BusinessUnit @relation(fields: [businessUnitId], references: [id], onDelete: Cascade)
}
```

### DocumentTemplate (Nueva - Fase 2)

Plantillas personalizadas para documentos PDF:

```prisma
model DocumentTemplate {
  id             String  @id @default(uuid())
  businessUnitId String
  tenantId       String

  name           String              // "Cotización Premium"
  description    String?
  documentType   String              // quotation | contract | receipt
  isActive       Boolean @default(true)
  isDefault      Boolean @default(false)

  layoutConfig   Json                // { format, orientation, margins }
  sections       Json                // Array de secciones
  htmlContent    String? @db.Text    // HTML con variables Handlebars
  customStyles   String? @db.Text    // CSS personalizado

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  businessUnit   BusinessUnit @relation(...)
  tenant         Tenant @relation(...)

  @@unique([businessUnitId, documentType, isDefault])
}
```

### EmailTemplate (Nueva - Fase 2)

Plantillas para emails automáticos:

```prisma
model EmailTemplate {
  id             String  @id @default(uuid())
  businessUnitId String
  tenantId       String

  name           String              // "Bienvenida Cliente"
  description    String?
  emailType      String              // welcome | quotation_sent | payment_reminder
  isActive       Boolean @default(true)
  isDefault      Boolean @default(false)

  subject        String              // "Cotización {{code}} - {{clientName}}"
  fromName       String?
  replyToEmail   String?

  htmlContent    String @db.Text     // HTML con variables
  textContent    String? @db.Text    // Texto plano (fallback)
  preheader      String?             // Preview text

  useBranding    Boolean @default(true)
  customColors   Json?               // Override de colores
  defaultAttachments Json

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  businessUnit   BusinessUnit @relation(...)
  tenant         Tenant @relation(...)

  @@unique([businessUnitId, emailType, isDefault])
}
```

**Status:** ✅ Modelos creados, pendiente migración de BD.

---

## Componentes Frontend

### 1. useBranding Hook

Hook personalizado que encapsula **toda la lógica** de branding:

```typescript
const {
  formData, // Datos del formulario
  loading, // Cargando datos
  saving, // Guardando cambios
  generating, // Generando PDF
  error, // Mensaje de error
  success, // Mensaje de éxito
  isDirty, // ¿Hay cambios sin guardar?

  setFormData, // Actualizar formulario
  updateHeaderConfig, // Actualizar header
  updateFooterConfig, // Actualizar footer

  save, // Guardar cambios
  uploadLogo, // Subir logo
  generatePreview, // Generar PDF de prueba
} = useBranding(businessUnitId);
```

**Características:**

- ✅ Auto-limpieza de mensajes de éxito con `useEffect` (no `setTimeout`)
- ✅ Detección de cambios sin guardar (`isDirty = JSON.stringify(...)`)
- ✅ Validación de archivos (tipo, tamaño)
- ✅ Manejo centralizado de errores
- ✅ Validación mejorada de `parseInt` con `isNaN` check

### 2. BrandingPreview

Componente de vista previa en tiempo real:

**Props:**

```typescript
interface BrandingPreviewProps {
  formData: UpdateBrandingDTO;
  businessUnitName: string;
  generating: boolean;
  isDirty: boolean;
  onGeneratePreview: (docType, format) => Promise<void>;
}
```

**Características:**

- ✅ Simulación de documento A4 o Ticket
- ✅ Selector de tipo de documento
- ✅ Advertencia visual de cambios sin guardar
- ✅ Botón "Generar PDF" bloqueado si `isDirty = true`
- ✅ Tooltip explicativo cuando está bloqueado

### 3. BrandingForm

Formulario modular con secciones colapsables:

```typescript
<BrandingForm
  formData={formData}
  saving={saving}
  isDirty={isDirty}
  onSave={save}
  onFormChange={handleFormChange}
  onHeaderChange={updateHeaderConfig}
  onFooterChange={updateFooterConfig}
  onLogoUpload={uploadLogo}
/>
```

#### Secciones:

**LogoSection** (Siempre abierto)

- Upload de archivo con validación
- Preview del logo actual
- Botón "Eliminar Logo"
- Formatos: JPG, PNG, SVG, WebP < 2MB

**ColorSection** (Siempre abierto)

- Color picker para primario y secundario
- Input manual de código hexadecimal
- Validación de formato `#RRGGBB`

**FontSection** (Siempre abierto)

- Selector de fuentes pre-configuradas
- Preview en tiempo real en vista previa

**HeaderSection** (Colapsable, cerrado por defecto)

- Checkboxes: mostrar logo, nombre, info tributaria
- Alineación del logo (izquierda, centro, derecha)
- Altura personalizable (40-200px)
- Validación numérica mejorada

**FooterSection** (Colapsable, cerrado por defecto)

- Checkboxes: mostrar contacto, disclaimer
- Textarea para disclaimer personalizado
- Altura personalizable (40-200px)
- Validación numérica mejorada

### 4. CollapsibleSection

Componente reutilizable para secciones colapsables:

```typescript
<CollapsibleSection
  title="Encabezado"
  icon={<LayoutIcon className="w-5 h-5 text-primary-400" />}
  defaultOpen={false}
>
  {children}
</CollapsibleSection>
```

**Características:**

- ✅ Estado interno con `useState`
- ✅ Animación de chevron (arriba/abajo)
- ✅ Prop `defaultOpen` configurable

---

## API y Servicios

### Endpoints Backend

```
GET    /api/v1/branding/:businessUnitId
PUT    /api/v1/branding/:businessUnitId
POST   /api/v1/branding/:businessUnitId/upload-logo  # Con Sharp
POST   /api/v1/branding/:businessUnitId/preview
```

### Cliente API (Frontend)

```typescript
import { brandingApi } from "@/core/services/branding.api";

// Obtener branding
const branding = await brandingApi.get(businessUnitId);

// Actualizar branding
const updated = await brandingApi.update(businessUnitId, {
  primaryColor: "#2563EB",
  fontFamily: "Roboto",
});

// Subir logo (con FormData)
const result = await brandingApi.uploadLogo(businessUnitId, file);
// { logoUrl, blobName, size, originalSize, optimized }

// Generar PDF de prueba
const blob = await brandingApi.preview(businessUnitId, {
  documentType: "quotation",
  format: "A4",
});
```

---

## Procesamiento de Imágenes con Sharp

El backend ahora procesa automáticamente los logos subidos:

### Pipeline de Procesamiento

```
Upload → Sharp → Resize → Optimize → Azure Blob
```

### Código (branding.controller.ts)

```typescript
// 1. Detectar si tiene transparencia
const isTransparent = mimetype === "image/png" || mimetype === "image/webp";

// 2. Procesar según tipo
if (isTransparent) {
  // PNG para transparencia
  processedBuffer = await sharp(buffer)
    .resize({ width: 600, fit: "inside", withoutEnlargement: true })
    .png({ quality: 90, compressionLevel: 9 })
    .toBuffer();
} else {
  // JPEG para fotos (mejor compresión)
  processedBuffer = await sharp(buffer)
    .resize({ width: 600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 90, progressive: true })
    .toBuffer();
}

// 3. SVG se sube sin procesar (es vector)
```

### Optimizaciones Aplicadas

- ✅ Resize a máximo 600px de ancho (mantiene aspect ratio)
- ✅ No agranda imágenes pequeñas (`withoutEnlargement: true`)
- ✅ PNG con compresión nivel 9
- ✅ JPEG progresivo para carga más rápida
- ✅ SVG se sube sin modificar (es vectorial)
- ✅ Logging de reducción de tamaño: `X bytes → Y bytes (Z% reduction)`

### Respuesta del Upload

```json
{
  "success": true,
  "data": {
    "logoUrl": "https://stdivancodev.blob.../logo-uuid.png",
    "blobName": "tenant-abc/business-unit-xyz/branding/logos/logo-uuid.png",
    "size": 45678, // Tamaño final
    "originalSize": 120000, // Tamaño original
    "optimized": true // false si es SVG
  }
}
```

---

## Estructura de Carpetas en Azure

### Folder Structure

```
stdivancodev/
└── templates/
    └── {tenantId}/
        └── {businessUnitId}/
            └── branding/
                └── logos/
                    ├── logo-abc123.png   (optimizado con Sharp)
                    ├── logo-def456.svg   (sin procesar)
                    └── logo-ghi789.jpg   (optimizado con Sharp)
```

### Ejemplo

```
tenant-abc123/
  business-unit-xyz789/
    branding/
      logos/
        logo-550e8400-e29b-41d4-a716-446655440000.png
```

**Aislamiento Multi-Tenant:**

- ✅ Cada tenant tiene su propia carpeta
- ✅ Cada business unit tiene subcarpeta propia
- ✅ Archivos en contenedor "templates"
- ✅ Seguridad por folder path

---

## Roadmap y Expansiones Futuras

### Fase 1: Branding Básico ✅ COMPLETADO

- [x] Modelo BusinessUnitBranding
- [x] CRUD de branding
- [x] Upload de logos a Azure Blob Storage
- [x] Procesamiento de imágenes con Sharp
- [x] Vista previa de documentos
- [x] Frontend modularizado
- [x] Secciones colapsables
- [x] Detección de cambios sin guardar
- [x] Validación mejorada (parseInt, file types)

### Fase 2: Plantillas de Documentos (Próximo)

**Objetivo:** Sistema de plantillas personalizables para PDF

**Estructura propuesta en UI:**

```
/settings/branding
   ├─ General         (Logo, colores, fuente - ACTUAL)
   ├─ PDF Layout      (Plantillas de documentos - NUEVO)
   ├─ Email Layout    (Plantillas de emails - NUEVO)
   └─ Templates       (Galería de plantillas - NUEVO)
```

**Modelo:** `DocumentTemplate`

- Sistema de secciones modulares
- HTML con variables Handlebars
- CSS personalizado
- Múltiples plantillas por tipo de documento
- Una plantilla por defecto por tipo

**Funcionalidades:**

- [ ] CRUD de plantillas
- [ ] Editor visual de secciones
- [ ] Variables dinámicas ({{clientName}}, {{total}}, etc.)
- [ ] Preview en tiempo real
- [ ] Galería de plantillas pre-diseñadas
- [ ] Clonar plantilla
- [ ] Compartir entre Business Units

### Fase 3: Plantillas de Emails

**Objetivo:** Emails automáticos con branding consistente

**Modelo:** `EmailTemplate`

- HTML responsive
- Variables Handlebars
- Preview en cliente de email
- Versión texto plano (fallback)

**Tipos de emails:**

- [ ] Welcome (bienvenida a cliente)
- [ ] Quotation sent (cotización enviada)
- [ ] Contract signed (contrato firmado)
- [ ] Payment reminder (recordatorio de pago)
- [ ] Invoice (factura)
- [ ] Custom (personalizados)

**Funcionalidades:**

- [ ] Editor WYSIWYG para emails
- [ ] Test send (envío de prueba)
- [ ] A/B testing
- [ ] Analytics (open rate, click rate)
- [ ] Adjuntos automáticos (PDF de cotización, etc.)

### Fase 4: Mejoras Avanzadas

**Características:**

- [ ] Logo en modo claro/oscuro
- [ ] Galería de logos (historial)
- [ ] Cropper de imágenes en frontend
- [ ] Presets de colores (paletas predefinidas)
- [ ] Temas completos (dark mode, light mode)
- [ ] Export/import de configuración
- [ ] CDN para logos (caching)
- [ ] Watermark en PDFs

---

## Guía de Uso Rápido

### Para Desarrolladores

**1. Crear nuevo componente de branding:**

```typescript
import { useBranding } from "@/core/hooks/useBranding";

export function MyBrandingFeature() {
  const { formData, save, uploadLogo } = useBranding(businessUnitId);

  // Tu lógica aquí
}
```

**2. Agregar nueva sección colapsable:**

```typescript
import { CollapsibleSection } from '@/core/components/branding';

<CollapsibleSection title="Mi Sección" icon={<Icon />}>
  {/* Contenido */}
</CollapsibleSection>
```

**3. Procesar logo en backend:**

La lógica de Sharp está en `branding.controller.ts` línea ~270-330.

### Para Usuarios Finales

**1. Acceso:**

- Ir a `/settings/branding`
- O usar el menú "Configuración → Branding"
- O el widget "Branding Status" en el dashboard

**2. Configurar branding:**

- Upload de logo (se optimiza automáticamente)
- Seleccionar colores con color picker
- Elegir fuente
- Configurar header/footer (secciones colapsables)
- Ver preview en tiempo real

**3. Guardar:**

- Botón "Guardar Configuración" (solo habilitado si `isDirty`)
- Mensaje de éxito desaparece en 3 segundos
- Cambios aplicados inmediatamente a nuevos documentos

**4. Generar PDF de prueba:**

- Seleccionar tipo de documento
- Seleccionar formato (A4 / Ticket)
- Click "Generar PDF de Prueba"
- Se abre en nueva pestaña
- ⚠️ Requiere guardar cambios primero (`isDirty` debe ser `false`)

---

## Troubleshooting

### Logo no se ve en PDF

**Causa:** URL del logo no accesible desde Puppeteer

**Solución:**

- Verificar que Azure Blob Storage tiene CORS habilitado
- Verificar que el contenedor "templates" es privado pero accesible con token
- Ver logs de Puppeteer en backend

### Imagen demasiado grande

**Causa:** Sharp no está procesando la imagen

**Solución:**

- Verificar logs del backend: `[BrandingController] Image processed: ...`
- Si no aparece, revisar que Sharp está instalado: `npm list sharp`
- SVG no se procesa (es correcto)

### Cambios no se guardan

**Causa:** Error de validación o permisos

**Solución:**

- Abrir DevTools → Network → ver respuesta del endpoint
- Verificar que el usuario tiene permisos sobre el businessUnitId
- Verificar que los datos cumplen validación (colores, tipos, etc.)

### Secciones no se colapsan

**Causa:** Problema con estado de `CollapsibleSection`

**Solución:**

- Verificar que `defaultOpen` está seteado correctamente
- Comprobar que no hay CSS conflictivo
- Revisar errores en consola de React

---

## Referencias

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Azure Blob Storage SDK](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/storage/storage-blob)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [Handlebars Templates](https://handlebarsjs.com/)
- [BRANDING_SYSTEM.md](./BRANDING_SYSTEM.md) (doc original)
- [AZURE_BLOB_STORAGE_CONFIG.md](./AZURE_BLOB_STORAGE_CONFIG.md)

---

**Última actualización:** 2026-02-17  
**Versión del sistema:** 2.0 (Modularizado)  
**Status:** ✅ Producción (Fase 1 completa)
