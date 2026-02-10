/**
 * PURCHASES MODULE - SUPPLIERS SERVICE
 * Servicio para gestión de proveedores
 */

import apiClient from "@/lib/api";
import type {
  Supplier,
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierFilters,
  SupplierContact,
  CreateSupplierContactDTO,
  UpdateSupplierContactDTO,
  SupplierAccountEntry,
  CreateAccountEntryDTO,
  AccountBalance,
} from "../types/purchases.types";

const BASE_URL = "/modules/purchases/suppliers";

export const supplierService = {
  /**
   * Listar proveedores
   */
  async list(filters: SupplierFilters = {}): Promise<{
    data: Supplier[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.search) params.append("search", filters.search);
    if (filters.country) params.append("country", filters.country);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const response = await apiClient.get(`${BASE_URL}?${params.toString()}`);
    console.log("API Response:", response.data); // Debug log
    return response.data;
  },

  /**
   * Obtener un proveedor por ID
   */
  async getById(id: string): Promise<Supplier> {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  /**
   * Crear proveedor
   */
  async create(data: CreateSupplierDTO): Promise<Supplier> {
    const response = await apiClient.post(BASE_URL, data);
    return response.data.data;
  },

  /**
   * Actualizar proveedor
   */
  async update(id: string, data: UpdateSupplierDTO): Promise<Supplier> {
    const response = await apiClient.put(`${BASE_URL}/${id}`, data);
    return response.data.data;
  },

  /**
   * Eliminar proveedor
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Agregar contacto a proveedor
   */
  async addContact(
    supplierId: string,
    data: CreateSupplierContactDTO,
  ): Promise<SupplierContact> {
    const response = await apiClient.post(
      `${BASE_URL}/${supplierId}/contacts`,
      data,
    );
    return response.data.data;
  },

  /**
   * Actualizar contacto
   */
  async updateContact(
    contactId: string,
    data: UpdateSupplierContactDTO,
  ): Promise<SupplierContact> {
    const response = await apiClient.put(
      `/modules/purchases/suppliers/contacts/${contactId}`,
      data,
    );
    return response.data.data;
  },

  /**
   * Eliminar contacto
   */
  async deleteContact(contactId: string): Promise<void> {
    await apiClient.delete(
      `/modules/purchases/suppliers/contacts/${contactId}`,
    );
  },

  /**
   * Obtener balance de cuenta corriente
   */
  async getAccountBalance(supplierId: string): Promise<AccountBalance> {
    const response = await apiClient.get(
      `${BASE_URL}/${supplierId}/account/balance`,
    );
    return response.data.data;
  },

  /**
   * Obtener historial de cuenta corriente
   */
  async getAccountHistory(supplierId: string): Promise<{
    data: SupplierAccountEntry[];
    balance: AccountBalance;
  }> {
    const response = await apiClient.get(
      `${BASE_URL}/${supplierId}/account/history`,
    );
    return response.data;
  },

  /**
   * Crear entrada en cuenta corriente
   */
  async createAccountEntry(
    supplierId: string,
    data: CreateAccountEntryDTO,
  ): Promise<SupplierAccountEntry> {
    const response = await apiClient.post(
      `${BASE_URL}/${supplierId}/account/entries`,
      data,
    );
    return response.data.data;
  },
};
