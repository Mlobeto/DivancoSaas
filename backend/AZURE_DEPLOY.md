# DivancoSaaS Backend - Deploy en Azure

## 🎯 Arquitectura Recomendada

```
┌─────────────────────────────────────────────────────────┐
│                    Azure Container Registry              │
│                 (divancosaas.azurecr.io)                │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Azure App Service (Linux)                   │
│           con Docker Container Support                   │
│         - Puppeteer/Chromium incluido                   │
│         - Auto-scaling                                   │
│         - Managed SSL                                    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│         Azure Database for PostgreSQL                    │
│              (Flexible Server)                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Opción 1: Azure App Service + Docker (Recomendada)

### Ventajas

✅ Chromium incluido en el contenedor  
✅ Fácil de escalar  
✅ Rollback simple  
✅ CI/CD con GitHub Actions  
✅ Managed certificate (SSL)

### Paso 1: Crear Azure Container Registry (ACR)

```bash
# Variables
RESOURCE_GROUP="rg-divancosaas-prod"
LOCATION="eastus"
ACR_NAME="divancosaas"

# Crear resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Crear container registry
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true
```

### Paso 2: Build y Push de la Imagen

```bash
# Login a ACR
az acr login --name $ACR_NAME

# Build de la imagen
docker build -t $ACR_NAME.azurecr.io/divancosaas-backend:latest \
  -f backend/Dockerfile backend/

# Tag con versión
docker tag $ACR_NAME.azurecr.io/divancosaas-backend:latest \
  $ACR_NAME.azurecr.io/divancosaas-backend:v1.0.0

# Push a ACR
docker push $ACR_NAME.azurecr.io/divancosaas-backend:latest
docker push $ACR_NAME.azurecr.io/divancosaas-backend:v1.0.0
```

### Paso 3: Crear Azure App Service

```bash
# Variables
APP_SERVICE_PLAN="asp-divancosaas-prod"
WEB_APP_NAME="divancosaas-backend"

# Crear App Service Plan (Linux)
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --is-linux \
  --sku B2

# Crear Web App con container
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $WEB_APP_NAME \
  --deployment-container-image-name $ACR_NAME.azurecr.io/divancosaas-backend:latest

# Configurar ACR credentials
az webapp config container set \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name $ACR_NAME.azurecr.io/divancosaas-backend:latest \
  --docker-registry-server-url https://$ACR_NAME.azurecr.io \
  --docker-registry-server-user $ACR_NAME \
  --docker-registry-server-password $(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)
```

### Paso 4: Configurar Variables de Entorno

```bash
# Database
az webapp config appsettings set \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    DATABASE_URL="postgresql://user:pass@pg-divanco-dev.postgres.database.azure.com:5432/divanco_prod?sslmode=require" \
    JWT_SECRET="tu-clave-secreta-jwt" \
    ENCRYPTION_MASTER_KEY="tu-clave-de-encriptacion-minimo-32-chars" \
    NODE_ENV="production" \
    PORT="3000" \
    AZURE_STORAGE_CONNECTION_STRING="..." \
    AZURE_STORAGE_CONTAINER_NAME="uploads" \
    AZURE_COMMUNICATION_CONNECTION_STRING="..." \
    SENDGRID_API_KEY="..." \
    SENDGRID_FROM_EMAIL="noreply@divancosaas.com" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true" \
    PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome-stable"
```

### Paso 5: Habilitar CI/CD con GitHub Actions

Crea `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches: [main, production]
    paths:
      - "backend/**"

