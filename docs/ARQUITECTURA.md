# ARQUITECTURA DIVANC SaaS

## Principios de Diseño No Negociables

---

## 🔒 PRINCIPIOS NO NEGOCIABLES

### 1. Sistema MULTITENANT

- Todo dato pertenece SIEMPRE a un tenant
- Nunca debe existir acceso cruzado entre tenants
- Aislamiento total de datos

### 2. Business Units (Rubros de Negocio)

- Un tenant puede tener múltiples BUSINESS UNITS
- Cada businessUnit representa un negocio distinto
- Los datos NO se mezclan entre businessUnits
- Un mismo usuario puede operar en varias businessUnits con roles distintos

### 3. Módulos de Negocio Independientes

- Comercio, proyectos, ganadería, envíos, etc.
- Un tenant puede activar varios módulos en distintas businessUnits
- El core nunca depende de un módulo
- **Si algo parece "general" pero solo sirve para un rubro específico: NO VA EN EL CORE**

---

## 🏗️ CORE DEL SISTEMA

El CORE solo contiene lógica transversal y genérica:

- ✅ Autenticación
- ✅ Autorización (RBAC dinámico)
- ✅ Tenants
- ✅ Business Units
- ✅ Usuarios
- ✅ Roles y permisos configurables
- ✅ Motor de módulos (enable / disable)
- ✅ Motor de workflows configurables
- ✅ Billing de la PLATAFORMA SaaS (suscripciones)
- ✅ Auditoría y trazabilidad

### Tipos de Usuarios del Sistema:

El sistema distingue tres tipos de usuarios con propósitos diferentes:

1. **PLATFORM_OWNER** (Dueño del negocio SaaS)
   - Gestiona comercialmente la plataforma DivancoSaaS
   - Administra suscripciones de todos los tenants
   - Ve métricas de negocio (MRR, churn, revenue)
   - Aprueba/suspende/reactiva tenants
   - Configura precios y planes
   - **NO** tiene acceso a datos internos de los tenants
   - Dashboard: Admin comercial del SaaS

2. **SUPER_ADMIN** (Desarrolladora/equipo técnico)
   - Debugging y mantenimiento técnico
   - Acceso cross-tenant para troubleshooting
   - Ve logs, errores, sistema de auditoría
   - Gestiona infraestructura y deploys
   - Accede a base de datos directamente si es necesario
   - Dashboard: Herramientas técnicas y monitoreo

3. **TENANT (Cliente del SaaS)**
   - Usuario final que paga suscripción
   - Administra su propio tenant
   - Crea business units y usuarios
   - **NO** ve otros tenants
   - Dashboard: Su aplicación de negocio

**Importante**: PLATFORM_OWNER y SUPER_ADMIN son roles a nivel de plataforma, no pertenecen a ningún tenant. Los usuarios TENANT pertenecen a un tenant específico.

### El core:

- ❌ NO conoce rubros
- ❌ NO conoce integraciones concretas
- ✅ SOLO define interfaces (contracts)

---

## 🔄 WORKFLOWS

- Los estados NO se hardcodean
- Los workflows son configurables por módulo y businessUnit
- Ejemplos:
  - Estados de un proyecto
  - Etapas de una obra
  - Flujo creativo
  - Estados de un pedido

---

## � CANALES DE COMUNICACIÓN E INTENCIONES

### Principio fundamental: El sistema reacciona a INTENCIONES, no a mensajes

Los canales (WhatsApp, Web, App, API) son solo **transportes**. La lógica de negocio nunca debe ejecutarse dentro de un canal o adapter.

### 🧠 PRINCIPIOS OBLIGATORIOS

1. **El sistema NO reacciona a mensajes, reacciona a INTENCIONES**
2. Los canales son solo transportes
3. Nunca ejecutar lógica de negocio dentro de un canal o adapter
4. Nunca acoplar un módulo a un canal específico
5. Nunca asumir conectividad constante
6. Nunca mezclar datos entre tenants o businessUnits

---

### 📨 CANALES SOPORTADOS

- **WhatsApp** (Meta Cloud API)
- **App Mobile** (Expo – offline first)
- **Web** (React)
- **API externa** (REST/Webhooks)

