/**
 * PURCHASES MODULE - ROUTES
 * Rutas para gestión de proveedores, cotizaciones y órdenes de compra
 */

import { Router } from "express";
import { SupplierController } from "../controllers/supplier.controller";
import { QuoteController } from "../controllers/quote.controller";
import { PurchaseOrderController } from "../controllers/purchase-order.controller";
import { SupplyCategoryController } from "../controllers/supply-category.controller";
import { SupplyController } from "../controllers/supply.controller";
import { authenticate, authorize } from "@core/middlewares/auth.middleware";

const router = Router();

// Aplicar autenticación a todas las rutas del módulo
router.use(authenticate);

// ============================================
// SUPPLY CATEGORIES
// ============================================

router.get(
  "/supply-categories/stats",
  authorize("supply-categories:read"),
  SupplyCategoryController.getStats,
);
router.post(
  "/supply-categories",
  authorize("supply-categories:create"),
  SupplyCategoryController.createCategory,
);
router.get(
  "/supply-categories",
  authorize("supply-categories:read"),
  SupplyCategoryController.listCategories,
);
router.get(
  "/supply-categories/:categoryId",
  authorize("supply-categories:read"),
  SupplyCategoryController.getCategory,
);
router.put(
  "/supply-categories/:categoryId",
  authorize("supply-categories:update"),
  SupplyCategoryController.updateCategory,
);
router.delete(
  "/supply-categories/:categoryId",
  authorize("supply-categories:delete"),
  SupplyCategoryController.deleteCategory,
);
router.patch(
  "/supply-categories/:categoryId/toggle-active",
  authorize("supply-categories:update"),
  SupplyCategoryController.toggleActive,
);

// Import route
router.post(
  "/supply-categories/import",
  authorize("supply-categories:create"),
  SupplyCategoryController.getUploadMiddleware(),
  SupplyCategoryController.importCSV,
);

// ============================================
// SUPPLIES (SUMINISTROS)
// ============================================

router.post(
  "/supplies",
  authorize("supplies:create"),
  SupplyController.createSupply,
);
router.get(
  "/supplies",
  authorize("supplies:read"),
  SupplyController.listSupplies,
);
router.get(
  "/supplies/:supplyId",
  authorize("supplies:read"),
  SupplyController.getSupply,
);
router.patch(
  "/supplies/:supplyId",
  authorize("supplies:update"),
  SupplyController.updateSupply,
);
router.delete(
  "/supplies/:supplyId",
  authorize("supplies:delete"),
  SupplyController.deleteSupply,
);
router.patch(
  "/supplies/:supplyId/toggle-active",
  authorize("supplies:update"),
  SupplyController.toggleActive,
);
router.post(
  "/supplies/:supplyId/adjust-stock",
  authorize("supplies:update"),
  SupplyController.adjustStock,
);

// Import route
router.post(
  "/supplies/import",
  authorize("supplies:create"),
  SupplyController.getUploadMiddleware(),
  SupplyController.importCSV,
);

// ============================================
// SUPPLIERS
// ============================================

router.post(
  "/suppliers",
  authorize("suppliers:create"),
  SupplierController.createSupplier,
);
router.get(
  "/suppliers",
  authorize("suppliers:read"),
  SupplierController.listSuppliers,
);
router.get(
  "/suppliers/:supplierId",
  authorize("suppliers:read"),
  SupplierController.getSupplier,
);
router.put(
  "/suppliers/:supplierId",
  authorize("suppliers:update"),
  SupplierController.updateSupplier,
);
router.delete(
  "/suppliers/:supplierId",
  authorize("suppliers:delete"),
  SupplierController.deleteSupplier,
);

// Contactos de proveedores
router.post(
  "/suppliers/:supplierId/contacts",
  authorize("suppliers:update"),
  SupplierController.addContact,
);
router.put(
  "/suppliers/contacts/:contactId",
  authorize("suppliers:update"),
  SupplierController.updateContact,
);
router.delete(
  "/suppliers/contacts/:contactId",
  authorize("suppliers:update"),
  SupplierController.deleteContact,
);

