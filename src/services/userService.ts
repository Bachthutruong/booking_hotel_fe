import api from './api';
import type { User, ApiResponse, Pagination } from '@/types';

interface UsersResponse extends ApiResponse<User[]> {
  pagination: Pagination;
}

export const userService = {
  async getUsers(params?: {
    search?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<UsersResponse> {
    const { data } = await api.get<UsersResponse>('/users', { params });
    return data;
  },

  async getUser(id: string): Promise<ApiResponse<User>> {
    const { data } = await api.get<ApiResponse<User>>(`/users/${id}`);
    return data;
  },

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    const { data } = await api.put<ApiResponse<User>>(`/users/${id}`, userData);
    return data;
  },

  async deleteUser(id: string): Promise<ApiResponse> {
    const { data } = await api.delete<ApiResponse>(`/users/${id}`);
    return data;
  },

  async uploadAvatar(id: string, file: File): Promise<ApiResponse<User>> {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.put<ApiResponse<User>>(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
