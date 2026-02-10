/**
 * PURCHASE ORDER SERVICE
 * Gestión de órdenes de compra y recepción de mercadería
 */

import {
  PrismaClient,
  PurchaseOrderStatus,
  AccountEntryType,
  TransactionType,
} from "@prisma/client";
import {
  CreatePurchaseOrderDTO,
  UpdatePurchaseOrderDTO,
  AddPurchaseOrderItemDTO,
  UpdatePurchaseOrderItemDTO,
  ReceivePurchaseOrderDTO,
  PurchaseOrderFilters,
} from "../types/purchases.types";
import { SupplierService } from "./supplier.service";

export class PurchaseOrderService {
  private supplierService: SupplierService;

  constructor(private prisma: PrismaClient) {
    this.supplierService = new SupplierService(prisma);
  }

  /**
   * Crear orden de compra
   */
  async createPurchaseOrder(
    tenantId: string,
    businessUnitId: string,
    data: CreatePurchaseOrderDTO,
    createdBy?: string,
  ) {
    // Verificar código único
    const existing = await this.prisma.purchaseOrder.findUnique({
      where: {
        tenantId_businessUnitId_code: {
          tenantId,
          businessUnitId,
          code: data.code,
        },
      },
    });

    if (existing) {
      throw new Error(`Purchase order with code ${data.code} already exists`);
    }

    // Verificar proveedor
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id: data.supplierId,
        tenantId,
        businessUnitId,
      },
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Calcular totales
    let subtotal = 0;
    const itemsData = [];

    for (const item of data.items) {
      // Verificar supply
      const supply = await this.prisma.supply.findFirst({
        where: {
          id: item.supplyId,
          tenantId,
          businessUnitId,
        },
      });

      if (!supply) {
        throw new Error(`Supply ${item.supplyId} not found`);
      }

      const totalPrice = Number(item.quantity) * Number(item.unitPrice);
      subtotal += totalPrice;

      itemsData.push({
        supplyId: item.supplyId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
      });
    }

    const tax = 0; // Puede configurarse
    const total = subtotal + tax;

    // Crear orden de compra
    const purchaseOrder = await this.prisma.purchaseOrder.create({
      data: {
        code: data.code,
        tenantId,
        businessUnitId,
        supplierId: data.supplierId,
        expectedDate: data.expectedDate,
        notes: data.notes,
        subtotal,
        tax,
        total,
        currency: supplier.currency,
        createdBy,
        items: {
          create: itemsData,
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            supply: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    return purchaseOrder;
  }

  /**
   * Listar órdenes de compra
   */
  async listPurchaseOrders(
    tenantId: string,
    businessUnitId: string,
    filters: PurchaseOrderFilters = {},
  ) {
    const {
      supplierId,
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 50,
    } = filters;

    const where: any = {
      tenantId,
      businessUnitId,
    };

    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;

    if (fromDate || toDate) {
      where.orderDate = {};
      if (fromDate) where.orderDate.gte = fromDate;
      if (toDate) where.orderDate.lte = toDate;
    }

    const [orders, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy: { orderDate: "desc" },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener orden de compra por ID
   */
  async getPurchaseOrderById(orderId: string) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: {
        supplier: true,
        items: {
          include: {
            supply: {
              select: {
                id: true,
                name: true,
                unit: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error("Purchase order not found");
    }

    return order;
  }

  /**
   * Actualizar orden de compra
   */
  async updatePurchaseOrder(orderId: string, data: UpdatePurchaseOrderDTO) {
    return await this.prisma.purchaseOrder.update({
      where: { id: orderId },
      data,
      include: {
        supplier: true,
        items: {
          include: {
            supply: true,
          },
        },
      },
    });
  }

  /**
   * Agregar item a orden de compra
   */
  async addItem(orderId: string, data: AddPurchaseOrderItemDTO) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Purchase order not found");
    }

    if (order.status !== PurchaseOrderStatus.DRAFT) {
      throw new Error(
        "Cannot modify purchase order that is not in draft status",
      );
    }

    const totalPrice = Number(data.quantity) * Number(data.unitPrice);

    const item = await this.prisma.purchaseOrderItem.create({
      data: {
        purchaseOrderId: orderId,
        supplyId: data.supplyId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice,
        notes: data.notes,
      },
      include: {
        supply: true,
      },
    });

    // Recalcular totales
    await this.recalculateTotals(orderId);

    return item;
  }

  /**
   * Actualizar item de orden de compra
   */
  async updateItem(itemId: string, data: UpdatePurchaseOrderItemDTO) {
    const item = await this.prisma.purchaseOrderItem.findUnique({
      where: { id: itemId },
      include: {
        purchaseOrder: true,
      },
    });

    if (!item) {
      throw new Error("Purchase order item not found");
    }

    if (item.purchaseOrder.status !== PurchaseOrderStatus.DRAFT) {
      throw new Error(
        "Cannot modify purchase order that is not in draft status",
      );
    }

    const updateData: any = { ...data };

    // Recalcular precio total si cambiaron quantity o unitPrice
    if (data.quantity || data.unitPrice) {
      const newQuantity = data.quantity || item.quantity;
      const newUnitPrice = data.unitPrice || item.unitPrice;
      updateData.totalPrice = Number(newQuantity) * Number(newUnitPrice);
    }

    const updatedItem = await this.prisma.purchaseOrderItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        supply: true,
      },
    });

    // Recalcular totales de la orden
    await this.recalculateTotals(item.purchaseOrderId);

    return updatedItem;
  }

  /**
   * Eliminar item de orden de compra
   */
  async deleteItem(itemId: string) {
    const item = await this.prisma.purchaseOrderItem.findUnique({
      where: { id: itemId },
      include: {
        purchaseOrder: true,
      },
    });

    if (!item) {
      throw new Error("Purchase order item not found");
    }

    if (item.purchaseOrder.status !== PurchaseOrderStatus.DRAFT) {
      throw new Error(
        "Cannot modify purchase order that is not in draft status",
      );
    }

    await this.prisma.purchaseOrderItem.delete({
      where: { id: itemId },
    });

    // Recalcular totales
    await this.recalculateTotals(item.purchaseOrderId);
  }

  /**
   * Confirmar orden de compra (enviarla al proveedor)
   */
  async confirmOrder(orderId: string) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error("Purchase order not found");
    }

    if (order.status !== PurchaseOrderStatus.DRAFT) {
      throw new Error("Can only confirm draft purchase orders");
    }

    if (order.items.length === 0) {
      throw new Error("Cannot confirm purchase order without items");
    }

    return await this.prisma.purchaseOrder.update({
      where: { id: orderId },
      data: {
        status: PurchaseOrderStatus.SENT,
      },
      include: {
        supplier: true,
        items: {
          include: {
            supply: true,
          },
        },
      },
    });
  }

  /**
   * Recibir mercadería (entrada a stock)
   */
  async receivePurchaseOrder(
    orderId: string,
    data: ReceivePurchaseOrderDTO,
    createdBy?: string,
  ) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            supply: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Purchase order not found");
    }

