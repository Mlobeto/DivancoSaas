# ✅ Migración a Cuenta de Azure del Cliente - COMPLETADO

## 📊 Resumen de la Migración

Se ha creado una infraestructura completamente nueva en la suscripción de Azure del cliente (Ricardo@grupodivanco.com).

### 🏗️ Recursos Creados en Azure

| Recurso               | Nombre               | URL/Endpoint                                       |
| --------------------- | -------------------- | -------------------------------------------------- |
| **Resource Group**    | rg-divancosaas-prod  | -                                                  |
| **PostgreSQL Server** | pg-divancosaas-prod  | pg-divancosaas-prod.postgres.database.azure.com    |
| **Database**          | divancosaas_prod     | -                                                  |
| **Storage Account**   | stdivancosaasprod    | stdivancosaasprod.blob.core.windows.net            |
| **Storage Container** | uploads              | -                                                  |
| **App Service Plan**  | asp-divancosaas-prod | B1 (Always On enabled)                             |
| **Web App**           | divancosaas-api-prod | **https://divancosaas-api-prod.azurewebsites.net** |

### 🔐 Credenciales

**PostgreSQL:**

- Host: `pg-divancosaas-prod.postgres.database.azure.com`
- Usuario: `divanco_admin`
- Contraseña: `Admin123!`
- Base de datos: `divancosaas_prod`
- Connection String: `postgresql://divanco_admin:Admin123!@pg-divancosaas-prod.postgres.database.azure.com:5432/divancosaas_prod?schema=public&sslmode=require`

**Storage Account:**

- Nombre: `stdivancosaasprod`
- Container: `uploads`
- Connection String: Configurada en variables de entorno de la Web App

**JWT Secret (generado):**

- `WHLwje6SeJFB8ZVONtI8XrreSkliEVUpuN3vuDc2nGk=`

### ⚙️ Variables de Entorno Configuradas

Todas las variables necesarias están configuradas en Azure Web App:

- ✅ NODE_ENV=production
- ✅ PORT=8080
- ✅ DATABASE_URL
- ✅ AZURE_STORAGE_CONNECTION_STRING
- ✅ AZURE_STORAGE_CONTAINER_NAME=uploads
- ✅ JWT_SECRET
- ✅ JWT_EXPIRES_IN=7d
- ✅ CORS_ORIGIN=\*

### 🚀 GitHub Actions Configurado

**Workflow creado:** `.github/workflows/deploy-backend-prod.yml`

El workflow se ejecuta automáticamente al:

- Hacer push a `main`
- Modificar archivos en `backend/`
- Ejecutar manualmente desde GitHub Actions

### 📱 URLs Actualizadas

**Mobile (app.json):**

```json
"apiUrl": "https://divancosaas-api-prod.azurewebsites.net"
```

**Web (.env.production):**

```env
VITE_API_URL=https://divancosaas-api-prod.azurewebsites.net
```

## 📋 Próximos Pasos (HACER AHORA)

### 1. Configurar GitHub Secrets

Sigue las instrucciones en: `GITHUB_SECRETS_SETUP.md`

**Secrets necesarios:**

- `AZURE_WEBAPP_PUBLISH_PROFILE_PROD` → Contenido de `backend/publish-profile-prod.xml`
- `DATABASE_URL_PROD` → Connection string de PostgreSQL

### 2. Hacer Push del Workflow

```bash
cd /c/Users/merce/Desktop/desarrollo/DivancoSaas
git add .github/workflows/deploy-backend-prod.yml
git add mobile/app.json
git add web/.env.production
git add backend/.gitignore
git commit -m "feat: setup production deployment to client Azure account"
git push origin main
```

### 3. Ejecutar Migraciones de Prisma

Una vez que el deployment de GitHub Actions termine:

```bash
# Desde tu máquina local
cd backend
DATABASE_URL="postgresql://divanco_admin:Admin123!@pg-divancosaas-prod.postgres.database.azure.com:5432/divancosaas_prod?schema=public&sslmode=require" npx prisma migrate deploy
```

O ejecuta manualmente desde Azure Portal usando la consola SSH de la Web App.

### 4. Verificar el Backend

Abre en el navegador:

```
https://divancosaas-api-prod.azurewebsites.net/health
```

Deberías ver una respuesta del servidor.

### 5. Construir Nuevo APK

Una vez verificado que el backend funciona:

```bash
cd mobile
eas build --platform android --profile preview
```

El nuevo APK ya tendrá la URL correcta del backend de producción.

### 6. Crear Usuario Administrador

Ejecuta el seed desde el backend:

```bash
cd backend
DATABASE_URL="postgresql://divanco_admin:Admin123!@pg-divancosaas-prod.postgres.database.azure.com:5432/divancosaas_prod?schema=public&sslmode=require" npm run prisma:seed
```

## 🗑️ Eliminar Infraestructura Antigua (OPCIONAL)

Una vez que confirmes que todo funciona correctamente, puedes eliminar los recursos de tu cuenta personal para dejar de pagar:

```bash
# Listar recursos en tu cuenta
az login  # Login a tu cuenta personal
az group list --output table

# Eliminar el resource group viejo (¡CONFIRMA antes!)
az group delete --name <nombre-del-resource-group-viejo> --yes --no-wait
```

## 💰 Costos Estimados (Cuenta del Cliente)

| Servicio            | SKU            | Costo Mensual Aprox. |
| ------------------- | -------------- | -------------------- |
| App Service Plan    | B1             | ~$55 USD             |
| PostgreSQL Flexible | Burstable B1ms | ~$12 USD             |
| Storage Account     | Standard LRS   | ~$0.50 USD           |
| **Total**           |                | **~$67.50 USD/mes**  |

## 📞 Soporte

Si tienes algún problema:

1. Revisa los logs en GitHub Actions
2. Revisa logs de la Web App en Azure Portal
3. Verifica que los secrets de GitHub estén configurados correctamente

---

**Fecha de migración:** 13 de marzo de 2026  
**Suscripción Azure:** 37865fc0-8d5a-411e-aa94-e89551635d7a  
**Tenant:** 98086c98-7526-4e86-a6f9-284616365817