env:
  AZURE_WEBAPP_NAME: divancosaas-backend
  ACR_NAME: divancosaas

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Login to ACR
        run: |
          az acr login --name ${{ env.ACR_NAME }}

      - name: Build and push Docker image
        run: |
          docker build -t ${{ env.ACR_NAME }}.azurecr.io/divancosaas-backend:${{ github.sha }} \
            -t ${{ env.ACR_NAME }}.azurecr.io/divancosaas-backend:latest \
            -f backend/Dockerfile backend/
          docker push ${{ env.ACR_NAME }}.azurecr.io/divancosaas-backend:${{ github.sha }}
          docker push ${{ env.ACR_NAME }}.azurecr.io/divancosaas-backend:latest

      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          images: ${{ env.ACR_NAME }}.azurecr.io/divancosaas-backend:${{ github.sha }}
```

---

## 📦 Opción 2: Azure Container Instances (ACI)

### Ventajas

✅ Más económico para cargas pequeñas  
✅ Pago por segundo  
✅ Fácil de configurar  
❌ Sin auto-scaling automático

```bash
CONTAINER_NAME="divancosaas-backend"

az container create \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --image $ACR_NAME.azurecr.io/divancosaas-backend:latest \
  --cpu 2 \
  --memory 4 \
  --registry-login-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_NAME \
  --registry-password $(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv) \
  --dns-name-label divancosaas-backend \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    PORT=3000 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  --secure-environment-variables \
    DATABASE_URL="..." \
    JWT_SECRET="..." \
    ENCRYPTION_MASTER_KEY="..."
```

---

## 📦 Opción 3: Azure Kubernetes Service (AKS)

### Ventajas

✅ Máximo control y escalabilidad  
✅ Multi-región fácil  
✅ Blue-Green deployments  
❌ Más complejo  
❌ Más costoso

Ver documentación separada: `docs/AZURE_AKS_SETUP.md` (si lo necesitas)

---

## 🚫 Opción NO Recomendada: Azure App Service sin Docker

Azure App Service **sin** contenedor (usando solo Node.js runtime) **NO incluye Chromium** por defecto.

Si aún así quieres usarlo, necesitarías:

```bash
# En tu package.json scripts
"postinstall": "node scripts/install-chrome.js"
```

```javascript
// scripts/install-chrome.js
const { execSync } = require("child_process");

if (process.env.WEBSITE_INSTANCE_ID) {
  // Azure App Service
  console.log("Installing Chromium dependencies...");
  execSync("apt-get update && apt-get install -y chromium-browser", {
    stdio: "inherit",
  });
}
```

⚠️ **Problema**: Requiere privilegios elevados que App Service no da. **No recomendado**.

---

## 🔐 Variables de Entorno Necesarias en Azure

### Obligatorias

```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
ENCRYPTION_MASTER_KEY="..."
NODE_ENV="production"
PORT="3000"

# Puppeteer (si usas Docker)
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome-stable"
```

### Integraciones (Opcionales)

```bash
# Azure Storage (PDFs, imágenes)
AZURE_STORAGE_CONNECTION_STRING="..."
AZURE_STORAGE_CONTAINER_NAME="uploads"

# Email
AZURE_COMMUNICATION_CONNECTION_STRING="..."
SENDGRID_API_KEY="..."
SENDGRID_FROM_EMAIL="noreply@divancosaas.com"

# Payments
STRIPE_SECRET_KEY="..."
MERCADOPAGO_ACCESS_TOKEN="..."
WOMPI_PRIVATE_KEY="..."

# WhatsApp
META_WHATSAPP_ACCESS_TOKEN="..."
META_WHATSAPP_PHONE_NUMBER_ID="..."
```

---

## 🎯 Comparación de Opciones

| Característica               | App Service + Docker | Container Instances | App Service (solo Node) |
| ---------------------------- | -------------------- | ------------------- | ----------------------- |
| **Chromium incluido**        | ✅ Sí                | ✅ Sí               | ❌ No (manual)          |
| **Auto-scaling**             | ✅ Sí                | ❌ Manual           | ✅ Sí                   |
| **Dificultad**               | 🟢 Media             | 🟢 Fácil            | 🔴 Difícil              |
| **Costo mensual (estimado)** | $70-150              | $30-80              | $70-150                 |
| **Managed SSL**              | ✅ Sí                | ❌ Necesita setup   | ✅ Sí                   |
| **CI/CD integrado**          | ✅ Fácil             | 🟡 Manual           | ✅ Fácil                |
| **Recomendado para**         | Producción           | Dev/Testing         | ❌ No usar              |

---

## 🧪 Testing Local con Docker

Antes de subir a Azure, prueba localmente:

```bash
# Build
docker build -t divancosaas-backend -f backend/Dockerfile backend/

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="test-secret" \
  -e ENCRYPTION_MASTER_KEY="test-key-min-32-characters-long" \
  -e NODE_ENV="development" \
  divancosaas-backend

