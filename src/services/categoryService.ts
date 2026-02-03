import api from './api';
import type { ApiResponse, Pagination, RoomCategory } from '@/types';

interface CategoriesResponse extends ApiResponse<RoomCategory[]> {
  pagination?: Pagination;
}

export const categoryService = {
  // Public endpoints
  async getCategories(): Promise<ApiResponse<RoomCategory[]>> {
    const { data } = await api.get<ApiResponse<RoomCategory[]>>('/categories');
    return data;
  },

  async getCategoryById(id: string): Promise<ApiResponse<RoomCategory>> {
    const { data } = await api.get<ApiResponse<RoomCategory>>(`/categories/${id}`);
    return data;
  },

  // Admin endpoints
  async getAllCategories(params?: {
    page?: number;
    limit?: number;
  }): Promise<CategoriesResponse> {
    const { data } = await api.get<CategoriesResponse>('/categories/admin/all', { params });
    return data;
  },

  async createCategory(categoryData: {
    name: string;
    description?: string;
    icon?: string;
    order?: number;
  }): Promise<ApiResponse<RoomCategory>> {
    const { data } = await api.post<ApiResponse<RoomCategory>>('/categories', categoryData);
    return data;
  },

  async updateCategory(id: string, categoryData: {
    name?: string;
    description?: string;
    icon?: string;
    order?: number;
    isActive?: boolean;
  }): Promise<ApiResponse<RoomCategory>> {
    const { data } = await api.put<ApiResponse<RoomCategory>>(`/categories/${id}`, categoryData);
    return data;
  },

  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    const { data } = await api.delete<ApiResponse<void>>(`/categories/${id}`);
    return data;
  },
};
