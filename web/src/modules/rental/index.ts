/**
 * RENTAL MODULE - EXPORTS
 * Módulo de cotizaciones, contratos de renta y estados de cuenta
 */

// Types
export * from "./types/quotation.types.ts";

// Services
export * from "./services/quotation.service.ts";
export * from "./services/template.service.ts";

// Pages
export { QuotationsListPage } from "./pages/QuotationsListPage.tsx";
export { QuotationFormPage } from "./pages/QuotationFormPage.tsx";
export { QuotationTemplatesPage } from "./pages/QuotationTemplatesPage.tsx";
export { ContractsListPage } from "./pages/ContractsListPage.tsx";
export { AccountsListPage } from "./pages/AccountsListPage.tsx";
