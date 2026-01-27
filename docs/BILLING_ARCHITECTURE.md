# ⚡ Arquitectura de Billing - Clean Architecture

## 🎯 Principio Fundamental

> **El CORE nunca conoce implementaciones concretas. Solo define contratos.**

Este documento explica cómo el sistema de billing de la plataforma SaaS sigue los principios de **Clean Architecture** y **Dependency Inversion**.

---

## 📐 Capas de la Arquitectura

```
┌─────────────────────────────────────────────┐
│          CORE (Contratos)                   │
│  - PlatformPaymentProvider (interfaz)       │
│  - BillingService (usa solo interfaz)       │
│  - NO conoce Stripe, Wompi, MercadoPago     │
└─────────────────────────────────────────────┘
              ↑ Depende de
              │
┌─────────────────────────────────────────────┐
│          ADAPTERS (Implementaciones)         │
│  - StripeAdapter                             │
│  - WompiAdapter                              │
│  - MercadoPagoAdapter                        │
│  ↳ Implementan PlatformPaymentProvider      │
└─────────────────────────────────────────────┘
              ↑ Usa
              │
┌─────────────────────────────────────────────┐
│        RESOLVER (Inyección)                  │
│  - PaymentProviderResolver                   │
│  - Selecciona provider según país/config    │
│  - Vive FUERA del core                       │
└─────────────────────────────────────────────┘
              ↑ Usa
              │
┌─────────────────────────────────────────────┐
│          ROUTES (Controladores)              │
│  - billing.routes.ts                         │
│  - webhook.routes.ts                         │
│  - Inyectan provider en BillingService      │
└─────────────────────────────────────────────┘
```

---

## 🔒 Reglas de Oro

### ✅ PERMITIDO

1. **CORE define interfaces**

   ```typescript
   // backend/src/core/contracts/providers.contract.ts
   export interface PlatformPaymentProvider {
     createSubscriptionPayment(params): Promise<PlatformPaymentIntent>;
     confirmSubscriptionPayment(id): Promise<PlatformPaymentResult>;
     refundSubscriptionPayment(id, amount?): Promise<PlatformRefundResult>;
     verifyWebhookSignature(payload, signature): boolean;
   }
   ```

2. **CORE usa solo interfaces**

   ```typescript
   // backend/src/core/services/billing.service.ts
   export class BillingService {
     constructor(private paymentProvider: PlatformPaymentProvider) {}
     // Solo conoce la interfaz, NO las implementaciones
   }
   ```

3. **ADAPTERS implementan interfaces**

   ```typescript
   // backend/src/adapters/payment/stripe.adapter.ts
   export class StripeAdapter implements PlatformPaymentProvider {
     async createSubscriptionPayment(params) {
       /* ... */
     }
   }
   ```

4. **RESOLVER inyecta dependencias**
   ```typescript
   // backend/src/adapters/payment/payment.resolver.ts
   export class PaymentProviderResolver {
     resolveProvider(tenantConfig): PlatformPaymentProvider {
       // Selecciona según país/configuración
     }
   }
   ```

### ❌ PROHIBIDO

1. **CORE importa adapters**

   ```typescript
   // ❌ NUNCA HACER ESTO
   import { StripeAdapter } from "@adapters/payment/stripe.adapter";
   ```

2. **CORE conoce SDKs externos**

   ```typescript
   // ❌ NUNCA HACER ESTO
   import Stripe from "stripe";
   ```

3. **CORE tiene lógica específica de proveedores**

   ```typescript
   // ❌ NUNCA HACER ESTO
   if (provider === "stripe") {
     /* lógica de stripe */
   }
   ```

4. **Servicios usan singletons con implementaciones**
   ```typescript
   // ❌ NUNCA HACER ESTO
   export const billingService = new BillingService(stripeAdapter);
   ```

---

## 🏗️ Estructura de Archivos

