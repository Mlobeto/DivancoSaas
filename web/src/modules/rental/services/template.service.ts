/**
 * TEMPLATE SERVICE
 * Servicio para gestión de plantillas PDF personalizadas
 */

import apiClient from "@/lib/api";
import type {
  Template,
  CreateTemplateDTO,
  TemplateType,
} from "../types/quotation.types";

const BASE_URL = "/rental";

export const templateService = {
  /**
   * Listar plantillas
   */
  async list(
    filters: {
      type?: TemplateType;
    } = {},
  ): Promise<Template[]> {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);

      const response = await apiClient.get(
        `${BASE_URL}/templates?${params.toString()}`,
      );
      return response.data?.data || [];
    } catch (error: any) {
      console.error("Error fetching templates:", error);
      throw error;
    }
  },

  /**
   * Obtener plantilla por ID
   */
  async getById(id: string): Promise<Template> {
    const response = await apiClient.get(`${BASE_URL}/templates/${id}`);
    return response.data.data;
  },

  /**
   * Crear plantilla
   */
  async create(data: CreateTemplateDTO): Promise<Template> {
    const response = await apiClient.post(`${BASE_URL}/templates`, data);
    return response.data.data;
  },

  /**
   * Actualizar plantilla
   */
  async update(
    id: string,
    data: Partial<CreateTemplateDTO>,
  ): Promise<Template> {
    const response = await apiClient.put(`${BASE_URL}/templates/${id}`, data);
    return response.data.data;
  },

  /**
   * Desactivar plantilla
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/templates/${id}`);
  },

  /**
   * Activar/Desactivar plantilla
   */
  async toggleActive(id: string, isActive: boolean): Promise<Template> {
    const response = await apiClient.put(`${BASE_URL}/templates/${id}`, {
      isActive,
    });
    return response.data.data;
  },

  /**
   * Upload logo image for template
   */
  async uploadLogo(
    templateId: string,
    file: File,
  ): Promise<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append("logo", file);

    const response = await apiClient.post(
      `${BASE_URL}/templates/${templateId}/logo`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data.data;
  },
};
