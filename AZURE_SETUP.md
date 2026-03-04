# 🔧 Azure Setup - DivancoSaaS

## 📋 Recursos Actuales

✅ **Resource Group**: `rg-divanco-dev`  
✅ **PostgreSQL Server**: `pg-divanco-dev.postgres.database.azure.com`  
✅ **Database**: `divanco_dev`  
✅ **Admin User**: `divanco_admin`  
✅ **Location**: Central US

---

## 🎯 Recursos Pendientes de Crear

### 1. Azure Communication Services (Email)

```bash
# Crear Communication Services
az communication create \
  --name comm-divanco-dev \
  --resource-group rg-divanco-dev \
  --location global \
  --data-location UnitedStates
```

**Después de crear:**

- Ve a Azure Portal → Communication Services → `comm-divanco-dev`
- Click en "Email" → "Try Email"
- Configura dominio (divanco.com o usar Azure free domain)
- Copia el **Connection String**

### 2. Azure Blob Storage (Archivos)

```bash
# Crear Storage Account
az storage account create \
  --name stdivancodev \
  --resource-group rg-divanco-dev \
  --location centralus \
  --sku Standard_LRS \
  --kind StorageV2

# Crear container para archivos
az storage container create \
  --name uploads \
  --account-name stdivancodev \
  --public-access off
```

**Después de crear:**

- Ve a Azure Portal → Storage Account → `stdivancodev`
- Click en "Access keys"
- Copia el **Connection String**

---

## 🔐 Variables de Entorno

### Backend (.env)

```env
# Azure PostgreSQL
DATABASE_URL="postgresql://divanco_admin:TU_PASSWORD@pg-divanco-dev.postgres.database.azure.com:5432/divanco_dev?sslmode=require"

# Azure Communication Services
AZURE_COMMUNICATION_CONNECTION_STRING="endpoint=https://comm-divanco-dev.communication.azure.com/;accesskey=xxx"

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=stdivancodev;AccountKey=xxx"
AZURE_STORAGE_CONTAINER_NAME="uploads"
```

---

## 🚀 Pasos de Configuración

### 1. Conectar Base de Datos

```bash
# 1. Actualizar DATABASE_URL en .env con tu password
# 2. Ejecutar migraciones
cd backend
npx prisma migrate deploy

# 3. Generar cliente de Prisma
npx prisma generate

# 4. (Opcional) Seed de datos iniciales
npm run prisma:seed
```

### 2. Configurar Communication Services

```bash
# En Azure Portal:
# 1. Communication Services → comm-divanco-dev
# 2. Email → Provision domain
# 3. Copy Connection String
# 4. Agregar a .env:
AZURE_COMMUNICATION_CONNECTION_STRING="..."
```

### 3. Configurar Blob Storage

```bash
# En Azure Portal:
# 1. Storage Account → stdivancodev
# 2. Access Keys → Show keys
# 3. Copy Connection String
# 4. Agregar a .env:
AZURE_STORAGE_CONNECTION_STRING="..."
```

### 4. Probar Integración Email

```bash
# POST /api/v1/business-units/{id}/integrations/email
{
  "provider": "azure-communication-services",
  "credentials": {
    "connectionString": "endpoint=https://comm-divanco-dev.communication.azure.com/;accesskey=xxx"
  },
  "config": {
    "defaultFrom": "noreply@divanco.com",
    "defaultFromName": "Grupo Divanco"
  }
}
```

---

## 🔧 GitHub Actions CI/CD

### Crear archivo: `.github/workflows/deploy-backend.yml`

```yaml
name: Build and deploy Node.js app to Azure Web App - divancosaas-backend

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  REGISTRY_NAME: divancosaas2026
  IMAGE_NAME: divancosaas-backend
  APP_NAME: divancosaas-backend

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Login to Azure
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZUREAPPSERVICE_CLIENTID_9F1F7C40B85347F8B59CFBE63C98C81C }}
          tenant-id: ${{ secrets.AZUREAPPSERVICE_TENANTID_EFEBEF97B0BB48BE80D258C4AF5D8ECF }}
          subscription-id: ${{ secrets.AZUREAPPSERVICE_SUBSCRIPTIONID_A5ADA5AEC81C4C9E986AD8A1111FBD2F }}

      - name: Login to Azure Container Registry
        uses: azure/docker-login@v1
        with:
          login-server: ${{ env.REGISTRY_NAME }}.azurecr.io
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}

      - name: Build and push Docker image
        working-directory: ./backend
        run: |
          docker build . -t ${{ env.REGISTRY_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ github.sha }}
          docker build . -t ${{ env.REGISTRY_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:latest
          docker push ${{ env.REGISTRY_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ github.sha }}
          docker push ${{ env.REGISTRY_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:latest

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ env.APP_NAME }}
          slot-name: "Production"
          images: ${{ env.REGISTRY_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ github.sha }}
```

---

## 📊 Comandos Útiles

```bash
# Verificar conexión a Azure PostgreSQL
psql "postgresql://divanco_admin:PASSWORD@pg-divanco-dev.postgres.database.azure.com:5432/divanco_dev?sslmode=require"

# Ver bases de datos
\l

# Conectar a divanco_dev
\c divanco_dev

# Ver tablas
\dt

# Ver estructura de una tabla
\d "User"

# Ejecutar migraciones
npx prisma migrate deploy

# Abrir Prisma Studio
npx prisma studio

# Crear migration nueva
npx prisma migrate dev --name descripcion_cambio
```

---

## 🔒 Firewall Rules de PostgreSQL

Si tienes problemas de conexión, agrega tu IP:

```bash
# Obtener tu IP pública
curl ifconfig.me

# Agregar regla de firewall en Azure
az postgres flexible-server firewall-rule create \
  --resource-group rg-divanco-dev \
  --name pg-divanco-dev \
  --rule-name AllowMyIP \
  --start-ip-address TU_IP \
  --end-ip-address TU_IP
```

O desde Azure Portal:

1. PostgreSQL Server → Networking
2. Add current client IP address
3. Save

---

## 📝 Checklist de Setup

- [ ] Actualizar DATABASE_URL en .env local
- [ ] Ejecutar migraciones: `npx prisma migrate deploy`
- [ ] Crear Azure Communication Services
- [ ] Crear Azure Blob Storage
- [ ] Copiar connection strings a .env
- [ ] Actualizar variables en Azure Web App / GitHub Secrets
- [ ] Probar conexión desde backend local
- [ ] Configurar GitHub Actions
- [ ] Probar deploy automático
- [ ] Configurar email integration via API
- [ ] Probar envío de emails

---

## 🆘 Troubleshooting

### Error: "SSL connection required"

✅ Asegúrate de incluir `?sslmode=require` en el DATABASE_URL

### Error: "Connection timeout"

✅ Verifica firewall rules en Azure PostgreSQL

### Error: "Authentication failed"

✅ Verifica usuario y contraseña en DATABASE_URL

### Error: "Database does not exist"

✅ Crea la base de datos: `CREATE DATABASE divanco_dev;`

---

**Última actualización**: 2026-02-06  
**Status**: PostgreSQL ✅ | Communication Services ⏳ | Blob Storage ⏳
