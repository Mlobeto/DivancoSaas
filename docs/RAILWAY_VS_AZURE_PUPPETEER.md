# Railway vs Azure - Comparación para DivancoSaaS Backend

## 📊 Comparación Rápida

| Aspecto                     | Railway                                                                                          | Azure App Service + Docker                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Configuración Puppeteer** | ✅ Automática (nixpacks.toml)                                                                    | ✅ Automática (Dockerfile)                                                                           |
| **Variables de entorno**    | `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`<br>`PUPPETEER_EXECUTABLE_PATH=/nix/store/*/bin/chromium` | `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`<br>`PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable` |
| **Setup inicial**           | 🟢 Muy fácil (5 min)                                                                             | 🟡 Medio (20 min)                                                                                    |
| **Costo mensual**           | $5-20 (Hobby/Pro)                                                                                | $70-150 (B2 plan)                                                                                    |
| **Auto-scaling**            | ✅ Incluido                                                                                      | ✅ Incluido (configurar)                                                                             |
| **Custom domain**           | ✅ Gratis                                                                                        | ✅ Gratis + SSL automático                                                                           |
| **CI/CD**                   | ✅ GitHub auto-deploy                                                                            | ✅ GitHub Actions (requiere setup)                                                                   |
| **Límites (Hobby)**         | 512MB RAM, 1GB storage                                                                           | N/A                                                                                                  |
| **Monitoreo**               | ✅ Built-in logs                                                                                 | Azure Monitor + App Insights                                                                         |
| **Base de datos**           | PostgreSQL incluido gratis (500MB)                                                               | Separado (Flexible Server ~$20/mes)                                                                  |
| **Región**                  | US/EU                                                                                            | 60+ regiones globales                                                                                |
| **Soporte empresarial**     | ❌ Solo Pro plan                                                                                 | ✅ Incluido con Azure                                                                                |

---

## 🎯 Recomendación por Escenario

### 1. **Desarrollo / MVP / Testing** → Railway ⭐

**Por qué:**

- Setup en 5 minutos
- Costo bajísimo ($5-10/mes)
- Base de datos incluida gratis
- Deploy automático con cada push
- No necesitas conocer Docker/Azure

**Configuración:**

```bash
# Solo necesitas nixpacks.toml con:
nixPkgs = ['nodejs_20', 'openssl', 'chromium']
```

---

### 2. **Producción / Startup Escalando** → Railway Pro ⭐⭐

**Por qué:**

- Sigue siendo simple
- Auto-scaling incluido
- $20-50/mes para tráfico moderado
- No necesitas administrar infraestructura
- Deploy instantáneo

**Limites:**

- RAM: hasta 32GB
- vCPU: hasta 32
- Concurrent builds: ilimitados

---

### 3. **Producción Empresarial / Gran Escala** → Azure ⭐⭐⭐

**Por qué:**

- Control total sobre infraestructura
- Multi-región para baja latencia
- Cumplimiento regulatorio (HIPAA, SOC2, etc.)
- Soporte 24/7
- Integración con otros servicios Azure
- Mejor para equipos DevOps

**Requiere:**

- Conocimiento de Docker
- Azure CLI
- CI/CD setup manual
- Administración de ACR

---

## 💰 Costo Real Estimado (Producción)

### Railway Pro

```
Plan Pro Base:     $20/mes
Resource usage:    $15-30/mes (según tráfico)
PostgreSQL (1GB):  Incluido
Total:             $35-50/mes
```

**Escala hasta:**

- 50,000 requests/día
- 2GB RAM
- 30GB storage
- 2vCPU

---

### Azure App Service

```
App Service B2:           $73/mes (2 cores, 3.5GB RAM)
PostgreSQL Flexible:      $20-40/mes (Burstable B1ms)
Azure Storage:            $2-5/mes (50GB)
Container Registry:       $5/mes (Basic)
Application Insights:     $2-10/mes (50k events)
--------------------------------------------
Total:                    $102-133/mes
```

**Escala hasta:**

- Ilimitado con plan Premium
- Load balancer incluido
- Multi-región

---

## 🔧 Configuración Técnica Necesaria

### Railway

**Archivos:**

- ✅ `nixpacks.toml` (ya creado)

**Variables de entorno:**

```bash
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/nix/store/*/bin/chromium
DATABASE_URL=<auto-generada>
JWT_SECRET=tu-secret
ENCRYPTION_MASTER_KEY=tu-key
```

**Deploy:**

```bash
git push origin main
# ✅ Auto-deploy en Railway
```

---

### Azure

**Archivos:**

- ✅ `Dockerfile` (ya creado)
- ✅ `.dockerignore` (ya creado)
- ✅ `deploy-azure.sh` (ya creado)
- `.github/workflows/azure-deploy.yml` (opcional)

