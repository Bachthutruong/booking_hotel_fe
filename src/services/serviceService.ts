import api from './api';
import type { Service, ApiResponse } from '@/types';

interface ServiceQueryParams {
  page?: number;
  limit?: number;
}

export const serviceService = {
  async getServices(): Promise<ApiResponse<Service[]>> {
    const { data } = await api.get<ApiResponse<Service[]>>('/services');
    return data;
  },

  async getAdminServices(params?: ServiceQueryParams): Promise<ApiResponse<Service[]>> {
    const { data } = await api.get<ApiResponse<Service[]>>('/services/admin', { params });
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
