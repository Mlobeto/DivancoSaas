#!/bin/bash
# Script simplificado para crear infraestructura DivancoSaaS en cuenta del cliente

set -e

echo "🚀 Creando infraestructura DivancoSaaS..."
echo ""

# Configuración
SUBSCRIPTION_ID="37865fc0-8d5a-411e-aa94-e89551635d7a"
RESOURCE_GROUP="rg-divancosaas-prod"
LOCATION="centralus"

# Nombres de recursos
PG_SERVER="pg-divancosaas-prod"
PG_ADMIN="divanco_admin"
PG_DATABASE="divancosaas_prod"

STORAGE_ACCOUNT="stdivancosaasprod"
APP_PLAN="asp-divancosaas-prod"
WEB_APP="divancosaas-api-prod"
CONTAINER_REGISTRY="divancosaasprod"

echo "📌 Verificando suscripción..."
az account show --query "{Name:name, ID:id}" -o table

read -p "¿Continuar? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo ""
echo "1/6 - 📦 Creando Resource Group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --tags proyecto="DivancoSaaS" ambiente="produccion" \
  --output table

echo ""
echo "2/6 - 🗄️ Creando PostgreSQL Server (~5 min)..."
read -sp "Contraseña para PostgreSQL (min 8 caracteres): " PG_PASSWORD
echo ""

az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $PG_SERVER \
  --location $LOCATION \
  --admin-user $PG_ADMIN \
  --admin-password "$PG_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16 \
  --public-access 0.0.0.0-255.255.255.255 \
  --yes

echo ""
echo "📂 Creando base de datos..."
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $PG_SERVER \
  --database-name $PG_DATABASE

echo ""
echo "3/6 - 📦 Creando Storage Account..."
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

STORAGE_KEY=$(az storage account keys list \
  --resource-group $RESOURCE_GROUP \
  --account-name $STORAGE_ACCOUNT \
  --query "[0].value" -o tsv)

az storage container create \
  --name uploads \
  --account-name $STORAGE_ACCOUNT \
  --account-key "$STORAGE_KEY"

echo ""
echo "4/6 - 🐳 Creando Container Registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_REGISTRY \
  --sku Basic \
  --admin-enabled true

echo ""
echo "5/6 - 🌐 Creando App Service Plan..."
az appservice plan create \
  --name $APP_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --is-linux \
  --sku B1

echo ""
echo "6/6 - 🚀 Creando Web App..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_PLAN \
  --name $WEB_APP \
  --runtime "NODE:20-lts"

az webapp config set \
  --name $WEB_APP \
  --resource-group $RESOURCE_GROUP \
  --always-on true

echo ""
echo "✅ ¡Infraestructura creada!"
echo ""
echo "================================================"
echo "📋 INFORMACIÓN DE CONEXIÓN"
echo "================================================"
echo ""
echo "PostgreSQL:"
echo "  Host: $PG_SERVER.postgres.database.azure.com"
echo "  Database: $PG_DATABASE"
echo "  User: $PG_ADMIN"
echo "  Connection String:"
echo "  postgresql://$PG_ADMIN:PASSWORD@$PG_SERVER.postgres.database.azure.com:5432/$PG_DATABASE?sslmode=require"
echo ""
echo "Web App:"
echo "  URL: https://$WEB_APP.azurewebsites.net"
echo ""
echo "Storage:"
echo "  Account: $STORAGE_ACCOUNT"
echo ""
echo "Container Registry:"
echo "  Login Server: $CONTAINER_REGISTRY.azurecr.io"
echo ""
echo "================================================"

# Guardar info
cat > migration-info.txt <<EOF
# Infraestructura DivancoSaaS - $(date)

Resource Group: $RESOURCE_GROUP
Location: $LOCATION

PostgreSQL:
  Host: $PG_SERVER.postgres.database.azure.com
  Database: $PG_DATABASE
  User: $PG_ADMIN

Web App: https://$WEB_APP.azurewebsites.net
Storage: $STORAGE_ACCOUNT
Container Registry: $CONTAINER_REGISTRY.azurecr.io

DATABASE_URL=postgresql://$PG_ADMIN:PASSWORD@$PG_SERVER.postgres.database.azure.com:5432/$PG_DATABASE?sslmode=require
EOF

echo ""
echo "💾 Información guardada en: migration-info.txt"