**Variables de entorno:**

```bash
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
DATABASE_URL=postgresql://...
JWT_SECRET=tu-secret
ENCRYPTION_MASTER_KEY=tu-key
AZURE_STORAGE_CONNECTION_STRING=...
# + todas las demás
```

**Deploy:**

```bash
./deploy-azure.sh production
# O
git push origin main  # Con GitHub Actions
```

---

## 🚦 Decisión Rápida

### ¿Cuándo usar Railway?

✅ Si tu proyecto está en fase de:

- MVP / Prototipo
- Desarrollo
- Testing
- Beta privada
- Startup temprano (<10k usuarios)

✅ Si tu equipo:

- No tiene DevOps dedicado
- Quiere desplegar rápido
- Prefiere no administrar infraestructura

✅ Si tu presupuesto es:

- Limitado (<$100/mes)
- Variable (pagas por uso)

---

### ¿Cuándo usar Azure?

✅ Si tu proyecto está en fase de:

- Producción estable
- Escalamiento (>10k usuarios)
- Empresas que requieren compliance

✅ Si tu equipo:

- Tiene DevOps o está aprendiendo
- Necesita control granular
- Ya usa Azure para otros servicios

✅ Si tu presupuesto es:

- Predecible ($100-500/mes)
- Solido para infraestructura
- Empresarial

✅ Si necesitas:

- Multi-región
- Disaster recovery
- Auditorías de seguridad
- SLA 99.95%

---

## 🎬 Mi Recomendación para DivancoSaaS

### Fase 1: MVP (Ahora) → **Railway** 🚀

```bash
# Ya tienes nixpacks.toml configurado
# Solo necesitas:
git push
```

**Ventajas:**

- Ya tienes Railway configurado
- Costo mínimo (menos de $20/mes para empezar)
- Deploy en segundos
- Puedes enfocarte en el producto, no en infraestructura

---

### Fase 2: Beta/Clientes Pagos (3-6 meses) → **Railway Pro**

```bash
# Upgrade a Pro plan en Railway
# Todo sigue funcionando igual
```

**Ventajas:**

- Mismo setup, más recursos
- Auto-scaling incluido
- Todavía simple

---

### Fase 3: Escala Empresarial (12+ meses) → **Migrar a Azure**

```bash
# Usar Dockerfile y scripts ya preparados
./deploy-azure.sh production
```

**Ventajas:**

- Ya tienes el Dockerfile listo
- Migración sin sorpresas
- Preparado para crecer

---

## 📋 Checklist de Variables Puppeteer

### ✅ Railway (nixpacks.toml)

```toml
[phases.setup]
nixPkgs = ['nodejs_20', 'openssl', 'chromium']

[phases.setup.nixPkgsEnvironment]
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true'
PUPPETEER_EXECUTABLE_PATH = '/nix/store/*/bin/chromium'
```

En Railway Dashboard:

- [x] `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` = `true`
- [x] `PUPPETEER_EXECUTABLE_PATH` = `/nix/store/*/bin/chromium`

---

### ✅ Azure (Dockerfile)

Ya incluido en el Dockerfile:

```dockerfile
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

También agregar en App Service Settings:

- [x] `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` = `true`
- [x] `PUPPETEER_EXECUTABLE_PATH` = `/usr/bin/google-chrome-stable`

---

## 🔍 Testing Puppeteer en Cada Plataforma

### Railway

```bash
# Después de deploy
curl https://tu-app.up.railway.app/api/v1/rental/quotations/test-id/generate-pdf \
  -H "Authorization: Bearer token"
```

### Azure

```bash
# Después de deploy
curl https://divancosaas-backend-production.azurewebsites.net/api/v1/rental/quotations/test-id/generate-pdf \
  -H "Authorization: Bearer token"
```

### Local (desarrollo)

```bash
# Con Docker
docker build -t divancosaas-backend -f Dockerfile .
docker run -p 3000:3000 -e DATABASE_URL="..." divancosaas-backend

# Sin Docker (Puppeteer auto-descarga Chromium)
npm run dev
```

---

## 🎯 Conclusión

Para **DivancoSaaS ahora mismo**:

1. ✅ **Usar Railway** para MVP/desarrollo (ya configurado)
2. ✅ Ambas plataformas **soportan Puppeteer** correctamente
3. ✅ Los archivos están listos para ambas (**nixpacks.toml** + **Dockerfile**)
4. ✅ Migrar a Azure será **fácil cuando sea necesario**

**No necesitas cambiar nada ahora.** Railway funcionará perfecto con Puppeteer.

---

**Última actualización:** Febrero 11, 2026  
**Recomendación actual:** Railway (ya tienes todo configurado)  
**Próximo paso:** Push a Railway y probar generación de PDF
