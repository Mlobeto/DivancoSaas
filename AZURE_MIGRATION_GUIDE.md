# 🔄 Migración a Cuenta del Cliente - Azure

## 📋 Recursos Actuales a Migrar

Según tu setup actual:

- ✅ Resource Group: `rg-divanco-dev`
- ✅ PostgreSQL Server: `pg-divanco-dev.postgres.database.azure.com`
- ✅ Database: `divanco_dev`
- ✅ App Service: `divancosaas-backend-h4esckd7cwbxhcdx`
- ✅ Container Registry (si existe)
- ✅ Azure Blob Storage
- ✅ Azure Communication Services (Email)

---

## 🎯 Estrategia de Migración

### Opción 1: Recrear desde Cero (Recomendado)

Usar scripts de Azure CLI para recrear toda la infraestructura en la nueva suscripción.

**Ventajas:**

- ✅ Más limpio y controlado
- ✅ Puedes ajustar nombres y configuraciones
- ✅ No dependes de limitaciones de Azure

**Tiempo:** 1-2 horas

### Opción 2: Mover Recursos

Usar `az resource move` para mover recursos entre suscripciones.

**Limitaciones:**

- ⚠️ No todos los recursos se pueden mover
- ⚠️ Puede causar downtime
- ⚠️ Algunas configuraciones se pierden

---

## 🚀 Opción 1: Scripts de Recreación (Recomendado)

### Paso 1: Exportar Configuración Actual

```bash
# Login a tu cuenta actual
az login

# Exportar configuración del Resource Group
az group export \
  --name rg-divanco-dev \
  --output json > azure-config-export.json

# Exportar configuración de PostgreSQL
az postgres flexible-server show \
  --name pg-divanco-dev \
  --resource-group rg-divanco-dev \
  --output json > postgres-config.json

# Exportar configuración del App Service
az webapp show \
  --name divancosaas-backend-h4esckd7cwbxhcdx \
  --resource-group rg-divanco-dev \
  --output json > webapp-config.json

# Exportar app settings
az webapp config appsettings list \
  --name divancosaas-backend-h4esckd7cwbxhcdx \
  --resource-group rg-divanco-dev \
  --output json > webapp-settings.json
```

### Paso 2: Backup de Base de Datos

```bash
# Crear backup de la base de datos PostgreSQL
az postgres flexible-server db dump \
  --resource-group rg-divanco-dev \
  --server-name pg-divanco-dev \
  --database-name divanco_dev \
  --output-file divanco_backup_$(date +%Y%m%d).sql

# O usando pg_dump directamente (requiere PostgreSQL instalado)
pg_dump "host=pg-divanco-dev.postgres.database.azure.com \
  port=5432 \
  dbname=divanco_dev \
  user=divanco_admin \
  password=TU_PASSWORD \
  sslmode=require" \
  > divanco_backup.sql
```

### Paso 3: Script de Recreación

