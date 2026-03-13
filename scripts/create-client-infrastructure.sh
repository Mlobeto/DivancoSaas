#!/bin/bash
# Script para recrear infraestructura en cuenta del cliente

set -e

echo "🚀 Migrando DivancoSaaS a cuenta del cliente..."
echo ""

# ============================================
# CONFIGURACIÓN - AJUSTA ESTOS VALORES
# ============================================

# Suscripción del cliente
SUBSCRIPTION_ID="37865fc0-8d5a-411e-aa94-e89551635d7a"

# Nombres de recursos
RESOURCE_GROUP="rg-divancosaas-prod"
LOCATION="centralus"

# PostgreSQL
PG_SERVER_NAME="pg-divancosaas-prod"
PG_ADMIN_USER="divanco_admin"
PG_DATABASE="divancosaas_prod"
PG_VERSION="16"

# Storage
STORAGE_ACCOUNT="stdivancosaasprod"

# App Service
APP_SERVICE_PLAN="asp-divancosaas-prod"
WEB_APP_NAME="divancosaas-api-prod"

# ============================================
# INICIO DEL SCRIPT
# ============================================

echo "📌 Configurando suscripción del cliente..."
az account set --subscription $SUBSCRIPTION_ID

echo "✅ Suscripción configurada:"
az account show --query "{Name:name, ID:id}" -o table
echo ""

read -p "¿Continuar con la creación de recursos? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelado por el usuario"
    exit 1
fi

echo ""
echo "📦 1/6 - Creando Resource Group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --tags proyecto="DivancoSaaS" ambiente="produccion"

echo ""
echo "🗄️  2/6 - Creando PostgreSQL Server..."
echo "⚠️  Esto puede tomar 5-10 minutos..."

read -sp "Ingresa la contraseña para PostgreSQL (mínimo 8 caracteres): " PG_PASSWORD
echo ""

az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $PG_SERVER_NAME \
  --location $LOCATION \
  --admin-user $PG_ADMIN_USER \
  --admin-password "$PG_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version $PG_VERSION \
  --public-access 0.0.0.0 \
  --high-availability Disabled \
  --backup-retention 7

echo ""
echo "🔓 3/6 - Configurando firewall de PostgreSQL..."
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $PG_SERVER_NAME \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

echo ""
echo "💾 4/6 - Creando base de datos..."
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $PG_SERVER_NAME \
  --database-name $PG_DATABASE

echo ""
echo "📦 5/6 - Creando Storage Account..."
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot

echo ""
echo "📂 Creando container 'uploads'..."
az storage container create \
  --name uploads \
  --account-name $STORAGE_ACCOUNT \
  --public-access off
  --auth-mode login

echo ""
echo "🌐 6/6 - Creando App Service..."

# Crear App Service Plan
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --is-linux \
  --sku B1

# Crear Web App
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $WEB_APP_NAME \
  --runtime "NODE:20-lts"

# Habilitar Always On
az webapp config set \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --always-on true

echo ""
echo "✅ Infraestructura creada exitosamente!"
echo ""
echo "=================================================="
echo "📋 INFORMACIÓN DE CONEXIÓN"
echo "=================================================="
echo ""
echo "PostgreSQL:"
echo "  Host: $PG_SERVER_NAME.postgres.database.azure.com"
echo "  Database: $PG_DATABASE"
echo "  User: $PG_ADMIN_USER"
echo "  Port: 5432"
echo ""
echo "Web App:"
echo "  URL: https://$WEB_APP_NAME.azurewebsites.net"
echo ""
echo "Storage:"
echo "  Account: $STORAGE_ACCOUNT"
echo ""
echo "=================================================="
echo ""
echo "📝 PRÓXIMOS PASOS:"
echo ""
echo "1. Restaurar backup de base de datos:"
echo "   pg_restore -h $PG_SERVER_NAME.postgres.database.azure.com \\"
echo "     -U $PG_ADMIN_USER -d $PG_DATABASE -v backup.sql"
echo ""
echo "2. Copiar archivos a Blob Storage"
echo ""
echo "3. Configurar variables de entorno del App Service"
echo ""
echo "4. Deploy del backend"
echo ""

# Guardar información en archivo
cat > migration-info.txt <<EOF
# Información de Migración - $(date)

Resource Group: $RESOURCE_GROUP
Location: $LOCATION

PostgreSQL:
  Host: $PG_SERVER_NAME.postgres.database.azure.com
  Database: $PG_DATABASE
  User: $PG_ADMIN_USER

Web App: https://$WEB_APP_NAME.azurewebsites.net
Storage: $STORAGE_ACCOUNT

DATABASE_URL: postgresql://$PG_ADMIN_USER:PASSWORD@$PG_SERVER_NAME.postgres.database.azure.com:5432/$PG_DATABASE?sslmode=require
EOF

echo "💾 Información guardada en: migration-info.txt"
