#!/bin/bash

# DivancoSaaS - Azure Deployment Script
# Uso: ./deploy-azure.sh [environment]
# Ejemplo: ./deploy-azure.sh production

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
ENVIRONMENT=${1:-production}
RESOURCE_GROUP="rg-divancosaas-${ENVIRONMENT}"
LOCATION="eastus"
ACR_NAME="divancosaas${ENVIRONMENT}"
APP_SERVICE_PLAN="asp-divancosaas-${ENVIRONMENT}"
WEB_APP_NAME="divancosaas-backend-${ENVIRONMENT}"
IMAGE_TAG=$(git rev-parse --short HEAD)

echo -e "${GREEN}🚀 DivancoSaaS - Azure Deployment${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Image tag: ${YELLOW}${IMAGE_TAG}${NC}"
echo ""

# 1. Verificar login de Azure
echo -e "${YELLOW}➤ Verificando Azure CLI...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${RED}❌ No estás logueado en Azure. Ejecuta: az login${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Azure CLI OK${NC}"

# 2. Crear Resource Group (si no existe)
echo -e "\n${YELLOW}➤ Creando Resource Group...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION --output none
echo -e "${GREEN}✓ Resource Group creado/verificado${NC}"

# 3. Crear Container Registry (si no existe)
echo -e "\n${YELLOW}➤ Creando Azure Container Registry...${NC}"
if ! az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    az acr create \
      --resource-group $RESOURCE_GROUP \
      --name $ACR_NAME \
      --sku Basic \
      --admin-enabled true \
      --output none
    echo -e "${GREEN}✓ ACR creado${NC}"
else
    echo -e "${GREEN}✓ ACR ya existe${NC}"
fi

# 4. Login a ACR
echo -e "\n${YELLOW}➤ Login a Container Registry...${NC}"
az acr login --name $ACR_NAME
echo -e "${GREEN}✓ Login exitoso${NC}"

# 5. Build Docker image
echo -e "\n${YELLOW}➤ Building Docker image...${NC}"
FULL_IMAGE_NAME="${ACR_NAME}.azurecr.io/divancosaas-backend"

docker build \
  -t ${FULL_IMAGE_NAME}:${IMAGE_TAG} \
  -t ${FULL_IMAGE_NAME}:latest \
  -f Dockerfile \
  .

echo -e "${GREEN}✓ Image buildeada${NC}"

# 6. Push a ACR
echo -e "\n${YELLOW}➤ Pushing a Azure Container Registry...${NC}"
docker push ${FULL_IMAGE_NAME}:${IMAGE_TAG}
docker push ${FULL_IMAGE_NAME}:latest
echo -e "${GREEN}✓ Push completado${NC}"

# 7. Crear App Service Plan (si no existe)
echo -e "\n${YELLOW}➤ Creando App Service Plan...${NC}"
if ! az appservice plan show --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP &> /dev/null; then
    az appservice plan create \
      --name $APP_SERVICE_PLAN \
      --resource-group $RESOURCE_GROUP \
      --is-linux \
      --sku B2 \
      --output none
    echo -e "${GREEN}✓ App Service Plan creado${NC}"
else
    echo -e "${GREEN}✓ App Service Plan ya existe${NC}"
fi

# 8. Crear Web App (si no existe)
echo -e "\n${YELLOW}➤ Creando/Actualizando Web App...${NC}"
if ! az webapp show --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    az webapp create \
      --resource-group $RESOURCE_GROUP \
      --plan $APP_SERVICE_PLAN \
      --name $WEB_APP_NAME \
      --deployment-container-image-name ${FULL_IMAGE_NAME}:latest \
      --output none
    echo -e "${GREEN}✓ Web App creada${NC}"
else
    echo -e "${GREEN}✓ Web App ya existe${NC}"
fi

# 9. Configurar ACR credentials
echo -e "\n${YELLOW}➤ Configurando credenciales de ACR...${NC}"
ACR_USERNAME=$ACR_NAME
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

az webapp config container set \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name ${FULL_IMAGE_NAME}:${IMAGE_TAG} \
  --docker-registry-server-url https://${ACR_NAME}.azurecr.io \
  --docker-registry-server-user $ACR_USERNAME \
  --docker-registry-server-password $ACR_PASSWORD \
  --output none

echo -e "${GREEN}✓ Credenciales configuradas${NC}"

# 10. Configurar variables de entorno básicas
echo -e "\n${YELLOW}➤ Configurando variables de entorno...${NC}"
az webapp config appsettings set \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV="${ENVIRONMENT}" \
    PORT="3000" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true" \
    PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome-stable" \
  --output none

echo -e "${GREEN}✓ Variables básicas configuradas${NC}"

# 11. Restart Web App
echo -e "\n${YELLOW}➤ Reiniciando Web App...${NC}"
az webapp restart --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP --output none
echo -e "${GREEN}✓ Web App reiniciada${NC}"

# 12. Obtener URL
WEB_APP_URL="https://${WEB_APP_NAME}.azurewebsites.net"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deploy completado exitosamente!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "📝 Información del deployment:"
echo -e "   Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "   Image: ${YELLOW}${FULL_IMAGE_NAME}:${IMAGE_TAG}${NC}"
echo -e "   URL: ${YELLOW}${WEB_APP_URL}${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo -e "   1. Configura las variables de entorno sensibles:"
echo -e "      ${YELLOW}az webapp config appsettings set --name ${WEB_APP_NAME} --resource-group ${RESOURCE_GROUP} --settings DATABASE_URL=\"...\" JWT_SECRET=\"...\"${NC}"
echo -e "   2. Verifica el health check:"
echo -e "      ${YELLOW}curl ${WEB_APP_URL}/health${NC}"
echo -e "   3. Revisa los logs:"
echo -e "      ${YELLOW}az webapp log tail --name ${WEB_APP_NAME} --resource-group ${RESOURCE_GROUP}${NC}"
echo ""