Crea este script `migrate-to-client.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Migrando DivancoSaaS a cuenta del cliente..."

# Variables - AJUSTA SEGÚN NECESITES
NEW_SUBSCRIPTION_ID="tu-nueva-subscription-id"
NEW_RESOURCE_GROUP="rg-divancosaas-prod"
LOCATION="centralus"
CLIENT_NAME="cliente"

# PostgreSQL
PG_SERVER_NAME="pg-divancosaas-${CLIENT_NAME}"
PG_ADMIN_USER="divanco_admin"
PG_DATABASE="divancosaas_prod"

# App Service
APP_SERVICE_PLAN="asp-divancosaas-${CLIENT_NAME}"
WEB_APP_NAME="divancosaas-${CLIENT_NAME}-api"

# Storage
STORAGE_ACCOUNT="stdivancosaas${CLIENT_NAME}"

echo "📌 Configurando suscripción del cliente..."
az account set --subscription $NEW_SUBSCRIPTION_ID

echo "📦 Creando Resource Group..."
az group create \
  --name $NEW_RESOURCE_GROUP \
  --location $LOCATION

echo "🗄️ Creando PostgreSQL Server..."
az postgres flexible-server create \
  --resource-group $NEW_RESOURCE_GROUP \
  --name $PG_SERVER_NAME \
  --location $LOCATION \
  --admin-user $PG_ADMIN_USER \
  --admin-password "GENERAR_PASSWORD_SEGURO" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16

echo "🔓 Configurando firewall de PostgreSQL..."
az postgres flexible-server firewall-rule create \
  --resource-group $NEW_RESOURCE_GROUP \
  --name $PG_SERVER_NAME \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

echo "💾 Creando base de datos..."
az postgres flexible-server db create \
  --resource-group $NEW_RESOURCE_GROUP \
  --server-name $PG_SERVER_NAME \
  --database-name $PG_DATABASE

echo "📦 Creando Storage Account..."
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $NEW_RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

echo "📂 Creando container 'uploads'..."
az storage container create \
  --name uploads \
  --account-name $STORAGE_ACCOUNT \
  --public-access off

echo "🌐 Creando App Service Plan..."
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $NEW_RESOURCE_GROUP \
  --location $LOCATION \
  --is-linux \
  --sku B1

echo "🚀 Creando Web App..."
az webapp create \
  --resource-group $NEW_RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $WEB_APP_NAME \
  --deployment-container-image-name "mcr.microsoft.com/appsvc/staticsite:latest"

echo "⚙️ Habilitando Always On..."
az webapp config set \
  --name $WEB_APP_NAME \
  --resource-group $NEW_RESOURCE_GROUP \
  --always-on true

echo "✅ Infraestructura creada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Restaurar backup de base de datos"
echo "2. Copiar archivos a nuevo Blob Storage"
echo "3. Configurar variables de entorno del App Service"
echo "4. Deploy del backend"
echo ""
echo "📝 Connection Strings:"
echo "PostgreSQL: $PG_SERVER_NAME.postgres.database.azure.com"
echo "Web App: https://$WEB_APP_NAME.azurewebsites.net"
```

### Paso 4: Restaurar Base de Datos

```bash
# Restaurar el backup en el nuevo servidor
psql "host=pg-divancosaas-cliente.postgres.database.azure.com \
  port=5432 \
  dbname=divancosaas_prod \
  user=divanco_admin \
  password=NUEVO_PASSWORD \
  sslmode=require" \
  < divanco_backup.sql
```

### Paso 5: Copiar Archivos de Blob Storage

```bash
# Instalar AzCopy (si no lo tienes)
# Windows: choco install azcopy
# Linux/Mac: ver https://docs.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-v10

# Copiar todos los archivos
azcopy copy \
  "https://stdivancodev.blob.core.windows.net/uploads/*?SAS_TOKEN_ORIGEN" \
  "https://stdivancosaascliente.blob.core.windows.net/uploads/?SAS_TOKEN_DESTINO" \
  --recursive
```

### Paso 6: Configurar Variables de Entorno

```bash
# Obtener connection strings
STORAGE_CONNECTION=$(az storage account show-connection-string \
  --name stdivancosaascliente \
  --resource-group rg-divancosaas-prod \
  --query connectionString -o tsv)

DB_URL="postgresql://divanco_admin:PASSWORD@pg-divancosaas-cliente.postgres.database.azure.com:5432/divancosaas_prod?sslmode=require"

# Configurar app settings
az webapp config appsettings set \
  --name divancosaas-cliente-api \
  --resource-group rg-divancosaas-prod \
  --settings \
    DATABASE_URL="$DB_URL" \
    AZURE_STORAGE_CONNECTION_STRING="$STORAGE_CONNECTION" \
    NODE_ENV="production" \
    JWT_SECRET="GENERAR_NUEVO_SECRET" \
    PORT="8080"
```

### Paso 7: Deploy del Backend