```
backend/src/
├── core/                           # CORE - Sin dependencias externas
│   ├── contracts/
│   │   └── providers.contract.ts   # PlatformPaymentProvider (interfaz)
│   ├── services/
│   │   └── billing.service.ts      # Usa solo interfaz (DI)
│   └── routes/
│       ├── billing.routes.ts       # Inyecta provider
│       └── webhook.routes.ts       # Inyecta provider
│
└── adapters/                       # ADAPTERS - Implementaciones
    └── payment/
        ├── stripe.adapter.ts       # Implementa interfaz
        ├── wompi.adapter.ts        # Implementa interfaz
        ├── mercadopago.adapter.ts  # Implementa interfaz
        └── payment.resolver.ts     # Resuelve provider
```

---

## 🔄 Flujo de Ejecución

### 1. Request llega a ruta

```typescript
// backend/src/core/routes/billing.routes.ts
router.post("/subscribe", authenticate, async (req, res) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  // Resolver provider FUERA del core
  const provider = paymentProviderResolver.resolveProvider({
    country: tenant.country,
    preferredPaymentProvider: tenant.preferredPaymentProvider,
  });

  // Inyectar provider en servicio
  const billingService = new BillingService(provider);

  // Ejecutar lógica de negocio
  const result = await billingService.createSubscription(tenantId, plan);

  res.json(result);
});
```

### 2. Resolver selecciona provider

```typescript
// backend/src/adapters/payment/payment.resolver.ts
resolveProvider(tenantConfig) {
  // Colombia → Wompi
  if (tenantConfig.country === 'CO' && this.providers.has('wompi')) {
    return this.providers.get('wompi');
  }

  // Argentina, México, Brasil → MercadoPago
  if (['AR', 'MX', 'BR'].includes(tenantConfig.country)) {
    return this.providers.get('mercadopago');
  }

  // Fallback → Stripe (global)
  return this.providers.get('stripe');
}
```

### 3. BillingService ejecuta

```typescript
// backend/src/core/services/billing.service.ts
export class BillingService {
  constructor(private paymentProvider: PlatformPaymentProvider) {}

  async createSubscription(tenantId, plan) {
    // Usar la INTERFAZ, no sabe qué implementación es
    const paymentIntent = await this.paymentProvider.createSubscriptionPayment({
      tenantId,
      plan,
      amount,
      currency,
      billingEmail,
    });

    // Guardar en BD
    return await prisma.platformSubscription.create({ ... });
  }
}
```

### 4. Adapter ejecuta lógica específica

```typescript
// backend/src/adapters/payment/stripe.adapter.ts
export class StripeAdapter implements PlatformPaymentProvider {
  async createSubscriptionPayment(params) {
    const stripe = require("stripe")(this.secretKey);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount * 100,
      currency: params.currency,
      // ...
    });
    return paymentIntent;
  }
}
```

---

## 🌍 Selección de Proveedores

### Reglas de Negocio

```typescript
// backend/src/adapters/payment/payment.resolver.ts

// 1. Colombia → Wompi (mejor 3DS para Colombia)
if (country === "CO" && wompiDisponible) {
  return wompi;
}

// 2. Argentina, México, Brasil → MercadoPago (amplia adopción Latam)
if (["AR", "MX", "BR"].includes(country) && mercadopagoDisponible) {
  return mercadopago;
}

// 3. Resto del mundo → Stripe (global, funciona en cualquier país)
return stripe;

// 4. Override manual → tenant.preferredPaymentProvider
if (tenant.preferredPaymentProvider) {
  return preferredProvider; // Ignora reglas de país
}
```

### Configuración por Tenant

```typescript
// Tenant puede forzar proveedor
await prisma.tenant.update({
  where: { id: tenantId },
  data: {
    preferredPaymentProvider: "stripe", // O 'wompi', 'mercadopago'
  },
});
```

---

## 🧪 Testing

### Test de Servicio (Mock del Provider)