#### Reglas de canales:

Cada canal debe:

- ✅ Traducir eventos externos a eventos normalizados
- ❌ NO acceder a módulos directamente
- ❌ NO decidir qué hacer con los datos
- ❌ NO contener lógica de negocio

---

### 🎯 SISTEMA DE INTENCIONES

Toda acción debe expresarse como una **intención explícita**:

**Ejemplos de intenciones:**

- `UPLOAD_IMAGE` - Subir una imagen al storage
- `PROJECT_UPDATE` - Actualizar estado de proyecto
- `SEND_PAYMENT_REMINDER` - Enviar recordatorio de pago
- `REGISTER_WORK_EVENT` - Registrar evento de trabajo en campo
- `CREATE_INVOICE` - Crear factura
- `ASSIGN_TASK` - Asignar tarea a usuario

#### Características de las intenciones:

- ✅ Son agnósticas al canal
- ✅ Una misma intención puede originarse desde múltiples canales
- ✅ El sistema decide qué acción ejecutar según:
  - `tenant`
  - `businessUnit`
  - Configuración activa
  - Permisos del usuario
- ✅ Son auditables y trazables

#### Ejemplo de flujo:

```
WhatsApp recibe: "Actualizar proyecto 123 a completado"
  ↓
Adapter normaliza: { intent: "PROJECT_UPDATE", projectId: 123, status: "completed" }
  ↓
Motor de Intenciones resuelve: ¿BU tiene módulo Projects activo?
  ↓
Módulo Projects ejecuta: updateProjectStatus()
  ↓
Auditoría registra: "User X updated Project 123 via WhatsApp"
```

---

### 🧩 MOTOR DE INTENCIONES

El **Motor de Intenciones** es el orquestador central que:

1. Recibe eventos normalizados desde cualquier canal
2. Determina la intención del evento
3. Valida permisos y configuración
4. Orquesta las acciones configuradas
5. Registra auditoría completa

#### Responsabilidades:

- ✅ Recibir eventos normalizados
- ✅ Determinar la intención
- ✅ Orquestar acciones configuradas
- ❌ NO contiene lógica de rubros
- ❌ NO conoce implementaciones concretas

#### Estructura del evento normalizado:

```typescript
interface NormalizedEvent {
  tenant: string;
  businessUnit: string;
  user: string;
  channel: "whatsapp" | "web" | "mobile" | "api";
  intent: string;
  payload: any;
  metadata: {
    timestamp: Date;
    ipAddress?: string;
    deviceId?: string;
  };
}
```

---

### ⚙️ CONFIGURACIÓN POR BUSINESS UNIT

Cada BusinessUnit define su propia configuración de canales e intenciones:

```json
{
  "businessUnitId": "uuid",
  "channels": {
    "whatsapp": {
      "enabled": true,
      "allowedIntents": [
        "PROJECT_UPDATE",
        "UPLOAD_IMAGE",
        "REGISTER_WORK_EVENT"
      ]
    },
    "mobile": {
      "enabled": true,
      "allowedIntents": ["*"]
    },
    "web": {
      "enabled": true,
      "allowedIntents": ["*"]
    }
  },
  "intentActions": {
    "UPLOAD_IMAGE": {
      "module": "storage",
      "action": "uploadToAzure",
      "config": {
        "container": "project-images",
        "autoCompress": true
      }
    },
    "PROJECT_UPDATE": {
      "module": "projects",
      "action": "updateStatus",
      "requiredPermission": "projects.update"
    }
  }
}
```

**Principio clave**: Copilot debe **leer configuración**, no hardcodear flujos.

---

### 🔁 OFFLINE FIRST (Mobile)

Para la aplicación móvil:

1. Las acciones generan **eventos locales**
2. Los eventos se persisten en cola local
3. Al reconectar, se sincronizan con el backend
4. El backend procesa eventos móviles igual que cualquier otro canal
5. Resolución de conflictos se maneja por timestamps y lógica de negocio

#### Ejemplo de cola de eventos offline:

