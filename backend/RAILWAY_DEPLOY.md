# DivancoSaaS Backend - Despliegue en Railway

## 🚀 Pasos para desplegar en Railway

### 1. Crear proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Crea una nueva cuenta o inicia sesión
3. Click en "New Project"
4. Selecciona "Deploy from GitHub repo"
5. Conecta tu repositorio

### 2. Configurar la base de datos PostgreSQL

1. En tu proyecto de Railway, click en "+ New"
2. Selecciona "Database" → "PostgreSQL"
3. Railway creará automáticamente una base de datos
4. Copia la variable `DATABASE_URL` que Railway genera automáticamente

### 3. Configurar variables de entorno

En la configuración de tu servicio en Railway, agrega las siguientes variables:

**Variables obligatorias:**

```
DATABASE_URL=postgresql://... (auto-generada por Railway)
JWT_SECRET=tu-clave-secreta-jwt-cambiala-en-produccion
ENCRYPTION_KEY=una-clave-de-32-caracteres-minimo
PORT=3000
NODE_ENV=production
```

**Variables opcionales (para integraciones):**

```
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
AZURE_STORAGE_ACCOUNT_NAME=
AZURE_STORAGE_ACCOUNT_KEY=
META_WHATSAPP_ACCESS_TOKEN=
META_WHATSAPP_PHONE_NUMBER_ID=
META_WHATSAPP_BUSINESS_ACCOUNT_ID=
META_WHATSAPP_WEBHOOK_VERIFY_TOKEN=
CORS_ORIGINS=https://tudominio.com
```

### 4. Ejecutar migraciones

Railway ejecutará automáticamente:

1. `npm install`
2. `npx prisma generate`
3. `npm run build`
4. `npm run start:prod`

Para ejecutar las migraciones de base de datos:

**Opción A: Desde la terminal de Railway**

1. Ve a tu servicio → Settings → Variables
2. Activa la opción de ejecutar comando one-off
3. Ejecuta: `npx prisma migrate deploy`

**Opción B: Desde tu terminal local**

```bash
# Instala Railway CLI
npm install -g @railway/cli

# Login
railway login

# Vincula el proyecto
railway link

# Ejecuta migraciones
railway run npx prisma migrate deploy
```

### 5. Verificar el despliegue

Una vez desplegado, Railway te dará una URL pública tipo:

```
https://tu-proyecto.railway.app
```

Verifica que Swagger esté funcionando:

```
https://tu-proyecto.railway.app/api-docs
```

### 6. Seed inicial (opcional)

Para crear datos de prueba:

```bash
railway run npm run prisma:seed
```

## 🔒 Seguridad

- **Nunca** comitees el archivo `.env` con credenciales reales
- Cambia `JWT_SECRET` y `ENCRYPTION_KEY` en producción
- Usa variables de entorno de Railway para secretos
- Configura CORS_ORIGINS para restringir acceso

## 📊 Monitoreo

Railway provee:

- Logs en tiempo real
- Métricas de uso (CPU, RAM, Network)
- Reinicio automático en caso de fallos

## 🔧 Troubleshooting

### Error: "Cannot find module"

- Verifica que `npx prisma generate` se ejecutó correctamente
- Railway debe ejecutar este comando antes de `npm run build`

### Error de conexión a base de datos

- Verifica que la variable `DATABASE_URL` esté configurada
- Asegúrate de que las migraciones se ejecutaron con `prisma migrate deploy`

### Error 502 Bad Gateway

- Verifica que el puerto configurado sea `PORT=3000`
- Revisa los logs en Railway para más detalles

## 📝 Comandos útiles

```bash
# Ver logs
railway logs

# Ejecutar comando one-off
railway run [comando]

# Abrir shell interactivo
railway shell

# Ver variables de entorno
railway variables
```

## 🔄 CI/CD Automático

Railway automáticamente despliega cuando haces push a tu rama principal. Para configurar:

1. Settings → Service → Branch: `main` (o la que uses)
2. Activa "Auto Deploy"
3. Railway detectará cambios y desplegará automáticamente

## 💡 Tips

1. Railway incluye 500 horas gratis al mes ($5 de crédito)
2. PostgreSQL en Railway incluye backup automático
3. Puedes tener múltiples entornos (staging, production)
4. Railway soporta monorepos (ya configurado con `railway.json`)

## 🌐 Dominios personalizados

Para usar tu propio dominio:

1. Settings → Networking → Custom Domain
2. Agrega tu dominio
3. Configura los DNS según las instrucciones de Railway