# Test PDF generation
curl http://localhost:3000/api/v1/rental/quotations/test-id/generate-pdf
```

---

## 📊 Monitoreo en Azure

### Application Insights (Recomendado)

```bash
# Habilitar Application Insights
az monitor app-insights component create \
  --app divancosaas-backend \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web

# Obtener connection string
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app divancosaas-backend \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey -o tsv)

# Agregar a App Service
az webapp config appsettings set \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$INSTRUMENTATION_KEY"
```

En tu código (opcional), puedes integrar Application Insights:

```bash
npm install applicationinsights
```

```typescript
// src/index.ts
import * as appInsights from "applicationinsights";

if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  appInsights.setup().start();
}
```

---

## 🚀 Resumen de Comandos Rápidos

### Deploy completo desde cero:

```bash
#!/bin/bash
# deploy-azure.sh

RESOURCE_GROUP="rg-divancosaas-prod"
LOCATION="eastus"
ACR_NAME="divancosaas"
APP_SERVICE_PLAN="asp-divancosaas-prod"
WEB_APP_NAME="divancosaas-backend"

# 1. Crear recursos
az group create --name $RESOURCE_GROUP --location $LOCATION
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true

# 2. Build y push
az acr login --name $ACR_NAME
docker build -t $ACR_NAME.azurecr.io/divancosaas-backend:latest -f backend/Dockerfile backend/
docker push $ACR_NAME.azurecr.io/divancosaas-backend:latest

# 3. App Service
az appservice plan create --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP --is-linux --sku B2
az webapp create --resource-group $RESOURCE_GROUP --plan $APP_SERVICE_PLAN --name $WEB_APP_NAME \
  --deployment-container-image-name $ACR_NAME.azurecr.io/divancosaas-backend:latest

# 4. Configurar
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)
az webapp config container set --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name $ACR_NAME.azurecr.io/divancosaas-backend:latest \
  --docker-registry-server-url https://$ACR_NAME.azurecr.io \
  --docker-registry-server-user $ACR_NAME \
  --docker-registry-server-password $ACR_PASSWORD

# 5. Variables de entorno (agregar las tuyas)
az webapp config appsettings set --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP \
  --settings NODE_ENV="production" PORT="3000" \
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true" \
  PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome-stable"

echo "✅ Deploy completado!"
echo "URL: https://$WEB_APP_NAME.azurewebsites.net"
```

---

## 📝 Checklist de Deploy

- [ ] Dockerfile creado y testeado localmente
- [ ] .dockerignore configurado
- [ ] Azure Container Registry creado
- [ ] Imagen Docker buildeada y pusheada
- [ ] Azure App Service creado (Linux + Docker)
- [ ] Variables de entorno configuradas
- [ ] Base de datos PostgreSQL en Azure conectada
- [ ] Azure Storage configurado
- [ ] SSL/HTTPS habilitado (automático en App Service)
- [ ] Github Actions configurado (CI/CD)
- [ ] Application Insights habilitado
- [ ] Probar generación de PDF en producción
- [ ] Configurar custom domain (opcional)

---

**Fecha:** Febrero 11, 2026  
**Recomendación:** Azure App Service + Docker + ACR  
**Costo estimado:** $100-150/mes (App Service B2 + PostgreSQL + Storage)
