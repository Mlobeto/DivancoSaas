# 📱 Distribución Interna - DivancoSaaS Mobile

## 🎯 Para Pruebas del Equipo (Distribución Interna)

Ya tienes cuenta de Google Play. Aquí hay dos opciones para distribución interna:

### Opción 1: APK Directo (⚡ Recomendado para empezar)

Genera un APK que compartes directamente con tu equipo vía Drive, email, Slack, etc.

```bash
# 1. Login en Expo
eas login

# 2. Configurar el proyecto (primera vez)
cd mobile
eas build:configure

# 3. Construir APK para distribución interna
eas build --platform android --profile preview
```

**Ventajas:**

- ✅ Rápido (10-15 minutos)
- ✅ Sin proceso de revisión
- ✅ Instalación inmediata
- ✅ Ideal para testing interno

**El equipo instala así:**

1. Descargan el APK
2. En Android: Configuración → Seguridad → "Instalar apps desconocidas"
3. Instalar el APK

---

### Opción 2: Google Play Internal Testing (📱 Más profesional)

Sube la app a Google Play Console en modo "Internal Testing"

**Ventajas:**

- ✅ Hasta 100 testers internos
- ✅ Actualizaciones automáticas vía Play Store
- ✅ Sin revisión de Google (aprobación instantánea)
- ✅ Más profesional

**Pasos:**

```bash
# 1. Construir AAB
eas build --platform android --profile production

# 2. En Play Console:
```

1. Ve a https://play.google.com/console
2. Click en "Crear aplicación" (si no existe)
3. Ve a "Testing" → "Internal testing"
4. Click "Create new release"
5. Sube el AAB que descargaste
6. Agrega emails de los testers (hasta 100)
7. Comparte el link de testing con tu equipo

---

## 📋 Comandos Esenciales

```bash
# Instalar EAS CLI (si no lo tienes)
npm install -g eas-cli

# Login
eas login

# Configurar proyecto (primera vez)
eas build:configure

# Build APK (distribución directa)
eas build --platform android --profile preview

# Build AAB (para Play Console)
eas build --platform android --profile production

# Ver tus builds
eas build:list
```

---

## 🔄 Actualizar Versión

Cuando hagas cambios:

1. **Actualiza versión en `app.json`:**

```json
{
  "expo": {
    "version": "1.0.1" // Incrementa: 1.0.0 → 1.0.1
  }
}
```

2. **Construye nueva versión:**

```bash
eas build --platform android --profile preview
```

3. **Comparte el nuevo APK/AAB**

---

## 📊 Comparación

|                     | APK Directo    | Internal Testing |
| ------------------- | -------------- | ---------------- |
| **Setup**           | ⚡ 15 min      | 🕐 1-2 horas     |
| **Testers**         | ♾️ Ilimitados  | 👥 100 max       |
| **Actualizaciones** | 📲 Manual      | 🔄 Automáticas   |
| **Instalación**     | 📥 Download    | 📱 Play Store    |
| **Mejor para**      | Testing rápido | Testing continuo |

---

## ✅ Pasos Rápidos (Empezar Ahora)

```bash
# 1. Instalar EAS
npm install -g eas-cli

# 2. Login
eas login

# 3. Ir a carpeta mobile
cd mobile

# 4. Configurar
eas build:configure

# 5. Construir APK
eas build --platform android --profile preview
```

Toma ☕ mientras se construye (~10-15 min). Luego recibirás un link para descargar el APK.

---

## 📱 Mensaje para el Equipo

**Copia y pega esto para tu equipo:**

> **🚀 DivancoSaaS Mobile - Testing Interno**
>
> **Instalación:**
>
> 1. Descarga el APK: [link al APK]
> 2. En Android: Configuración → Seguridad → Activa "Instalar apps desconocidas"
> 3. Abre el APK e instala
>
> **Credenciales:**
>
> - URL: https://divancosaas-backend-h4esckd7cwbxhcdx.centralus-01.azurewebsites.net
> - Email: [tu email de prueba]
> - Pass: [tu contraseña de prueba]
>
> **Reportar bugs:** [tu canal de Slack/Email]

---

## 🆘 Solución de Problemas

**Build falla:**

```bash
# Ver detalles del build
eas build:view [BUILD_ID]
```

**"Install apps from unknown sources":**

- Android: Configuración → Seguridad → Fuentes desconocidas
- Android 8+: Permite específicamente al app (Chrome, Files, etc.)

**Cambios no aparecen:**

- Asegúrate de aumentar la versión en `app.json`
- Desinstala la app anterior antes de instalar la nueva

---

## 📈 Siguiente Nivel: Publicación Oficial

Cuando quieras publicar en Play Store para usuarios reales:

1. Aumenta versión a algo como `1.0.0`
2. Build AAB: `eas build --platform android --profile production`
3. Play Console → Producción → Subir AAB
4. Completa store listing (descripción, capturas, etc.)
5. Enviar a revisión (1-7 días)

La app estará en Play Store para todo el mundo.