    if (order.status === PurchaseOrderStatus.CANCELLED) {
      throw new Error("Cannot receive cancelled purchase order");
    }

    // Procesar cada item recibido
    for (const receivedItem of data.items) {
      const orderItem = order.items.find((i) => i.id === receivedItem.itemId);

      if (!orderItem) {
        throw new Error(
          `Item ${receivedItem.itemId} not found in purchase order`,
        );
      }

      const newReceivedQty =
        Number(orderItem.receivedQty) + Number(receivedItem.receivedQty);

      // Actualizar cantidad recibida en el item
      await this.prisma.purchaseOrderItem.update({
        where: { id: receivedItem.itemId },
        data: {
          receivedQty: newReceivedQty,
        },
      });

      // Actualizar stock del insumo
      await this.prisma.supply.update({
        where: { id: orderItem.supplyId },
        data: {
          stock: {
            increment: receivedItem.receivedQty,
          },
        },
      });

      // Crear transacción de stock
      await this.prisma.stockTransaction.create({
        data: {
          tenantId: order.tenantId,
          businessUnitId: order.businessUnitId,
          supplyId: orderItem.supplyId,
          type: TransactionType.PURCHASE,
          quantity: receivedItem.receivedQty,
          unitCost: orderItem.unitPrice,
          totalCost:
            Number(receivedItem.receivedQty) * Number(orderItem.unitPrice),
          purchaseOrderId: orderId,
          notes: `Recepción de OC ${order.code}`,
          createdBy,
        },
      });
    }

    // Actualizar estado de la orden
    const allItemsReceived = order.items.every(
      (item) =>
        Number(item.receivedQty) +
          Number(
            data.items.find((i) => i.itemId === item.id)?.receivedQty || 0,
          ) >=
        Number(item.quantity),
    );

    const updatedOrder = await this.prisma.purchaseOrder.update({
      where: { id: orderId },
      data: {
        status: allItemsReceived
          ? PurchaseOrderStatus.RECEIVED
          : PurchaseOrderStatus.CONFIRMED,
        receivedDate: allItemsReceived
          ? data.receivedDate || new Date()
          : undefined,
      },
      include: {
        supplier: true,
        items: {
          include: {
            supply: true,
          },
        },
      },
    });

    // Crear entrada en cuenta corriente del proveedor
    if (allItemsReceived) {
      await this.supplierService.createAccountEntry(
        order.tenantId,
        order.businessUnitId,
        {
          supplierId: order.supplierId,
          type: AccountEntryType.PURCHASE,
          amount: Number(order.total),
          reference: order.code,
          description: `Compra OC ${order.code}`,
          purchaseOrderId: orderId,
        },
        createdBy,
      );
    }

    return updatedOrder;
  }

  /**
   * Cancelar orden de compra
   */
  async cancelOrder(orderId: string) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Purchase order not found");
    }

    if (order.status === PurchaseOrderStatus.RECEIVED) {
      throw new Error("Cannot cancel received purchase order");
    }

    return await this.prisma.purchaseOrder.update({
      where: { id: orderId },
      data: {
        status: PurchaseOrderStatus.CANCELLED,
      },
    });
  }

  /**
   * Recalcular totales de orden de compra
   */
  private async recalculateTotals(orderId: string) {
    const items = await this.prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: orderId },
    });

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0,
    );

    const tax = 0; // Puede configurarse
    const total = subtotal + tax;

    await this.prisma.purchaseOrder.update({
      where: { id: orderId },
      data: {
        subtotal,
        tax,
        total,
      },
    });
  }
}