```typescript
[
  {
    id: "local-uuid-1",
    intent: "REGISTER_WORK_EVENT",
    payload: { hours: 8, projectId: "123" },
    createdAt: "2026-02-01T08:00:00Z",
    synced: false,
  },
  {
    id: "local-uuid-2",
    intent: "UPLOAD_IMAGE",
    payload: { image: "base64...", projectId: "123" },
    createdAt: "2026-02-01T09:00:00Z",
    synced: false,
  },
];
```

---

### 🔌 ADAPTERS DE CANALES

Los adapters de canales tienen **una sola responsabilidad**: traducir eventos externos a eventos normalizados.

#### Ejemplo: WhatsApp Adapter

```typescript
// ✅ CORRECTO
class WhatsAppChannelAdapter {
  async handleIncomingMessage(message: WhatsAppMessage) {
    const normalizedEvent = this.normalize(message);
    await intentEngine.process(normalizedEvent);
  }

  private normalize(message: WhatsAppMessage): NormalizedEvent {
    return {
      tenant: this.resolveTenant(message.from),
      businessUnit: this.resolveBusinessUnit(message.from),
      user: this.resolveUser(message.from),
      channel: "whatsapp",
      intent: this.extractIntent(message.body),
      payload: this.extractPayload(message),
      metadata: {
        timestamp: new Date(),
      },
    };
  }
}

// ❌ INCORRECTO
class WhatsAppAdapter {
  async handleIncomingMessage(message: WhatsAppMessage) {
    // ❌ NO hacer esto
    if (message.body.includes("proyecto")) {
      await projectModule.updateProject(/*...*/);
    }
  }
}
```

#### Reglas para adapters:

- ✅ Implementan únicamente traducción de eventos
- ✅ Implementan contracts del core
- ❌ NO contienen reglas de negocio
- ❌ NO importan módulos directamente
- ❌ NO deciden qué acción ejecutar

---

### 🛡️ SEGURIDAD Y VALIDACIÓN

Todo evento debe validarse contra:

1. **Tenant**: ¿El evento pertenece a un tenant válido?
2. **BusinessUnit**: ¿La BU existe y está activa?
3. **Usuario**: ¿El usuario está autenticado y autorizado?
4. **Canal**: ¿El canal está habilitado para esta BU?
5. **Intención**: ¿La intención está permitida desde este canal?
6. **Permisos**: ¿El usuario tiene permisos para esta acción?

#### Ejemplo de validación:

```typescript
async validateEvent(event: NormalizedEvent): Promise<boolean> {
  // Validar tenant
  const tenant = await tenantService.findById(event.tenant);
  if (!tenant || tenant.status !== 'ACTIVE') return false;

  // Validar BusinessUnit
  const bu = await businessUnitService.findById(event.businessUnit);
  if (!bu || bu.tenantId !== event.tenant) return false;

  // Validar canal habilitado
  const config = await configService.getChannelConfig(event.businessUnit);
  if (!config.channels[event.channel]?.enabled) return false;

  // Validar intención permitida
  const allowedIntents = config.channels[event.channel].allowedIntents;
  if (allowedIntents !== ['*'] && !allowedIntents.includes(event.intent)) {
    return false;
  }

  // Validar permisos de usuario
  const hasPermission = await authService.checkPermission(
    event.user,
    event.intent
  );
  return hasPermission;
}
```

#### WhatsApp: Identidad verificada

- Los usuarios de WhatsApp deben estar previamente registrados y asociados a su número
- Nunca confiar en nombres de contacto o mensajes no verificados
- Implementar flujo de vinculación: código QR o token único
- Rechazar eventos ambiguos o sin contexto claro

---

### 📋 AUDITORÍA (OBLIGATORIO)

Toda intención procesada debe:

- ✅ Generar evento de auditoría
- ✅ Registrar canal origen
- ✅ Registrar usuario responsable
- ✅ Incluir timestamp
- ✅ Guardar payload original y normalizado
- ✅ Ser trazable end-to-end

#### Estructura de log de auditoría:

```typescript
{
  id: "uuid",
  tenantId: "uuid",
  businessUnitId: "uuid",
  userId: "uuid",
  channel: "whatsapp",
  intent: "PROJECT_UPDATE",
  entity: "project",
  entityId: "123",
  action: "update",
  oldData: { status: "in-progress" },
  newData: { status: "completed" },
  metadata: {
    timestamp: "2026-02-01T10:00:00Z",
    ipAddress: "192.168.1.1",
    userAgent: "WhatsApp/2.23.1",
    phoneNumber: "+573001234567"
  }
}
```