// Cuenta corriente
router.get(
  "/suppliers/:supplierId/account/balance",
  authorize("suppliers:read"),
  SupplierController.getAccountBalance,
);
router.get(
  "/suppliers/:supplierId/account/history",
  authorize("suppliers:read"),
  SupplierController.getAccountHistory,
);
router.post(
  "/suppliers/:supplierId/account/entries",
  authorize("suppliers:update"),
  SupplierController.createAccountEntry,
);

// ============================================
// QUOTES (COTIZACIONES)
// ============================================

router.post(
  "/quotes",
  authorize("supply-quotes:create"),
  QuoteController.createQuote,
);
router.get(
  "/quotes",
  authorize("supply-quotes:read"),
  QuoteController.listQuotes,
);
router.get(
  "/quotes/compare/:supplyId",
  authorize("supply-quotes:read"),
  QuoteController.compareQuotes,
);
router.get(
  "/quotes/:quoteId",
  authorize("supply-quotes:read"),
  QuoteController.getQuote,
);
router.put(
  "/quotes/:quoteId",
  authorize("supply-quotes:update"),
  QuoteController.updateQuote,
);
router.delete(
  "/quotes/:quoteId",
  authorize("supply-quotes:delete"),
  QuoteController.deleteQuote,
);
router.post(
  "/quotes/deactivate-expired",
  authorize("supply-quotes:update"),
  QuoteController.deactivateExpiredQuotes,
);

// Cotizaciones activas de un proveedor
router.get(
  "/suppliers/:supplierId/active-quotes",
  authorize("supply-quotes:read"),
  QuoteController.getActiveQuotesBySupplierId,
);

// ============================================
// PURCHASE ORDERS (ÓRDENES DE COMPRA)
// ============================================

router.post(
  "/purchase-orders",
  authorize("purchase-orders:create"),
  PurchaseOrderController.createPurchaseOrder,
);
router.get(
  "/purchase-orders",
  authorize("purchase-orders:read"),
  PurchaseOrderController.listPurchaseOrders,
);
router.get(
  "/purchase-orders/:orderId",
  authorize("purchase-orders:read"),
  PurchaseOrderController.getPurchaseOrder,
);
router.put(
  "/purchase-orders/:orderId",
  authorize("purchase-orders:update"),
  PurchaseOrderController.updatePurchaseOrder,
);

// Acciones sobre órdenes
router.post(
  "/purchase-orders/:orderId/submit",
  authorize("purchase-orders:create"),
  PurchaseOrderController.submitForApproval,
);
router.post(
  "/purchase-orders/:orderId/approve",
  authorize("purchase-orders:approve"),
  PurchaseOrderController.approvePurchaseOrder,
);
router.post(
  "/purchase-orders/:orderId/reject",
  authorize("purchase-orders:approve"),
  PurchaseOrderController.rejectPurchaseOrder,
);
router.post(
  "/purchase-orders/:orderId/confirm",
  authorize("purchase-orders:update"),
  PurchaseOrderController.confirmOrder,
);
router.post(
  "/purchase-orders/:orderId/cancel",
  authorize("purchase-orders:delete"),
  PurchaseOrderController.cancelOrder,
);
router.post(
  "/purchase-orders/:orderId/receive",
  authorize("purchase-orders:update"),
  PurchaseOrderController.receivePurchaseOrder,
);

// Items de órdenes de compra
router.post(
  "/purchase-orders/:orderId/items",
  authorize("purchase-orders:update"),
  PurchaseOrderController.addItem,
);
router.put(
  "/purchase-orders/items/:itemId",
  authorize("purchase-orders:update"),
  PurchaseOrderController.updateItem,
);
router.delete(
  "/purchase-orders/items/:itemId",
  authorize("purchase-orders:update"),
  PurchaseOrderController.deleteItem,
);

export default router;
