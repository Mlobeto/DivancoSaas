# 💳 Integración de Pagos Multi-Proveedor

Este documento describe cómo funciona el sistema de pagos multi-proveedor para el billing de la plataforma SaaS.

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Proveedores Soportados](#proveedores-soportados)
- [Selección Automática](#selección-automática)
- [Configuración](#configuración)
- [Uso](#uso)
- [Webhooks](#webhooks)
- [Testing](#testing)

---

## 🏗️ Arquitectura

El sistema de pagos sigue el **patrón Adapter** definido en los principios arquitectónicos:

```
BillingService
    ↓
PaymentProviderFactory
    ↓
┌───────────┬───────────┬──────────────┐
│  Stripe   │   Wompi   │  MercadoPago │
│  Adapter  │  Adapter  │   Adapter    │
└───────────┴───────────┴──────────────┘
```

**Componentes clave:**

- `PaymentProvider` (interface): Contrato que todos los adapters implementan
- `PaymentProviderFactory`: Singleton que selecciona el proveedor adecuado
- Adapters concretos: Implementaciones para cada proveedor

---

## 🌍 Proveedores Soportados

### 1. **Stripe** (Global)

- **País:** Todos (fallback global)
- **Características:**
  - Soporte para 135+ monedas
  - 3D Secure 2.0 automático
  - Excelente documentación
  - SDKs oficiales
- **Uso:** Mercados internacionales, USA, Europa

### 2. **Wompi** (Colombia)

- **País:** Colombia (CO)
- **Características:**
  - Optimizado para mercado colombiano
  - 3D Secure nativo (requisito en Colombia)
  - Soporte PSE (débito bancario)
  - Pagos en COP
- **Uso:** Tenants colombianos
- **Documentación:** https://docs.wompi.co/

### 3. **MercadoPago** (Latinoamérica)

- **Países:** AR, MX, BR, CL, PE, UY, CO
- **Características:**
  - Amplia adopción en Latam
  - Múltiples métodos de pago locales
  - Soporte para cuotas
  - Integración con Mercado Libre
- **Uso:** Tenants de América Latina
- **Documentación:** https://www.mercadopago.com/developers

---

## 🎯 Selección Automática

El `PaymentProviderFactory` selecciona el proveedor según esta lógica:

```typescript
1. Si tenant.preferredPaymentProvider existe → usar ese proveedor
2. Si tenant.country === 'CO' → Wompi (mejor para Colombia)
3. Si tenant.country en ['AR', 'MX', 'BR', 'CL', 'PE', 'UY'] → MercadoPago
4. Fallback → Stripe (global)
```

### Ejemplo de uso:

```typescript
// El factory selecciona automáticamente
const provider = paymentProviderFactory.getProviderForCountry("CO");
// → Wompi

const provider = paymentProviderFactory.getProviderForCountry("MX");
// → MercadoPago

const provider = paymentProviderFactory.getProviderForCountry("US");
// → Stripe
```

---

## ⚙️ Configuración

### 1. Variables de Entorno

Copia `.env.example` a `.env` y configura:

```bash
# Stripe (Global)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Wompi (Colombia)
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_PRIVATE_KEY=prv_test_...
WOMPI_EVENTS_SECRET=...
WOMPI_ENVIRONMENT=test  # test | production

# MercadoPago (Latam)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_PUBLIC_KEY=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=...
```

### 2. Configuración del Tenant

Al crear un tenant, especifica el país:

```typescript
await prisma.tenant.create({
  data: {
    name: "Mi Empresa",
    slug: "mi-empresa",
    country: "CO", // ISO 3166-1 alpha-2
    // Opcional: forzar un proveedor específico
    preferredPaymentProvider: "wompi",
  },
});
```

---

## 🚀 Uso

### Crear Suscripción

```typescript
import { billingService } from '@core/services/billing.service';

// El servicio selecciona automáticamente el proveedor
const result = await billingService.createSubscription(
  tenantId,
  'pro' // free, pro, enterprise
);

// Resultado:
{
  subscription: { ... },
  paymentIntent: {
    id: 'pi_...',
    clientSecret: '...',
    amount: 49,
    currency: 'usd',
  },
  provider: 'stripe' // o 'wompi', 'mercadopago'
}
```

### Confirmar Pago

```typescript
const subscription = await billingService.confirmSubscriptionPayment(
  subscriptionId,
  paymentIntentId,
);
```

### Cancelar Suscripción

```typescript
const result = await billingService.cancelSubscription(
  subscriptionId,
  true, // refund = true
);
```

---

## 🔔 Webhooks

Cada proveedor envía webhooks para notificar eventos. Las URLs son:

```
POST /api/v1/webhooks/stripe
POST /api/v1/webhooks/wompi
POST /api/v1/webhooks/mercadopago
```

### Configuración en Proveedores

**Stripe:**

```bash
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
```

**Wompi:**
Configurar en dashboard: `https://tu-dominio.com/api/v1/webhooks/wompi`

**MercadoPago:**
Configurar en dashboard: `https://tu-dominio.com/api/v1/webhooks/mercadopago`

### Verificación de Firmas

Todos los webhooks son verificados con firmas criptográficas:

```typescript
// Automático en cada adapter
const isValid = paymentProvider.verifyWebhook(payload, signature);
```

---

## 🧪 Testing

### Modo Test

Todos los proveedores tienen modo sandbox/test:

**Stripe:**

- Usar `sk_test_...` y tarjetas de prueba: `4242 4242 4242 4242`

**Wompi:**

- `WOMPI_ENVIRONMENT=test`
- Tarjetas de prueba en docs

**MercadoPago:**

- Usar credenciales de test
- Tarjetas de prueba por país en docs

### Simular Pagos

```typescript
// En desarrollo, los adapters devuelven mocks
const paymentIntent = await provider.createPaymentIntent({
  amount: 100,
  currency: "usd",
  description: "Test",
});
// → { id: 'mock_...', status: 'pending', ... }
```

### Testing de Webhooks

```bash
# Stripe CLI
stripe trigger payment_intent.succeeded

# Wompi - usar Postman con payload de ejemplo

# MercadoPago - usar webhooks simulados del dashboard
```

---

## 🔐 Seguridad

### Mejores Prácticas

1. **Nunca expongas claves privadas** en el frontend
2. **Verifica todas las firmas** de webhooks
3. **Usa HTTPS** en producción para webhooks
4. **Almacena tokens** de forma segura (variables de entorno)
5. **Implementa rate limiting** en endpoints de pago
6. **Audita todas las transacciones** (tabla AuditLog)

### Logging de Transacciones

```typescript
// Automático con el middleware de auditoría
// Todas las operaciones quedan en AuditLog
```

---

## 📊 Monitoreo

### Métricas Importantes

- Tasa de éxito de pagos por proveedor
- Tiempo de respuesta de APIs
- Webhooks fallidos
- Refunds procesados

### Logs

```typescript
// Los adapters loguean errores automáticamente
console.error("Stripe webhook verification failed:", error);
```

---

## 🔄 Migración entre Proveedores

Si un tenant quiere cambiar de proveedor:

```typescript
await prisma.tenant.update({
  where: { id: tenantId },
  data: {
    preferredPaymentProvider: "mercadopago", // nuevo proveedor
  },
});

// Las próximas suscripciones usarán el nuevo proveedor
```

---

## 📚 Referencias

- [Stripe API Docs](https://stripe.com/docs/api)
- [Wompi API Docs](https://docs.wompi.co/)
- [MercadoPago API Docs](https://www.mercadopago.com/developers)
- [Arquitectura DivancoSaaS](../ARQUITECTURA.md)
- [Payment Provider Contract](../backend/src/core/contracts/providers.contract.ts)

---

## 🐛 Troubleshooting

### Problema: "No payment provider available for country"

**Solución:** Verificar que las variables de entorno estén configuradas para el proveedor del país.

### Problema: "Webhook verification failed"

**Solución:** Verificar que el `*_WEBHOOK_SECRET` sea correcto y coincida con el del proveedor.

### Problema: "Payment intent creation failed"

**Solución:** Revisar logs del adapter específico, verificar credenciales y estado de la cuenta.

---

## 💡 Próximos Pasos

- [ ] Implementar SDKs oficiales (stripe, mercadopago-sdk-node)
- [ ] Agregar más métodos de pago locales (PSE, OXXO, Boleto)
- [ ] Implementar suscripciones recurrentes automáticas
- [ ] Agregar dashboard de métricas de pagos
- [ ] Implementar retry logic para webhooks fallidos
- [ ] Agregar soporte para más monedas y conversiones

---

**¿Dudas?** Revisa la [Arquitectura](../ARQUITECTURA.md) o contacta al equipo.
