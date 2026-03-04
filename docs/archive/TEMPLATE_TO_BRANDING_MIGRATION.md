# Template to Branding Migration Guide

## ✅ Refactorización Completada

El sistema de Templates ha sido refactorizado para usar BusinessUnitBranding centralizado.

## 📋 Cambios Realizados

### 1. Modelo Prisma - Template

**ANTES:**

```prisma
model Template {
  logoUrl        String?
  headerHtml     String?  @db.Text
  footerHtml     String?  @db.Text
  content        String   @db.Text
  // ...
}
```

**DESPUÉS:**

```prisma
model Template {
  content        String   @db.Text // Solo el body del documento
  styles         String?  @db.Text // CSS adicional
  // logoUrl, headerHtml, footerHtml REMOVIDOS
  // Ahora se usan desde BusinessUnitBranding
}
```

### 2. TemplateService - Refactorizado

**Cambios principales:**

- **Tipos actualizados**: Removidos `logoUrl`, `headerHtml`, `footerHtml` de interfaces
- **Integración con BrandingService**: `renderAndGeneratePDF()` ahora usa branding automáticamente
- **uploadTemplateLogo()**: Marcado como @deprecated con error informativo

**Flujo nuevo de generación de PDFs:**

```typescript
async renderAndGeneratePDF(params) {
  // 1. Get template (solo content)
  const template = await this.getTemplate(params.templateId);

  // 2. Get branding from BusinessUnit
  const branding = await brandingService.getOrCreateDefault(
    template.businessUnitId
  );

  // 3. Render content with Handlebars
  const renderedContent = this.handlebars.compile(template.content)(data);

  // 4. Build complete document (branding + content)
  const html = buildDocument(
    branding,      // ← Header/Footer/Logo desde Branding
    businessUnit,
    renderedContent, // ← Body desde Template
    template.type
  );

  // 5. Generate PDF
  return pdfGeneratorService.generatePDF(html);
}
```

### 3. TemplateController

- **uploadLogo()**: Ahora retorna HTTP 410 (Gone) con mensaje informativo
- Redirige a usar BrandingService: `PUT /api/v1/branding/:businessUnitId`

### 4. Rutas

- Ruta deprecated marcada con comentario:
  ```typescript
  // @deprecated Upload logo for template - USE BRANDING API INSTEAD
  router.post("/templates/:id/logo", ...); // Retorna error 410
  ```

### 5. Script de Migración

Creado: `scripts/migrate-templates-to-branding.ts`

**Función:**

1. Lee templates existentes con branding data
2. Crea BusinessUnitBranding por cada BusinessUnit
3. Migra logoUrl de templates a branding

## 🚀 Pasos para Aplicar

### 1. Ejecutar Script de Migración de Datos

```bash
cd backend
npx tsx scripts/migrate-templates-to-branding.ts
```

Este script:

- ✅ Lee todos los templates
- ✅ Agrupa por BusinessUnit
- ✅ Crea BusinessUnitBranding con datos de templates
- ✅ Preserva logos existentes

### 2. Ejecutar Migración de Prisma

```bash
npx prisma migrate dev --name remove_template_branding_fields
```

Esta migración:

- ❌ Elimina columnas `logoUrl`, `headerHtml`, `footerHtml` de `templates` table
- ✅ Mantiene datos en `business_unit_branding` table

### 3. Regenerar Cliente Prisma

```bash
npx prisma generate
```

### 4. Reiniciar Backend

```bash
npm run dev
```

## 📊 Arquitectura Nueva

```
┌─────────────────────────────────────┐
│   BusinessUnitBranding               │
│   (1 por BusinessUnit)               │
│                                      │
│   - logoUrl                          │
│   - primaryColor, secondaryColor     │
│   - headerConfig (JSON)              │
│   - footerConfig (JSON)              │
└─────────────────────────────────────┘
              │
              │ usado por
              ▼
┌─────────────────────────────────────┐
│   Template                           │
│   (Muchos por BusinessUnit)          │
│                                      │
│   - content (solo body HTML)         │
│   - styles (CSS adicional)           │
│   - variables (para Handlebars)      │
└─────────────────────────────────────┘
              │
              │ renderizado con
              ▼
┌─────────────────────────────────────┐
│   PDF Generado                       │
│                                      │
│   Header (de Branding)               │
│   ├─ Logo                            │
│   └─ Business Name                   │
│                                      │
│   Body (de Template)                 │
│   └─ Contenido renderizado           │
│                                      │
│   Footer (de Branding)               │
│   ├─ Contacto                        │
│   └─ Disclaimer                      │
└─────────────────────────────────────┘
```

