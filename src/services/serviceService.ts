import api from './api';
import type { Service, ApiResponse } from '@/types';

interface ServiceQueryParams {
  page?: number;
  limit?: number;
  category?: string;
}

export const serviceService = {
  async getServices(categoryId?: string): Promise<ApiResponse<Service[]>> {
    const params = categoryId ? { category: categoryId } : undefined;
    const { data } = await api.get<ApiResponse<Service[]>>('/services', { params });
    return data;
  },

  async getAdminServices(params?: ServiceQueryParams): Promise<ApiResponse<Service[]>> {
    const { data } = await api.get<ApiResponse<Service[]>>('/services/admin', {
      params: { page: params?.page, limit: params?.limit, category: params?.category },
    });
    return data;
  },

  async getService(id: string): Promise<ApiResponse<Service>> {
    const { data } = await api.get<ApiResponse<Service>>(`/services/${id}`);
    return data;
  },

  async createService(serviceData: Partial<Service>): Promise<ApiResponse<Service>> {
    const { data } = await api.post<ApiResponse<Service>>('/services', serviceData);
    return data;
  },

  async updateService(id: string, serviceData: Partial<Service>): Promise<ApiResponse<Service>> {
    const { data } = await api.put<ApiResponse<Service>>(`/services/${id}`, serviceData);
    return data;
  },

  async deleteService(id: string): Promise<ApiResponse<void>> {
    const { data } = await api.delete<ApiResponse<void>>(`/services/${id}`);
    return data;
  },
};
