# ⚡ Quick Deploy en Railway

## Pasos rápidos (5 minutos)

### 1. Crea el proyecto en Railway

```bash
# Desde la terminal
cd backend
railway login
railway init
```

O desde la web: https://railway.app → "New Project" → "Deploy from GitHub repo"

### 2. Agrega PostgreSQL

En Railway:

- Click "+ New" → "Database" → "PostgreSQL"
- Railway auto-configura `DATABASE_URL`

### 3. Configura variables de entorno mínimas

```env
# Railway auto-genera esta
DATABASE_URL=postgresql://...

# Agrega estas manualmente
JWT_SECRET=cambia-esto-por-algo-seguro-de-al-menos-32-caracteres
ENCRYPTION_KEY=otra-clave-secreta-de-32-caracteres-minimo
NODE_ENV=production
PORT=3000
```

### 4. Deploy automático

Railway detectará el `nixpacks.toml` y ejecutará:

1. ✅ `npm install`
2. ✅ `npx prisma generate`
3. ✅ `npm run build`
4. ✅ `npm run start:prod` (incluye `prisma migrate deploy`)

### 5. Verifica Swagger

Railway te dará una URL:

```
https://tu-proyecto.railway.app/api-docs
```

## 🔧 Si algo falla

**Error: "DATABASE_URL not found"**

```bash
# Desde Railway CLI
railway variables
railway variables set DATABASE_URL="postgresql://..."
```

**Error: "Missing JWT_SECRET"**

```bash
railway variables set JWT_SECRET="tu-clave-secreta"
railway variables set ENCRYPTION_KEY="tu-clave-de-32-chars"
```

**Logs en tiempo real**

```bash
railway logs
```

## 💰 Costos

- Railway: $5 gratis/mes (500 horas)
- PostgreSQL incluido en el plan gratuito

## 🚀 Siguiente paso

Una vez funcionando en Railway, ya puedes:

- Probar Swagger desde la URL pública
- Crear tu primer tenant con POST `/api/v1/auth/register`
- Mientras tanto, preparar Azure para producción

---

**Documentación completa:** [RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md)
