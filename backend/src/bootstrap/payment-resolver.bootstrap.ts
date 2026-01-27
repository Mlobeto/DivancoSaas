/**
 * PAYMENT RESOLVER BOOTSTRAP
 * Instancia y exporta el resolver de payment providers
 *
 * Este archivo vive FUERA del core y es quien conoce las implementaciones concretas
 */

import { PaymentProviderResolver } from "@integrations/adapters/payment/payment.resolver";

// Instanciar el resolver (singleton)
export const paymentProviderResolver = new PaymentProviderResolver();
