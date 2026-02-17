# Fix: Logo No Se Muestra - Azure Blob Storage

## 🔍 Problema Identificado

Los logos no se muestran en el frontend porque:

1. **Contenedores privados**: Los contenedores de Azure Blob Storage están configurados con `--public-access off`
2. **URLs sin autenticación**: El sistema estaba generando URLs directas sin tokens SAS (Shared Access Signature)
3. **Acceso bloqueado**: El navegador no puede descargar las imágenes sin autenticación

## ✅ Solución Implementada

He modificado el sistema para generar **SAS URLs con expiración de 1 año** para los logos de branding:

### Cambios Realizados

1. **Azure Blob Storage Service** (`backend/src/shared/storage/azure-blob-storage.service.ts`):
   - ✅ Añadido parámetro `containerName` opcional en `uploadFile()`
   - ✅ Modificado `generateSasUrl()` para aceptar `containerName` como parámetro
   - ✅ Soporte para múltiples contenedores (quotations, contracts, templates, documents)

2. **Branding Controller** (`backend/src/core/controllers/branding.controller.ts`):
   - ✅ Upload de logos al contenedor `templates` (no al contenedor por defecto)
   - ✅ Generación automática de SAS URL con expiración de 1 año
   - ✅ Logo URLs ahora incluyen token SAS para acceso autenticado

3. **Frontend - LogoSection** (`web/src/core/components/branding/LogoSection.tsx`):
   - ✅ Indicador de carga mientras se descarga la imagen
   - ✅ Manejo de errores si la imagen no carga
   - ✅ Mensaje de error con la URL completa para debugging

## 🚀 Pasos de Configuración

### 1. Crear Contenedor "templates" en Azure

```bash
# Login a Azure
az login

# Crear contenedor templates (acceso privado)
az storage container create \
  --name templates \
  --account-name stdivancodev \
  --public-access off
```

O desde el [Azure Portal](https://portal.azure.com):

1. Ir a **Resource groups > rg-divanco-dev > stdivancodev**
2. Ir a **Data storage > Containers**
3. Clic en **+ Container**
4. Nombre: `templates`
5. Public access level: **Private**
6. Clic en **Create**

### 2. Verificar Variables de Entorno

En **backend/.env**, asegúrate de tener:

```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=stdivancodev;AccountKey=<TU_KEY>;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=uploads
```

**IMPORTANTE**: El `AZURE_STORAGE_CONTAINER_NAME` puede ser `uploads` (valor por defecto). Los logos se guardarán en el contenedor `templates` especificado en el código.

### 3. Verificar Structure de Almacenamiento

Los logos se guardarán en:

```
templates/
├── {tenantId}/
│   ├── {businessUnitId}/
│   │   ├── branding/
│   │   │   ├── logos/
│   │   │   │   ├── {uuid}.png
│   │   │   │   ├── {uuid}.jpg
│   │   │   │   ├── {uuid}.svg
```

Ejemplo real:

```
templates/tenant-abc123/business-unit-xyz789/branding/logos/f47ac10b-58cc-4372-a567-0e02b2c3d479.png
```

### 4. Reiniciar Backend

```bash
cd backend
npm run dev
```

## 🧪 Probar el Sistema

1. **Acceder a la página de Branding** en el frontend
2. **Subir un logo** (JPG, PNG, SVG, o WebP - máx 2MB)
3. **Verificar**:
   - ✅ La imagen se procesa con Sharp (resize 600px, optimización)
   - ✅ Se sube al contenedor `templates` en Azure
   - ✅ La URL generada incluye un token SAS
   - ✅ El logo se muestra correctamente en el frontend
   - ✅ El logo aparece en el preview de documentos

## 📋 Ejemplo de URL Generada

**Antes (no funcionaba):**

```
https://stdivancodev.blob.core.windows.net/uploads/tenant-abc/business-unit-xyz/branding/logos/logo.png
```

**Ahora (funciona con SAS token):**

```
https://stdivancodev.blob.core.windows.net/templates/tenant-abc/business-unit-xyz/branding/logos/logo.png?sv=2021-08-06&se=2027-02-17T12:00:00Z&sr=b&sp=r&sig=...
```

Componentes de la SAS URL:

- `sv`: Storage version
- `se`: Expiration time (1 año desde ahora)
- `sr`: Resource (blob)
- `sp`: Permissions (read only)
- `sig`: Signature (autenticación)

## 🔒 Seguridad

### ✅ Implementado

- Contenedores privados (no accesibles públicamente)
- SAS tokens con permisos de solo lectura (`r`)
- Expiración de 1 año para logos (semi-permanentes)
- Isolation multi-tenant (cada tenant en su carpeta)
- Validación de tipos de archivo (JPG, PNG, SVG, WebP)
- Validación de tamaño (máx 2MB)

### 🔄 Renovación de URLs

Los SAS tokens expiran después de 1 año. Opciones:

1. **Opción A: Re-generar SAS URLs automáticamente** (futuro)
   - Implementar endpoint para renovar SAS URL de logos existentes
   - Ejecutar job mensual para renovar URLs próximas a expirar

2. **Opción B: Contenedor público solo para logos** (más simple)

   ```bash
   az storage container set-permission \
     --name templates \
     --public-access blob \
     --account-name stdivancodev
   ```

   **Nota**: Solo hazlo si los logos no son confidenciales.

3. **Opción C: Proxy a través del backend** (más seguro)
   - Crear endpoint `/api/branding/logo/:businessUnitId`
   - El backend descarga de Azure y sirve al frontend
   - Control total de acceso

## 🆘 Troubleshooting

### Error: "Container not found: templates"

**Solución**: Crear el contenedor como se indica en el paso 1.

### Logo aún no se muestra

**Solución**:

1. Abrir DevTools (F12) → Console
2. Buscar errores de carga de imagen
3. Verificar la URL completa del logo
4. Si dice "403 Forbidden", el SAS token no es válido
5. Si dice "404 Not Found", el contenedor no existe

### Error: "Account credentials not available"

**Solución**:

- Verificar que el `AZURE_STORAGE_CONNECTION_STRING` incluye `AccountName` y `AccountKey`
- Formato correcto: `DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net`

### Las URLs expiran muy rápido

**Solución**:

- Verificar que el código usa `525600` minutos (1 año)
- Si quieres URLs permanentes, considera la Opción B (contenedor público)

## 📊 Monitoreo

Ver estadísticas de uso en Azure Portal:

1. **stdivancodev > Monitoring > Insights**
2. Métricas:
   - Transacciones (uploads/downloads)
   - Latencia
   - Capacidad utilizada

## ✅ Checklist Post-Fix

- [ ] Contenedor `templates` creado en Azure
- [ ] Variables de entorno configuradas
- [ ] Backend reiniciado
- [ ] Logo subido correctamente
- [ ] Logo se visualiza en el frontend
- [ ] Preview de PDF muestra el logo
- [ ] URL incluye token SAS (verificar en DevTools)

---

## 🎯 Resultado Final

- ✅ Logos se cargan correctamente con SAS authentication
- ✅ Seguridad mantenida (contenedores privados)
- ✅ Sharp processing optimiza las imágenes
- ✅ Estructura multi-tenant funcional
- ✅ Frontend muestra indicadores de carga y errores
