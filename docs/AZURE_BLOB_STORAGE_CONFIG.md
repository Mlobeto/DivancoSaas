# Configuración de Azure Blob Storage - Divanco SaaS

Esta guía te llevará paso a paso para configurar el Storage Account **stdivancodev** que ya tienes en tu grupo de recursos **rg-divanco-dev**.

## 📋 Recursos Actuales

- **Resource Group**: `rg-divanco-dev`
- **Storage Account**: `stdivancodev`
- **Location**: East US

---

## 1. Obtener Connection String

### Opción A: Desde Azure Portal

1. Ve al [Portal de Azure](https://portal.azure.com)
2. Navega a **Resource groups > rg-divanco-dev > stdivancodev**
3. En el menú izquierdo, selecciona **Access keys** (bajo Security + networking)
4. Copia el **Connection string** de key1 o key2

### Opción B: Usando Azure CLI

```bash
# Login a Azure
az login

# Obtener connection string
az storage account show-connection-string \
  --name stdivancodev \
  --resource-group rg-divanco-dev \
  --output table
```

---

## 2. Crear Contenedores (Containers)

Los contenedores son como carpetas principales donde se organizarán los archivos. Necesitamos crear los siguientes:

### Usando Azure Portal

1. En tu Storage Account **stdivancodev**
2. Ir a **Data storage > Containers**
3. Hacer clic en **+ Container**
4. Crear estos contenedores con **Private** access level:
   - `quotations` - Para PDFs de cotizaciones
   - `contracts` - Para contratos firmados
   - `templates` - Para plantillas y assets
   - `documents` - Para documentos generales

### Usando Azure CLI

```bash
# Usar el connection string obtenido anteriormente
export AZURE_STORAGE_CONNECTION_STRING="<tu-connection-string>"

# Crear contenedores
az storage container create --name quotations --public-access off
az storage container create --name contracts --public-access off
az storage container create --name templates --public-access off
az storage container create --name documents --public-access off
```

---

## 3. Configurar Variables de Entorno

### Archivo `.env` en Backend

Agrega estas variables a tu archivo `.env`:

```env
# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=stdivancodev;AccountKey=<TU_KEY>;EndpointSuffix=core.windows.net
AZURE_STORAGE_ACCOUNT_NAME=stdivancodev

# Contenedores específicos (opcional, usa valores por defecto si no se especifican)
AZURE_BLOB_CONTAINER_QUOTATIONS=quotations
AZURE_BLOB_CONTAINER_CONTRACTS=contracts
AZURE_BLOB_CONTAINER_TEMPLATES=templates
AZURE_BLOB_CONTAINER_DOCUMENTS=documents
```

**⚠️ IMPORTANTE**: Nunca subas el archivo `.env` a Git. Ya está en `.gitignore`.

---

## 4. Estructura de Archivos en Blob Storage

El servicio organiza automáticamente los archivos siguiendo esta estructura multi-tenant:

```
stdivancodev/
├── quotations/
│   ├── {tenantId}/
│   │   ├── {businessUnitId}/
│   │   │   ├── quotations/
│   │   │   │   ├── 123e4567-e89b.pdf    (cotización original)
│   │   │   └── signed/
│   │   │       ├── 123e4567-e89b.pdf    (cotización firmada)
├── contracts/
│   ├── {tenantId}/
│   │   ├── {businessUnitId}/
│   │   │   ├── CON-2024-001.pdf
├── templates/
│   ├── {tenantId}/
│   │   ├── {businessUnitId}/
│   │   │   ├── branding/
│   │   │   │   ├── logos/
│   │   │   │   │   ├── logo-123.png
│   │   │   │   │   ├── logo-456.svg
│   │   │   ├── headers/
│   │   │   └── footers/
├── documents/
│   ├── {tenantId}/
│   │   ├── {businessUnitId}/
│   │   │   ├── general/
```

**Estructura de carpetas para Branding:**
- Ruta: `{tenantId}/{businessUnitId}/branding/logos/`
- Ejemplo: `tenant-abc123/business-unit-xyz789/branding/logos/logo-uuid.png`

Esto asegura **completa separación de datos** entre tenants y unidades de negocio.

---

## 5. Configurar CORS (Opcional, para Acceso desde Frontend)

Si necesitas que el frontend acceda directamente a archivos:

### Usando Azure Portal

1. En **stdivancodev > Settings > Resource sharing (CORS)**
2. En la pestaña **Blob service**, agregar:
   - **Allowed origins**: `https://tudominio.com` o `*` para desarrollo
   - **Allowed methods**: GET, PUT, POST, DELETE, HEAD, OPTIONS
   - **Allowed headers**: `*`
   - **Exposed headers**: `*`
   - **Max age**: 3600

### Usando Azure CLI

```bash
az storage cors add \
  --services b \
  --methods GET PUT POST DELETE HEAD OPTIONS \
  --origins '*' \
  --allowed-headers '*' \
  --exposed-headers '*' \
  --max-age 3600 \
  --account-name stdivancodev
```

---

## 6. Política de Lifecycle (Opcional, para Gestión Automática)

Para eliminar archivos antiguos automáticamente:

```json
{
  "rules": [
    {
      "enabled": true,
      "name": "DeleteOldQuotations",
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "baseBlob": {
            "delete": {
              "daysAfterModificationGreaterThan": 365
            }
          }
        },
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["quotations/"]
        }
      }
    }
  ]
}
```

Aplicar desde:
1. **stdivancodev > Data management > Lifecycle management**
2. **Add a rule** y pegar la configuración

---

## 7. Verificar Configuración

### Test Rápido con Node.js

Crea un archivo `test-blob-storage.ts` temporal:

```typescript
import { azureBlobStorageService } from "./src/shared/storage/azure-blob-storage.service";

async function testUpload() {
  const testBuffer = Buffer.from("Test file content");
  
  const result = await azureBlobStorageService.uploadFile({
    file: testBuffer,
    fileName: "test.txt",
    contentType: "text/plain",
    folder: "quotations",
    tenantId: "test-tenant",
    businessUnitId: "test-bu",
  });
  
  console.log("Upload successful:", result);
  
  // Verificar que existe
  const exists = await azureBlobStorageService.fileExists(
    result.containerName,
    result.blobName
  );
  console.log("File exists:", exists);
}

testUpload().catch(console.error);
```

Ejecutar:
```bash
npx ts-node test-blob-storage.ts
```

---

## 8. Actualizar Swagger para Incluir Rental Module

Edita `backend/src/config/swagger.ts` y agrega el módulo rental:

```typescript
import rentalSwagger from "@modules/rental/rental.swagger";

export const swaggerSpec = {
  openapi: "3.0.0",
  // ... resto de configuración
  apis: [
    path.join(__dirname, "../modules/clients/clients.swagger.ts"),
    path.join(__dirname, "../modules/assets/assets.swagger.ts"),
    path.join(__dirname, "../modules/purchases/purchases.swagger.ts"),
    path.join(__dirname, "../modules/rental/rental.swagger.ts"), // ← AGREGAR ESTA LÍNEA
  ],
};
```

---

## 9. Monitoreo y Debugging

### Ver Logs de Storage

```bash
# Listar archivos recientes
az storage blob list \
  --container-name quotations \
  --account-name stdivancodev \
  --output table

# Ver métricas
az monitor metrics list \
  --resource /subscriptions/{subscription-id}/resourceGroups/rg-divanco-dev/providers/Microsoft.Storage/storageAccounts/stdivancodev \
  --metric "Transactions"
```

### Desde Azure Portal

1. **stdivancodev > Monitoring > Insights**
2. Ver gráficos de:
   - Transacciones
   - Latencia
   - Disponibilidad
   - Capacidad utilizada

---

## 10. Seguridad Best Practices

### ✅ Implementado

- Connection string en variables de entorno
- Contenedores con acceso privado
- Estructura de carpetas con tenant/BU isolation

### 🔒 Recomendaciones Adicionales

1. **Usar Managed Identity** (para producción):
   ```typescript
   // En lugar de connection string, usar DefaultAzureCredential
   import { DefaultAzureCredential } from "@azure/identity";
   const credential = new DefaultAzureCredential();
   const blobServiceClient = new BlobServiceClient(
     `https://stdivancodev.blob.core.windows.net`,
     credential
   );
   ```

2. **Rotar Access Keys** periódicamente desde Azure Portal

3. **Habilitar Soft Delete**:
   - **stdivancodev > Data protection > Enable soft delete for blobs**
   - Retention period: 7-30 días

4. **Habilitar Logging**:
   - **stdivancodev > Monitoring > Diagnostic settings**
   - Log: StorageRead, StorageWrite, StorageDelete

---

## 🚀 Checklist de Configuración

- [ ] Connection string obtenido y guardado en `.env`
- [ ] 4 contenedores creados (quotations, contracts, templates, documents)
- [ ] CORS configurado si es necesario
- [ ] Test de upload ejecutado exitosamente
- [ ] Swagger actualizado con módulo rental
- [ ] Soft delete habilitado
- [ ] Métricas de monitoreo revisadas

---

## 11. Uso del Sistema de Branding con Azure Blob Storage

### Upload de Logos

El sistema de branding ahora soporta upload automático de logos a Azure Blob Storage:

**Endpoint Backend:**
```
POST /api/v1/branding/:businessUnitId/upload-logo
Content-Type: multipart/form-data
Field: logo (archivo de imagen)
```

**Validaciones:**
- Tipos permitidos: JPG, PNG, SVG, WebP
- Tamaño máximo: 2MB
- Estructura de carpetas: `{tenantId}/{businessUnitId}/branding/logos/`

**Ejemplo de uso desde Frontend:**
```typescript
import { brandingApi } from "@/core/services/branding.api";