---

### ❌ PROHIBICIONES ABSOLUTAS

1. ❌ **Hardcodear lógica por rubro** en el motor de intenciones
2. ❌ **Usar if/else por canal** para decidir acciones
3. ❌ **Importar adapters dentro del core** (solo contracts)
4. ❌ **Ejecutar lógica de negocio en controllers de canales**
5. ❌ **Asumir que WhatsApp "sabe" qué hacer** (solo traduce)
6. ❌ **Mezclar contextos de tenant o businessUnit**
7. ❌ **Asumir conectividad constante** (siempre pensar offline-first)

---

### ✅ BUENAS PRÁCTICAS

1. ✅ **Siempre validar el contexto completo** (tenant + BU + usuario)
2. ✅ **Usar configuración dinámica** en lugar de código hardcodeado
3. ✅ **Implementar idempotencia** (eventos duplicados no deben causar problemas)
4. ✅ **Registrar auditoría completa** de cada acción
5. ✅ **Diseñar intenciones genéricas** que sirvan para múltiples rubros
6. ✅ **Separar transporte de lógica** siempre
7. ✅ **Pensar en mobile + web + WhatsApp** desde el diseño

---

### 🎯 OBJETIVO

Generar código que sea:

- ✅ **Extensible**: Agregar nuevos canales sin cambiar el core
- ✅ **Modular**: Cada pieza con responsabilidad única
- ✅ **Desacoplado**: Canales no conocen módulos, módulos no conocen canales
- ✅ **Seguro**: Validación en cada paso
- ✅ **Preparado para múltiples rubros**: Sin asumir un negocio específico
- ✅ **Compatible con web + mobile + WhatsApp**: Mismo backend para todos

---

### 📌 REGLA FINAL

> **Si una funcionalidad parece general pero solo aplica a un rubro específico,  
> NO VA EN EL CORE.**
>
> Si una lógica depende del canal de origen,  
> está en el lugar equivocado.

---

## �🔌 INTEGRACIONES EXTERNAS

Se manejan con **ADAPTERS**:

- El core define interfaces (contracts)
- Las implementaciones viven fuera del core
- **El core nunca importa adapters**
- La resolución del adapter se realiza por configuración y composición en el bootstrap de la aplicación

### Ejemplo de estructura:

```
core/contracts/payment.provider.ts (interfaz)
core/contracts/email.provider.ts (interfaz)
core/contracts/whatsapp.provider.ts (interfaz)

integrations/adapters/payment/
  ├── stripe.adapter.ts
  ├── wompi.adapter.ts
  └── mercadopago.adapter.ts

integrations/adapters/email/
  └── sendgrid.adapter.ts

integrations/adapters/whatsapp/
  └── meta-whatsapp.adapter.ts
```

### Tipos de integraciones:

#### Comunicaciones

- **Email**: SendGrid (transaccional y marketing)
- **WhatsApp**: Meta Cloud API directa (sin intermediarios)
- **SMS**: Twilio u otros proveedores

#### Pagos

- Stripe (internacional)
- MercadoPago (LATAM)
- Wompi (Colombia)

#### Storage y multimedia

- **Azure Blob Storage** (almacenamiento principal)
- **Sharp** (procesamiento de imágenes en Node.js)
- **Azure CDN** (distribución global)

#### Facturación electrónica

- Siigo (Colombia)
- Facturama (México)

#### Otros

- Google Maps (geolocalización)
- Analytics

### Configuración por BusinessUnit

**PRINCIPIO CLAVE**: Cada BusinessUnit configura sus propias credenciales de integraciones.

- Un tenant puede tener múltiples BusinessUnits
- Cada BU puede usar diferentes proveedores
- Ejemplo:
  - BU "Obras Civiles" usa MercadoPago
  - BU "Desarrollos Inmobiliarios" usa Stripe
  - Ambas comparten el mismo tenant pero tienen configuraciones independientes

### Almacenamiento de credenciales

