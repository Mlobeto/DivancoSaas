# Setup Azure Container Registry para DivancoSaaS

## 1. Crear Azure Container Registry

```bash
# Login a Azure
az login

# Variables
RESOURCE_GROUP="rg-divancosaas"
LOCATION="centralus"
ACR_NAME="divancosaas"

# Crear ACR (si no existe)
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --location $LOCATION \
  --admin-enabled true

# Obtener credenciales
az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP
```

Esto te dará:

- `username`: divancosaas
- `password`: [password generado]
- `password2`: [password alternativo]

## 2. Agregar Secrets a GitHub

Ve a tu repositorio en GitHub:

1. **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Agrega:
   - `ACR_USERNAME` = `divancosaas`
   - `ACR_PASSWORD` = [el password que obtuviste arriba]

## 3. Configurar Azure App Service para Docker

```bash
APP_NAME="divancosaas-backend"

# Configurar App Service para usar Docker
az webapp config container set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name $ACR_NAME.azurecr.io/divancosaas-backend:latest \
  --docker-registry-server-url https://$ACR_NAME.azurecr.io

# Configurar continuous deployment
az webapp deployment container config \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --enable-cd true
```

## 4. Verificar que funcione

Después de hacer push, el workflow:

1. ✅ Buildea la imagen Docker con Chromium incluido
2. ✅ Push a Azure Container Registry
3. ✅ Azure App Service descarga y ejecuta el contenedor
4. ✅ Puppeteer tendrá Chrome disponible en `/usr/bin/chromium`

## Troubleshooting

Si falla el deployment:

```bash
# Ver logs del App Service
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP

# Ver configuración actual
az webapp config show --name $APP_NAME --resource-group $RESOURCE_GROUP
```
