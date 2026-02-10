/**
 * PURCHASES MODULE - PURCHASE ORDERS SERVICE
 * Servicio para gestión de órdenes de compra
 */

import apiClient from "@/lib/api";
import type {
  PurchaseOrder,
  CreatePurchaseOrderDTO,
  UpdatePurchaseOrderDTO,
  PurchaseOrderFilters,
  AddPurchaseOrderItemDTO,
  UpdatePurchaseOrderItemDTO,
  ReceivePurchaseOrderDTO,
  PurchaseOrderItem,
} from "../types/purchases.types";

const BASE_URL = "/modules/purchases/purchase-orders";

export const purchaseOrderService = {
  /**
   * Listar órdenes de compra
   */
  async list(filters: PurchaseOrderFilters = {}): Promise<{
    data: PurchaseOrder[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters.supplierId) params.append("supplierId", filters.supplierId);
    if (filters.status) params.append("status", filters.status);
    if (filters.fromDate) params.append("fromDate", filters.fromDate);
    if (filters.toDate) params.append("toDate", filters.toDate);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const response = await apiClient.get(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener una orden de compra por ID
   */
  async getById(id: string): Promise<PurchaseOrder> {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  /**
   * Crear orden de compra
   */
  async create(data: CreatePurchaseOrderDTO): Promise<PurchaseOrder> {
    const response = await apiClient.post(BASE_URL, data);
    return response.data.data;
  },

  /**
   * Actualizar orden de compra
   */
  async update(
    id: string,
    data: UpdatePurchaseOrderDTO,
  ): Promise<PurchaseOrder> {
    const response = await apiClient.put(`${BASE_URL}/${id}`, data);
    return response.data.data;
  },

  /**
   * Confirmar orden de compra
   */
  async confirm(id: string): Promise<PurchaseOrder> {
    const response = await apiClient.post(`${BASE_URL}/${id}/confirm`);
    return response.data.data;
  },

  /**
   * Cancelar orden de compra
   */
  async cancel(id: string): Promise<PurchaseOrder> {
    const response = await apiClient.post(`${BASE_URL}/${id}/cancel`);
    return response.data.data;
  },

  /**
   * Recibir mercadería
   */
  async receive(
    id: string,
    data: ReceivePurchaseOrderDTO,
  ): Promise<PurchaseOrder> {
    const response = await apiClient.post(`${BASE_URL}/${id}/receive`, data);
    return response.data.data;
  },

  /**
   * Agregar item a orden de compra
   */
  async addItem(
    orderId: string,
    data: AddPurchaseOrderItemDTO,
  ): Promise<PurchaseOrderItem> {
    const response = await apiClient.post(`${BASE_URL}/${orderId}/items`, data);
    return response.data.data;
  },

  /**
   * Actualizar item de orden de compra
   */
  async updateItem(
    itemId: string,
    data: UpdatePurchaseOrderItemDTO,
  ): Promise<PurchaseOrderItem> {
    const response = await apiClient.put(`${BASE_URL}/items/${itemId}`, data);
    return response.data.data;
  },

  /**
   * Eliminar item de orden de compra
   */
  async deleteItem(itemId: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/items/${itemId}`);
  },
};
