# Configuración de GitHub Secrets para Deployment Automático

## 📋 Pasos para configurar GitHub Actions

### 1. Ir a GitHub Repository Settings

1. Abre tu repositorio en GitHub
2. Ve a **Settings** → **Secrets and variables** → **Actions**
3. Click en **New repository secret**

### 2. Configurar AZURE_WEBAPP_PUBLISH_PROFILE_PROD

**Nombre del Secret:**

```
AZURE_WEBAPP_PUBLISH_PROFILE_PROD
```

**Valor del Secret:**
Copia TODO el contenido del archivo `backend/publish-profile-prod.xml`

Para ver el contenido completo:

```bash
cd backend
cat publish-profile-prod.xml
```

### 3. Configurar DATABASE_URL_PROD

**Nombre del Secret:**

```
DATABASE_URL_PROD
```

**Valor del Secret:**

```
postgresql://divanco_admin:Admin123!@pg-divancosaas-prod.postgres.database.azure.com:5432/divancosaas_prod?schema=public&sslmode=require
```

## 🚀 Deployment Automático

Una vez configurados los secrets:

1. Haz commit de los cambios del workflow:

```bash
git add .github/workflows/deploy-backend-prod.yml
git commit -m "Add GitHub Actions workflow for production deployment"
git push origin main
```

2. El deployment se ejecutará automáticamente cuando:
   - Hagas push a la rama `main`
   - Modifiques archivos en la carpeta `backend/`
   - O ejecutes manualmente desde GitHub Actions

## 🔍 Verificar Deployment

1. Ve a **Actions** en tu repositorio de GitHub
2. Verás el workflow "Deploy Backend to Azure (Production)" ejecutándose
3. Click en el workflow para ver los logs en tiempo real

## 📦 Recursos Creados

- **Web App:** https://divancosaas-api-prod.azurewebsites.net
- **PostgreSQL:** pg-divancosaas-prod.postgres.database.azure.com
- **Storage Account:** stdivancosaasprod
- **Resource Group:** rg-divancosaas-prod

## ⚠️ IMPORTANTE

**NO** commitear el archivo `publish-profile-prod.xml` al repositorio.
Este ya está excluido en `.gitignore`.
