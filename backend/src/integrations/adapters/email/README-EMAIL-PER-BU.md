# Email por BusinessUnit - Guía de Implementación

## 📋 Estado Actual

✅ **Completado:**

- Adapter de Azure Communication Services creado
- Enum `IntegrationType` actualizado con `AZURE_COMMUNICATION_SERVICES`
- Tabla `BusinessUnitIntegration` lista para almacenar credenciales

⏳ **Pendiente:**

- Refactorizar `EmailService` para resolver provider por BusinessUnit
- Crear factory/resolver de email providers
- Migración de datos (mover credenciales globales a BusinessUnit)

---

## 🏗️ Arquitectura Propuesta

### Flujo Actual (Global)

```
EmailService → SendGrid (credenciales en .env)
```

### Flujo Nuevo (Por BusinessUnit)

```
EmailService → getEmailProvider(businessUnitId) → {
  BusinessUnit_A → Azure Communication Services
  BusinessUnit_B → SendGrid
  BusinessUnit_C → SMTP Custom
}
```

---

## 🔧 Pasos de Implementación

### 1. Crear Email Provider Resolver

Crear archivo: `backend/src/bootstrap/email-resolver.bootstrap.ts`

```typescript
import { EmailProvider } from "@core/contracts/email.provider";
import { SendGridEmailAdapter } from "@integrations/adapters/email/sendgrid-email.adapter";
import { AzureCommunicationEmailAdapter } from "@integrations/adapters/email/azure-communication-email.adapter";

export function emailProviderResolver(
  provider: string,
  config: any,
): EmailProvider {
  switch (provider) {
    case "sendgrid":
      return new SendGridEmailAdapter({
        apiKey: config.apiKey,
        defaultFrom: config.defaultFrom,
      });

    case "azure-communication-services":
      return new AzureCommunicationEmailAdapter({
        connectionString: config.connectionString,
        defaultFrom: config.defaultFrom,
      });

    default:
      throw new Error(`Email provider ${provider} not supported`);
  }
}
```

### 2. Refactorizar EmailService

Modificar `backend/src/core/services/email.service.ts`:

```typescript
import { EmailProvider } from "@core/contracts/email.provider";
import prisma from "@config/database";

export class EmailService {
  /**
   * Obtener provider de email por BusinessUnit
   */
  private async getEmailProvider(
    businessUnitId: string,
  ): Promise<EmailProvider> {
    const integration = await prisma.businessUnitIntegration.findFirst({
      where: {
        businessUnitId,
        type: "email",
        isActive: true,
      },
    });

    if (!integration) {
      throw new Error(
        `No email integration configured for BusinessUnit ${businessUnitId}`,
      );
    }

    return emailProviderResolver(integration.provider, integration.credentials);
  }

  /**
   * Enviar email usando el provider de la BusinessUnit
   */
  async sendEmail(
    businessUnitId: string,
    params: {
      to: string;
      subject: string;
      html: string;
    },
  ): Promise<void> {
    const provider = await this.getEmailProvider(businessUnitId);

    const result = await provider.sendEmail({
      to: params.to,
      from: (provider as any).defaultFrom, // o desde integration.config
      subject: params.subject,
      html: params.html,
    });

    if (!result.success) {
      throw new Error(result.error);
    }
  }
}
```

### 3. Actualizar llamadas a EmailService

Cambiar en `auth.service.ts` y otros:

```typescript
// Antes:
await emailService.sendWelcomeEmail(email, firstName, tenantName);

// Después:
await emailService.sendEmail(businessUnitId, {
  to: email,
  subject: `Bienvenido a ${tenantName}`,
  html: this.renderWelcomeTemplate(firstName, tenantName),
});
```

### 4. Migrar credenciales existentes

Crear script de migración para mover credenciales de `.env` a `BusinessUnitIntegration`:

```typescript
// Script: scripts/migrate-email-credentials.ts
import prisma from "@config/database";

async function migrateEmailCredentials() {
  const businessUnits = await prisma.businessUnit.findMany();

  for (const bu of businessUnits) {
    await prisma.businessUnitIntegration.upsert({
      where: {
        businessUnitId_type_provider: {
          businessUnitId: bu.id,
          type: "email",
          provider: "sendgrid", // o el que uses
        },
      },
      update: {},
      create: {
        businessUnitId: bu.id,
        type: "email",
        provider: "sendgrid",
        credentials: {
          apiKey: process.env.SENDGRID_API_KEY,
        },
        config: {
          defaultFrom: process.env.SENDGRID_FROM_EMAIL,
          defaultFromName: process.env.SENDGRID_FROM_NAME,
        },
        isActive: true,
      },
    });
  }

  console.log("✅ Email credentials migrated to all BusinessUnits");
}

migrateEmailCredentials();
```

---

## 📝 Configurar por BusinessUnit (UI/API)

### Endpoint para configurar email

```typescript
// POST /api/v1/business-units/:id/integrations/email
router.post("/:id/integrations/email", async (req, res) => {
  const { id } = req.params;
  const { provider, credentials, config } = req.body;

  const integration = await prisma.businessUnitIntegration.upsert({
    where: {
      businessUnitId_type_provider: {
        businessUnitId: id,
        type: "email",
        provider,
      },
    },
    update: {
      credentials,
      config,
      isActive: true,
    },
    create: {
      businessUnitId: id,
      type: "email",
      provider,
      credentials,
      config,
      isActive: true,
    },
  });

  res.json({ success: true, data: integration });
});
```

### Ejemplo de request:

**Azure Communication Services:**

```json
{
  "provider": "azure-communication-services",
  "credentials": {
    "connectionString": "endpoint=https://xxx.communication.azure.com/;accesskey=xxx"
  },
  "config": {
    "defaultFrom": "noreply@divanco.com",
    "defaultFromName": "Grupo Divanco"
  }
}
```

**SendGrid:**

```json
{
  "provider": "sendgrid",
  "credentials": {
    "apiKey": "SG.xxxxxxxxx"
  },
  "config": {
    "defaultFrom": "admin@miempresa.com",
    "defaultFromName": "Mi Empresa"
  }
}
```

---

## 🎯 Prioridad de Implementación

### Para tu demo de mañana:

- ❌ NO cambiar nada - usa SendGrid global como está

### Después de la demo:

1. ✅ Crear adapter de SendGrid (extraer de EmailService)
2. ✅ Crear email resolver
3. ✅ Refactorizar EmailService
4. ✅ Migrar credenciales a BusinessUnitIntegration
5. ✅ Crear endpoints de configuración
6. ✅ UI para gestionar integraciones

---

## 💡 Ventajas

✅ Cada BusinessUnit puede usar su propio proveedor de email
✅ Credenciales aisladas por BusinessUnit (seguridad)
✅ Cambiar provider sin afectar otras BusinessUnits
✅ Soporte para múltiples proveedores en paralelo
✅ Configuración desde UI sin tocar .env

---

## 📚 Documentación

- [Azure Communication Services](https://learn.microsoft.com/en-us/azure/communication-services/)
- [SendGrid Node.js SDK](https://github.com/sendgrid/sendgrid-nodejs)
- [Email Provider Contract](../src/core/contracts/email.provider.ts)

---

**Última actualización**: 2026-02-03  
**Estado**: Adapter creado, pendiente refactorización de EmailService