```typescript
import { BillingService } from "@core/services/billing.service";
import { PlatformPaymentProvider } from "@core/contracts/providers.contract";

describe("BillingService", () => {
  it("should create subscription using provider", async () => {
    // Mock del provider (NO implementación real)
    const mockProvider: PlatformPaymentProvider = {
      name: "mock",
      createSubscriptionPayment: jest.fn().mockResolvedValue({
        id: "pi_mock",
        tenantId: "tenant1",
        amount: 49,
        currency: "usd",
        status: "pending",
      }),
      confirmSubscriptionPayment: jest.fn(),
      refundSubscriptionPayment: jest.fn(),
      verifyWebhookSignature: jest.fn(),
    };

    // Inyectar mock
    const billingService = new BillingService(mockProvider);

    // Test
    const result = await billingService.createSubscription("tenant1", "pro");

    expect(mockProvider.createSubscriptionPayment).toHaveBeenCalled();
    expect(result.subscription.plan).toBe("pro");
  });
});
```

---

## 🔧 Cómo Agregar Nuevo Proveedor

### 1. Crear Adapter

```typescript
// backend/src/adapters/payment/paypal.adapter.ts
import { PlatformPaymentProvider } from "@core/contracts/providers.contract";

export class PayPalAdapter implements PlatformPaymentProvider {
  readonly name = "paypal";

  async createSubscriptionPayment(params) {
    // Lógica de PayPal
  }

  async confirmSubscriptionPayment(id) {
    /* ... */
  }
  async refundSubscriptionPayment(id, amount?) {
    /* ... */
  }
  verifyWebhookSignature(payload, signature) {
    /* ... */
  }
}
```

### 2. Registrar en Resolver

```typescript
// backend/src/adapters/payment/payment.resolver.ts
private initializeProviders() {
  // ... proveedores existentes

  // Agregar PayPal
  if (process.env.PAYPAL_CLIENT_ID) {
    this.providers.set('paypal', new PayPalAdapter({
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    }));
  }
}
```

### 3. Actualizar Lógica de Selección

```typescript
resolveProvider(tenantConfig) {
  // ... lógica existente

  // Agregar regla de negocio
  if (country === 'US' && this.providers.has('paypal')) {
    return this.providers.get('paypal');
  }
}
```

### 4. Configurar Variables de Entorno

```bash
# .env
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

**¡Listo!** El CORE no cambió en absoluto.

---

## 📊 Beneficios de Esta Arquitectura

### ✅ Desacoplamiento Total

- El core NO conoce Stripe, Wompi, MercadoPago
- Cambiar proveedor no requiere modificar el core

### ✅ Extensibilidad

- Agregar nuevo proveedor: solo crear adapter
- No tocar servicios ni lógica de negocio

### ✅ Testabilidad

- Mock de providers es trivial
- Tests unitarios sin dependencias externas

### ✅ Mantenibilidad

- Cada proveedor es un archivo independiente
- Bugs en adapter no afectan el core

### ✅ Flexibilidad

- Cambiar lógica de selección sin tocar servicios
- Múltiples proveedores activos simultáneamente

---

## 🚨 Señales de Violación

Si ves esto en el CORE, **está MAL**:

```typescript
// ❌ Import de adapter
import { StripeAdapter } from "@adapters/...";

// ❌ Import de SDK
import Stripe from "stripe";

// ❌ Lógica específica de proveedor
if (provider === "stripe") {
  /* ... */
}

// ❌ Singleton con implementación
const billingService = new BillingService(stripeAdapter);

// ❌ Factory en el core
PaymentProviderFactory.getInstance();
```

---

## 📚 Referencias

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Dependency Inversion Principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
- [Adapter Pattern](https://refactoring.guru/design-patterns/adapter)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

**Conclusión**: Esta arquitectura garantiza que el sistema de billing sea **extensible, testeable y mantenible**, siguiendo los principios de Clean Architecture y SOLID.