async function uploadLogo(file: File, businessUnitId: string) {
  const result = await brandingApi.uploadLogo(businessUnitId, file);
  console.log("Logo URL:", result.logoUrl);
  console.log("Size:", result.size);
}
```

**Estructura del resultado:**
```json
{
  "success": true,
  "data": {
    "logoUrl": "https://stdivancodev.blob.core.windows.net/templates/tenant-abc/business-unit-xyz/branding/logos/logo-uuid.png",
    "blobName": "tenant-abc/business-unit-xyz/branding/logos/logo-uuid.png",
    "size": 45678
  }
}
```

### Acceso a Logos en Documentos

Los logos se cargan automáticamente en los documentos PDF generados usando el servicio de branding:

```typescript
// El sistema automáticamente usa el logo del Business Unit
const branding = await brandingService.getOrCreateDefault(businessUnitId);
// branding.logoUrl contiene la URL del logo en Azure Blob Storage
```

---

## 📚 Referencias

- [Azure Blob Storage Docs](https://docs.microsoft.com/azure/storage/blobs/)
- [Azure Storage SDK for Node.js](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/storage/storage-blob)
- [Best Practices for Azure Storage](https://docs.microsoft.com/azure/storage/common/storage-performance-checklist)

---

## 🆘 Troubleshooting

### Error: "Connection string not found"
**Solución**: Verificar que `AZURE_STORAGE_CONNECTION_STRING` está en `.env` y que el backend lo está cargando correctamente.

### Error: "Container not found"
**Solución**: Crear el contenedor usando Azure CLI o Portal.

### Error: "Authorization failed"
**Solución**: Verificar que la access key en el connection string es correcta y no ha sido rotada.

### Uploads lentos
**Solución**: Considerar cambiar la región del storage account a una más cercana a tus usuarios principales.