```prisma
model IntegrationCredential {
  businessUnitId  String
  provider        IntegrationType // SENDGRID, META_WHATSAPP, etc.
  credentials     Json            // Encriptado
  isActive        Boolean
}
```

Las credenciales se almacenan:

- ✅ Encriptadas en la base de datos
- ✅ Por BusinessUnit (no compartidas)
- ✅ Con validación de configuración
- ✅ Con fecha de última validación

**IMPORTANTE**: El billing del SaaS es independiente de los pagos del negocio del cliente.

---

## 📁 ALMACENAMIENTO DE ARCHIVOS E IMÁGENES

### Solución: Azure Blob Storage + Sharp

La plataforma usa **Azure Blob Storage** como solución de almacenamiento por las siguientes razones:

#### Ventajas técnicas y económicas

- **Costos**: ~90% más económico que Cloudinary para grandes volúmenes
- **Integración nativa**: Ecosistema completo en Azure (donde se desplegará en producción)
- **Escalabilidad**: Ilimitada con CDN global (Azure CDN / Front Door)
- **Control total**: Sobre compresión, formatos, y políticas de almacenamiento
- **Por BusinessUnit**: Containers separados por BU para aislamiento de datos

#### Stack tecnológico

```
Azure Blob Storage (almacenamiento)
  ↓
Sharp (compresión/transformación en Node.js)
  ↓
Azure CDN (distribución global)
  ↓
SAS Tokens (URLs firmadas temporales)
```

#### Capacidades específicas

**Tipos de archivos soportados:**

- Imágenes: JPG, PNG, WebP, AVIF (con compresión automática)
- Imágenes 360° (metadata preservada)
- Documentos: PDF, DOCX, XLSX
- Videos: MP4, MOV (con Azure Media Services para transcodificación)
- Audio: MP3, WAV

**Procesamiento con Sharp:**

- Compresión automática de imágenes
- Redimensionamiento y thumbnails
- Conversión a formatos modernos (WebP, AVIF)
- Marcas de agua
- Recortes inteligentes

**App móvil offline:**

- Uploads chunked para archivos grandes
- SDKs nativos para React Native
- Reintentos automáticos en reconexión
- Cola de uploads pendientes

#### Arquitectura de containers

```
Tenant: "Constructora ABC"
  ├── Container: "obras-civiles-images"
  ├── Container: "obras-civiles-documents"
  ├── Container: "obras-civiles-videos"
  └── Container: "desarrollos-images"
```

#### Seguridad

- **SAS Tokens**: URLs firmadas con expiración temporal
- **Access tiers**: Hot (frecuente), Cool (ocasional), Archive (histórico)
- **Cifrado**: AES-256 en reposo por defecto
- **CORS**: Configurado por BusinessUnit
- **Private endpoints**: Para acceso desde VNet de Azure

#### Configuración por BusinessUnit

Cada BU configura sus credenciales de Azure:

```json
{
  "provider": "AZURE_BLOB_STORAGE",
  "credentials": {
    "accountName": "divancostorage",
    "accountKey": "***",
    "containerPrefix": "obras-civiles",
    "cdnEndpoint": "https://cdn.divanco.com"
  }
}
```

---

## 🧪 DOCUMENTACIÓN Y PRUEBAS DE API

La plataforma utiliza **OpenAPI (Swagger)** como estándar obligatorio para documentar y probar la API.

### Objetivos

- Facilitar pruebas manuales y automáticas
- Documentar contratos entre frontend, mobile y backend
- Servir como fuente única de verdad para los endpoints
- Facilitar integraciones externas futuras

---

### Principios

- ✅ **Todo endpoint público debe estar documentado**
- ✅ Los contratos reflejan la arquitectura real (tenants, businessUnits, módulos)
- ❌ Swagger NO contiene lógica de negocio
- ❌ Swagger NO define permisos hardcodeados

---

### Alcance de la documentación

Cada endpoint debe incluir:

- Método y ruta
- Descripción clara
- Requisitos de autenticación
- Parámetros obligatorios:
  - `tenantId`
  - `businessUnitId` (cuando aplique)
- Body con schemas tipados
- Ejemplos de request y response
- Códigos de error esperados

---

### Seguridad en Swagger

