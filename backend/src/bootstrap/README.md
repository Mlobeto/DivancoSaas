# Bootstrap / Composition Root

Esta carpeta contiene la **raíz de composición** de la aplicación, donde se instancian e inyectan las dependencias concretas.

## 📋 Principio Arquitectural

**El core nunca importa adapters.** En lugar de eso:

1. **Bootstrap** (esta carpeta) instancia los adapters concretos
2. **app.ts** inyecta las dependencias en las rutas del core
3. **Core** solo conoce interfaces (contracts)

## 🔄 Flujo de Dependency Injection

```
┌──────────────────────────────────────────────────┐
│  bootstrap/payment-resolver.bootstrap.ts         │
│  - Instancia PaymentProviderResolver             │
│  - Conoce los adapters concretos                 │
└───────────────┬──────────────────────────────────┘
                │
                │ export resolver
                ▼
        ┌───────────────┐
        │    app.ts     │
        │  (Inyección)  │
        └───────┬───────┘
                │
                │ setPaymentProviderResolver()
                ▼
    ┌────────────────────────┐
    │  core/routes/*.routes  │
    │  - Recibe resolver     │
    │  - NO importa adapters │
    └────────────────────────┘
```

## ✅ Correcto (patrón actual)

```typescript
// bootstrap/payment-resolver.bootstrap.ts
import { PaymentProviderResolver } from "@integrations/adapters/payment/payment.resolver";
export const paymentProviderResolver = new PaymentProviderResolver();

// app.ts
import { paymentProviderResolver } from "./bootstrap/payment-resolver.bootstrap";
import billingRouter, {
  setPaymentProviderResolver,
} from "@core/routes/billing.routes";

setPaymentProviderResolver(paymentProviderResolver);

// core/routes/billing.routes.ts
import type { PaymentProviderResolver } from "@integrations/adapters/payment/payment.resolver";

let paymentProviderResolver: PaymentProviderResolver;
export function setPaymentProviderResolver(resolver: PaymentProviderResolver) {
  paymentProviderResolver = resolver;
}
```

## ❌ Incorrecto (violación del guardrail)

```typescript
// core/routes/billing.routes.ts
import { paymentProviderResolver } from "@integrations/adapters/payment/payment.resolver";
// ❌ El core NO debe importar de @integrations
```

## 📁 Archivos en esta carpeta

- `payment-resolver.bootstrap.ts` - Inicializa el resolver de payment providers

## 🔮 Futuros bootstraps

Cuando agreguemos más integraciones:

- `email-provider.bootstrap.ts` - SendGrid, SMTP, etc.
- `storage-provider.bootstrap.ts` - S3, Cloudinary, etc.
- `sms-provider.bootstrap.ts` - Twilio, etc.

Cada uno seguirá el mismo patrón: instanciar aquí, inyectar desde app.ts.
