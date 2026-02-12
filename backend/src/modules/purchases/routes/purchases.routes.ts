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
import { authenticate } from "@core/middlewares/auth.middleware";

const router = Router();

// Aplicar autenticación a todas las rutas del módulo
router.use(authenticate);

// ============================================
// SUPPLY CATEGORIES
// ============================================

router.get("/supply-categories/stats", SupplyCategoryController.getStats);
router.post("/supply-categories", SupplyCategoryController.createCategory);
router.get("/supply-categories", SupplyCategoryController.listCategories);
router.get(
  "/supply-categories/:categoryId",
  SupplyCategoryController.getCategory,
);
router.put(
  "/supply-categories/:categoryId",
  SupplyCategoryController.updateCategory,
);
router.delete(
  "/supply-categories/:categoryId",
  SupplyCategoryController.deleteCategory,
);
router.patch(
  "/supply-categories/:categoryId/toggle-active",
  SupplyCategoryController.toggleActive,
);

// ============================================
// SUPPLIES (SUMINISTROS)
// ============================================

router.post("/supplies", SupplyController.createSupply);
router.get("/supplies", SupplyController.listSupplies);
router.get("/supplies/:supplyId", SupplyController.getSupply);
router.patch("/supplies/:supplyId", SupplyController.updateSupply);
router.delete("/supplies/:supplyId", SupplyController.deleteSupply);
router.patch(
  "/supplies/:supplyId/toggle-active",
  SupplyController.toggleActive,
);
router.post("/supplies/:supplyId/adjust-stock", SupplyController.adjustStock);

// ============================================
// SUPPLIERS
// ============================================

router.post("/suppliers", SupplierController.createSupplier);
router.get("/suppliers", SupplierController.listSuppliers);
router.get("/suppliers/:supplierId", SupplierController.getSupplier);
router.put("/suppliers/:supplierId", SupplierController.updateSupplier);
router.delete("/suppliers/:supplierId", SupplierController.deleteSupplier);

// Contactos de proveedores
router.post("/suppliers/:supplierId/contacts", SupplierController.addContact);
router.put("/suppliers/contacts/:contactId", SupplierController.updateContact);
router.delete(
  "/suppliers/contacts/:contactId",
  SupplierController.deleteContact,
);

// Cuenta corriente
router.get(
  "/suppliers/:supplierId/account/balance",
  SupplierController.getAccountBalance,
);
router.get(
  "/suppliers/:supplierId/account/history",
  SupplierController.getAccountHistory,
);
router.post(
  "/suppliers/:supplierId/account/entries",
  SupplierController.createAccountEntry,
);

// ============================================
// QUOTES (COTIZACIONES)
// ============================================

router.post("/quotes", QuoteController.createQuote);
router.get("/quotes", QuoteController.listQuotes);
router.get("/quotes/compare/:supplyId", QuoteController.compareQuotes);
router.get("/quotes/:quoteId", QuoteController.getQuote);
router.put("/quotes/:quoteId", QuoteController.updateQuote);
router.delete("/quotes/:quoteId", QuoteController.deleteQuote);
router.post(
  "/quotes/deactivate-expired",
  QuoteController.deactivateExpiredQuotes,
);

// Cotizaciones activas de un proveedor
router.get(
  "/suppliers/:supplierId/active-quotes",
  QuoteController.getActiveQuotesBySupplierId,
);

// ============================================
// PURCHASE ORDERS (ÓRDENES DE COMPRA)
// ============================================

router.post("/purchase-orders", PurchaseOrderController.createPurchaseOrder);
router.get("/purchase-orders", PurchaseOrderController.listPurchaseOrders);
router.get(
  "/purchase-orders/:orderId",
  PurchaseOrderController.getPurchaseOrder,
);
router.put(
  "/purchase-orders/:orderId",
  PurchaseOrderController.updatePurchaseOrder,
);

// Acciones sobre órdenes
router.post(
  "/purchase-orders/:orderId/confirm",
  PurchaseOrderController.confirmOrder,
);
router.post(
  "/purchase-orders/:orderId/cancel",
  PurchaseOrderController.cancelOrder,
);
router.post(
  "/purchase-orders/:orderId/receive",
  PurchaseOrderController.receivePurchaseOrder,
);

// Items de órdenes de compra
router.post("/purchase-orders/:orderId/items", PurchaseOrderController.addItem);
router.put(
  "/purchase-orders/items/:itemId",
  PurchaseOrderController.updateItem,
);
router.delete(
  "/purchase-orders/items/:itemId",
  PurchaseOrderController.deleteItem,
);

export default router;