- Autenticación vía **Bearer Token (JWT)**
- Swagger debe permitir:
  - Login
  - Setear token
  - Probar endpoints autenticados

⚠️ **Nunca exponer secretos ni claves reales en Swagger**

---

### Separación por Contexto

- Endpoints del CORE documentados como:
  - Auth
  - Tenants
  - Business Units
  - Users
  - Roles / Permissions
  - Billing Plataforma
  - Modules
  - Workflows

- Endpoints de módulos se documentan:
  - Dentro del módulo
  - Con su propio tag OpenAPI
  - Sin contaminar el core

---

### Integraciones y Webhooks

- Webhooks entrantes y salientes deben estar documentados
- Cada adapter define:
  - Payload esperado
  - Firma / validación
  - Ejemplo real del proveedor

---

### Uso esperado

Swagger es una **herramienta de desarrollo y validación**, no un producto final para el cliente.

- Frontend y mobile se desarrollan contra el contrato OpenAPI
- Los tests pueden generarse a partir del schema
- Los cambios en endpoints requieren actualizar Swagger

---

## 💻 FRONTEND WEB

### Stack tecnológico:

- React
- TanStack Query para estado remoto
- Zustand para estado local/UI
- Tailwind CSS
- Siempre responsive

### Principios:

- UI desacoplada de módulos concretos
- La UI se adapta a la configuración enviada por el backend
- Estética profesional tipo AutoCAD 2014 (sobria, técnica, no "marketinera")
- Componentes genéricos reutilizables

---

## 📱 APLICACIÓN MÓVIL

### Stack tecnológico:

- Expo + React Native
- Solo para módulos que lo requieran

### Módulos candidatos:

- Operarios
- Campo/ganadería
- Construcción/obra
- Logística

### Arquitectura OFFLINE FIRST:

- El backend NO asume conectividad constante
- Persistencia local
- Cola de eventos
- Sincronización al reconectar
- Resolución de conflictos por backend

---

## ⚠️ REGLAS ESTRICTAS

1. ❌ Nunca mezclar tenants
2. ❌ Nunca mezclar businessUnits
3. ❌ No hardcodear estados ni roles
4. ❌ No acoplar frontend a módulos específicos
5. ❌ No meter lógica de rubro en el core
6. ✅ Priorizar extensibilidad antes que rapidez
7. ✅ Pensar siempre en web + mobile (pero no mobile-first obligatorio)

---

## 🎯 OBJETIVO FINAL

Construir un SaaS profesional, escalable y extensible, capaz de soportar:

- ✅ Múltiples rubros de negocio
- ✅ Integraciones externas
- ✅ Aplicaciones móviles
- ✅ Sin reescribir el backend
- ✅ Sin comprometer la separación de datos

---

## 📐 ESTRUCTURA DE DATOS

### Jerarquía:

```
Platform
  └── Tenant (empresa cliente del SaaS)
      └── Business Unit (rubro de negocio)
          └── Modules (activados por BU)
              └── Data (aislada por BU)
```

### Ejemplo real:

```
Platform: DivancoSaaS
  └── Tenant: "Constructora ABC"
      ├── Business Unit: "Obras Civiles"
      │   └── Modules: [projects, machinery, hr]
      └── Business Unit: "Desarrollos Inmobiliarios"
          └── Modules: [projects, sales, marketing]
```

### Separación de contextos:

- Un usuario puede tener rol "admin" en "Obras Civiles"
- Y rol "viewer" en "Desarrollos Inmobiliarios"
- Los datos de proyectos NO se mezclan entre BUs

---

## 🛣️ ENDPOINTS DE LA API (CORE)

### Base URL: `/api/v1`

Todos los endpoints requieren autenticación JWT mediante header `Authorization: Bearer <token>`, excepto los marcados como públicos.

---

### 🔐 Autenticación

#### `POST /auth/register`

Registro de nuevo tenant y usuario administrador.

**Body:**

