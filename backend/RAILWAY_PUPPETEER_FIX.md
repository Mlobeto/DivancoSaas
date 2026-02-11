# Fix Puppeteer en Railway

## 🐛 Problema

Railway no incluye las dependencias del sistema necesarias para Puppeteer (Chromium).

## ✅ Solución Implementada

### 1. Actualizado `nixpacks.toml`

Se agregó `chromium` a los paquetes de Nix:

```toml
[phases.setup]
nixPkgs = ['nodejs_20', 'openssl', 'chromium']

[phases.setup.nixPkgsEnvironment]
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true'
PUPPETEER_EXECUTABLE_PATH = '/nix/store/*/bin/chromium'
```

### 2. Variables de entorno en Railway

Agrega estas variables en Railway Dashboard → Settings → Variables:

```
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/nix/store/*/bin/chromium
```

## 🚀 Pasos para Deploy

### 1. Commit y Push

```bash
git add backend/nixpacks.toml
git commit -m "fix: Add Chromium for Puppeteer in Railway"
git push
```

### 2. Configurar Variables en Railway

1. Ve a tu proyecto en Railway
2. Click en tu servicio (backend)
3. Ve a **Settings → Variables**
4. Click en **+ New Variable**
5. Agrega:
   - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` = `true`
   - `PUPPETEER_EXECUTABLE_PATH` = `/nix/store/*/bin/chromium`

### 3. Re-deploy

Railway debería hacer redeploy automáticamente después del push. Si no:

1. Ve a **Deployments**
2. Click en los **tres puntos** del último deployment
3. Click en **Redeploy**

## 🧪 Verificar que funciona

Una vez deployado, prueba la generación de PDF:

```bash
curl -X POST https://tu-app.up.railway.app/api/v1/rental/quotations/{id}/generate-pdf \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Deberías recibir una URL del PDF generado.

## 📊 Logs de Debug

Si sigue fallando, revisa los logs en Railway:

```bash
# Busca en los logs:
- "Downloading Chromium..." (NO debería aparecer)
- "Failed to launch the browser" (error)
- "Generated PDF successfully" (éxito)
```

## 🔧 Alternativa: Usar puppeteer-core + chrome-aws-lambda

Si el build sigue siendo muy pesado, podemos cambiar a `puppeteer-core` con `chrome-aws-lambda`:

```bash
npm uninstall puppeteer
npm install puppeteer-core chrome-aws-lambda
```

Actualizar código en `template.service.ts`:

```typescript
import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath,
  headless: true,
});
```

## 📝 Notas

- El build puede tardar 2-3 minutos más por la instalación de Chromium
- Chromium agrega ~200MB al tamaño del contenedor
- En desarrollo local, Puppeteer descarga su propio Chromium automáticamente

---

**Fecha:** Febrero 11, 2026  
**Status:** ✅ Fix aplicado  
**Próximo paso:** Deploy y testing