```bash
# Desde tu repo local
cd backend

# Build y push de la imagen Docker (si usas ACR)
az acr build \
  --registry divancosaascliente \
  --image backend:latest \
  --file Dockerfile .

# Configurar el App Service para usar la imagen
az webapp config container set \
  --name divancosaas-cliente-api \
  --resource-group rg-divancosaas-prod \
  --docker-custom-image-name divancosaascliente.azurecr.io/backend:latest
```

---

## 🗂️ Opción 2: Mover Recursos (Limitado)

```bash
# Login a cuenta origen
az login

# Obtener IDs de los recursos
RESOURCE_IDS=$(az resource list \
  --resource-group rg-divanco-dev \
  --query "[].id" -o tsv)

# Mover recursos (NO FUNCIONA CON TODOS)
az resource move \
  --destination-group rg-divancosaas-prod \
  --destination-subscription-id NUEVA_SUBSCRIPTION_ID \
  --ids $RESOURCE_IDS
```

**⚠️ Limitaciones:**

- PostgreSQL Flexible Server **NO se puede mover**
- App Service puede moverse pero pierde configuraciones
- Blob Storage se puede mover

---

## ✅ Checklist de Migración

Antes de empezar:

- [ ] Backup completo de base de datos
- [ ] Exportar todas las configuraciones
- [ ] Listar todos los secrets y connection strings
- [ ] Documentar integraciones externas (emails, pagos, etc.)

Durante la migración:

- [ ] Crear nueva infraestructura en cuenta del cliente
- [ ] Restaurar base de datos
- [ ] Copiar archivos de storage
- [ ] Configurar variables de entorno
- [ ] Deploy del backend
- [ ] Probar endpoints críticos

Después de migrar:

- [ ] Actualizar DNS (si aplica)
- [ ] Actualizar frontend con nueva URL
- [ ] Configurar UptimeRobot
- [ ] Configurar alertas y monitoring
- [ ] Actualizar documentación

---

## 🎯 GitHub y Repo

Para el nuevo repo del cliente:

```bash
# Clonar tu repo actual
git clone https://github.com/tu-usuario/DivancoSaas.git divancosaas-cliente

cd divancosaas-cliente

# Cambiar remote al repo del cliente
git remote set-url origin https://github.com/cliente/divancosaas.git

# Crear .env.production con nuevas URLs
cat > web/.env.production << EOF
VITE_API_URL=https://divancosaas-cliente-api.azurewebsites.net
EOF

cat > mobile/.env << EOF
EXPO_PUBLIC_API_URL=https://divancosaas-cliente-api.azurewebsites.net
EOF

# Push al nuevo repo
git push -u origin main
```

---

## 💰 Costos Estimados (Cliente)

**Configuración Recomendada:**

| Recurso      | SKU                | Costo/mes       |
| ------------ | ------------------ | --------------- |
| PostgreSQL   | Standard_B1ms      | ~$28            |
| App Service  | B1 (con Always On) | ~$55            |
| Blob Storage | Standard LRS       | ~$2-5           |
| Bandwidth    | -                  | ~$5-10          |
| **Total**    |                    | **~$90-98/mes** |

---

## 🆘 Scripts de Ayuda

### Ver todos los recursos actuales

```bash
az resource list \
  --resource-group rg-divanco-dev \
  --output table
```

### Exportar TODO como ARM template

```bash
az group export \
  --name rg-divanco-dev \
  --output json > full-export.json
```

### Obtener todos los secrets

```bash
# App Settings
az webapp config appsettings list \
  --name divancosaas-backend-h4esckd7cwbxhcdx \
  --resource-group rg-divanco-dev \
  --output json > secrets.json
```

---

## 📞 Contacto Post-Migración

Después de la migración, actualizar:

- URLs en documentación
- Connection strings en desarrollo
- Mobile app (.env)
- Frontend (.env.production)
- UptimeRobot configuration
- GitHub Actions (si tienes CI/CD)