```json
{
  "tenantName": "Constructora ABC",
  "tenantSlug": "constructora-abc",
  "email": "admin@constructora.com",
  "password": "SecurePass123!",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

#### `POST /auth/login`

Login de usuario existente.

**Body:**

```json
{
  "email": "admin@constructora.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "admin@constructora.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "tenantId": "uuid"
    }
  }
}
```

#### `POST /auth/request-password-reset`

Solicitar reset de contraseña.

#### `POST /auth/reset-password`

Confirmar reset de contraseña con token.

---

### 🏢 Tenants

#### `GET /tenants/:tenantId`

Obtiene información del tenant.

#### `PUT /tenants/:tenantId`

Actualiza información del tenant (nombre, país, proveedor de pagos preferido).

#### `GET /tenants/:tenantId/subscription`

Obtiene el estado de la suscripción del tenant al SaaS.

---

### 🏗️ Business Units

#### `GET /business-units?tenantId=<uuid>`

Lista todas las BUs de un tenant.

#### `POST /business-units`

Crea una nueva Business Unit.

**Body:**

```json
{
  "tenantId": "uuid",
  "name": "Obras Civiles",
  "slug": "obras-civiles",
  "description": "División de construcción de infraestructura"
}
```

#### `GET /business-units/:businessUnitId`

Obtiene detalles de una BU específica.

#### `PUT /business-units/:businessUnitId`

Actualiza una BU.

#### `DELETE /business-units/:businessUnitId`

Elimina una BU (y todos sus datos asociados).

---

### 👥 Usuarios

#### `GET /users?tenantId=<uuid>`

Lista todos los usuarios de un tenant.

#### `POST /users`

Crea un nuevo usuario en el tenant.

**Body:**

```json
{
  "tenantId": "uuid",
  "email": "operario@constructora.com",
  "password": "SecurePass123!",
  "firstName": "Carlos",
  "lastName": "López"
}
```

#### `GET /users/:userId`

Obtiene información de un usuario.

#### `PUT /users/:userId`

Actualiza información de un usuario.

#### `DELETE /users/:userId`

Elimina un usuario (soft delete).

#### `POST /users/:userId/business-units`

Asigna un usuario a una BusinessUnit con un rol específico.

**Body:**

```json
{
  "businessUnitId": "uuid",
  "roleId": "uuid"
}
```

---

### 🧩 Módulos

#### `GET /modules`

Lista todos los módulos disponibles en la plataforma.

#### `GET /modules/:moduleId`

Obtiene detalles de un módulo específico.

#### `POST /business-units/:businessUnitId/modules`

Activa un módulo en una BusinessUnit.

**Body:**

```json
{
  "moduleId": "uuid",
  "config": {
    "key": "value"
  }
}
```

#### `DELETE /business-units/:businessUnitId/modules/:moduleId`

Desactiva un módulo de una BusinessUnit.

---

### 🔄 Workflows

#### `GET /workflows?businessUnitId=<uuid>`

Lista workflows configurados para una BU.

#### `POST /workflows`

Crea un workflow personalizado.

**Body:**

```json
{
  "businessUnitId": "uuid",
  "moduleId": "uuid",
  "name": "Flujo de Proyectos",
  "states": [
    {
      "id": "draft",
      "name": "Borrador",
      "color": "#gray",
      "order": 1,
      "isInitial": true
    },
    {
      "id": "in-progress",
      "name": "En Progreso",
      "color": "#blue",
      "order": 2
    },
    {
      "id": "completed",
      "name": "Completado",
      "color": "#green",
      "order": 3,
      "isFinal": true
    }
  ],
  "transitions": [
    {
      "from": "draft",
      "to": "in-progress",
      "label": "Iniciar",
      "requiredRole": "manager"
    },
    {
      "from": "in-progress",
      "to": "completed",
      "label": "Finalizar",
      "requiredRole": "admin"
    }
  ]
}
```

#### `PUT /workflows/:workflowId`

Actualiza un workflow.

#### `DELETE /workflows/:workflowId`

Elimina un workflow.

---

### 💳 Billing (Suscripciones del SaaS)

#### `POST /billing/create-subscription`

Crea una suscripción para el tenant.

**Body:**

```json
{
  "tenantId": "uuid",
  "plan": "pro",
  "billingCycle": "monthly",
  "paymentProvider": "stripe"
}
```

#### `POST /billing/cancel-subscription`

Cancela la suscripción del tenant.

#### `GET /billing/invoices?tenantId=<uuid>`

Lista todas las facturas del tenant.

---

### 🔌 Integraciones

#### `GET /integrations/:businessUnitId`

Lista todas las integraciones configuradas para una BU.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "provider": "META_WHATSAPP",
      "isActive": true,
      "lastValidated": "2026-02-01T10:00:00Z",
      "createdAt": "2026-01-15T08:00:00Z"
    }
  ]
}
```

