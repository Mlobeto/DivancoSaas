# 📘 Guía de Documentación OpenAPI - DivancoSaaS

## ✅ Endpoints Ya Documentados

### Auth (auth.routes.ts)

- ✅ `POST /auth/register` - Registro de tenant + usuario admin
- ✅ `POST /auth/login` - Login de usuario

### Billing Platform (billing.routes.ts)

- ✅ `POST /billing/subscribe` - Crear suscripción al SaaS
- ✅ `GET /billing/subscription` - Obtener suscripción activa
- ✅ `GET /billing/plans` - Listar planes disponibles

### Tenants (tenant.routes.ts)

- ✅ `GET /tenants/me` - Info del tenant actual

---

## 📋 Patrón de Documentación

### Estructura Estándar

```typescript
/**
 * @openapi
 * /ruta/{parametro}:
 *   metodo:
 *     tags: [Categoría]
 *     summary: Título corto
 *     description: Descripción detallada con contexto multitenant
 *     security:
 *       - bearerAuth: []      # Si requiere auth
 *     parameters:              # Para path/query params
 *       - in: path
 *         name: parametro
 *         required: true
 *         schema:
 *           type: string
 *         description: Descripción del parámetro
 *     requestBody:             # Para POST/PUT/PATCH
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [campo1, campo2]
 *             properties:
 *               campo1:
 *                 type: string
 *                 example: "valor"
 *     responses:
 *       200:
 *         description: Éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campo: { type: string }
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 */
router.metodo("/ruta", middleware, handler);
```

---

## 🎯 Tags Recomendados

Organiza los endpoints por contexto:

```yaml
Tags del CORE:
  - Auth                    # Autenticación y registro
  - Tenants                 # Gestión de tenants
  - Business Units          # Unidades de negocio
  - Users                   # Gestión de usuarios
  - Roles & Permissions     # RBAC dinámico
  - Modules                 # Activación de módulos
  - Workflows               # Configuración de workflows
  - Billing - Platform      # Suscripciones al SaaS
  - Audit                   # Logs de auditoría

Tags de MÓDULOS:
  - [Module] Projects       # Módulo de proyectos
  - [Module] Livestock      # Módulo de ganadería
  - [Module] Sales          # Módulo de ventas
  # etc.
```

---

## 📝 Siguientes Rutas a Documentar

### 1. user.routes.ts (Alta prioridad)

```typescript
GET    /users              # Listar usuarios del tenant
POST   /users              # Crear usuario
GET    /users/:id          # Detalle de usuario
PUT    /users/:id          # Actualizar usuario
DELETE /users/:id          # Eliminar usuario
POST   /users/:id/roles    # Asignar rol en businessUnit
```

**Consideraciones:**

- Incluir `businessUnitId` en listados si aplica
- Documentar que un usuario puede tener roles diferentes por BU
- Ejemplos con permisos dinámicos (no hardcodeados)

### 2. business-unit.routes.ts (Alta prioridad)

```typescript
GET    /business-units           # Listar BUs del tenant
POST   /business-units           # Crear BU
GET    /business-units/:id       # Detalle de BU
PUT    /business-units/:id       # Actualizar BU
GET    /business-units/:id/modules  # Módulos activados en BU
```

**Consideraciones:**

- Enfatizar aislamiento de datos entre BUs
- Documentar que los módulos se activan por BU

### 3. module.routes.ts (Media prioridad)

```typescript
GET    /modules                  # Listar módulos disponibles
GET    /modules/:businessUnitId  # Módulos activos en BU
POST   /modules/:businessUnitId/:moduleId/enable   # Activar módulo
POST   /modules/:businessUnitId/:moduleId/disable  # Desactivar módulo
```

**Consideraciones:**

- Diferenciar módulos disponibles vs activados
- Documentar permisos requeridos por módulo

### 4. workflow.routes.ts (Media prioridad)

```typescript
GET    /workflows/:businessUnitId           # Workflows configurados en BU
POST   /workflows/:businessUnitId           # Crear workflow
GET    /workflows/:businessUnitId/:id       # Detalle workflow
PUT    /workflows/:businessUnitId/:id       # Actualizar workflow
```

**Consideraciones:**

- Workflows son configurables, no hardcodeados
- Diferentes workflows por módulo y BU

### 5. webhook.routes.ts (Baja prioridad - interno)

```typescript
POST   /webhooks/stripe          # Webhook de Stripe
POST   /webhooks/wompi           # Webhook de Wompi
POST   /webhooks/mercadopago     # Webhook de MercadoPago
```

**⚠️ IMPORTANTE:**

- NO documentar con Swagger público (son internos)
- O documentar en sección separada "Webhooks Internos"
- Incluir estructura del payload pero SIN secretos reales
- Usar placeholders: `"signature": "whsec_XXXXXX"`

---

## 🔐 Componentes de Seguridad

Ya configurados en `swagger.ts`:

```yaml
securitySchemes:
  bearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT

# Uso en endpoints:
security:
  - bearerAuth: []
```

---

## 🎨 Schemas Reutilizables

Considera definir en `components/schemas`:

```typescript
// En swagger.ts
components: {
  schemas: {
    Error: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    Tenant: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        slug: { type: 'string' },
        plan: { type: 'string' },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'SUSPENDED', 'CANCELLED']
        }
      }
    },
    BusinessUnit: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        tenantId: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        type: { type: 'string' }
      }
    },
    User: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        tenantId: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED']
        }
      }
    }
  }
}
```

**Uso en endpoints:**

```typescript
schema: $ref: "#/components/schemas/User";
```

---

## ✅ Checklist por Endpoint

Antes de considerar un endpoint "documentado":

- [ ] Tag apropiado
- [ ] Summary claro (1 línea)
- [ ] Description con contexto (multitenant, BU si aplica)
- [ ] `security: bearerAuth` si requiere auth
- [ ] Parámetros de path/query documentados
- [ ] Request body con ejemplos reales
- [ ] Responses 200, 400, 401, 403, 500
- [ ] Ejemplos que NO expongan datos reales/sensibles
- [ ] Mencionar `tenantId` y `businessUnitId` cuando aplique

---

## 🚀 Próximos Pasos

1. **Documentar user.routes.ts** (crítico para frontend)
2. **Documentar business-unit.routes.ts** (crítico para arquitectura)
3. **Agregar schemas reutilizables** en swagger.ts
4. **Probar en Swagger UI**: http://localhost:3000/api-docs
5. **Iterar** según feedback del frontend/mobile

---

## 💡 Tips

- **No sobre-documentar**: Solo endpoints públicos/usados
- **Mantener sincronizado**: Actualizar Swagger cuando cambies código
- **Usar schemas**: $ref reduce duplicación
- **Ejemplos realistas**: Pero nunca datos reales de producción
- **Separar webhooks**: Contexto interno vs público

---

**Estado actual:** ✅ Base implementada, lista para escalar
