# 📱 Guía para Publicar en Google Play Store

## 1️⃣ Crear Cuenta de Google Play Developer

1. Ve a https://play.google.com/console/signup
2. Paga $25 USD (una sola vez)
3. Completa el perfil de desarrollador

## 2️⃣ Instalar EAS CLI

```bash
npm install -g eas-cli
```

## 3️⃣ Login en Expo

```bash
eas login
```

Si no tienes cuenta de Expo, créala gratis en https://expo.dev

## 4️⃣ Configurar el Proyecto

```bash
# Desde la carpeta mobile/
eas build:configure
```

## 5️⃣ Construir APK para Pruebas (Opcional)

Para probar antes de publicar, genera un APK:

```bash
eas build --platform android --profile preview
```

Esto genera un APK que puedes instalar directamente en tu teléfono.

## 6️⃣ Construir AAB para Play Store

Para publicar en Play Store necesitas un Android App Bundle (AAB):

```bash
eas build --platform android --profile production
```

**Proceso:**

- Toma ~10-20 minutos
- Te pedirá generar keystore (di "yes")
- Al final te da un link para descargar el AAB

## 7️⃣ Subir a Google Play Console

1. Ve a https://play.google.com/console
2. Click en "Crear aplicación"
3. Completa:
   - Nombre: **DivancoSaaS Mobile**
   - Idioma predeterminado: **Español**
   - Tipo: **Aplicación**
   - Gratuita/Pago: **Gratuita**

4. En el menú lateral → **Producción** → **Crear nueva versión**

5. Sube el archivo `.aab` que descargaste de EAS

6. Completa la información requerida:
   - **Descripción corta** (80 caracteres)
   - **Descripción completa** (4000 caracteres)
   - **Capturas de pantalla** (mínimo 2, máximo 8)
   - **Ícono de la app** (512x512 px)
   - **Gráfico destacado** (1024x500 px)

7. Click en **Enviar para revisión**

## 8️⃣ Proceso de Revisión

- Google tarda 1-7 días en revisar
- Recibirás un email cuando sea aprobada
- La app estará disponible en Play Store

## 🔄 Actualizaciones Futuras

Cuando quieras actualizar la app:

1. Aumenta `version` en `app.json`:

   ```json
   "version": "1.0.1"
   ```

2. Construye nueva versión:

   ```bash
   eas build --platform android --profile production
   ```

3. Sube el nuevo AAB en Play Console

## 📝 Notas Importantes

- **Keystore**: EAS guarda tu keystore automáticamente. NO lo pierdas.
- **Permisos**: Revisa que la app solo pida los permisos necesarios
- **Testing**: Prueba bien antes de publicar (usa `preview` profile)
- **Políticas**: Lee las políticas de Google Play antes de publicar

## 🆘 Comandos Útiles

```bash
# Ver estado de builds
eas build:list

# Ver detalles de un build
eas build:view [BUILD_ID]

# Submit directo a Play Store (requiere service account)
eas submit --platform android
```

## 🎯 Checklist Pre-Publicación

- [ ] Version correcta en app.json
- [ ] Íconos de 512x512 listos
- [ ] Capturas de pantalla tomadas (2-8)
- [ ] Descripción de app escrita
- [ ] App probada en dispositivo físico
- [ ] Cuenta de Play Developer creada
- [ ] Build production descargado