#### `POST /integrations/:businessUnitId`

Configura o actualiza credenciales de una integración.

**Body (ejemplo WhatsApp):**

```json
{
  "provider": "META_WHATSAPP",
  "credentials": {
    "phoneNumberId": "123456789",
    "businessAccountId": "987654321",
    "accessToken": "EAAxxxxxxxxxx",
    "webhookVerifyToken": "mi-token-secreto",
    "apiVersion": "v18.0"
  }
}
```

**Body (ejemplo SendGrid):**

```json
{
  "provider": "SENDGRID",
  "credentials": {
    "apiKey": "SG.xxxxxxxxxxxxxxx",
    "fromEmail": "noreply@miempresa.com",
    "fromName": "Mi Empresa"
  }
}
```

#### `PUT /integrations/:businessUnitId/:provider/toggle`

Activa o desactiva una integración.

**Body:**

```json
{
  "isActive": false
}
```

#### `DELETE /integrations/:businessUnitId/:provider`

Elimina permanentemente las credenciales de una integración.

#### `POST /integrations/:businessUnitId/:provider/validate`

Valida las credenciales haciendo una prueba real con el proveedor.

#### `GET /integrations/:businessUnitId/:provider/status`

Verifica si una integración está configurada y activa.

---

### 📱 WhatsApp

#### `POST /whatsapp/send/text`

Envía un mensaje de texto por WhatsApp.

**Body:**

```json
{
  "to": "+573001234567",
  "message": "Hola, tu pedido está en camino",
  "businessUnitId": "uuid"
}
```

#### `POST /whatsapp/send/template`

Envía un mensaje usando una plantilla aprobada por Meta.

**Body:**

```json
{
  "to": "+573001234567",
  "templateName": "welcome_message",
  "language": "es_MX",
  "businessUnitId": "uuid",
  "components": [
    {
      "type": "body",
      "parameters": [{ "type": "text", "text": "Juan Pérez" }]
    }
  ]
}
```

#### `POST /whatsapp/send/media`

Envía un archivo multimedia por WhatsApp.

**Body:**

```json
{
  "to": "+573001234567",
  "mediaType": "document",
  "mediaUrl": "https://ejemplo.com/archivo.pdf",
  "filename": "factura_123.pdf",
  "caption": "Adjunto el documento solicitado",
  "businessUnitId": "uuid"
}
```

#### `GET /whatsapp/webhook/:businessUnitId` (público)

Verifica el webhook de Meta (configuración inicial).

**Query params:**

- `hub.mode=subscribe`
- `hub.verify_token=<token>`
- `hub.challenge=<challenge>`

#### `POST /whatsapp/webhook/:businessUnitId` (público)

Recibe webhooks de Meta con mensajes entrantes y cambios de estado.

#### `GET /whatsapp/status/:businessUnitId`

Verifica si WhatsApp está configurado para una BU.

---

### 📊 Auditoría

#### `GET /audit-logs?tenantId=<uuid>&entity=<entity>&from=<date>&to=<date>`

Lista registros de auditoría filtrados.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "userId": "uuid",
      "entity": "project",
      "entityId": "uuid",
      "action": "update",
      "oldData": {},
      "newData": {},
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2026-02-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 234
  }
}
```

---

### 🔗 Webhooks (públicos)

#### `POST /webhooks/stripe`

Recibe webhooks de Stripe para eventos de pagos.

#### `POST /webhooks/mercadopago`

Recibe webhooks de MercadoPago para eventos de pagos.

#### `POST /webhooks/wompi`

Recibe webhooks de Wompi para eventos de pagos.

---

**Fecha de creación**: Enero 2026  
**Versión**: 1.0.0  
**Prioridad**: MÁXIMA - Este documento es la guía absoluta del proyecto
