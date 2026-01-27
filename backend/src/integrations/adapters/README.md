# Adapters: Implementaciones de Integraciones Externas

Los adapters son implementaciones concretas de los contracts definidos en el core.

**IMPORTANTE**: El core nunca importa adapters. La resolución se hace por composición en el bootstrap.

## 📂 Estructura

```
integrations/adapters/
├── payment/
│   ├── stripe.adapter.ts
│   ├── mercadopago.adapter.ts
│   ├── wompi.adapter.ts
│   └── payment.resolver.ts
├── storage/
│   ├── s3.adapter.ts
│   └── cloudinary.adapter.ts
├── email/
│   ├── sendgrid.adapter.ts
│   └── smtp.adapter.ts
└── shipping/
    ├── fedex.adapter.ts
    └── dhl.adapter.ts
```

## ✅ Reglas para Adapters

1. **Implementar el contract correspondiente**

   ```typescript
   export class StripeAdapter implements PlatformPaymentProvider {
     readonly name = "stripe";
     // ...
   }
   ```

2. **No tener lógica de negocio**
   - Solo traducir entre el SaaS y el servicio externo

3. **Configuración por tenant/businessUnit**
   - Cada cliente puede usar diferentes proveedores

4. **Manejo de errores**
   - Traducir errores del proveedor a errores del sistema

5. **Normalización de webhooks**
   - El adapter valida firma y parsea payload
   - Devuelve eventos normalizados al core
   - El core NUNCA ve payloads crudos

## 🔌 Ejemplo: Payment Provider

Ver contract: `core/contracts/payment.provider.ts`

```typescript
import { PlatformPaymentProvider } from "@core/contracts/payment.provider";
import { WebhookAdapter } from "@core/contracts/webhook.adapter";

export class StripeAdapter implements PlatformPaymentProvider, WebhookAdapter {
  readonly name = "stripe";

  async createSubscriptionPayment(params: SubscriptionPaymentParams) {
    // Implementación con API de Stripe
  }

  async confirmSubscriptionPayment(paymentIntentId: string) {
    // ...
  }

  async refundSubscriptionPayment(paymentIntentId: string, amount?: number) {
    // ...
  }

  async parseWebhook(
    rawPayload: any,
    signature: string,
  ): Promise<PaymentEvent | null> {
    // 1. Verificar firma
    // 2. Parsear y normalizar evento
    // 3. Devolver PaymentEvent normalizado
  }
}
```

## ⚠️ Importante

- Los adapters NO deben ser usados directamente por los módulos
- Usar siempre el contract (interfaz) del core
- El core nunca importa adapters
- La resolución se hace en el bootstrap/routes