## ✅ Beneficios

1. **Un solo branding por BusinessUnit**
   - Cambiar logo → afecta todos los documentos
   - Cambiar colores → afecta todos los documentos
   - Consistencia total

2. **Templates más simples**
   - Solo contienen el contenido variable
   - No duplican header/footer
   - Más fáciles de crear y mantener

3. **Separación de responsabilidades**
   - Branding = Identidad visual
   - Template = Contenido y estructura
   - PDF Generator = Ensamblado final

4. **Menos almacenamiento**
   - No se duplica logoUrl en cada template
   - No se duplican headers/footers

## 🔄 Compatibilidad

### Endpoints que siguen funcionando:

✅ `GET /api/v1/rental/templates` - Lista templates
✅ `GET /api/v1/rental/templates/:id` - Obtiene template
✅ `POST /api/v1/rental/templates` - Crea template
✅ `PUT /api/v1/rental/templates/:id` - Actualiza template
✅ `DELETE /api/v1/rental/templates/:id` - Elimina template

### Endpoints deprecados:

❌ `POST /api/v1/rental/templates/:id/logo` → Retorna 410 Gone
**Reemplazar con:** `PUT /api/v1/branding/:businessUnitId`

## 📝 Actualizar Frontend (cuando esté listo)

### Cambios necesarios:

1. **Remover logo upload de Templates**
   - Eliminar componente de upload logo en template form
   - Redirigir a página de Branding

2. **Crear página de Branding**
   - Implementar según [BRANDING_SYSTEM.md](BRANDING_SYSTEM.md)
   - Permitir upload de logo por BusinessUnit
   - Preview en tiempo real

3. **Actualizar flujo de creación de templates**
   - Solo pedir `name`, `type`, `content`, `styles`
   - No pedir logo/header/footer

## 🧪 Testing

### Verificar que funcione:

```bash
# 1. Crear template (sin logo)
curl -X POST http://localhost:3000/api/v1/rental/templates \
  -H "Content-Type: application/json" \
  -d '{
    "businessUnitId": "...",
    "name": "Test Template",
    "type": "quotation",
    "content": "<h2>Test Content</h2>"
  }'

# 2. Generar PDF (usa branding automáticamente)
# El PDF tendrá header/footer con logo de BusinessUnitBranding

# 3. Intentar subir logo a template (debería retornar error)
curl -X POST http://localhost:3000/api/v1/rental/templates/xxx/logo \
  -F "logo=@logo.png"
# Respuesta: 410 Gone con mensaje de deprecación
```

## 📚 Referencias

- [BRANDING_SYSTEM.md](BRANDING_SYSTEM.md) - Documentación completa del sistema de branding
- [schema.prisma](../prisma/schema.prisma) - Modelos actualizados
- [template.service.ts](../src/shared/templates/template.service.ts) - Servicio refactorizado

## ⚠️ Notas Importantes

1. **Backup de datos**: El script de migración NO elimina datos, solo los copia a BusinessUnitBranding
2. **Reversión**: Si necesitas revertir, restaura backup antes de correr migración de Prisma
3. **Templates existentes**: Seguirán funcionando, solo perderán campos de branding (que ya están en BrandingService)
4. **Logos**: Se preservan en BusinessUnitBranding durante migración

## 🎯 Próximos Pasos

1. ✅ Ejecutar migración de datos
2. ✅ Ejecutar migración de Prisma
3. ⏳ Implementar frontend de branding (ver BRANDING_SYSTEM.md)
4. ⏳ Actualizar generación de cotizaciones para usar nuevo sistema
5. ⏳ Actualizar generación de contratos para usar nuevo sistema
6. ⏳ Testing completo end-to-end
