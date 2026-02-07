import api from './api';
import type { ServiceCategory, ApiResponse } from '@/types';

interface PaginationParams {
  page?: number;
  limit?: number;
}

export const serviceCategoryService = {
  async getServiceCategories(): Promise<ApiResponse<ServiceCategory[]>> {
    const { data } = await api.get<ApiResponse<ServiceCategory[]>>('/service-categories');
    return data;
  },

  async getAllServiceCategories(params?: PaginationParams): Promise<ApiResponse<ServiceCategory[]>> {
    const { data } = await api.get<ApiResponse<ServiceCategory[]>>('/service-categories/admin/all', { params });
    return data;
  },

  async getServiceCategoryById(id: string): Promise<ApiResponse<ServiceCategory>> {
    const { data } = await api.get<ApiResponse<ServiceCategory>>(`/service-categories/${id}`);
    return data;
  },

  async createServiceCategory(payload: Partial<ServiceCategory>): Promise<ApiResponse<ServiceCategory>> {
    const { data } = await api.post<ApiResponse<ServiceCategory>>('/service-categories', payload);
    return data;
  },

  async updateServiceCategory(id: string, payload: Partial<ServiceCategory>): Promise<ApiResponse<ServiceCategory>> {
    const { data } = await api.put<ApiResponse<ServiceCategory>>(`/service-categories/${id}`, payload);
    return data;
  },

  async deleteServiceCategory(id: string): Promise<ApiResponse<void>> {
    const { data } = await api.delete<ApiResponse<void>>(`/service-categories/${id}`);
    return data;
  },
};
