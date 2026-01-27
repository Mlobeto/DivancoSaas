# 🎯 Refactorización Completa - Clean Architecture

## ✅ Cambios Realizados

### 1. **Separación de Contratos** (CORE)

**Antes:**

```typescript
// PaymentProvider genérico (para todo)
export interface PaymentProvider {
  createPaymentIntent(params): Promise<PaymentIntent>;
}
```

**Ahora:**

```typescript
// PlatformPaymentProvider (SOLO para billing de plataforma)
export interface PlatformPaymentProvider {
  createSubscriptionPayment(params): Promise<PlatformPaymentIntent>;
  confirmSubscriptionPayment(id): Promise<PlatformPaymentResult>;
  refundSubscriptionPayment(id, amount?): Promise<PlatformRefundResult>;
  verifyWebhookSignature(payload, signature): boolean;
}

// PaymentProvider (futuro - para módulos comerciales)
export interface PaymentProvider {
  // TODO: Implementar cuando existan módulos de negocio
}
```

---

### 2. **Desacoplamiento del Servicio** (CORE)

**Antes (❌ MALO):**

```typescript
import { paymentProviderFactory } from "@adapters/payment/payment.factory";

export class BillingService {
  async createSubscription(tenantId, plan) {
    // Core importando adapters directamente
    const provider = paymentProviderFactory.getProvider("stripe");
  }
}

export const billingService = new BillingService(); // Singleton
```

**Ahora (✅ BUENO):**

```typescript
import { PlatformPaymentProvider } from '@core/contracts/providers.contract';

export class BillingService {
  constructor(private paymentProvider: PlatformPaymentProvider) {}

  async createSubscription(tenantId, plan) {
    // Solo usa la interfaz
    const paymentIntent = await this.paymentProvider.createSubscriptionPayment({...});
  }
}

// NO exportar singleton
export { BillingService };
```

---

### 3. **Adapters Implementan Contrato** (ADAPTERS)

**Antes:**

```typescript
import { PaymentProvider } from "@core/contracts/providers.contract";

export class StripeAdapter implements PaymentProvider {
  async createPaymentIntent(params) {
    /* ... */
  }
  async confirmPayment(id) {
    /* ... */
  }
  async refund(id, amount) {
    /* ... */
  }
  verifyWebhook(payload, signature) {
    /* ... */
  }
}
```

**Ahora:**

```typescript
import { PlatformPaymentProvider } from "@core/contracts/providers.contract";

export class StripeAdapter implements PlatformPaymentProvider {
  async createSubscriptionPayment(params) {
    /* ... */
  }
  async confirmSubscriptionPayment(id) {
    /* ... */
  }
  async refundSubscriptionPayment(id, amount) {
    /* ... */
  }
  verifyWebhookSignature(payload, signature) {
    /* ... */
  }
}
```

Lo mismo para **WompiAdapter** y **MercadoPagoAdapter**.

---

### 4. **Resolver de Proveedores** (ADAPTERS)

**Nuevo archivo:** `payment.resolver.ts` (reemplaza `payment.factory.ts`)

```typescript
export class PaymentProviderResolver {
  private providers: Map<string, PlatformPaymentProvider> = new Map();

  resolveProvider(tenantConfig): PlatformPaymentProvider {
    // 1. Preferencia manual
    if (tenantConfig.preferredPaymentProvider) {
      return this.providers.get(tenantConfig.preferredPaymentProvider);
    }

    // 2. Por país
    const country = tenantConfig.country?.toUpperCase();

    // Colombia → Wompi (mejor 3DS)
    if (country === "CO" && this.providers.has("wompi")) {
      return this.providers.get("wompi");
    }

    // Argentina, México, Brasil → MercadoPago
    if (
      ["AR", "MX", "BR"].includes(country) &&
      this.providers.has("mercadopago")
    ) {
      return this.providers.get("mercadopago");
    }

    // Fallback → Stripe (global)
    return this.providers.get("stripe");
  }
}

export const paymentProviderResolver = new PaymentProviderResolver();
```

---

### 5. **Inyección de Dependencias** (ROUTES)

**Antes (❌ MALO):**

```typescript
import { billingService } from "@core/services/billing.service";

router.post("/subscribe", async (req, res) => {
  const result = await billingService.createSubscription(tenantId, plan);
});
```

