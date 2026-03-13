# 🔧 Solución: Backend Azure se Apaga (Cold Start)

## 🔍 Problema

El backend en Azure se apaga después de estar inactivo y tarda en volver a levantar (cold start). Esto es porque Azure apaga las apps sin tráfico para ahorrar recursos.

## ✅ Soluciones

### Opción 1: Activar "Always On" (Recomendado)

**Requisito:** Plan Basic (B1) o superior (NO funciona en Free tier)

```bash
# Verificar plan actual
az webapp show --name divancosaas-backend-h4esckd7cwbxhcdx \
  --resource-group rg-divanco-dev \
  --query "appServicePlanId" -o tsv

# Habilitar Always On
az webapp config set \
  --name divancosaas-backend-h4esckd7cwbxhcdx \
  --resource-group rg-divanco-dev \
  --always-on true
```

**Ventajas:**

- ✅ La app NUNCA se apaga
- ✅ Respuesta instantánea siempre
- ✅ Mejor experiencia de usuario

**Costo:** ~$55 USD/mes (plan B1 es el más barato que soporta Always On)

---

### Opción 2: Health Check / Keep-Alive (Gratis)

Crear un servicio que haga ping al backend cada ~5 minutos para mantenerlo activo.

#### A) Usando UptimeRobot (Gratis)

1. Ve a https://uptimerobot.com (gratis, 50 monitores)
2. Crea una cuenta
3. Add New Monitor:
   - Type: **HTTP(s)**
   - URL: `https://divancosaas-backend-h4esckd7cwbxhcdx.centralus-01.azurewebsites.net/api/v1/health`
   - Interval: **5 minutos**

#### B) Usando GitHub Actions (Gratis)

Crea `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Azure Backend Alive

on:
  schedule:
    # Cada 5 minutos (ajusta según necesites)
    - cron: "*/5 * * * *"
  workflow_dispatch: # Permite ejecución manual

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping backend
        run: |
          curl -f https://divancosaas-backend-h4esckd7cwbxhcdx.centralus-01.azurewebsites.net/api/v1/health || exit 0
```

#### C) Crear endpoint de health en el backend

Ya deberías tener este endpoint, pero si no:

**`backend/src/index.ts` o `routes/health.ts`:**

```typescript
app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});
```

---

### Opción 3: Upgrade a Plan Superior

Si tienes presupuesto, upgrade el App Service Plan:

```bash
# Listar planes disponibles
az appservice plan list --resource-group rg-divanco-dev -o table

# Upgrade a B1 (Basic, ~$55/mes)
az appservice plan update \
  --name <TU_PLAN_NAME> \
  --resource-group rg-divanco-dev \
  --sku B1

# Luego habilitar Always On
az webapp config set \
  --name divancosaas-backend-h4esckd7cwbxhcdx \
  --resource-group rg-divanco-dev \
  --always-on true
```

**Costo de planes:**

- Free/F1: $0 - NO soporta Always On
- Basic B1: ~$55/mes - Soporta Always On
- Standard S1: ~$70/mes - Más RAM y CPU
- Premium P1v2: ~$145/mes - Alto rendimiento

---

### Opción 4: Aumentar Timeout (Paliativo)

No previene el cold start, pero reduce su impacto:

```bash
# Aumentar idle timeout
az webapp config set \
  --name divancosaas-backend-h4esckd7cwbxhcdx \
  --resource-group rg-divanco-dev \
  --idle-timeout 20
```

---

## 📊 Comparación de Soluciones

| Solución         | Costo   | Efectividad | Facilidad  |
| ---------------- | ------- | ----------- | ---------- |
| Always On        | $55/mes | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐ |
| UptimeRobot      | Gratis  | ⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐ |
| GitHub Actions   | Gratis  | ⭐⭐⭐⭐    | ⭐⭐⭐⭐   |
| Aumentar timeout | Gratis  | ⭐⭐        | ⭐⭐⭐⭐⭐ |

---

## 🎯 Recomendación

**Para producción con usuarios reales:** Always On (upgrade a B1)
**Para testing/desarrollo:** UptimeRobot (gratis y muy efectivo)

---

## 🔍 Verificar Estado Actual

```bash
# Ver configuración actual
az webapp config show \
  --name divancosaas-backend-h4esckd7cwbxhcdx \
  --resource-group rg-divanco-dev \
  --query "{alwaysOn:.alwaysOn, tier:.tier}" -o json

# Ver logs en tiempo real
az webapp log tail \
  --name divancosaas-backend-h4esckd7cwbxhcdx \
  --resource-group rg-divanco-dev

# Ver plan de App Service
az appservice plan list \
  --resource-group rg-divanco-dev \
  -o table
```

---

## 🆘 Logs de Azure

```bash
# Habilitar logs de aplicación
az webapp log config \
  --name divancosaas-backend-h4esckd7cwbxhcdx \
  --resource-group rg-divanco-dev \
  --application-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true

# Ver logs
az webapp log tail \
  --name divancosaas-backend-h4esckd7cwbxhcdx \
  --resource-group rg-divanco-dev

# Descargar logs
az webapp log download \
  --name divancosaas-backend-h4esckd7cwbxhcdx \
  --resource-group rg-divanco-dev \
  --log-file azure-logs.zip
```

---

## 🚀 Próximos Pasos

1. **Inmediato (Gratis):** Configura UptimeRobot para mantener el backend vivo
2. **Cuando tengas presupuesto:** Upgrade a plan B1 y activa Always On
3. **Opcional:** Configura alertas en Azure Monitor para saber cuándo el backend se cae