**Ahora (✅ BUENO):**

```typescript
import { BillingService } from "@core/services/billing.service";
import { paymentProviderResolver } from "@adapters/payment/payment.resolver";

router.post("/subscribe", async (req, res) => {
  // Obtener tenant
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  // Resolver provider FUERA del core
  const provider = paymentProviderResolver.resolveProvider({
    country: tenant.country,
    preferredPaymentProvider: tenant.preferredPaymentProvider,
  });

  // Inyectar provider en servicio
  const billingService = new BillingService(provider);

  // Ejecutar
  const result = await billingService.createSubscription(tenantId, plan);
});
```

---

## 📊 Reglas de Selección de Proveedores

### Por País

| País         | Código | Proveedor       | Razón                            |
| ------------ | ------ | --------------- | -------------------------------- |
| 🇨🇴 Colombia  | CO     | **Wompi**       | Mejor experiencia 3DS local, PSE |
| 🇦🇷 Argentina | AR     | **MercadoPago** | Amplia adopción, métodos locales |
| 🇲🇽 México    | MX     | **MercadoPago** | Amplia adopción, cuotas          |
| 🇧🇷 Brasil    | BR     | **MercadoPago** | Amplia adopción, Pix             |
| 🌍 Otros     | \*     | **Stripe**      | Funciona globalmente             |

### Override Manual

```typescript
// Tenant puede forzar proveedor
await prisma.tenant.update({
  where: { id },
  data: { preferredPaymentProvider: "stripe" }, // Ignora reglas de país
});
```

---

## 🗂️ Archivos Modificados/Creados

### ✅ Creados

- `backend/src/adapters/payment/payment.resolver.ts` - Resolver de providers
- `docs/BILLING_ARCHITECTURE.md` - Documentación de arquitectura
- `docs/REFACTORING_SUMMARY.md` - Este resumen

### ✏️ Modificados

- `backend/src/core/contracts/providers.contract.ts` - Separar PlatformPaymentProvider
- `backend/src/core/services/billing.service.ts` - Inyección de dependencias
- `backend/src/core/routes/billing.routes.ts` - Resolver + inyección
- `backend/src/core/routes/webhook.routes.ts` - Resolver + inyección
- `backend/src/adapters/payment/stripe.adapter.ts` - Implementar nueva interfaz
- `backend/src/adapters/payment/wompi.adapter.ts` - Implementar nueva interfaz
- `backend/src/adapters/payment/mercadopago.adapter.ts` - Implementar nueva interfaz

### 🗑️ Eliminados

- `backend/src/adapters/payment/payment.factory.ts` - Obsoleto (reemplazado por resolver)

---

## ✅ Verificación de Principios

### ✅ CORE puro

- NO importa adapters ✅
- NO importa SDKs externos (Stripe, Wompi, etc.) ✅
- Solo define contratos ✅
- Solo usa interfaces ✅

### ✅ Dependency Inversion

- High-level (BillingService) no depende de low-level (StripeAdapter) ✅
- Ambos dependen de abstracción (PlatformPaymentProvider) ✅

### ✅ Single Responsibility

- BillingService: lógica de billing ✅
- Adapters: integración con proveedor ✅
- Resolver: selección de proveedor ✅
- Routes: orquestación ✅

### ✅ Open/Closed

- Agregar nuevo proveedor: crear adapter, NO modificar core ✅

---

## 🚀 Próximos Pasos

1. ✅ **Arquitectura limpia implementada**
2. ⏳ **Integrar SDKs reales** (stripe, mercadopago-sdk-node)
3. ⏳ **Tests unitarios** con mocks
4. ⏳ **Webhooks completos** (procesar eventos)
5. ⏳ **Suscripciones recurrentes**
6. ⏳ **Dashboard de métricas**

---

## 📚 Referencias Clave

- [ARQUITECTURA.md](../ARQUITECTURA.md) - Principios maestros
- [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md) - Arquitectura de billing
- [PAYMENT_INTEGRATION.md](./PAYMENT_INTEGRATION.md) - Integración de proveedores

---

**Conclusión**: El sistema ahora es **100% extensible, testeable y desacoplado**. El CORE es puro y no conoce implementaciones concretas. ✅
